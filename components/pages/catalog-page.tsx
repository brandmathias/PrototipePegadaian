"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BellRing,
  BriefcaseBusiness,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Eye,
  Gem,
  Gavel,
  Grid3X3,
  Heart,
  Image as ImageIcon,
  LayoutList,
  MapPin,
  Medal,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Tag,
  Timer,
  X
} from "lucide-react";

import { AdminSelect } from "@/components/admin/admin-select";
import { LiveCountdown } from "@/components/buyer/live-countdown";
import { LotFigure } from "@/components/shared/lot-figure";
import { buttonVariants } from "@/components/ui/button";
import type { Lot } from "@/lib/contracts/catalog";
import { currency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

type CatalogPageProps = {
  initialQuery?: string;
  lots: Lot[];
  serverNow?: string;
};

type SaleMode = "all" | "fixed_price" | "vickrey";
type SortMode = "latest" | "popular" | "lowest" | "highest" | "ending";
type ViewMode = "grid" | "list";

const HERO_BACKGROUND = "/uploads/Hero%20Section%20Katalog%20Buyer.png";
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

const sortOptions = [
  { value: "latest", label: "Terbaru" },
  { value: "popular", label: "Paling Dilihat" },
  { value: "lowest", label: "Harga Terendah" },
  { value: "highest", label: "Harga Tertinggi" },
  { value: "ending", label: "Lelang Berakhir Dekat" }
];

const modeCopy: Record<Exclude<SaleMode, "all">, { label: string; icon: ReactNode; tone: string }> = {
  fixed_price: {
    label: "Harga Tetap",
    icon: <ShoppingBag className="size-3.5" />,
    tone: "bg-[#d99900] text-white"
  },
  vickrey: {
    label: "Lelang Vickrey",
    icon: <Gavel className="size-3.5" />,
    tone: "bg-[#006b42] text-white"
  }
};

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `Rp ${Math.round(value / 1_000_000_000)} M`;
  }

  if (value >= 1_000_000) {
    return `Rp ${Math.round(value / 1_000_000)} Jt`;
  }

  return currency.format(value);
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getCountLabel(count: number) {
  return count.toLocaleString("id-ID");
}

function getSubtype(lot: Lot) {
  const ignored = new Set(["kategori", "kondisi", "status", "unit", "lokasi"]);
  const spec = lot.specs.find((item) => !ignored.has(normalize(item.label)));

  if (spec?.value) {
    return titleCase(spec.value);
  }

  const parts = lot.name.split(" ");
  return parts.length > 1 ? titleCase(parts.slice(1, 3).join(" ")) : titleCase(lot.category);
}

function getHashSeed(input: string) {
  return input.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function getLotInsights(lot: Lot, index: number) {
  const seed = getHashSeed(`${lot.id}-${lot.code}-${lot.name}`) + index * 17;
  const views = 84 + (seed % 168);
  const likes = 12 + (seed % 38);
  const followers = lot.mode === "vickrey" ? 8 + (seed % 34) : 0;
  const stock = lot.mode === "fixed_price" ? 1 + (seed % 6) : 1;
  const photoCount = Math.max(1, lot.media.filter((item) => item.type === "foto").length);

  return {
    followers,
    likes,
    photoCount,
    stock,
    views
  };
}

function getCategoryIcon(category: string) {
  const normalized = normalize(category);

  if (normalized.includes("emas") || normalized.includes("perhiasan")) return Gem;
  if (normalized.includes("logam")) return Medal;
  if (normalized.includes("elektronik")) return Cpu;
  if (normalized.includes("kendaraan")) return CarFront;
  return Package;
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const items: Array<number | "ellipsis-start" | "ellipsis-end"> = [0];
  const nearStart = currentPage <= 3;
  const nearEnd = currentPage >= totalPages - 4;
  const start = nearStart ? 1 : nearEnd ? totalPages - 5 : currentPage - 1;
  const end = nearStart ? 4 : nearEnd ? totalPages - 2 : currentPage + 1;

  if (start > 1) items.push("ellipsis-start");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < totalPages - 2) items.push("ellipsis-end");
  items.push(totalPages - 1);

  return items;
}

