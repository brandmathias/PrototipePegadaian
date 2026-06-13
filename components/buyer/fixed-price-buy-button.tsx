"use client";

import { ShoppingBag } from "lucide-react";
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

  function handleBuyNow() {
    router.replace(`/katalog/${lotId}/beli`);
  }

  return (
    <Button
      className={cn("h-10 w-full rounded-md text-sm font-black", className)}
      onClick={handleBuyNow}
      variant="accent"
    >
      Beli Sekarang
      <ShoppingBag className="size-4" />
    </Button>
  );
}
