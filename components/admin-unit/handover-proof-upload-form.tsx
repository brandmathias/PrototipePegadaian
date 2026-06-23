"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { HandoverProofCard, type HandoverProofViewModel } from "@/components/shared/handover-proof-card";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  const controls = (
    <div className="mt-4 flex flex-col items-center gap-3 text-center">
      <label
        aria-disabled={!canUpload || isPending}
        className={cn(
          "inline-flex h-11 cursor-pointer items-center justify-center rounded-[0.95rem] border border-[#c8cec5] bg-white px-5 font-body text-sm font-semibold text-primary transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.03] active:scale-[0.98]",
          (!canUpload || isPending) &&
            "pointer-events-none cursor-not-allowed border-[#d7ded5] bg-[#eef3ed] text-[#718077] hover:translate-y-0"
        )}
        htmlFor={inputId}
      >
        Pilih File
      </label>
      <span className="block font-body text-[0.78rem] uppercase tracking-[0.08em] text-[#6e716c]">
        JPG, PNG, atau WebP (Maks. 5MB)
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      <HandoverProofCard
        audience="admin"
        controls={controls}
        itemTitle={itemTitle}
        previewUrl={previewUrl}
        proof={proof ? { ...proof, location: proof.location ?? location } : { location }}
      />

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

      <Button
        className="h-14 w-full rounded-md font-body text-base font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
        disabled={disabled}
        onClick={handleSubmit}
        type="button"
      >
        {!isHydrated ? (
          "Menyiapkan..."
        ) : isPending ? (
          <>
            <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
            Mengunggah...
          </>
        ) : (
          "Unggah Bukti Serah-Terima"
        )}
      </Button>

      {!canUpload ? (
        <InlineFeedback
          description="Bukti serah-terima baru dapat diunggah setelah pembayaran transaksi diverifikasi."
          title="Menunggu pembayaran terverifikasi"
          variant="info"
        />
      ) : null}
      {feedback ? (
        <InlineFeedback
          className="feedback-lift"
          description={feedback.description}
          title={feedback.title}
          variant={feedback.variant}
        />
      ) : null}
    </div>
  );
}
