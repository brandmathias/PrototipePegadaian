import Link from "next/link";
import type { ReactNode } from "react";
import { Download, Printer } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TransactionReceiptActions({
  noteHref,
  className,
  printControl
}: {
  noteHref: string;
  className?: string;
  printControl?: ReactNode;
}) {
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
