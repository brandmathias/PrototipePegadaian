"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Gem,
  Gavel,
  Grid3X3,
  LayoutList,
  MapPin,
  Medal,
  PackagePlus,
  RotateCcw,
  Search,
  Shapes,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Timer,
  X
} from "lucide-react";

import { AdminSelect } from "@/components/admin/admin-select";
import { LiveCountdown } from "@/components/buyer/live-countdown";
import { FavoriteToggleButton } from "@/components/shared/favorite-toggle-button";
import { LotFigure } from "@/components/shared/lot-figure";
import { LotRealtimeStats } from "@/components/shared/lot-realtime-stats";
import { buttonVariants } from "@/components/ui/button";
import type { Lot } from "@/lib/contracts/catalog";
import type { CountdownState } from "@/lib/countdown";
import { currency } from "@/lib/formatters/currency";
import { formatAppDateTime } from "@/lib/timezone";
import { cn } from "@/lib/utils";

type CatalogPageProps = {
  initialQuery?: string;
  initialFavoriteIds?: string[];
  lots: Lot[];
  serverNow?: string;
  wishlistSyncEnabled?: boolean;
};

type SaleMode = "all" | "fixed_price" | "vickrey";
type SortMode = "latest" | "popular" | "lowest" | "highest" | "ending";
type ViewMode = "grid" | "list";

const HERO_BACKGROUND = "/uploads/Hero%20Section%20Katalog%20Buyer.png";
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
const EMPTY_FAVORITE_IDS: string[] = [];
const idNumberFormatter = new Intl.NumberFormat("id-ID");

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

function titleCase(value: string | null | undefined) {
  return (value ?? "")
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
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

function isCodeLikeChip(value: string, code: string) {
  const normalizedValue = normalize(value);
  const normalizedCode = normalize(code);
  return normalizedValue === normalizedCode || /^brg[-\s]?\d+/i.test(value);
}

function formatCatalogCountdownLabel(label: string, state: CountdownState) {
  if (state.isExpired) {
    return label;
  }

  const match = label.match(/(?:(\d+)\s+hari\s+)?(?:(\d+)\s+jam\s+)?(?:(\d+)\s+menit\s+)?(?:(\d+)\s+detik)?/i);
  if (!match) {
    return label;
  }

  const [, dayRaw, hourRaw, minuteRaw, secondRaw] = match;
  const days = Number(dayRaw ?? 0);
  const hours = Number(hourRaw ?? 0);
  const minutes = Number(minuteRaw ?? 0);
  const seconds = Number(secondRaw ?? 0);

  if (days > 0) {
    return `${days} hari ${hours} jam`;
  }

  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  }

  if (minutes > 0) {
    return `${minutes} menit ${seconds} detik`;
  }

  return `${Math.max(1, seconds)} detik`;
}

function getLotInsights(lot: Lot) {
  return {
    followers: lot.mode === "vickrey" ? (lot.insights?.participants ?? 0) : 0,
    likes: lot.insights?.likes ?? 0,
    views: lot.insights?.views ?? 0
  };
}

