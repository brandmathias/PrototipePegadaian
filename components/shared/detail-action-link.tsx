import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type DetailActionLinkProps = {
  href: string;
  className?: string;
  label?: string;
};

export function DetailActionLink({
  href,
  className,
  label = "Lihat detail",
}: DetailActionLinkProps) {
  return (
    <Link
      className={cn(
        "group inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[0.95rem] border border-[#d8e4de] bg-white px-3 text-[0.74rem] font-bold text-[#075b3f] shadow-[0_12px_24px_-24px_rgba(8,69,50,0.45)] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#006747] hover:bg-[#006747] hover:text-white hover:shadow-[0_14px_26px_-20px_rgba(0,103,71,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006747]/25 active:translate-y-0 active:scale-[0.98]",
        className
      )}
      href={href}
    >
      {label}
      <ChevronRight className="size-3.5 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5" />
    </Link>
  );
}
