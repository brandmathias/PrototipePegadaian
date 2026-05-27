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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ paymentMethod: "transfer" })
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/katalog/${lotId}`)}`);
        return;
      }

      if (!response.ok) {
        const description = payload.message ?? "Detail pembayaran belum bisa dibuka. Silakan coba lagi.";
        toast({
          title: "Pembelian belum bisa diproses",
          description,
          variant: "error",
          scope: "buyer"
        });
        setIsPending(false);
        return;
      }

      toast({
        title: "Detail pembayaran dibuat",
        description: "Anda diarahkan langsung ke halaman pembayaran transfer.",
        variant: "success",
        scope: "buyer"
      });
      router.replace(`/transaksi/${payload.data.id}`);
      router.refresh();
    } catch {
      toast({
        title: "Pembelian belum bisa diproses",
        description: "Koneksi terputus. Coba lagi dalam beberapa saat.",
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
          Membuka Detail Pembayaran
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
