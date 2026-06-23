import Link from "next/link";
import type { ReactNode } from "react";
import { Download, Printer } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TransactionReceiptActions({
  noteHref,
  className,
  disabledReason,
  printControl
}: {
  noteHref: string;
  className?: string;
  disabledReason?: string | null;
  printControl?: ReactNode;
}) {
  if (disabledReason) {
    return (
      <div className={cn("flex max-w-full flex-wrap gap-3", className)}>
        <button
          className={cn(buttonVariants({ variant: "default" }), "cursor-not-allowed opacity-55")}
          disabled
          title={disabledReason}
          type="button"
        >
          <Download className="size-4" />
          Unduh PDF
        </button>
        <button
          className={cn(buttonVariants({ size: "default", variant: "secondary" }), "cursor-not-allowed opacity-55")}
          disabled
          title={disabledReason}
          type="button"
        >
          <Printer className="size-4" />
          Cetak Nota
        </button>
        <p className="basis-full text-sm font-medium leading-6 text-muted-foreground">{disabledReason}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <Link
        className={buttonVariants({ variant: "default" })}
        href={`${noteHref}?output=download`}
        rel="noreferrer"
        target="_blank"
      >
        <Download className="size-4" />
        Unduh PDF
      </Link>
      {printControl ?? (
        <Link
          className={buttonVariants({ size: "default", variant: "secondary" })}
          href={`${noteHref}?output=print`}
          rel="noreferrer"
          target="_blank"
        >
          <Printer className="size-4" />
          Cetak Nota
        </Link>
      )}
    </div>
  );
}
