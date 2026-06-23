"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { useToast } from "@/components/ui/toast";

export function CompletePurchaseButton({
  disabledReason,
  transactionId
}: {
  disabledReason?: string | null;
  transactionId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
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

  function handleComplete() {
    if (disabledReason) {
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const response = await fetch(`/api/user/transaksi/${transactionId}/selesai`, {
        method: "POST"
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const description = payload.message ?? "Transaksi belum bisa ditandai selesai.";
        setFeedback({
          title: "Pembelian belum selesai",
          description,
          variant: "error"
        });
        toast({
          title: "Pembelian belum selesai",
          description,
          variant: "error",
          scope: "buyer"
        });
        return;
      }

      setFeedback({
        title: "Pembelian selesai",
        description: "Status transaksi sudah masuk ke tahap final dan nota tetap tersedia.",
        variant: "success"
      });
      toast({
        title: "Pembelian selesai",
        description: "Transaksi sudah ditutup sebagai selesai.",
        variant: "success",
        scope: "buyer"
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Button
        className="min-h-14 w-full rounded-[1rem] px-5 text-[0.98rem] font-bold tracking-[0.01em] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] disabled:border disabled:border-primary/10 disabled:bg-primary/45 disabled:text-white/95 disabled:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] disabled:saturate-[0.88]"
        disabled={!isHydrated || isPending || Boolean(disabledReason)}
        onClick={handleComplete}
      >
        {disabledReason ? (
          <>
            <LockKeyhole className="size-[1.05rem]" />
            Pembelian Selesai
          </>
        ) : isPending ? (
          <>
            <LoaderCircle aria-hidden="true" className="button-spinner size-[1.05rem]" />
            Menyelesaikan...
          </>
        ) : (
          <>
            <CheckCircle2 className="size-[1.05rem]" />
            Pembelian Selesai
          </>
        )}
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
