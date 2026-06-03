"use client";

import { useState } from "react";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FixedPriceBuyButton({
  className,
  lotId
}: {
  className?: string;
  lotId: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  function handleBuyNow() {
    if (isPending) {
      return;
    }

    setIsPending(true);
    router.replace(`/katalog/${lotId}/beli`);
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