function FilterSection({
  children,
  title
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="border-t border-black/8 py-5 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-[#14211b]">{title}</h3>
        <ChevronRight className="size-4 rotate-90 text-black/42" />
      </div>
      {children}
    </section>
  );
}

function CountPill({ children }: { children: ReactNode }) {
  return <span className="ml-auto text-xs font-black text-black/48">{children}</span>;
}

function ModeButton({
  active,
  count,
  icon,
  label,
  onClick
}: {
  active: boolean;
  count: number;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "group flex h-10 w-full items-center gap-2 rounded-md border px-3 text-left text-[0.8rem] font-bold transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        active
          ? "border-[#0b6a49] bg-[#006b42] text-white shadow-[0_12px_24px_-20px_rgba(0,74,35,0.8)]"
          : "border-[#d8ded6] bg-white text-[#314139] hover:border-[#0b6a49]/28 hover:bg-[#f2faf5] hover:text-[#075f42]"
      )}
      type="button"
      onClick={onClick}
    >
      <span
        className={cn(
          "grid size-5 place-items-center rounded-full transition duration-500",
          active ? "bg-white/18 text-white" : "bg-[#eef5f0] text-[#075f42] group-hover:bg-white"
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
      <CountPill>{getCountLabel(count)}</CountPill>
    </button>
  );
}

function CheckFilterButton({
  active,
  count,
  icon,
  label,
  onClick
}: {
  active: boolean;
  count: number;
  icon?: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "flex min-h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-[0.78rem] font-semibold transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        active
          ? "bg-[#e6f6ee] text-[#075f42] ring-1 ring-[#0b6a49]/14"
          : "text-[#3f4940] hover:bg-[#f5f8f5] hover:text-[#075f42]"
      )}
      type="button"
      onClick={onClick}
    >
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[0.28rem] border transition duration-500",
          active ? "border-[#0b6a49] bg-[#0b6a49] text-white" : "border-black/22 bg-white text-transparent"
        )}
      >
        <CheckCircle2 className="size-3" />
      </span>
      {icon ? <span className="text-[#075f42]">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <CountPill>{getCountLabel(count)}</CountPill>
    </button>
  );
}