function getCategoryIcon(category: string) {
  const normalized = normalize(category);

  if (normalized.includes("emas")) return Gem;
  if (normalized.includes("perhiasan")) return Shapes;
  if (normalized.includes("logam")) return Medal;
  if (normalized.includes("elektronik")) return Cpu;
  if (normalized.includes("kendaraan")) return CarFront;
  return PackagePlus;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const CATALOG_PRICE_FILTER_LIMIT = 999_999_999_999;

function parsePriceInput(value: string) {
  if (!value.trim()) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatPriceInput(value: string) {
  const numeric = parsePriceInput(value);
  return numeric === null ? "" : idNumberFormatter.format(numeric);
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
    <div className="relative flex h-full flex-col rounded-[1.1rem] border border-black/8 bg-white/86 p-5 shadow-[0_24px_64px_-50px_rgba(9,55,41,0.48)]">
      <span
        className={cn(
          "absolute right-5 top-5 grid size-5 place-items-center rounded-full border",
          tone === "gold"
            ? "border-black/16 bg-white text-transparent"
            : "border-[#075f42] bg-[#075f42] text-white"
        )}
      >
        {tone === "green" ? <CheckCircle2 className="size-3.5" /> : null}
      </span>
      <div className="flex min-h-[4.25rem] items-start gap-4 pr-8">
        <span
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-full",
            tone === "gold" ? "bg-[#fff2ca] text-[#a36d00]" : "bg-[#e8f5ee] text-[#075f42]"
          )}
        >
          {icon}
        </span>
        <div>
          <h2 className="font-headline text-xl font-black text-[#075f42]">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-black/58">
            {tone === "gold" ? "Penawaran tertutup, pemenang ditetapkan secara adil." : "Beli sekarang dengan harga pasti."}
          </p>
        </div>
      </div>
      <div className="mt-5 grid flex-1 content-start gap-3">
        {items.map((item) => (
          <p className="flex min-h-5 items-center gap-2 text-xs font-medium text-[#34433c]" key={item}>
            <CheckCircle2 className={cn("size-3.5", tone === "gold" ? "text-[#a36d00]" : "text-[#075f42]")} />
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

function PriceRangeControl({
  maxLimit,
  maxValue,
  minValue,
  onMaxValueChange,
  onMinValueChange,
  step = 100000
}: {
  maxLimit: number;
  maxValue: string;
  minValue: string;
  onMaxValueChange: (value: string) => void;
  onMinValueChange: (value: string) => void;
  step?: number;
}) {
  const normalizedLimit = Math.max(step, maxLimit);
  const minNumber = clamp(parsePriceInput(minValue) ?? 0, 0, normalizedLimit);
  const parsedMax = parsePriceInput(maxValue);
  const maxNumber = parsedMax === null ? normalizedLimit : clamp(parsedMax, minNumber, normalizedLimit);
  const minPercent = (minNumber / normalizedLimit) * 100;
  const maxPercent = (maxNumber / normalizedLimit) * 100;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-[0.62rem] font-bold text-black/56">Min</span>
          <input
            className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-[0.78rem] font-semibold text-[#14211b] outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-black/35 focus:border-[#0b6a49]/30 focus:ring-4 focus:ring-[#0b6a49]/8"
            inputMode="numeric"
            name="catalogMinPriceInput"
            placeholder="0"
            value={formatPriceInput(minValue)}
            onChange={(event) => onMinValueChange(event.target.value.replace(/\D/g, ""))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[0.62rem] font-bold text-black/56">Maks</span>
          <input
            className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-[0.78rem] font-semibold text-[#14211b] outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-black/35 focus:border-[#0b6a49]/30 focus:ring-4 focus:ring-[#0b6a49]/8"
            inputMode="numeric"
            name="catalogMaxPriceInput"
            placeholder="Tidak terbatas"
            value={formatPriceInput(maxValue)}
            onChange={(event) => onMaxValueChange(event.target.value.replace(/\D/g, ""))}
          />
        </label>
      </div>

      <div className="catalog-range relative h-6">
        <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#dfe7de]" />
        <div
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#075f42]"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`
          }}
        />
        <input
          aria-label="Harga minimum"
          className="catalog-range-thumb"
          max={normalizedLimit}
          min={0}
          name="catalogMinPrice"
          step={step}
          type="range"
          value={minNumber}
          onChange={(event) => {
            const nextMin = Math.min(Number(event.target.value), maxNumber);
            onMinValueChange(String(nextMin));
          }}
        />
        <input
          aria-label="Harga maksimum"
          className="catalog-range-thumb"
          max={normalizedLimit}
          min={0}
          name="catalogMaxPrice"
          step={step}
          type="range"
          value={maxNumber}
          onChange={(event) => {
            const nextMax = Math.max(Number(event.target.value), minNumber);
            onMaxValueChange(nextMax >= normalizedLimit ? "" : String(nextMax));
          }}
        />
      </div>
    </div>
  );
}

function CatalogLotCard({
  favorite,
  lot,
  serverNow,
  viewMode,
  onToggleFavorite
}: {
  favorite: boolean;
  lot: Lot;
  serverNow?: string;
  viewMode: ViewMode;
  onToggleFavorite: () => void;
}) {
  const mode = modeCopy[lot.mode];
  const subtype = getSubtype(lot);
  const showAuctionCountdown = lot.mode === "vickrey" && (lot.countdown || lot.endsAt);
  const CategoryIcon = getCategoryIcon(lot.category);
  const detailTags =
    lot.mode === "vickrey"
      ? [
          { icon: <Gavel className="size-3" />, label: "Penawaran tertutup" },
          { icon: <BadgeCheck className="size-3" />, label: "Aturan transparan" }
        ]
      : [
          { icon: <BadgeCheck className="size-3" />, label: "Pembayaran aman" },
          { icon: <Tag className="size-3" />, label: "Harga pasti" }
        ];
  const metadataItems = [
    {
      icon: <CategoryIcon className="size-3.5" />,
      label: titleCase(lot.category)
    },
    {
      icon: <Tag className="size-3.5" />,
      label: subtype
    },
    {
      icon: <MapPin className="size-3.5" />,
      label: lot.unitName
    },
    {
      icon: <BadgeCheck className="size-3.5" />,
      label: titleCase(lot.condition)
    }
  ].filter((item) => !isCodeLikeChip(item.label, lot.code));

  return (
    <article
      className={cn(
        "group h-full overflow-hidden rounded-md border border-black/10 bg-white shadow-[0_20px_54px_-44px_rgba(8,69,50,0.42)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[#0b6a49]/22 hover:shadow-[0_26px_70px_-48px_rgba(8,69,50,0.52)]",
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
        <div className="absolute right-3 top-3 rounded-full bg-black/18 p-0.5 shadow-[0_18px_30px_-22px_rgba(0,0,0,0.75)] backdrop-blur-sm">
          <FavoriteToggleButton favorited={favorite} itemName={lot.name} onClick={onToggleFavorite} />
        </div>
      </div>

        <div className="flex h-full min-h-0 flex-col p-4">
          <div className="min-h-[3rem] min-w-0">
            <h3 className="truncate font-headline text-base font-black text-[#13211c]">{lot.name}</h3>
            <p className="mt-0.5 text-xs font-semibold text-black/48">{lot.code}</p>
          </div>

        <div className="mt-2.5 flex flex-wrap content-start gap-1.5 overflow-hidden text-[0.7rem] font-bold text-black/58">
          {metadataItems.map((item) => (
            <span
              className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-[#f4f3ef] px-2 py-[0.34rem]"
              key={`${lot.id}-${item.label}`}
            >
              <span className="shrink-0 text-[#075f42]">{item.icon}</span>
              <span className="min-w-0 truncate">{item.label}</span>
            </span>
          ))}
        </div>

        <LotRealtimeStats
          className="mt-2 flex min-h-[1.2rem] items-center gap-3.5 overflow-hidden text-[0.72rem] font-semibold text-black/56"
          initialStats={lot.insights}
          lotId={lot.id}
          mode={lot.mode}
        />

        <div className="mt-3 grid content-start gap-2.5">
          <div className={cn("grid items-start gap-2.5", showAuctionCountdown ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1")}>
            <div className="min-w-0 flex-1">
              <p className="text-[0.68rem] font-black text-[#075f42]/72">
                {lot.mode === "vickrey" ? "Harga Dasar" : "Harga"}
              </p>
              <p className={cn("mt-0.5 font-headline text-lg font-black", lot.mode === "fixed_price" ? "text-[#d28b00]" : "text-[#075f42]")}>
                {currency.format(lot.price)}
              </p>
            </div>
            {showAuctionCountdown ? (
              <div className="inline-grid min-w-[10.4rem] w-max max-w-full gap-y-0.5 self-center text-left">
                <span className="flex items-center gap-1.5 whitespace-nowrap text-[0.72rem] font-bold leading-none text-[#5b6761]">
                  <Timer className="size-3.5 text-[#d72b43]" />
                  <span>Berakhir</span>
                  <span className="font-black text-[#34423c] [font-variant-numeric:tabular-nums]">
                    <LiveCountdown
                      expiredLabel="Menunggu hasil"
                      fallbackLabel={lot.countdown}
                      formatLabel={formatCatalogCountdownLabel}
                      serverNow={serverNow}
                      targetAt={lot.endsAt}
                    />
                  </span>
                </span>
                <span className="pl-5 text-[0.62rem] font-semibold leading-tight text-black/46">
                  {formatAppDateTime(lot.endsAt)}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex min-h-[1.05rem] flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.66rem] font-semibold text-black/56">
            {detailTags.map((item) => (
              <span className="inline-flex items-center gap-1 whitespace-nowrap" key={`${lot.id}-${item.label}`}>
                <span className="text-[#075f42]">{item.icon}</span>
                {item.label}
              </span>
            ))}
          </div>
          <Link
            aria-label={`Lihat detail ${lot.name}`}
            className={cn(
              buttonVariants({ variant: lot.mode === "fixed_price" ? "accent" : "default" }),
              "h-10 w-full rounded-md text-sm font-black"
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

export function CatalogPage({
  initialFavoriteIds = EMPTY_FAVORITE_IDS,
  initialQuery = "",
  lots: initialLots,
  serverNow,
  wishlistSyncEnabled = false
}: CatalogPageProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<SaleMode>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [unitQuery, setUnitQuery] = useState("");
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [pageIndex, setPageIndex] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(initialFavoriteIds);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setFavoriteIds(initialFavoriteIds);
  }, [initialFavoriteIds]);

  async function handleToggleFavorite(lotId: string) {
    const wasFavorite = favoriteIds.includes(lotId);
    setFavoriteIds((current) =>
      current.includes(lotId) ? current.filter((item) => item !== lotId) : [...current, lotId]
    );

    if (!wishlistSyncEnabled) {
      return;
    }

    try {
      const response = await fetch(`/api/user/wishlist/${lotId}`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Wishlist gagal diperbarui.");
      }

      const result = (await response.json()) as { favorited: boolean };
      setFavoriteIds((current) =>
        result.favorited
          ? Array.from(new Set([...current, lotId]))
          : current.filter((item) => item !== lotId)
      );
      window.dispatchEvent(new CustomEvent("pegadaian:lot-stats-refresh", { detail: { lotId } }));
      router.refresh();
    } catch {
      setFavoriteIds((current) =>
        wasFavorite ? Array.from(new Set([...current, lotId])) : current.filter((item) => item !== lotId)
      );
    }
  }

  const lotsWithInsights = useMemo(
    () =>
      initialLots.map((lot) => ({
        insights: getLotInsights(lot),
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
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id"));
  }, [initialLots]);

  const priceUpperBound = useMemo(() => {
    return CATALOG_PRICE_FILTER_LIMIT;
  }, []);

  const visibleCategories = categories.filter(([category]) => normalize(category).includes(normalize(categoryQuery)));
  const matchingUnits = units.filter(([unit]) => normalize(unit).includes(normalize(unitQuery)));
  const hiddenUnitCount = unitQuery.trim() ? 0 : Math.max(0, matchingUnits.length - 4);
  const visibleUnits = unitQuery.trim() || showAllUnits ? matchingUnits : matchingUnits.slice(0, 4);

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
    setShowAllUnits(false);
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
        className="relative isolate overflow-hidden bg-[image:var(--catalog-hero-image)] bg-[length:100%_auto] bg-bottom bg-no-repeat"
        style={heroStyle}
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.76)_42%,rgba(255,255,255,0.50)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(247,246,241,0.94)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-14 rounded-t-[2.4rem] border-t border-black/6 bg-[#fbfaf6]" />
        <div className="container grid gap-8 pb-20 pt-12 lg:grid-cols-[0.82fr_1fr] lg:items-center lg:pb-24 lg:pt-16">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.42em] text-[#b98200]">Katalog Premium</p>
            <h1 className="mt-4 max-w-4xl font-headline text-4xl font-black leading-[1.03] text-[#075f42] md:text-5xl lg:text-[2.85rem]">
              Pilih cara pembelian yang tepat untuk Anda
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#2f4038]">
              Dua cara aman dan transparan untuk mendapatkan barang berkualitas dengan proses terpercaya dari Pegadaian.
            </p>
          </div>

          <div className="grid items-stretch gap-5 md:grid-cols-2">
            <HeroInfoCard
              icon={<BriefcaseBusiness className="size-7" />}
              items={["Pembayaran instan", "Harga pasti & transparan", "Proses cepat & aman", "Pembayaran aman terjamin"]}
              title="Harga Tetap"
            />
            <HeroInfoCard
              icon={<Gavel className="size-7" />}
              items={["Penawaran tertutup (sealed-bid)", "Pemenang dengan harga terbaik", "Aturan jelas & transparan", "Peluang menang lebih besar"]}
              title="Lelang Vickrey"
              tone="gold"
            />
          </div>
        </div>
      </section>

      <section className="container relative z-10 -mt-14 pb-12 pt-0">
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
                {hiddenUnitCount > 0 ? (
                  <button
                    className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-black/8 bg-white px-3 py-2 text-[0.76rem] font-black text-[#075f42] transition duration-500 hover:border-[#0b6a49]/22 hover:bg-[#eef6f0]"
                    type="button"
                    onClick={() => setShowAllUnits(true)}
                  >
                    Tampilkan {hiddenUnitCount} lainnya
                  </button>
                ) : null}
              </FilterSection>

              <FilterSection title="Rentang Harga (Rp)">
                <PriceRangeControl
                  maxLimit={priceUpperBound}
                  maxValue={maxPrice}
                  minValue={minPrice}
                  onMaxValueChange={setMaxPrice}
                  onMinValueChange={setMinPrice}
                />
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
                  {visibleLots.map(({ lot }) => (
                    <CatalogLotCard
                      favorite={favoriteIds.includes(lot.id)}
                      key={lot.id}
                      lot={lot}
                      serverNow={serverNow}
                      viewMode={viewMode}
                      onToggleFavorite={() => void handleToggleFavorite(lot.id)}
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
