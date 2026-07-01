"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Expand, FileCheck2, FileText, LoaderCircle, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type BuyerPaymentProofFormProps = {
  transactionId: string;
  currentProof?: string;
  locked?: boolean;
  lockedTitle?: string;
  lockedDescription?: string;
  requireNewProof?: boolean;
  readOnlyPreview?: boolean;
  submitLabel?: string;
  lockedSubmitLabel?: string;
};

function getProofDisplayName(value?: string) {
  if (!value) return "Bukti pembayaran";
  const cleanValue = value.split("?")[0] ?? value;
  const name = cleanValue.split(/[\\/]/).filter(Boolean).pop() ?? cleanValue;

  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

function isPreviewableProofUrl(value?: string) {
  return Boolean(value && (value.startsWith("/") || /^https?:\/\//i.test(value)));
}

function proofUrlMatchesExtension(value: string | null | undefined, pattern: RegExp) {
  if (!value) return false;
  return pattern.test(value.split("?")[0] ?? value);
}

export function BuyerPaymentProofForm({
  transactionId,
  currentProof,
  locked = false,
  lockedTitle = "Bukti pembayaran sedang direview",
  lockedDescription = "Admin unit sedang mencocokkan nominal, rekening tujuan, referensi, dan kejelasan bukti transfer. Bukti tidak dapat diganti sampai admin memberi keputusan.",
  requireNewProof = false,
  readOnlyPreview = false,
  submitLabel = "Kirim Bukti Pembayaran",
  lockedSubmitLabel = "Bukti sedang direview admin"
}: BuyerPaymentProofFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reference, setReference] = useState("");
  const [fileName, setFileName] = useState(currentProof ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMediaFailed, setPreviewMediaFailed] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const proofInputId = `payment-proof-${transactionId}`;
  const previewTitleId = useId();
  const storedProofUrl = isPreviewableProofUrl(currentProof) ? currentProof : null;
  const displayPreviewUrl = previewUrl ?? storedProofUrl;
  const proofDisplayName = file?.name ?? getProofDisplayName(currentProof);
  const hasProofInput = requireNewProof ? Boolean(file) : Boolean(file || fileName.trim());
  const hasPreview = Boolean(displayPreviewUrl);
  const showUploadControls = !readOnlyPreview;
  const isImagePreview = file
    ? file.type.startsWith("image/")
    : proofUrlMatchesExtension(displayPreviewUrl, /\.(png|jpe?g|webp)$/i);
  const isPdfPreview = file
    ? file.type === "application/pdf"
    : proofUrlMatchesExtension(displayPreviewUrl, /\.pdf$/i);

  useEffect(() => {
    setPreviewMediaFailed(false);
  }, [displayPreviewUrl]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPreviewOpen]);

  function handleSubmit() {
    if (locked || readOnlyPreview || !hasProofInput) {
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const body = new FormData();
      if (file) {
        body.append("file", file);
      } else {
        body.append("fileName", fileName);
      }
      body.append("reference", reference);

      const response = await fetch(`/api/user/transaksi/${transactionId}/upload-bukti`, {
        method: "POST",
        body: file
          ? body
          : JSON.stringify({
              fileName,
              reference
            }),
        headers: file ? undefined : { "Content-Type": "application/json" }
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const description = payload.message ?? "Periksa nama file dan nomor referensi transfer.";
        setFeedback({
          title: "Bukti belum terkirim",
          description,
          variant: "error"
        });
        toast({
          title: "Bukti belum terkirim",
          description,
          variant: "error",
          scope: "buyer"
        });
        return;
      }

      setFeedback({
        title: "Bukti diterima sistem",
        description: "Status transaksi berubah menjadi bukti diunggah dan menunggu verifikasi admin unit.",
        variant: "success"
      });
      toast({
        title: "Bukti pembayaran terkirim",
        description: "Status transaksi berubah menjadi bukti diunggah dan menunggu verifikasi admin.",
        variant: "success",
        scope: "buyer"
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {locked && !readOnlyPreview ? (
        <div className="rounded-[1.35rem] border border-[#c9e2d6] bg-[#eef8f2] p-2">
          <div className="rounded-[calc(1.35rem-0.5rem)] border border-white/80 bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-[1rem] bg-[#e3f3eb] text-primary">
                <FileCheck2 className="size-5" />
              </span>
              <div>
                <p className="font-body text-sm font-black text-[#13211c]">{lockedTitle}</p>
                <p className="mt-1 font-body text-xs leading-5 text-[#52665c]">{lockedDescription}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div
        className={cn(
          "rounded-xl border-2 border-dashed border-[#d5d8d2] bg-[#f8f8f6]",
          hasPreview ? "p-1.5 sm:p-2" : "p-4 sm:p-5"
        )}
      >
        <div className={cn("flex flex-col", hasPreview ? "min-h-[30rem]" : "min-h-[26rem]")}>
          {hasPreview ? (
            <div className="relative flex-1 overflow-hidden rounded-[1.15rem] bg-[linear-gradient(180deg,#fafaf7,#f1f2ed)]">
              {previewMediaFailed ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
                  <span className="grid size-16 place-items-center rounded-[1.2rem] border border-[#dde1d9] bg-white text-primary shadow-[0_18px_38px_-28px_rgba(8,69,50,0.24)]">
                    <FileText className="size-6" />
                  </span>
                  <p className="mt-4 font-body text-base font-semibold text-[#1a1c1c]">
                    Bukti pembayaran tidak dapat ditampilkan di preview.
                  </p>
                  <p className="mt-2 max-w-[18rem] font-body text-sm leading-6 text-[#6e716c]">
                    File sudah tercatat. Buka file asli untuk membaca bukti pembayaran yang diunggah.
                  </p>
                  {displayPreviewUrl ? (
                    <a
                      className="mt-5 inline-flex h-11 items-center justify-center rounded-[0.95rem] border border-[#c8cec5] bg-white px-5 font-body text-sm font-semibold text-primary transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/[0.03] active:scale-[0.98]"
                      href={displayPreviewUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Buka file asli
                    </a>
                  ) : null}
                </div>
              ) : (
                <button
                  aria-label="Buka preview bukti transfer"
                  className="group absolute inset-0 block h-full w-full overflow-hidden bg-white text-left active:scale-[0.995]"
                  onClick={() => setIsPreviewOpen(true)}
                  type="button"
                >
                  {isImagePreview ? (
                    <img
                      alt="Preview bukti transfer"
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="eager"
                      onError={() => setPreviewMediaFailed(true)}
                      src={displayPreviewUrl ?? undefined}
                    />
                  ) : isPdfPreview ? (
                    <iframe
                      className="absolute inset-0 h-full w-full bg-white"
                      onError={() => setPreviewMediaFailed(true)}
                      src={displayPreviewUrl ? `${displayPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0` : undefined}
                      title="Preview PDF bukti transfer"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,#fafaf7,#f1f2ed)]">
                      <span className="flex items-center gap-3 rounded-[1.1rem] border border-[#dde1d9] bg-white px-5 py-4 shadow-[0_18px_38px_-28px_rgba(8,69,50,0.24)]">
                        <span className="grid size-11 place-items-center rounded-[0.95rem] bg-[#f1f3ee] text-primary">
                          <FileText className="size-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-body text-sm font-semibold text-[#1a1c1c]">
                            {proofDisplayName}
                          </span>
                          <span className="block text-[0.74rem] uppercase tracking-[0.08em] text-[#6e716c]">
                            File Tersimpan
                          </span>
                        </span>
                      </span>
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,25,18,0.02),transparent_36%,rgba(12,25,18,0.34))]" />
                  <span className="pointer-events-none absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-white/50 bg-white/86 text-primary shadow-[0_18px_32px_-24px_rgba(8,69,50,0.38)] backdrop-blur-sm">
                    <Expand className="size-4" />
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-[1.35rem] bg-[linear-gradient(180deg,#fbfbf8,#f3f4ef)] px-5 py-10 text-center">
              <span className="grid size-24 place-items-center rounded-[1.5rem] bg-[#ececea] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] transition duration-500 group-hover:scale-[1.04]">
                {file || currentProof ? <FileCheck2 className="size-7" /> : <UploadCloud className="size-7" />}
              </span>
              <span className="mt-6 block font-body text-[1.05rem] font-semibold text-[#1a1c1c]">
                {file ? file.name : currentProof ? "Bukti pembayaran tersimpan" : "Klik atau seret file ke sini"}
              </span>
              <span className="mt-2 block max-w-[18rem] font-body text-sm leading-6 text-[#6e716c]">
                {locked
                  ? "Bukti ini sudah masuk antrean review admin unit."
                  : requireNewProof
                    ? "Pilih file bukti baru agar admin dapat memeriksa ulang pembayaran."
                    : "Preview bukti transfer akan tampil besar di area ini setelah file dipilih."}
              </span>
            </div>
          )}

          {showUploadControls ? (
            <div className="mt-4 flex flex-col items-center gap-3 text-center">
              <label
                aria-disabled={locked}
                className={cn(
                  "inline-flex h-11 cursor-pointer items-center justify-center rounded-[0.95rem] border border-[#c8cec5] bg-white px-5 font-body text-sm font-semibold text-primary transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.03] active:scale-[0.98]",
                  locked && "pointer-events-none cursor-not-allowed border-[#d7ded5] bg-[#eef3ed] text-[#718077] hover:translate-y-0"
                )}
                htmlFor={proofInputId}
              >
                {requireNewProof ? "Pilih File Baru" : "Pilih File"}
              </label>
              <span className="block font-body text-[0.78rem] uppercase tracking-[0.08em] text-[#6e716c]">
                Format: JPG, PNG, PDF (Maks. 5MB)
              </span>
            </div>
          ) : null}
        </div>
      </div>
      {showUploadControls ? (
        <Input
          accept=".jpg,.jpeg,.png,.pdf"
          aria-label="File bukti transfer"
          className="sr-only"
          disabled={locked}
          id={proofInputId}
          name="proofFile"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            setFile(nextFile);
            setFileName(nextFile?.name ?? (requireNewProof ? "" : currentProof ?? ""));
            if (!nextFile) {
              setIsPreviewOpen(false);
            }
          }}
          type="file"
        />
      ) : null}
      <input
        aria-hidden="true"
        autoComplete="off"
        className="sr-only"
        name="paymentReference"
        onChange={(event) => setReference(event.target.value)}
        tabIndex={-1}
        value={reference}
      />
      {showUploadControls ? (
        <Button
          className="h-14 w-full rounded-md font-body text-base font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
          disabled={locked || !isHydrated || isPending || !hasProofInput}
          onClick={handleSubmit}
        >
          {locked
            ? lockedSubmitLabel
            : !isHydrated
            ? "Menyiapkan\u2026"
            : isPending
            ? (
                <>
                  <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
                  {"Mengirim\u2026"}
                </>
              )
            : submitLabel}
        </Button>
      ) : null}
      {feedback ? (
        <InlineFeedback
          className="feedback-lift"
          description={feedback.description}
          title={feedback.title}
          variant={feedback.variant}
        />
      ) : null}
      {isPreviewOpen && displayPreviewUrl
        ? createPortal(
            <div
              aria-labelledby={previewTitleId}
              aria-modal="true"
              className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#081b14]/72 px-3 py-3 backdrop-blur-md sm:px-6 sm:py-6"
              onClick={() => setIsPreviewOpen(false)}
              role="dialog"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,184,93,0.16),transparent_36%)]" />
              <div
                className="modal-viewport relative z-[141] my-auto w-full max-w-6xl rounded-[2rem] border border-white/28 bg-[linear-gradient(180deg,rgba(248,246,239,0.96),rgba(255,255,255,0.92))] p-2 shadow-[0_48px_120px_-40px_rgba(3,21,14,0.82)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] border border-black/5 bg-[#fbfbf8]">
                  <div className="flex items-start justify-between gap-4 border-b border-black/6 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <p className="font-body text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#8d6c08]">
                        Bukti Pembayaran
                      </p>
                      <h3
                        className="mt-1 truncate font-headline text-[1.35rem] font-black tracking-tight text-[#13211c]"
                        id={previewTitleId}
                      >
                        {proofDisplayName}
                      </h3>
                    </div>
                    <button
                      aria-label="Tutup preview bukti transfer"
                      className="grid size-11 shrink-0 place-items-center rounded-full border border-black/8 bg-white text-primary transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f5f7f2] active:scale-[0.97]"
                      onClick={() => setIsPreviewOpen(false)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="bg-[linear-gradient(180deg,#f7f8f4,#eef1ea)] p-3 sm:p-4">
                    <div className="overflow-hidden rounded-[1.5rem] border border-black/6 bg-white shadow-[0_24px_60px_-36px_rgba(8,69,50,0.28)]">
                      {isImagePreview && !previewMediaFailed ? (
                        <img
                          alt="Preview bukti transfer"
                          className="media-preview-frame w-full object-contain bg-[#f8f8f5]"
                          loading="eager"
                          onError={() => setPreviewMediaFailed(true)}
                          src={displayPreviewUrl ?? undefined}
                        />
                      ) : isPdfPreview && !previewMediaFailed ? (
                        <iframe
                          className="media-preview-frame-fixed w-full bg-white"
                          onError={() => setPreviewMediaFailed(true)}
                          src={displayPreviewUrl ? `${displayPreviewUrl}#toolbar=1&navpanes=0` : undefined}
                          title="Preview penuh PDF bukti transfer"
                        />
                      ) : (
                        <div className="media-preview-frame-fixed flex items-center justify-center bg-[#f8f8f5] px-4 text-center">
                          <div className="max-w-sm rounded-[1.15rem] border border-[#dde1d9] bg-white px-5 py-5 shadow-[0_18px_40px_-30px_rgba(8,69,50,0.28)]">
                            <span className="grid size-12 place-items-center rounded-[1rem] bg-[#f1f3ee] text-primary">
                              <FileText className="size-5" />
                            </span>
                            <p className="mt-3 break-words font-body text-sm font-semibold text-[#1a1c1c]">
                              {proofDisplayName}
                            </p>
                            <p className="mt-1 text-[0.78rem] leading-5 text-[#6e716c]">
                              Bukti pembayaran tidak dapat ditampilkan di preview.
                            </p>
                            {displayPreviewUrl ? (
                              <a
                                className="mt-4 inline-flex h-10 items-center justify-center rounded-[0.85rem] border border-[#c8cec5] bg-white px-4 font-body text-sm font-semibold text-primary"
                                href={displayPreviewUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Buka file asli
                              </a>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
