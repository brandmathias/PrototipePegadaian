"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CatalogSearchInputProps = {
  inputClassName?: string;
  placeholder?: string;
  submitLabel?: string;
  wrapperClassName?: string;
};

export function CatalogSearchInput({
  inputClassName,
  placeholder = "Cari lot, unit, kategori, atau kondisi...",
  submitLabel = "Cari",
  wrapperClassName
}: CatalogSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = pathname.startsWith("/katalog") ? searchParams.get("q") ?? "" : "";
  const [value, setValue] = useState(currentQuery);

  useEffect(() => {
    setValue(currentQuery);
  }, [currentQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = value.trim();
    const nextSearchParams = new URLSearchParams();
    if (trimmed) {
      nextSearchParams.set("q", trimmed);
    }

    const nextHref = nextSearchParams.size > 0 ? `/katalog?${nextSearchParams.toString()}` : "/katalog";
    router.push(nextHref);
  }

  return (
    <form className={cn("relative", wrapperClassName)} onSubmit={handleSubmit}>
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
        name="catalogSearch"
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      <button aria-label={submitLabel} className="sr-only" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
