"use client";

import { useState } from "react";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function FixedPriceBuyButton({
  className,
  lotId
}: {
  className?: string;
  lotId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  async function handleBuyNow() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch(`/api/user/beli/${lotId}`, {
        method: "POST",
        body: JSON.stringify({ paymentMethod: "transfer" }),
        headers: { "Content-Type": "application/json" }
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/katalog/${lotId}`)}`);
        return;
      }

      if (!response.ok) {
        toast({
          title: "Pembelian belum bisa diproses",
          description: payload.message ?? "Silakan coba lagi atau pilih barang lain.",
          variant: "error",
          scope: "buyer"
        });
        setIsPending(false);
        return;
      }

      const transactionId = payload?.data?.id;
      if (!transactionId) {
        toast({
          title: "Detail pembayaran belum tersedia",
          description: "Transaksi dibuat tetapi ID transaksi belum diterima.",
          variant: "error",
          scope: "buyer"
        });
        setIsPending(false);
        return;
      }

      router.replace(`/transaksi/${transactionId}`);
      router.refresh();
    } catch {
      toast({
        title: "Koneksi belum stabil",
        description: "Pembelian belum bisa diproses. Coba lagi dalam beberapa saat.",
        variant: "error",
        scope: "buyer"
      });
      setIsPending(false);
    }
  }

  return (
    <Button
      className={cn("h-10 w-full rounded-md text-sm font-black", className)}
      disabled={isPending}
      onClick={handleBuyNow}
      variant="accent"
    >
      {isPending ? (
        <>
          <LoaderCircle className="button-spinner size-4" />
          Membuat Transaksi
        </>
      ) : (
        <>
          Beli Sekarang
          <ShoppingBag className="size-4" />
        </>
      )}
    </Button>
  );
}
