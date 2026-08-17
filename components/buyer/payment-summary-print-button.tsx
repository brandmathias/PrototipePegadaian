"use client";

import { Printer } from "lucide-react";

import { cn } from "@/lib/utils";

export function PaymentSummaryPrintButton({ className }: { className?: string }) {
  return (
    <button
      className={cn(
        "interactive-tap inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#b8d4c6] bg-white px-4 text-sm font-black text-[#087642] transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#087642]/45 hover:bg-[#f7fbf8] active:scale-[0.98]",
        className
      )}
      onClick={() => window.print()}
      type="button"
    >
      <Printer className="size-4" />
      Cetak Ringkasan
    </button>
  );
}
