"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { FixedPricePaymentModal } from "@/components/buyer/fixed-price-payment-modal";
import {
  isFixedPriceUnavailable,
  useFixedPriceAvailability
} from "@/components/buyer/fixed-price-availability";
import type { FixedPriceAvailability } from "@/lib/contracts/fixed-price-availability";

export function FixedPriceBuyButton({
  buttonLabel = "Beli Sekarang",
  className,
  lotId,
  availability
}: {
  buttonLabel?: string;
  className?: string;
  lotId: string;
  availability?: FixedPriceAvailability;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const availabilityContext = useFixedPriceAvailability();
  const [isPending, setIsPending] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const currentAvailability = availability ?? availabilityContext.availability;
  const isUnavailable = isFixedPriceUnavailable(currentAvailability);
  const isContinuingPayment =
    currentAvailability.status === "reserved" &&
    currentAvailability.owner === "self" &&
    currentAvailability.canContinue !== false;
  const currentLabel = currentAvailability.status === "sold"
    ? "Tidak tersedia"
    : isUnavailable
      ? "Sedang diproses"
      : isContinuingPayment
        ? "Lanjutkan pembayaran"
        : buttonLabel;

  const closeConfirmation = useCallback(() => setIsConfirmationOpen(false), []);

  useEffect(() => {
    if (isUnavailable && isConfirmationOpen && !isPending) {
      setIsConfirmationOpen(false);
    }
  }, [isConfirmationOpen, isPending, isUnavailable]);

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
        setIsConfirmationOpen(false);
        router.replace(`/login?next=${encodeURIComponent(`/katalog/${lotId}`)}`);
        return;
      }

      if (!response.ok) {
        if (response.status === 409 || payload?.code === "FIXED_PRICE_RESERVED") {
          setIsConfirmationOpen(false);
          toast({
            title: "Barang baru saja dipesan",
            description: "Pembeli lain lebih dulu memulai pembayaran. Ketersediaan barang telah diperbarui.",
            variant: "error",
            scope: "buyer"
          });
          void availabilityContext.refresh();
          setIsPending(false);
          return;
        }

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

      setIsConfirmationOpen(false);
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
    <>
      <Button
        className={cn("h-10 w-full rounded-md text-sm font-black", className)}
        disabled={isPending || isUnavailable}
        onClick={() => {
          if (!isUnavailable) {
            setIsConfirmationOpen(true);
          }
        }}
        title={
          isUnavailable
            ? currentAvailability.status === "sold"
              ? "Barang sudah terjual."
              : "Sedang diproses pembeli lain."
            : undefined
        }
        variant="accent"
      >
        {isPending ? (
          <>
            <LoaderCircle className="button-spinner size-4" />
            Menyiapkan Pembayaran
          </>
        ) : (
          <>
            {currentLabel}
            <ShoppingBag className="size-4" />
          </>
        )}
      </Button>
      <FixedPricePaymentModal
        loading={isPending}
        onClose={closeConfirmation}
        onConfirm={handleBuyNow}
        open={isConfirmationOpen}
      />
    </>
  );
}
