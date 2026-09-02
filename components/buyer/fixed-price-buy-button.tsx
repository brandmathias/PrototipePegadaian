"use client";

import { useState } from "react";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function FixedPriceBuyButton({
  buttonLabel = "Beli Sekarang",
  className,
  lotId,
  openCheckout = false
}: {
  buttonLabel?: string;
  className?: string;
  lotId: string;
  openCheckout?: boolean;
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
        method: "POST"
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

      const transactionId = payload?.data?.transactionId;
      if (!transactionId) {
        toast({
          title: "Detail pembayaran belum tersedia",
          description: "Transaksi belum mengembalikan identitas yang dapat dibuka.",
          variant: "error",
          scope: "buyer"
        });
        setIsPending(false);
        return;
      }

      if (openCheckout) {
        const checkoutUrl = payload?.data?.snapRedirectUrl;
        if (!checkoutUrl) {
          toast({
            title: "Checkout Midtrans belum tersedia",
            description: "Transaksi dibuat tetapi tautan pembayaran belum diterima.",
            variant: "error",
            scope: "buyer"
          });
          setIsPending(false);
          return;
        }

        window.open(checkoutUrl, "_self");
        return;
      }

      router.replace(`/transaksi/${transactionId}`);
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
          Menyiapkan Pembayaran
        </>
      ) : (
        <>
          {buttonLabel}
          <ShoppingBag className="size-4" />
        </>
      )}
    </Button>
  );
}
