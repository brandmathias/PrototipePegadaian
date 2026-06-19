"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, LoaderCircle, UploadCloud } from "lucide-react";

import { HandoverProofCard, type HandoverProofViewModel } from "@/components/shared/handover-proof-card";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type HandoverProofUploadFormProps = {
  canUpload: boolean;
  itemTitle?: string;
  location?: string;
  proof?: HandoverProofViewModel | null;
  transactionId: string;
};

export function HandoverProofUploadForm({
  canUpload,
  itemTitle,
  location,
  proof,
  transactionId
}: HandoverProofUploadFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const inputId = `handover-proof-${transactionId}`;
  const hasFile = Boolean(file);
  const disabled = !canUpload || !isHydrated || isPending || !hasFile;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  function handleSubmit() {
    if (disabled || !file) {
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(`/api/admin/transaksi/${transactionId}/bukti-serah-terima`, {
        method: "POST",
        body
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const description = payload.message ?? "Foto bukti serah-terima belum dapat dikirim.";
        setFeedback({
          title: "Bukti belum terkirim",
          description,
          variant: "error"
        });
        toast({
          title: "Bukti belum terkirim",
          description,
          variant: "error",
          scope: "admin-unit"
        });
        return;
      }

      setFile(null);
      setFeedback({
        title: "Bukti serah-terima tersimpan",
        description: "Buyer kini dapat melihat dokumentasi dan mengonfirmasi Pembelian Selesai.",
        variant: "success"
      });
      toast({
        title: "Bukti serah-terima tersimpan",
        description: "Dokumentasi barang sudah masuk ke arsip transaksi.",
        variant: "success",
        scope: "admin-unit"
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <HandoverProofCard
        audience="admin"
        itemTitle={itemTitle}
        proof={proof ? { ...proof, location: proof.location ?? location } : { location }}
      />

      <div className="rounded-[1.35rem] border border-dashed border-[#c8d9cf] bg-[#f8fbf9] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[1rem] bg-[#e8f5ee] text-[#0a6a49]">
              <Camera className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-[#13211c]">
                {proof?.fileUrl ? "Ganti foto bukti serah-terima" : "Unggah foto bukti serah-terima"}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#52665c]">
                Format foto JPG, PNG, atau WebP. Maksimal 5 MB.
              </p>
              {file ? (
                <p className="mt-2 truncate rounded-lg border border-[#dce9df] bg-white px-3 py-2 text-xs font-semibold text-[#0a6a49]">
                  {file.name}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:min-w-[16rem]">
            <label
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[0.95rem] border border-[#c8cec5] bg-white px-5 text-sm font-semibold text-[#0a6a49] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#0a6a49]/35 hover:bg-[#0a6a49]/[0.03] active:scale-[0.98]"
              htmlFor={inputId}
            >
              Pilih Foto
            </label>
            <Button
              className="h-11 rounded-[0.95rem]"
              disabled={disabled}
              onClick={handleSubmit}
              type="button"
            >
              {isPending ? (
                <>
                  <LoaderCircle className="button-spinner size-4" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <UploadCloud className="size-4" />
                  Unggah Bukti Serah-Terima
                </>
              )}
            </Button>
          </div>
        </div>

        {!canUpload ? (
          <InlineFeedback
            className="mt-4"
            description="Bukti serah-terima baru dapat diunggah setelah pembayaran transaksi diverifikasi."
            title="Menunggu pembayaran terverifikasi"
            variant="info"
          />
        ) : null}
        {feedback ? (
          <InlineFeedback
            className="mt-4 feedback-lift"
            description={feedback.description}
            title={feedback.title}
            variant={feedback.variant}
          />
        ) : null}
      </div>

      <Input
        accept=".jpg,.jpeg,.png,.webp"
        aria-label="File bukti serah-terima barang"
        className="sr-only"
        disabled={!canUpload || isPending}
        id={inputId}
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
        }}
        type="file"
      />
    </div>
  );
}
