"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Gavel, ShoppingBag, SlidersHorizontal } from "lucide-react";

import { LotCard } from "@/components/shared/lot-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import type { Lot } from "@/lib/mock-data";

const sortOptions = [
  { value: "latest", label: "Terbaru" },
  { value: "lowest", label: "Harga Terendah" },
  { value: "highest", label: "Harga Tertinggi" }
];

const priceBands = [
  { value: "all", label: "Semua harga" },
  { value: "under-10", label: "< Rp 10 Jt" },
  { value: "10-50", label: "Rp 10-50 Jt" },
  { value: "above-50", label: "> Rp 50 Jt" }
] as const;

export function CatalogPage({ lots: initialLots }: { lots: Lot[] }) {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState("latest");
  const [mode, setMode] = useState<"all" | "fixed_price" | "vickrey">("all");
  const [unitFilter, setUnitFilter] = useState("Semua Unit");
  const [priceBand, setPriceBand] = useState<(typeof priceBands)[number]["value"]>("all");

  const units = useMemo(
    () => ["Semua Unit", ...new Set(initialLots.map((lot) => lot.unitName))],
    [initialLots]
  );
  const categories = useMemo(
    () => ["Semua", ...new Set(initialLots.map((lot) => lot.category))],
    [initialLots]
  );

  const lots = useMemo(() => {
    const byCategory =
      activeCategory === "Semua"
        ? initialLots
        : initialLots.filter((lot) => lot.category === activeCategory);

    const byMode =
      mode === "all" ? byCategory : byCategory.filter((lot) => lot.mode === mode);

    const byUnit =
      unitFilter === "Semua Unit"
        ? byMode
        : byMode.filter((lot) => lot.unitName === unitFilter);

    const filtered = byUnit.filter((lot) => {
      if (priceBand === "under-10") return lot.price < 10000000;
      if (priceBand === "10-50") return lot.price >= 10000000 && lot.price <= 50000000;
      if (priceBand === "above-50") return lot.price > 50000000;
      return true;
    });

    if (sortBy === "lowest") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }

    if (sortBy === "highest") {
      return [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [activeCategory, initialLots, mode, priceBand, sortBy, unitFilter]);

  return (
    <div className="container space-y-10 py-12">
      <SectionHeading
        eyebrow="Katalog Pembeli"
        title="Katalog barang yang sedang dipasarkan"
        description="Jelajahi barang fixed price dan lot lelang Vickrey dari berbagai unit. Setiap item sudah menampilkan mode transaksi, harga, kondisi, dan konteks pembayaran sesuai alur di PRD."
        action={
          <Button variant="secondary">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        }
      />

      <div className="rounded-[1.75rem] bg-surface-low p-5 shadow-ambient">
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.5rem] bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Pilih alur yang ingin Anda ikuti
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    mode === "all"
                      ? "bg-primary text-white"
                      : "bg-surface-highest text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                  onClick={() => setMode("all")}
                  type="button"
                >
                  <SlidersHorizontal className="size-4" />
                  Semua mode
                </button>
                <button
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    mode === "fixed_price"
                      ? "bg-primary text-white"
                      : "bg-surface-highest text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                  onClick={() => setMode("fixed_price")}
                  type="button"
                >
                  <ShoppingBag className="size-4" />
                  Fixed Price
                </button>
                <button
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    mode === "vickrey"
                      ? "bg-primary text-white"
                      : "bg-surface-highest text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                  onClick={() => setMode("vickrey")}
                  type="button"
                >
                  <Gavel className="size-4" />
                  Lelang Vickrey
                </button>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Ringkasan hasil
              </p>
              <p className="mt-4 text-3xl font-extrabold text-primary">{lots.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Barang sesuai filter aktif saat ini.
              </p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="flex items-center gap-3 overflow-x-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-lowest px-4 py-2 text-sm font-semibold text-primary">
                <SlidersHorizontal className="size-4" />
                Kategori
              </div>
              {categories.map((category) => (
                <button
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    category === activeCategory
                      ? "bg-accent text-accent-foreground"
                      : "bg-surface-highest text-muted-foreground hover:bg-accent/40"
                  }`}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <select
                aria-label="Filter unit"
                className="h-11 rounded-xl border border-transparent bg-surface-lowest px-4 text-sm outline-none ring-0"
                onChange={(event) => setUnitFilter(event.target.value)}
                value={unitFilter}
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <select
                aria-label="Rentang harga"
                className="h-11 rounded-xl border border-transparent bg-surface-lowest px-4 text-sm outline-none ring-0"
                onChange={(event) =>
                  setPriceBand(event.target.value as (typeof priceBands)[number]["value"])
                }
                value={priceBand}
              >
                {priceBands.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Urutkan"
                className="h-11 rounded-xl border border-transparent bg-surface-lowest px-4 text-sm outline-none ring-0"
                id="sort-by"
                onChange={(event) => setSortBy(event.target.value)}
                value={sortBy}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {lots.map((lot) => (
          <LotCard key={lot.id} lot={lot} />
        ))}
      </div>
      {lots.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-white p-8 text-center">
          <p className="text-lg font-semibold text-foreground">Belum ada barang sesuai filter ini.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Coba ubah kategori, mode pemasaran, unit, atau rentang harga.
          </p>
        </div>
      ) : null}
    </div>
  );
}
