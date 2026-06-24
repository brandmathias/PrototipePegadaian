"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

export function HandoverComplaintButton({
  complaint,
  transactionId,
}: {
  complaint?: { note: string; submittedAt: string } | null;
  transactionId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (complaint) {
    return (
      <InlineFeedback
        description={`Dikirim ${complaint.submittedAt}. ${complaint.note}`}
        title="Komplain serah-terima terkirim"
        variant="info"
      />
    );
  }

  function handleSubmit() {
    setFeedback(null);
    startTransition(async () => {
      const response = await fetch(`/api/user/transaksi/${transactionId}/komplain-serah-terima`, {
        body: JSON.stringify({ note }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const description = payload.message ?? "Komplain serah-terima gagal dikirim.";
        setFeedback(description);
        toast({
          title: "Komplain belum terkirim",
          description,
          variant: "error",
          scope: "buyer",
        });
        return;
      }

      toast({
        title: "Komplain terkirim",
        description: "Auto-selesai transaksi ditahan sampai komplain ditindaklanjuti.",
        variant: "success",
        scope: "buyer",
      });
      router.refresh();
    });
  }

  if (!expanded) {
    return (
      <Button
        className="min-h-12 w-full rounded-[1rem] border-amber-300 bg-amber-50 px-5 text-[0.9rem] font-bold text-amber-800 hover:bg-amber-100"
        onClick={() => setExpanded(true)}
        type="button"
        variant="secondary"
      >
        <AlertTriangle className="size-4" />
        Ajukan Komplain Serah-Terima
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-[1rem] border border-amber-200 bg-amber-50/60 p-4">
      <Textarea
        className="min-h-24 bg-white text-sm"
        maxLength={500}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Tuliskan kendala serah-terima barang secara singkat."
        value={note}
      />
      <div className="flex flex-wrap gap-2">
        <Button disabled={isPending} onClick={handleSubmit} type="button">
          {isPending ? <LoaderCircle className="button-spinner size-4" /> : <Send className="size-4" />}
          Kirim Komplain
        </Button>
        <Button disabled={isPending} onClick={() => setExpanded(false)} type="button" variant="ghost">
          Batal
        </Button>
      </div>
      {feedback ? <InlineFeedback description={feedback} title="Komplain belum terkirim" variant="error" /> : null}
    </div>
  );
}

