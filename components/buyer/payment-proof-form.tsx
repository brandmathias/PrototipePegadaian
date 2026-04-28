"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type BuyerPaymentProofFormProps = {
  transactionId: string;
  currentProof?: string;
};

export function BuyerPaymentProofForm({
  transactionId,
  currentProof
}: BuyerPaymentProofFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reference, setReference] = useState("");
  const [fileName, setFileName] = useState(currentProof ?? "bukti-transfer.pdf");
  const [file, setFile] = useState<File | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  function handleSubmit() {
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
    <div className="space-y-3">
      <Input
        aria-label="Nama file bukti transfer"
        autoComplete="off"
        name="proofFileName"
        onChange={(event) => setFileName(event.target.value)}
        placeholder="bukti-transfer.pdf"
        value={fileName}
      />
      <Input
        accept=".jpg,.jpeg,.png,.pdf"
        aria-label="File bukti transfer"
        name="proofFile"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        type="file"
      />
      <Input
        aria-label="Nomor referensi transfer"
        autoComplete="off"
        name="paymentReference"
        onChange={(event) => setReference(event.target.value)}
        placeholder="Nomor referensi transfer"
        value={reference}
      />
      <Button className="w-full" disabled={!isHydrated || isPending || !fileName.trim()} onClick={handleSubmit}>
        {!isHydrated
          ? "Menyiapkan\u2026"
          : isPending
          ? (
              <>
                <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
                {"Mengirim\u2026"}
              </>
            )
          : currentProof
            ? "Perbarui Bukti Pembayaran"
            : "Kirim Bukti Pembayaran"}
      </Button>
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
