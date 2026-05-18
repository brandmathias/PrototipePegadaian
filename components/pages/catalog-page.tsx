"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CarFront,
  Cpu,
  Gem,
  Gavel,
  Medal,
  Search,
  ShoppingBag,
  Shapes,
  Sparkles,
  Store,
  SlidersHorizontal
} from "lucide-react";

import { CatalogSearchInput } from "@/components/shared/catalog-search-input";
import { LotCard } from "@/components/shared/lot-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Lot } from "@/lib/contracts/catalog";

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

function FilterChip({
  active,
  children,
  icon,
  onClick
}: {
  active?: boolean;
  children: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition duration-200",
        active
          ? "border-[#0d6b4c] bg-[linear-gradient(135deg,#0d6b4c_0%,#159164_100%)] text-white shadow-[0_12px_30px_rgba(13,107,76,0.22)]"
          : "border-[#d9d6cb] bg-white text-[#46504b] hover:border-[#d4b65f] hover:bg-[#fff9ea] hover:text-[#0d6b4c]"
      )}
      onClick={onClick}
      type="button"
    >
      {icon ? <span className="grid size-4 place-items-center">{icon}</span> : null}
      {children}
    </button>
  );
}

function getCategoryIcon(category: string) {
  const normalized = category.trim().toLowerCase();

  if (normalized.includes("emas")) return <Gem className="size-3.5" />;
  if (normalized.includes("perhiasan")) return <Shapes className="size-3.5" />;
  if (normalized.includes("logam")) return <Medal className="size-3.5" />;
  if (normalized.includes("elektronik")) return <Cpu className="size-3.5" />;
  if (normalized.includes("kendaraan")) return <CarFront className="size-3.5" />;
  return <Store className="size-3.5" />;
}

export function CatalogPage({
  initialQuery = "",
  lots: initialLots
}: {
  initialQuery?: string;
  lots: Lot[];
}) {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState("latest");
  const [mode, setMode] = useState<"all" | "fixed_price" | "vickrey">("all");
  const [unitFilter, setUnitFilter] = useState("Semua Unit");
  const [priceBand, setPriceBand] = useState<(typeof priceBands)[number]["value"]>("all");
  const normalizedQuery = initialQuery.trim().toLowerCase();

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
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          lot.name,
          lot.code,
          lot.unitName,
          lot.city,
          lot.location,
          lot.category,
          lot.condition,
          lot.description,
          ...lot.specs.flatMap((spec) => [spec.label, spec.value])
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      if (!matchesQuery) {
        return false;
      }

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
  }, [activeCategory, initialLots, mode, normalizedQuery, priceBand, sortBy, unitFilter]);

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

      <div className="overflow-hidden rounded-[2rem] border border-[#ddd8cb] bg-[radial-gradient(circle_at_top_left,rgba(216,184,88,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(13,107,76,0.12),transparent_36%),linear-gradient(180deg,#fcfbf6_0%,#f4f1e8_100%)] p-5 shadow-[0_22px_60px_-36px_rgba(14,40,30,0.24)]">
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
            <div className="rounded-[1.7rem] border border-white/70 bg-white/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#0d6b4c]/66">
                <Search className="size-4" />
                Mesin pencarian buyer
              </div>
              <h3 className="mt-3 max-w-3xl font-headline text-2xl font-extrabold tracking-tight text-[#103b2d] md:text-[2.2rem]">
                Temukan lot lebih cepat dengan kata kunci yang benar-benar bekerja
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#53605a]">
                Cari berdasarkan nama barang, kode lot, unit, kategori, kondisi, atau deskripsi.
                Hasil akan ikut menyaring grid katalog di bawah.
              </p>
              <CatalogSearchInput
                inputClassName="mt-5 h-14 rounded-[1.25rem] border-[#d8d4c8] bg-[#fcfbf7] pl-11 pr-32 text-sm shadow-none focus-visible:border-[#0d6b4c]/25 focus-visible:ring-[#0d6b4c]/20"
                placeholder="Cari nama lot, kode, kategori, unit, atau kondisi..."
                submitLabel="Jalankan"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.7rem] border border-white/70 bg-[linear-gradient(135deg,#0d6b4c_0%,#13835d_100%)] p-5 text-white shadow-[0_22px_40px_-32px_rgba(13,107,76,0.5)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
                  Ringkasan hasil
                </p>
                <p className="mt-4 text-4xl font-black tracking-tight">{lots.length}</p>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  Lot cocok dengan kombinasi search, mode, kategori, unit, dan harga aktif.
                </p>
              </div>
              <div className="rounded-[1.7rem] border border-[#eadfbb] bg-[linear-gradient(180deg,#fff8e7_0%,#fffdf7_100%)] p-5">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#99751e]">
                  <Sparkles className="size-4" />
                  Filter aktif
                </div>
                <p className="mt-3 text-sm leading-7 text-[#665b3f]">
                  {normalizedQuery
                    ? `Keyword "${initialQuery}" ikut dipakai dalam pencarian.`
                    : "Belum ada keyword. Gunakan search untuk memburu lot spesifik."}
                </p>
              </div>
            </div>
          </div>

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
            <div className="rounded-[1.5rem] border border-[#ece6d8] bg-white/88 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Nuansa pencarian
              </p>
              <p className="mt-4 text-lg font-bold text-[#103b2d]">
                Filter kini lebih cepat dibaca, lebih enak disentuh, lebih jelas aktifnya.
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Tidak ada lagi dropdown datar untuk opsi kecil. Semua opsi penting tampil sebagai
                pilihan visual yang lebih hidup.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d8d4c8] bg-white px-4 py-2 text-sm font-semibold text-primary">
                <SlidersHorizontal className="size-4" />
                Kategori
              </div>
              {categories.map((category) => (
                <FilterChip
                  active={category === activeCategory}
                  icon={category === "Semua" ? <Building2 className="size-3.5" /> : getCategoryIcon(category)}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </FilterChip>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-[1.45rem] border border-[#dfdbcf] bg-white/88 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0d6b4c]/60">Unit</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {units.map((unit) => (
                    <FilterChip active={unitFilter === unit} key={unit} onClick={() => setUnitFilter(unit)}>
                      {unit}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.45rem] border border-[#dfdbcf] bg-white/88 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0d6b4c]/60">Rentang harga</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {priceBands.map((option) => (
                    <FilterChip active={priceBand === option.value} key={option.value} onClick={() => setPriceBand(option.value)}>
                      {option.label}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.45rem] border border-[#dfdbcf] bg-white/88 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0d6b4c]/60">Urutkan</p>
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Urutkan">
                  {sortOptions.map((option) => (
                    <FilterChip active={sortBy === option.value} key={option.value} onClick={() => setSortBy(option.value)}>
                      {option.label}
                    </FilterChip>
                  ))}
                </div>
              </div>
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
            Coba ubah keyword, kategori, mode pemasaran, unit, atau rentang harga.
          </p>
        </div>
      ) : null}
    </div>
  );
}