function FilterSearch({
  label,
  placeholder,
  value,
  onChange
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative mb-3 block">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/42" />
      <input
        className="h-10 w-full rounded-md border border-black/10 bg-white pl-9 pr-3 text-[0.8rem] font-medium text-[#14211b] outline-none transition duration-500 placeholder:text-black/36 focus:border-[#0b6a49]/30 focus:ring-4 focus:ring-[#0b6a49]/8"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function HeroInfoCard({
  icon,
  items,
  title,
  tone = "green"
}: {
  icon: ReactNode;
  items: string[];
  title: string;
  tone?: "green" | "gold";
}) {
  return (
    <div className="rounded-md border border-white/80 bg-white/78 p-5 shadow-[0_26px_70px_-54px_rgba(9,55,41,0.5)] backdrop-blur">
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-full",
            tone === "gold" ? "bg-[#fff2ca] text-[#a36d00]" : "bg-[#e8f5ee] text-[#075f42]"
          )}
        >
          {icon}
        </span>
        <div>
          <h2 className="font-headline text-2xl font-black text-[#075f42]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-black/58">
            {tone === "gold" ? "Penawaran tertutup, pemenang ditetapkan secara adil." : "Beli sekarang dengan harga pasti."}
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <p className="flex items-center gap-2 text-sm font-medium text-[#34433c]" key={item}>
            <CheckCircle2 className={cn("size-4", tone === "gold" ? "text-[#a36d00]" : "text-[#075f42]")} />
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function ActiveChip({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return (
    <button
      className="inline-flex h-8 items-center gap-2 rounded-md bg-[#eef5ef] px-3 text-xs font-bold text-[#1d3128] transition duration-500 hover:bg-[#e2f1e8] hover:text-[#075f42]"
      type="button"
      onClick={onRemove}
    >
      {children}
      <X className="size-3.5" />
    </button>
  );
}

function CatalogLotCard({
  favorite,
  index,
  lot,
  serverNow,
  viewMode,
  onToggleFavorite
}: {
  favorite: boolean;
  index: number;
  lot: Lot;
  serverNow?: string;
  viewMode: ViewMode;
  onToggleFavorite: () => void;
}) {
  const insights = getLotInsights(lot, index);
  const mode = modeCopy[lot.mode];
  const subtype = getSubtype(lot);
  const showAuctionCountdown = lot.mode === "vickrey" && (lot.countdown || lot.endsAt);

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-md border border-black/10 bg-white shadow-[0_20px_54px_-44px_rgba(8,69,50,0.42)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[#0b6a49]/22 hover:shadow-[0_26px_70px_-48px_rgba(8,69,50,0.52)]",
        viewMode === "list" && "grid gap-0 lg:grid-cols-[18rem_1fr]"
      )}
    >
      <div className="relative">
        <LotFigure
          category={lot.category}
          className={cn(
            "rounded-none",
            viewMode === "list" ? "h-full min-h-[13.5rem] lg:aspect-auto" : "aspect-[1.78]"
          )}
          media={lot.media}
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white/92 px-2.5 py-1 text-[0.68rem] font-black text-[#075f42] shadow-sm backdrop-blur">
          <span className={cn("grid size-5 place-items-center rounded-[0.35rem]", mode.tone)}>
            {mode.icon}
          </span>
          {mode.label}
        </div>
        <button
          aria-pressed={favorite}
          aria-label={`${favorite ? "Hapus suka" : "Sukai"} ${lot.name}`}
          className={cn(
            "absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-black/10 bg-white/92 text-black/54 shadow-sm backdrop-blur transition duration-500 hover:-translate-y-0.5 hover:text-[#075f42]",
            favorite && "border-[#d99900]/24 bg-[#fff7df] text-[#bd7a00]"
          )}
          type="button"
          onClick={onToggleFavorite}
        >
          <Heart className={cn("size-4", favorite && "fill-current")} />
        </button>
      </div>

      <div className="flex min-h-0 flex-col p-4">
        <div className="min-w-0">
          <h3 className="truncate font-headline text-base font-black text-[#13211c]">{lot.name}</h3>
          <p className="mt-1 text-xs font-semibold text-black/48">{lot.code}</p>
        </div>

        <div className="mt-3 grid gap-1.5 text-[0.72rem] font-medium text-black/56 sm:grid-cols-2">
          <p className="inline-flex min-w-0 items-center gap-1.5">
            <Tag className="size-3.5 shrink-0" />
            <span className="truncate">{titleCase(lot.category)}</span>
            <span className="text-black/24">-</span>
            <span className="truncate">{subtype}</span>
          </p>
          <p className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{lot.unitName}</span>
            <span className="text-black/24">-</span>
            <span className="truncate">{titleCase(lot.condition)}</span>
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.72rem] font-semibold text-black/56">
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" />
            Dilihat {insights.views}x
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5" />
            Suka {insights.likes}
          </span>
          <span className="inline-flex items-center gap-1">
            <Package className="size-3.5" />
            Stok {insights.stock}
          </span>
          <span className="inline-flex items-center gap-1">
            <ImageIcon className="size-3.5" />
            Foto {insights.photoCount}
          </span>
          {lot.mode === "vickrey" ? (
            <span className="inline-flex items-center gap-1">
              <BellRing className="size-3.5" />
              Diikuti {insights.followers}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-1 flex-col justify-end">
          <div className="flex items-end justify-between gap-3">
            <div>
              {lot.mode === "vickrey" ? (
                <p className="text-[0.68rem] font-black text-[#075f42]/72">Harga Awal</p>
              ) : null}
              <p className={cn("font-headline text-lg font-black", lot.mode === "fixed_price" ? "text-[#d28b00]" : "text-[#075f42]")}>
                {currency.format(lot.price)}
              </p>
            </div>
            {showAuctionCountdown ? (
              <p className="max-w-[11rem] text-right text-[0.72rem] font-semibold text-[#075f42]">
                <Timer className="mr-1 inline size-3.5 align-[-2px]" />
                <LiveCountdown
                  expiredLabel="Menunggu hasil"
                  fallbackLabel={lot.countdown}
                  prefix="Berakhir"
                  serverNow={serverNow}
                  targetAt={lot.endsAt}
                />
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {lot.mode === "fixed_price" ? (
              <>
                <span className="rounded-md bg-[#eef5ef] px-2 py-1 text-[0.68rem] font-bold text-[#075f42]">
                  Pembayaran aman
                </span>
                <span className="rounded-md bg-[#f7f3e9] px-2 py-1 text-[0.68rem] font-bold text-black/54">
                  Foto asli
                </span>
              </>
            ) : (
              <>
                <span className="rounded-md bg-[#eef5ef] px-2 py-1 text-[0.68rem] font-bold text-[#075f42]">
                  Penawaran tertutup
                </span>
                <span className="rounded-md bg-[#f7f3e9] px-2 py-1 text-[0.68rem] font-bold text-black/54">
                  Aturan transparan
                </span>
              </>
            )}
          </div>

          <Link
            aria-label={`Lihat detail ${lot.name}`}
            className={cn(
              buttonVariants({ variant: lot.mode === "fixed_price" ? "accent" : "default" }),
              "mt-4 h-10 w-full rounded-md text-sm font-black"
            )}
            href={`/katalog/${lot.id}`}
          >
            {lot.mode === "fixed_price" ? "Beli Sekarang" : "Ikut Lelang"}
            {lot.mode === "fixed_price" ? <ShoppingBag className="size-4" /> : <Gavel className="size-4" />}
          </Link>
        </div>
      </div>
    </article>
  );
}

function PaginationFooter({
  pageIndex,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange
}: {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const items = getPaginationItems(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-4 border-t border-black/8 bg-white px-4 py-4 text-sm text-black/54 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center justify-center gap-2 md:justify-start">
        <button
          aria-label="Halaman sebelumnya"
          className="grid size-9 place-items-center rounded-md text-black/42 transition duration-500 hover:bg-[#f3f6f2] hover:text-[#075f42] disabled:cursor-not-allowed disabled:opacity-35"
          disabled={currentPage === 0}
          type="button"
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        >
          <ChevronLeft className="size-4" />
        </button>
        {items.map((item) =>
          typeof item === "number" ? (
            <button
              aria-current={item === currentPage ? "page" : undefined}
              className={cn(
                "grid size-9 place-items-center rounded-md text-sm font-black transition duration-500",
                item === currentPage
                  ? "bg-[#075f42] text-white shadow-[0_16px_32px_-26px_rgba(7,95,66,0.7)]"
                  : "border border-black/8 bg-white text-black/58 hover:border-[#0b6a49]/18 hover:bg-[#f2faf5] hover:text-[#075f42]"
              )}
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
            >
              {item + 1}
            </button>
          ) : (
            <span className="grid size-9 place-items-center text-black/30" key={item}>
              ...
            </span>
          )
        )}
        <button
          aria-label="Halaman berikutnya"
          className="grid size-9 place-items-center rounded-md text-black/42 transition duration-500 hover:bg-[#f3f6f2] hover:text-[#075f42] disabled:cursor-not-allowed disabled:opacity-35"
          disabled={currentPage >= totalPages - 1}
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 md:justify-end">
        <span className="font-medium">Tampilkan</span>
        <AdminSelect
          ariaLabel="Jumlah katalog per halaman"
          className="w-24"
          options={PAGE_SIZE_OPTIONS.map((size) => ({ value: size, label: String(size) }))}
          size="compact"
          value={pageSize}
          onValueChange={(nextValue) => onPageSizeChange(Number(nextValue))}
        />
        <span className="font-medium">per halaman</span>
      </div>
    </div>
  );
}

export function CatalogPage({ initialQuery = "", lots: initialLots, serverNow }: CatalogPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<SaleMode>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [unitQuery, setUnitQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [pageIndex, setPageIndex] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const lotsWithInsights = useMemo(
    () =>
      initialLots.map((lot, index) => ({
        index,
        insights: getLotInsights(lot, index),
        lot
      })),
    [initialLots]
  );

  const modeCounts = useMemo(
    () => ({
      all: initialLots.length,
      fixed_price: initialLots.filter((lot) => lot.mode === "fixed_price").length,
      vickrey: initialLots.filter((lot) => lot.mode === "vickrey").length
    }),
    [initialLots]
  );

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    initialLots.forEach((lot) => map.set(lot.category, (map.get(lot.category) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "id"));
  }, [initialLots]);

  const conditions = useMemo(() => {
    const map = new Map<string, number>();
    initialLots.forEach((lot) => map.set(titleCase(lot.condition), (map.get(titleCase(lot.condition)) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "id"));
  }, [initialLots]);

  const units = useMemo(() => {
    const map = new Map<string, number>();
    initialLots.forEach((lot) => map.set(lot.unitName, (map.get(lot.unitName) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "id"));
  }, [initialLots]);

  const visibleCategories = categories.filter(([category]) => normalize(category).includes(normalize(categoryQuery)));
  const visibleUnits = units.filter(([unit]) => normalize(unit).includes(normalize(unitQuery)));

  const filteredLots = useMemo(() => {
    const normalizedQuery = normalize(query);
    const parsedMinPrice = minPrice.trim() ? Number(minPrice) : null;
    const parsedMaxPrice = maxPrice.trim() ? Number(maxPrice) : null;

    const filtered = lotsWithInsights.filter(({ lot }) => {
      if (mode !== "all" && lot.mode !== mode) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(lot.category)) return false;
      if (selectedConditions.length > 0 && !selectedConditions.includes(titleCase(lot.condition))) return false;
      if (selectedUnits.length > 0 && !selectedUnits.includes(lot.unitName)) return false;
      if (parsedMinPrice !== null && Number.isFinite(parsedMinPrice) && lot.price < parsedMinPrice) return false;
      if (parsedMaxPrice !== null && Number.isFinite(parsedMaxPrice) && lot.price > parsedMaxPrice) return false;

      if (!normalizedQuery) return true;

      return [
        lot.name,
        lot.code,
        lot.category,
        lot.condition,
        lot.city,
        lot.unitName,
        lot.location,
        lot.description,
        getSubtype(lot),
        ...lot.specs.flatMap((spec) => [spec.label, spec.value])
      ].some((value) => normalize(value).includes(normalizedQuery));
    });

    if (sortBy === "popular") {
      return [...filtered].sort((a, b) => b.insights.views - a.insights.views);
    }

    if (sortBy === "lowest") {
      return [...filtered].sort((a, b) => a.lot.price - b.lot.price);
    }

    if (sortBy === "highest") {
      return [...filtered].sort((a, b) => b.lot.price - a.lot.price);
    }

    if (sortBy === "ending") {
      return [...filtered].sort((a, b) => {
        const first = a.lot.endsAt ? new Date(a.lot.endsAt).getTime() : Number.MAX_SAFE_INTEGER;
        const second = b.lot.endsAt ? new Date(b.lot.endsAt).getTime() : Number.MAX_SAFE_INTEGER;
        return first - second;
      });
    }

    return filtered;
  }, [
    lotsWithInsights,
    maxPrice,
    minPrice,
    mode,
    query,
    selectedCategories,
    selectedConditions,
    selectedUnits,
    sortBy
  ]);

  useEffect(() => {
    setPageIndex(0);
  }, [filteredLots.length, mode, pageSize, query, selectedCategories, selectedConditions, selectedUnits, minPrice, maxPrice, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredLots.length / pageSize));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const visibleLots = filteredLots.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  const activeFilters = [
    query.trim()
      ? {
          label: `Pencarian: ${query.trim()}`,
          onRemove: () => setQuery("")
        }
      : null,
    mode !== "all"
      ? {
          label: modeCopy[mode].label,
          onRemove: () => setMode("all")
        }
      : null,
    ...selectedCategories.map((category) => ({
      label: category,
      onRemove: () => setSelectedCategories((current) => current.filter((item) => item !== category))
    })),
    ...selectedConditions.map((condition) => ({
      label: `Kondisi: ${condition}`,
      onRemove: () => setSelectedConditions((current) => current.filter((item) => item !== condition))
    })),
    ...selectedUnits.map((unit) => ({
      label: unit,
      onRemove: () => setSelectedUnits((current) => current.filter((item) => item !== unit))
    })),
    minPrice.trim()
      ? {
          label: `Min ${formatCompactCurrency(Number(minPrice))}`,
          onRemove: () => setMinPrice("")
        }
      : null,
    maxPrice.trim()
      ? {
          label: `Maks ${formatCompactCurrency(Number(maxPrice))}`,
          onRemove: () => setMaxPrice("")
        }
      : null
  ].filter(Boolean) as Array<{ label: string; onRemove: () => void }>;

  function resetFilters() {
    setQuery("");
    setMode("all");
    setSelectedCategories([]);
    setSelectedConditions([]);
    setSelectedUnits([]);
    setCategoryQuery("");
    setUnitQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("latest");
  }

  function toggleValue(value: string, setter: (updater: (current: string[]) => string[]) => void) {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  const heroStyle = {
    "--catalog-hero-image": `url('${HERO_BACKGROUND}')`
  } as CSSProperties;

  return (
    <div className="bg-[#f7f6f1]">
      <section
        className="relative isolate overflow-hidden border-b border-black/5 bg-[image:var(--catalog-hero-image)] bg-cover bg-center"
        style={heroStyle}
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0.86)_42%,rgba(255,255,255,0.58)_100%)]" />
        <div className="container grid gap-8 py-12 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.42em] text-[#b98200]">Katalog Premium</p>
            <h1 className="mt-4 max-w-4xl font-headline text-4xl font-black leading-[1.03] text-[#075f42] md:text-5xl lg:text-[3.3rem]">
              Temukan barang terbaik pilihan Anda di Pegadaian Lelang
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#2f4038]">
              Jelajahi beragam barang harga tetap dan lelang Vickrey dari berbagai kategori,
              unit, dan kondisi. Semua barang terverifikasi untuk pengalaman lelang yang aman,
              transparan, dan terpercaya.
            </p>

            <div className="mt-8 grid gap-4 text-sm text-[#314139] sm:grid-cols-3">
              {[
                { icon: <ShieldCheck className="size-5" />, title: "Terverifikasi & Aman", body: "Setiap barang telah diverifikasi" },
                { icon: <BadgeCheck className="size-5" />, title: "Transparan & Terpercaya", body: "Proses lelang terbuka & jelas" },
                { icon: <Store className="size-5" />, title: "Praktis & Nyaman", body: "Bisa diakses kapan pun" }
              ].map((item) => (
                <div className="flex items-start gap-3" key={item.title}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/82 text-[#075f42] shadow-sm">
                    {item.icon}
                  </span>
                  <span>
                    <span className="block font-black">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-black/56">{item.body}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <HeroInfoCard
              icon={<BriefcaseBusiness className="size-7" />}
              items={["Pembayaran instan", "Stok terbatas, siap cepat didapat", "Kondisi barang terverifikasi", "Aman, mudah, dan terpercaya"]}
              title="Harga Tetap"
            />
            <HeroInfoCard
              icon={<Gavel className="size-7" />}
              items={["Penawaran tertutup", "Pemenang dengan harga terbaik", "Aturan jelas & transparan", "Peluang menang lebih besar"]}
              title="Lelang Vickrey"
              tone="gold"
            />
          </div>
        </div>
      </section>

      <section className="container -mt-2 pb-12 pt-8">
        <div className="overflow-hidden rounded-md border border-black/10 bg-white shadow-[0_30px_80px_-62px_rgba(8,69,50,0.48)]">
          <div className="grid lg:grid-cols-[18rem_1fr]">
            <aside className="border-b border-black/8 bg-[#fbfaf6] p-5 lg:border-b-0 lg:border-r">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-headline text-xl font-black text-[#14211b]">Filter</h2>
                <button
                  className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-bold text-[#314139] transition duration-500 hover:bg-white hover:text-[#075f42]"
                  type="button"
                  onClick={resetFilters}
                >
                  <RotateCcw className="size-3.5" />
                  Reset semua
                </button>
              </div>

              <FilterSection title="Mode Penjualan">
                <div className="space-y-2">
                  <ModeButton
                    active={mode === "all"}
                    count={modeCounts.all}
                    icon={<SlidersHorizontal className="size-3.5" />}
                    label="Semua Mode"
                    onClick={() => setMode("all")}
                  />
                  <ModeButton
                    active={mode === "fixed_price"}
                    count={modeCounts.fixed_price}
                    icon={<ShoppingBag className="size-3.5" />}
                    label="Harga Tetap"
                    onClick={() => setMode("fixed_price")}
                  />
                  <ModeButton
                    active={mode === "vickrey"}
                    count={modeCounts.vickrey}
                    icon={<Gavel className="size-3.5" />}
                    label="Lelang Vickrey"
                    onClick={() => setMode("vickrey")}
                  />
                </div>
              </FilterSection>

              <FilterSection title="Kategori">
                <FilterSearch
                  label="Cari kategori"
                  placeholder="Cari kategori..."
                  value={categoryQuery}
                  onChange={setCategoryQuery}
                />
                <div className="space-y-1">
                  {visibleCategories.map(([category, count]) => {
                    const Icon = getCategoryIcon(category);
                    return (
                      <CheckFilterButton
                        active={selectedCategories.includes(category)}
                        count={count}
                        icon={<Icon className="size-3.5" />}
                        key={category}
                        label={titleCase(category)}
                        onClick={() => toggleValue(category, setSelectedCategories)}
                      />
                    );
                  })}
                </div>
              </FilterSection>

              <FilterSection title="Kondisi Barang">
                <div className="space-y-1">
                  {conditions.map(([condition, count]) => (
                    <CheckFilterButton
                      active={selectedConditions.includes(condition)}
                      count={count}
                      key={condition}
                      label={condition}
                      onClick={() => toggleValue(condition, setSelectedConditions)}
                    />
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Lokasi / Unit">
                <FilterSearch
                  label="Cari unit atau lokasi"
                  placeholder="Cari unit atau lokasi..."
                  value={unitQuery}
                  onChange={setUnitQuery}
                />
                <div className="space-y-1">
                  {visibleUnits.map(([unit, count]) => (
                    <CheckFilterButton
                      active={selectedUnits.includes(unit)}
                      count={count}
                      key={unit}
                      label={unit}
                      onClick={() => toggleValue(unit, setSelectedUnits)}
                    />
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Rentang Harga (Rp)">
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-[0.68rem] font-bold text-black/48">Min.</span>
                    <input
                      className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-[0.78rem] font-semibold outline-none transition duration-500 focus:border-[#0b6a49]/30 focus:ring-4 focus:ring-[#0b6a49]/8"
                      inputMode="numeric"
                      placeholder="100.000"
                      value={minPrice}
                      onChange={(event) => setMinPrice(event.target.value.replace(/\D/g, ""))}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[0.68rem] font-bold text-black/48">Maks.</span>
                    <input
                      className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-[0.78rem] font-semibold outline-none transition duration-500 focus:border-[#0b6a49]/30 focus:ring-4 focus:ring-[#0b6a49]/8"
                      inputMode="numeric"
                      placeholder="100.000.000"
                      value={maxPrice}
                      onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, ""))}
                    />
                  </label>
                </div>
              </FilterSection>
            </aside>

            <div className="min-w-0">
              <div className="border-b border-black/8 bg-white p-5">
                <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
                  <label className="relative block">
                    <span className="sr-only">Cari katalog</span>
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-black/48" />
                    <input
                      className="h-14 w-full rounded-md border border-black/8 bg-[#f4f3ef] pl-12 pr-20 text-sm font-semibold text-[#14211b] outline-none transition duration-500 placeholder:text-black/42 focus:border-[#0b6a49]/24 focus:bg-white focus:ring-4 focus:ring-[#0b6a49]/8"
                      placeholder="Cari lot, kode barang, kategori, atau unit..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-[0.35rem] border border-black/10 bg-white px-2 py-1 text-[0.68rem] font-black text-black/44 sm:inline-flex">
                      Ctrl K
                    </kbd>
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <AdminSelect
                      ariaLabel="Urutkan katalog"
                      className="w-52"
                      options={sortOptions}
                      value={sortBy}
                      onValueChange={(value) => setSortBy(value as SortMode)}
                    />
                    <div className="inline-flex rounded-md bg-[#f4f3ef] p-1">
                      <button
                        aria-label="Tampilan grid"
                        aria-pressed={viewMode === "grid"}
                        className={cn(
                          "grid size-10 place-items-center rounded-md transition duration-500",
                          viewMode === "grid" ? "bg-white text-[#075f42] shadow-sm" : "text-black/52 hover:text-[#075f42]"
                        )}
                        type="button"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid3X3 className="size-4" />
                      </button>
                      <button
                        aria-label="Tampilan daftar"
                        aria-pressed={viewMode === "list"}
                        className={cn(
                          "grid size-10 place-items-center rounded-md transition duration-500",
                          viewMode === "list" ? "bg-white text-[#075f42] shadow-sm" : "text-black/52 hover:text-[#075f42]"
                        )}
                        type="button"
                        onClick={() => setViewMode("list")}
                      >
                        <LayoutList className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-[#14211b]">Filter aktif</span>
                    {activeFilters.length > 0 ? (
                      activeFilters.map((filter) => (
                        <ActiveChip key={filter.label} onRemove={filter.onRemove}>
                          {filter.label}
                        </ActiveChip>
                      ))
                    ) : (
                      <span className="rounded-md bg-[#f4f3ef] px-3 py-1.5 text-xs font-bold text-black/44">
                        Semua barang
                      </span>
                    )}
                    <span className="rounded-md px-2 py-1 text-xs font-bold text-black/46">
                      Menampilkan {getCountLabel(filteredLots.length)} dari{" "}
                      {getCountLabel(initialLots.length)} barang
                    </span>
                  </div>
                  {activeFilters.length > 0 ? (
                    <button
                      className="w-fit text-xs font-black text-[#075f42] transition duration-500 hover:text-[#0b3f2e]"
                      type="button"
                      onClick={resetFilters}
                    >
                      Bersihkan semua
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="bg-[#fbfaf6] p-5">
                <div
                  className={cn(
                    "grid gap-4",
                    viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                  )}
                >
                  {visibleLots.map(({ index, lot }) => (
                    <CatalogLotCard
                      favorite={favoriteIds.includes(lot.id)}
                      index={index}
                      key={lot.id}
                      lot={lot}
                      serverNow={serverNow}
                      viewMode={viewMode}
                      onToggleFavorite={() =>
                        setFavoriteIds((current) =>
                          current.includes(lot.id)
                            ? current.filter((item) => item !== lot.id)
                            : [...current, lot.id]
                        )
                      }
                    />
                  ))}
                </div>

                {visibleLots.length === 0 ? (
                  <div className="rounded-md border border-dashed border-black/14 bg-white p-10 text-center">
                    <p className="font-headline text-xl font-black text-[#14211b]">
                      Belum ada barang sesuai filter ini.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-black/56">
                      Coba ubah mode penjualan, kategori, lokasi, rentang harga, atau kata kunci.
                    </p>
                  </div>
                ) : null}
              </div>

              <PaginationFooter
                pageIndex={currentPage}
                pageSize={pageSize}
                totalItems={filteredLots.length}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
