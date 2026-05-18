"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Search } from "lucide-react";

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
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="Cari katalog buyer"
        autoComplete="off"
        className={cn("border-border/70 bg-white pl-10 pr-28", inputClassName)}
        name="catalogSearch"
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      <button
        className="absolute right-1.5 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary/90 active:scale-[0.98]"
        type="submit"
      >
        <ArrowUpRight className="size-3.5" />
        {submitLabel}
      </button>
    </form>
  );
}
