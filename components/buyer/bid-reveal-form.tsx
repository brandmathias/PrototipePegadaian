"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type BidRevealFormProps = {
  buyerId: string;
  lotId: string;
};

type StoredRevealPacket = {
  amount?: number;
  salt?: string;
  bidHash?: string;
  storedAt?: string;
};

export function BidRevealForm({ buyerId, lotId }: BidRevealFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [salt, setSalt] = useState("");
  const [storedAt, setStoredAt] = useState<string | null>(null);

  useEffect(() => {
    const rawPacket = localStorage.getItem(`pegadaian:vickrey-reveal:${buyerId}:${lotId}`);
    if (!rawPacket) return;

    try {
      const packet = JSON.parse(rawPacket) as StoredRevealPacket;
      if (typeof packet.amount === "number") {
        setAmount(String(packet.amount));
      }
      if (typeof packet.salt === "string") {
        setSalt(packet.salt);
      }
      if (typeof packet.storedAt === "string") {
        setStoredAt(packet.storedAt);
      }
    } catch {
      localStorage.removeItem(`pegadaian:vickrey-reveal:${buyerId}:${lotId}`);
    }
  }, [buyerId, lotId]);

  function handleReveal() {
    startTransition(async () => {
      const response = await fetch(`/api/user/bid/${lotId}/reveal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount: Number(amount), salt })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: "Reveal bid gagal",
          description: payload.message ?? "Nominal atau salt belum cocok dengan hash tersimpan.",
          variant: "error",
          scope: "buyer"
        });
        return;
      }

      toast({
        title: "Bid berhasil dibuka",
      description: "Nominal kini masuk database dan bisa ikut proses mekanisme lelang.",
        variant: "success",
        scope: "buyer"
      });
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.5rem] border border-primary/20 bg-primary/[0.03] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Reveal legacy setelah deadline</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Form ini hanya untuk bid lama yang masih memakai hash-only. Bid baru memakai escrow terenkripsi
        dan dibuka otomatis oleh sistem setelah deadline.
      </p>
      {storedAt ? (
        <p className="mt-3 rounded-full bg-white px-3 py-2 text-xs font-semibold text-muted-foreground">
          Data reveal ditemukan di perangkat ini sejak {new Date(storedAt).toLocaleString("id-ID")}
        </p>
      ) : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground" htmlFor="reveal-amount">
            Nominal bid
          </label>
          <CurrencyInput
            id="reveal-amount"
            min={0}
            onValueChange={setAmount}
            placeholder="Nominal bid"
            value={amount}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground" htmlFor="reveal-salt">
            Salt rahasia
          </label>
          <Input
            id="reveal-salt"
            onChange={(event) => setSalt(event.target.value)}
            placeholder="Salt dari perangkat saat bid"
            value={salt}
          />
        </div>
      </div>
      <Button className="mt-5" disabled={isPending || !amount || !salt} onClick={handleReveal}>
        {isPending ? (
          <>
            <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
            Membuka bid...
          </>
        ) : (
          "Reveal Nominal Bid"
        )}
      </Button>
    </div>
  );
}
