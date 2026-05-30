"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Expand,
  FileCheck2,
  FileImage,
  FileText,
  LoaderCircle,
  Search,
  Send,
  ShieldAlert,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";

import {
  BlacklistHelpCaseStatus,
  type BuyerSafeBlacklistReviewCase
} from "@/components/buyer/blacklist-help-case-status";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type PublicLookupResult = {
  incidentId: string;
  blacklistStatus: string;
  existingCase: BuyerSafeBlacklistReviewCase | null;
};

type FeedbackState = {
  title: string;
  description?: string;
  variant: "error" | "info" | "success";
};

function FieldLabel({ children, htmlFor }: { children: string; htmlFor: string }) {
  return (
    <label className="text-xs font-black uppercase tracking-[0.14em] text-black/45" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const sizeKb = sizeBytes / 1024;
  if (sizeKb < 1024) {
    return `${sizeKb.toFixed(sizeKb >= 100 ? 0 : 1)} KB`;
  }

  const sizeMb = sizeKb / 1024;
  return `${sizeMb.toFixed(sizeMb >= 100 ? 0 : sizeMb >= 10 ? 1 : 2)} MB`;
}

async function readPayload(response: Response) {
  return response.json().catch(() => ({ message: "Permintaan review insiden gagal." }));
}

export function BlacklistHelpCaseForm({
  incidentId,
  mode = "authenticated"
}: {
  incidentId?: string;
  mode?: "authenticated" | "public";
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [nationalId, setNationalId] = useState("");
  const [contact, setContact] = useState("");
  const [buyerStatement, setBuyerStatement] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [lookup, setLookup] = useState<PublicLookupResult | null>(null);
  const [createdCase, setCreatedCase] = useState<BuyerSafeBlacklistReviewCase | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const resolvedIncidentId = mode === "public" ? lookup?.incidentId : incidentId;
  const existingCase = createdCase ?? lookup?.existingCase ?? null;
  const canSubmit = Boolean(resolvedIncidentId && buyerStatement.trim() && file);
  const isImageFile = Boolean(file?.type.startsWith("image/"));
  const isPdfFile = file?.type === "application/pdf";
  const fileSizeLabel = file ? formatFileSize(file.size) : null;
  const selectedFileName = file?.name ?? "";
  const actionCopy = useMemo(
    () => (mode === "public" ? "Kirim pengajuan review" : "Kirim review insiden"),
    [mode]
  );
  const fileInputId = mode === "public" ? "blacklist-review-file-public" : `blacklist-review-file-${incidentId ?? "buyer"}`;
  const previewTitleId = useId();

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);

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

  function clearSelectedFile() {
    setFile(null);
    setIsPreviewOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleLookup() {
    setFeedback(null);
    startTransition(async () => {
      const response = await fetch("/api/public/blacklist-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId, contact })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setFeedback({
          title: "Data belum cocok",
          description: payload.message ?? "Periksa kembali NIK dan email atau nomor HP.",
          variant: "error"
        });
        return;
      }

      setLookup(payload.data);
      setFeedback({
        title: payload.data.existingCase ? "Pengajuan sudah ditemukan" : "Insiden pelanggaran ditemukan",
        description: payload.data.existingCase
          ? "Anda diarahkan ke status pengajuan yang sudah pernah dibuat."
          : "Silakan siapkan seluruh bukti sebelum mengirim review insiden.",
        variant: "success"
      });
    });
  }

  function handleSubmit() {
    if (!resolvedIncidentId || !file) {
      setFeedback({
        title: "Bukti belum lengkap",
        description: "Pilih insiden dan unggah minimal satu file pendukung sebelum mengirim.",
        variant: "error"
      });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const body = new FormData();
      body.append("incidentId", resolvedIncidentId);
      body.append("buyerStatement", buyerStatement);
      body.append("file", file);
      if (mode === "public") {
        body.append("nationalId", nationalId);
        body.append("contact", contact);
      }

      const response = await fetch(mode === "public" ? "/api/public/blacklist-help" : "/api/user/blacklist-review", {
        method: "POST",
        body
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setFeedback({
          title: "Pengajuan review belum terkirim",
          description: payload.message ?? "Periksa kembali keterangan dan bukti yang diunggah.",
          variant: "error"
        });
        return;
      }

      setCreatedCase(payload.data);
      setFeedback({
        title: "Pengajuan review terkirim",
        description: "Permohonan sudah masuk antrean review. Bukti tidak bisa ditambahkan lagi setelah ini.",
        variant: "success"
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <InlineFeedback
        description="Pastikan data, kronologi, dan seluruh bukti sudah siap sebelum dikirim. Setelah terkirim, permohonan akan diperiksa oleh admin Pegadaian."
        title="Pengajuan review ini hanya dapat dilakukan satu kali."
        variant="info"
      />

      {mode === "public" ? (
        <section className="rounded-[1.6rem] border border-black/8 bg-white p-6 shadow-[0_24px_64px_-52px_rgba(8,69,50,0.42)]">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#eff7f2] text-[#0a6a49]">
              <Search className="size-5" />
            </span>
            <div>
              <h2 className="font-headline text-xl font-black tracking-[-0.02em] text-[#122018]">
                Cek insiden pelanggaran aktif
              </h2>
              <p className="mt-1 text-sm leading-6 text-black/56">
                Gunakan NIK dan email atau nomor HP yang terdaftar. Halaman ini tidak memakai OTP.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel htmlFor="blacklist-help-nik">NIK</FieldLabel>
              <Input id="blacklist-help-nik" value={nationalId} onChange={(event) => setNationalId(event.target.value)} />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="blacklist-help-contact">Email atau nomor HP</FieldLabel>
              <Input id="blacklist-help-contact" value={contact} onChange={(event) => setContact(event.target.value)} />
            </div>
          </div>
          <Button className="mt-5 rounded-xl px-5" disabled={isPending} type="button" onClick={handleLookup}>
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}
            Cek Insiden
          </Button>
        </section>
      ) : null}

      {existingCase ? <BlacklistHelpCaseStatus caseData={existingCase} publicView={mode === "public"} /> : null}

      {resolvedIncidentId && !existingCase ? (
        <section className="rounded-[1.75rem] border border-black/8 bg-white p-6 shadow-[0_28px_72px_-56px_rgba(8,69,50,0.42)] sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-800">
              <ShieldAlert className="size-5" />
            </span>
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#0a6a49]/70">
                Review Insiden Pelanggaran
              </p>
              <h2 className="mt-2 font-headline text-[2rem] font-black tracking-[-0.03em] text-[#122018] sm:text-[2.4rem]">
                Ajukan review insiden pelanggaran
              </h2>
              <p className="mt-1 text-sm leading-6 text-black/56">
                Jelaskan kronologi singkat dan unggah bukti pendukung utama. Setelah dikirim, pengajuan akan masuk ke antrean review.
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="blacklist-help-statement">Keterangan Buyer *</FieldLabel>
                <p className="text-[0.7rem] font-semibold tracking-[0.04em] text-black/38">{buyerStatement.length}/2000</p>
              </div>
              <Textarea
                className="min-h-[170px] rounded-[1.15rem] border-black/8 bg-[#fcfcfa] px-4 py-3.5 text-sm leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                id="blacklist-help-statement"
                maxLength={2000}
                placeholder="Jelaskan kronologi insiden atau berikan klarifikasi terkait pembatasan akun Anda..."
                value={buyerStatement}
                onChange={(event) => setBuyerStatement(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor={fileInputId}>Unggah Bukti Pendukung *</FieldLabel>
              <div className="rounded-xl border-2 border-dashed border-[#d5d8d2] bg-[#f8f8f6] p-4 sm:p-5">
                <input
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="sr-only"
                  id={fileInputId}
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  ref={fileInputRef}
                  type="file"
                />

                <div className="flex min-h-[18rem] flex-col">
                  {file ? (
                    <div className="flex flex-1 flex-col gap-4">
                      {filePreviewUrl ? (
                        <button
                          aria-label="Buka preview bukti pendukung"
                          className="group relative block flex-1 overflow-hidden rounded-[1.2rem] border border-[#d9ddd7] bg-white text-left shadow-[0_20px_40px_-28px_rgba(8,69,50,0.22)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_26px_52px_-28px_rgba(8,69,50,0.26)] active:scale-[0.995]"
                          onClick={() => setIsPreviewOpen(true)}
                          type="button"
                        >
                          {isImageFile ? (
                            <img
                              alt="Preview bukti pendukung"
                              className="h-full min-h-[12rem] w-full object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015]"
                              src={filePreviewUrl ?? undefined}
                            />
                          ) : isPdfFile ? (
                            <iframe
                              className="h-full min-h-[12rem] w-full bg-white"
                              src={`${filePreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                              title="Preview PDF bukti pendukung"
                            />
                          ) : (
                            <span className="flex h-full min-h-[12rem] items-center justify-center bg-[linear-gradient(180deg,#fafaf7,#f1f2ed)]">
                              <span className="flex items-center gap-3 rounded-[1rem] border border-[#dde1d9] bg-white px-4 py-3 shadow-[0_18px_38px_-28px_rgba(8,69,50,0.24)]">
                                <span className="grid size-10 place-items-center rounded-[0.9rem] bg-[#f1f3ee] text-primary">
                                  <FileText className="size-5" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate font-body text-sm font-semibold text-[#1a1c1c]">
                                    {selectedFileName}
                                  </span>
                                  <span className="block text-[0.7rem] uppercase tracking-[0.08em] text-[#6e716c]">
                                    File Tersimpan
                                  </span>
                                </span>
                              </span>
                            </span>
                          )}
                          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,25,18,0.02),transparent_36%,rgba(12,25,18,0.28))]" />
                          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/88 px-3 py-1.5 font-body text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#0d573e] shadow-[0_16px_28px_-22px_rgba(8,69,50,0.38)] backdrop-blur-sm">
                            <FileCheck2 className="size-3.5" />
                            Preview Aktif
                          </span>
                          <span className="pointer-events-none absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-white/50 bg-white/86 text-primary shadow-[0_16px_28px_-22px_rgba(8,69,50,0.38)] backdrop-blur-sm transition duration-500 group-hover:scale-[1.04]">
                            <Expand className="size-4" />
                          </span>
                          <span className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
                            <span className="block rounded-[1rem] border border-white/18 bg-[linear-gradient(180deg,rgba(9,35,24,0.64),rgba(7,28,20,0.84))] px-3.5 py-2.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm">
                              <span className="block truncate font-body text-[0.92rem] font-semibold">
                                {selectedFileName}
                              </span>
                              <span className="mt-1 block text-[0.66rem] uppercase tracking-[0.14em] text-white/72">
                                Tekan untuk melihat penuh
                              </span>
                            </span>
                          </span>
                        </button>
                      ) : (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-[1.2rem] bg-[linear-gradient(180deg,#fbfbf8,#f3f4ef)] px-5 py-8 text-center">
                          <span className="grid size-16 place-items-center rounded-[1.15rem] bg-[#ececea] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
                            <FileText className="size-7" />
                          </span>
                          <span className="mt-4 block font-body text-[0.98rem] font-semibold text-[#1a1c1c]">
                            Dokumen pendukung siap dikirim
                          </span>
                          <span className="mt-2 block max-w-[20rem] font-body text-sm leading-6 text-[#6e716c]">
                            File ini siap dibuka dalam tampilan penuh untuk membantu proses review.
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-3 rounded-[1.1rem] border border-[#d9ddd7] bg-white px-4 py-3 shadow-[0_18px_34px_-28px_rgba(8,69,50,0.18)] sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="grid size-10 shrink-0 place-items-center rounded-[0.95rem] bg-[#edf5f0] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                            {isImageFile ? <FileImage className="size-5" /> : <FileText className="size-5" />}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-body text-[0.96rem] font-semibold text-[#1a1c1c]">{file.name}</p>
                            <p className="text-[0.72rem] uppercase tracking-[0.08em] text-[#6e716c]">
                              {isImageFile ? "JPG / PNG" : "PDF"}{fileSizeLabel ? ` - ${fileSizeLabel}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <label
                            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[0.95rem] border border-[#c8cec5] bg-white px-5 font-body text-sm font-semibold text-primary transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.03] active:scale-[0.98]"
                            htmlFor={fileInputId}
                          >
                            Ganti file
                          </label>
                          <Button
                            className="rounded-[0.95rem] px-4 text-[#cf3f32] hover:bg-[#cf3f32]/8 hover:text-[#b93327]"
                            onClick={clearSelectedFile}
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="size-4" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-[1.2rem] bg-[linear-gradient(180deg,#fbfbf8,#f3f4ef)] px-5 py-8 text-center">
                      <span className="grid size-16 place-items-center rounded-[1.15rem] bg-[#ececea] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
                        <UploadCloud className="size-7" />
                      </span>
                      <span className="mt-4 block font-body text-[0.98rem] font-semibold text-[#1a1c1c]">
                        Klik atau seret file ke sini
                      </span>
                      <span className="mt-2 block max-w-[18rem] font-body text-sm leading-6 text-[#6e716c]">
                        Pilih JPG, PNG, atau PDF. Tekan preview untuk membuka tampilan penuh.
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex flex-col items-center gap-3 text-center">
                    {!file ? (
                      <label
                        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[0.95rem] border border-[#c8cec5] bg-white px-5 font-body text-sm font-semibold text-primary transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.03] active:scale-[0.98]"
                        htmlFor={fileInputId}
                      >
                        Pilih File
                      </label>
                    ) : null}
                    <span className="block font-body text-[0.78rem] uppercase tracking-[0.08em] text-[#6e716c]">
                      Format: JPG, PNG, PDF (Maks. 5MB)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button
            className="mt-6 rounded-xl bg-[#0d6a49] px-5 text-white hover:bg-[#0c5f42]"
            disabled={isPending || !canSubmit}
            type="button"
            onClick={handleSubmit}
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
            {actionCopy}
          </Button>
        </section>
      ) : null}

      {feedback ? (
        <InlineFeedback title={feedback.title} description={feedback.description} variant={feedback.variant} />
      ) : null}
      {isPreviewOpen && filePreviewUrl
        ? createPortal(
            <div
              aria-labelledby={previewTitleId}
              aria-modal="true"
              className="fixed inset-0 z-[140] flex items-center justify-center bg-[#081b14]/72 p-4 backdrop-blur-md sm:p-6"
              onClick={() => setIsPreviewOpen(false)}
              role="dialog"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,184,93,0.16),transparent_36%)]" />
              <div
                className="relative z-[141] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/28 bg-[linear-gradient(180deg,rgba(248,246,239,0.96),rgba(255,255,255,0.92))] p-2 shadow-[0_48px_120px_-40px_rgba(3,21,14,0.82)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] border border-black/5 bg-[#fbfbf8]">
                  <div className="flex items-start justify-between gap-4 border-b border-black/6 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <p className="font-body text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#8d6c08]">
                        Bukti Pendukung
                      </p>
                      <h3
                        className="mt-1 truncate font-headline text-[1.35rem] font-black tracking-tight text-[#13211c]"
                        id={previewTitleId}
                      >
                        {selectedFileName}
                      </h3>
                    </div>
                    <button
                      aria-label="Tutup preview bukti pendukung"
                      className="grid size-11 shrink-0 place-items-center rounded-full border border-black/8 bg-white text-primary transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f5f7f2] active:scale-[0.97]"
                      onClick={() => setIsPreviewOpen(false)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="bg-[linear-gradient(180deg,#f7f8f4,#eef1ea)] p-3 sm:p-4">
                    <div className="overflow-hidden rounded-[1.5rem] border border-black/6 bg-white shadow-[0_24px_60px_-36px_rgba(8,69,50,0.28)]">
                      {isImageFile ? (
                        <img
                          alt="Preview penuh bukti pendukung"
                          className="max-h-[78dvh] w-full object-contain bg-[#f8f8f5]"
                          src={filePreviewUrl ?? undefined}
                        />
                      ) : isPdfFile ? (
                        <iframe
                          className="h-[78dvh] w-full bg-white"
                          src={`${filePreviewUrl}#toolbar=1&navpanes=0`}
                          title="Preview penuh PDF bukti pendukung"
                        />
                      ) : (
                        <div className="flex h-[70dvh] items-center justify-center bg-[#f8f8f5]">
                          <div className="flex items-center gap-3 rounded-[1.15rem] border border-[#dde1d9] bg-white px-5 py-4 shadow-[0_18px_40px_-30px_rgba(8,69,50,0.28)]">
                            <span className="grid size-12 place-items-center rounded-[1rem] bg-[#f1f3ee] text-primary">
                              <FileText className="size-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-body text-sm font-semibold text-[#1a1c1c]">{selectedFileName}</p>
                              <p className="text-[0.74rem] uppercase tracking-[0.08em] text-[#6e716c]">
                                File siap ditinjau
                              </p>
                            </div>
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
