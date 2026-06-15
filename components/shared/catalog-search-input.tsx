import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CatalogSearchInputProps = {
  defaultValue?: string;
  inputClassName?: string;
  placeholder?: string;
  submitLabel?: string;
  wrapperClassName?: string;
};

export function CatalogSearchInput({
  defaultValue = "",
  inputClassName,
  placeholder = "Cari lot, unit, kategori, atau kondisi...",
  submitLabel = "Cari",
  wrapperClassName
}: CatalogSearchInputProps) {
  return (
    <form action="/katalog" className={cn("relative", wrapperClassName)} method="get">
      <div className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2">
        <span className="grid size-10 place-items-center rounded-2xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,251,246,0.8))] text-primary shadow-[0_16px_32px_-24px_rgba(8,69,50,0.65)] ring-1 ring-primary/5">
          <Search className="size-4" />
        </span>
      </div>
      <Input
        aria-label="Cari katalog buyer"
        autoComplete="off"
        className={cn(
          "h-14 rounded-[1.75rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(249,252,249,0.88))] pl-14 pr-5 text-[0.96rem] shadow-[0_24px_64px_-48px_rgba(8,69,50,0.65)] ring-1 ring-primary/5 placeholder:text-muted-foreground/80 focus-visible:border-primary/15 focus-visible:ring-primary/15",
          inputClassName
        )}
        defaultValue={defaultValue}
        name="q"
        placeholder={placeholder}
        type="search"
      />
      <button aria-label={submitLabel} className="sr-only" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
