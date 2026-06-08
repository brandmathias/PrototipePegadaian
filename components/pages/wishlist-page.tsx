"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CarFront,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Gavel,
  Gem,
  Grid3X3,
  Heart,
  LayoutList,
  MapPin,
  Medal,
  PackagePlus,
  Search,
  Shapes,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Timer,
  X,
} from "lucide-react";

import { AdminSelect } from "@/components/admin/admin-select";
import { LiveCountdown } from "@/components/buyer/live-countdown";
import { FavoriteToggleButton } from "@/components/shared/favorite-toggle-button";
import { LotFigure } from "@/components/shared/lot-figure";
import { LotRealtimeStats } from "@/components/shared/lot-realtime-stats";
import { buttonVariants } from "@/components/ui/button";
import type { AuctionMode } from "@/lib/contracts/catalog";
import type { BuyerWishlistItem } from "@/lib/contracts/wishlist";
import type { CountdownState } from "@/lib/countdown";
import { currency } from "@/lib/formatters/currency";
import { formatAppDateTime } from "@/lib/timezone";
import { cn } from "@/lib/utils";

type WishlistPageProps = {
  activeItems: BuyerWishlistItem[];
  unavailableItems: BuyerWishlistItem[];
  serverNow?: string;
};

type SaleMode = "all" | AuctionMode;
type SortMode = "latest" | "popular" | "lowest" | "highest" | "ending";
type ViewMode = "grid" | "list";
type PriceBand = "all" | "under-10000000" | "10000000-25000000" | "25000000-50000000" | "over-50000000";

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
const sortOptions = [
  { value: "latest", label: "Terbaru" },
  { value: "popular", label: "Paling Dilihat" },
  { value: "lowest", label: "Harga Terendah" },
  { value: "highest", label: "Harga Tertinggi" },
  { value: "ending", label: "Lelang Berakhir Dekat" },
];

const modeCopy: Record<Exclude<SaleMode, "all">, { label: string; icon: ReactNode; tone: string }> = {
  fixed_price: {
    label: "Harga Tetap",
    icon: <ShoppingBag className="size-3.5" />,
    tone: "bg-[#d99900] text-white",
  },
  vickrey: {
    label: "Lelang Tertutup",
    icon: <Gavel className="size-3.5" />,
    tone: "bg-[#006b42] text-white",
  },
};

const idNumberFormatter = new Intl.NumberFormat("id-ID");

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

function getSubtype(item: BuyerWishlistItem) {
  const ignored = new Set(["kategori", "kondisi", "status", "unit", "lokasi"]);
  const spec = item.lot.specs.find((entry) => !ignored.has(normalize(entry.label)));

  if (spec?.value) {
    return titleCase(spec.value);
  }

  const parts = item.lot.name.split(" ");
  return parts.length > 1 ? titleCase(parts.slice(1, 3).join(" ")) : titleCase(item.lot.category);
}

function isCodeLikeChip(value: string, code: string) {
  const normalizedValue = normalize(value);
  const normalizedCode = normalize(code);
  return normalizedValue === normalizedCode || /^brg[-\s]?\d+/i.test(value);
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `Rp ${Math.round(value / 1_000_000_000)} M`;
  }

  if (value >= 1_000_000) {
    return `Rp ${Math.round(value / 1_000_000)} Jt`;
  }

  return currency.format(value);
}

function formatWishlistCountdownLabel(label: string, state: CountdownState) {
  if (state.isExpired) {
    return label;
  }

  const match = label.match(
    /(?:(\d+)\s+hari\s+)?(?:(\d+)\s+jam\s+)?(?:(\d+)\s+menit\s+)?(?:(\d+)\s+detik)?/i,
  );
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
    return `${minutes} menit`;
  }

  return `${Math.max(1, seconds)} detik`;
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

function getWishlistInsights(item: BuyerWishlistItem) {
  return {
    likes: item.lot.insights?.likes ?? 0,
    participants: item.lot.mode === "vickrey" ? (item.lot.insights?.participants ?? 0) : 0,
    views: item.lot.insights?.views ?? 0,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

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

  if (nearStart) {
    items.push(1, 2, 3, 4, "ellipsis-end", totalPages - 1);
    return items;
  }

  if (nearEnd) {
    items.push("ellipsis-start", totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
    return items;
  }

  items.push("ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", totalPages - 1);
  return items;
}

function FilterSection({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.15rem] border border-black/8 bg-white p-4 shadow-[0_16px_40px_-34px_rgba(8,69,50,0.28)]",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-[#14211b]">{title}</h3>
        <ChevronDown className="size-4 text-black/38" />
      </div>
      {children}
    </section>
  );
}

function CountPill({ children }: { children: ReactNode }) {
  return <span className="ml-auto text-xs font-black text-black/48">{children}</span>;
}

function WishlistPill({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "group inline-flex h-10 items-center gap-2 rounded-md border px-3 text-[0.8rem] font-bold transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]",
        active
          ? "border-[#0b6a49] bg-[#006b42] text-white shadow-[0_12px_24px_-20px_rgba(0,74,35,0.8)]"
          : "border-[#d8ded6] bg-white text-[#314139] hover:border-[#0b6a49]/28 hover:bg-[#f2faf5] hover:text-[#075f42]",
      )}
      type="button"
      onClick={onClick}
    >
      <span>{label}</span>
      <span
        className={cn(
          "grid min-w-5 place-items-center rounded-full px-1 text-[0.62rem] leading-5 transition duration-500",
          active ? "bg-white/18 text-white" : "bg-[#eef5f0] text-[#075f42] group-hover:bg-white",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function WishlistHero({
  activeCount,
  totalCount,
}: {
  activeCount: number;
  totalCount: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-md border border-[#eadfca] bg-[#fff9ee] px-5 py-6 shadow-[0_28px_80px_-62px_rgba(84,63,20,0.42)] md:px-7 md:py-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_12%,rgba(217,153,0,0.13),transparent_28%),radial-gradient(circle_at_88%_4%,rgba(7,95,66,0.10),transparent_24%)]" />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.24em] text-[#b98200]">
            Barang tersimpan
            <span className="grid size-4 place-items-center rounded-full bg-white/84 text-[#b98200] shadow-[0_8px_18px_-14px_rgba(185,130,0,0.6)]">
              <Heart className="size-2.5 fill-current" />
            </span>
          </p>
          <h1 className="mt-2 font-headline text-5xl font-black leading-none text-[#161b17] md:text-6xl">Wishlist</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4f5b54]">
            Barang pilihan dari katalog untuk Anda bandingkan lebih cepat sebelum membeli langsung atau mengikuti lelang.
          </p>
          <p className="mt-3 text-sm font-black text-[#075f42]">{getCountLabel(totalCount)} barang disukai</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[17rem]">
          {[
            ["Total Disukai", totalCount],
            ["Masih Aktif", activeCount],
          ].map(([label, value]) => (
            <div
              className="rounded-md border border-[#eadfca] bg-white/76 px-4 py-3 shadow-[0_18px_44px_-36px_rgba(84,63,20,0.42)]"
              key={String(label)}
            >
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-black/42">{label}</p>
              <p className="mt-1 font-headline text-2xl font-black text-[#075f42]">{getCountLabel(Number(value))}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModeButton({
  active,
  count,
  icon,
  label,
  onClick,
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
          : "border-[#d8ded6] bg-white text-[#314139] hover:border-[#0b6a49]/28 hover:bg-[#f2faf5] hover:text-[#075f42]",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        className={cn(
          "grid size-5 place-items-center rounded-full transition duration-500",
          active ? "bg-white/18 text-white" : "bg-[#eef5f0] text-[#075f42] group-hover:bg-white",
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
  onClick,
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
          : "text-[#3f4940] hover:bg-[#f5f8f5] hover:text-[#075f42]",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[0.28rem] border transition duration-500",
          active ? "border-[#0b6a49] bg-[#0b6a49] text-white" : "border-black/22 bg-white text-transparent",
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
  onChange,
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
  step = 100000,
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
            name="wishlistMinPriceInput"
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
            name="wishlistMaxPriceInput"
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
            right: `${100 - maxPercent}%`,
          }}
        />
        <input
          aria-label="Harga minimum wishlist"
          className="catalog-range-thumb"
          max={normalizedLimit}
          min={0}
          name="wishlistMinPrice"
          step={step}
          type="range"
          value={minNumber}
          onChange={(event) => {
            const nextMin = Math.min(Number(event.target.value), maxNumber);
            onMinValueChange(String(nextMin));
          }}
        />
        <input
          aria-label="Harga maksimum wishlist"
          className="catalog-range-thumb"
          max={normalizedLimit}
          min={0}
          name="wishlistMaxPrice"
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

function WishlistCard({
  favorite,
  item,
  serverNow,
  viewMode,
  onToggleFavorite,
}: {
  favorite: boolean;
  item: BuyerWishlistItem;
  serverNow?: string;
  viewMode: ViewMode;
  onToggleFavorite: () => void;
}) {
  const isFixedPrice = item.lot.mode === "fixed_price";
  const actionLabel = isFixedPrice ? "Beli Sekarang" : "Ikut Lelang";
  const mode = modeCopy[item.lot.mode];
  const showAuctionCountdown = item.lot.mode === "vickrey" && (item.lot.countdown || item.lot.endsAt);
  const CategoryIcon = getCategoryIcon(item.lot.category);
  const detailTags =
    item.lot.mode === "vickrey"
      ? [
          { icon: <Gavel className="size-3" />, label: "Penawaran tertutup" },
          { icon: <BadgeCheck className="size-3" />, label: "Aturan transparan" },
        ]
      : [
          { icon: <BadgeCheck className="size-3" />, label: "Pembayaran aman" },
          { icon: <Tag className="size-3" />, label: "Harga pasti" },
        ];
  const metadataItems = [
    {
      icon: <CategoryIcon className="size-3.5" />,
      label: titleCase(item.lot.category),
    },
    {
      icon: <Tag className="size-3.5" />,
      label: getSubtype(item),
    },
    {
      icon: <MapPin className="size-3.5" />,
      label: item.lot.unitName,
    },
    {
      icon: <BadgeCheck className="size-3.5" />,
      label: titleCase(item.lot.condition),
    },
  ].filter((entry) => !isCodeLikeChip(entry.label, item.lot.code));

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-md border border-black/10 bg-white shadow-[0_20px_54px_-44px_rgba(8,69,50,0.42)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[#0b6a49]/22 hover:shadow-[0_26px_70px_-48px_rgba(8,69,50,0.52)]",
        viewMode === "list" && "lg:grid lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)] lg:gap-0",
      )}
    >
      <div className="relative">
        <LotFigure
          category={item.lot.category}
          className={cn(
            "rounded-none",
            viewMode === "list" ? "h-full min-h-[13.5rem] lg:aspect-auto" : "aspect-[1.78]",
          )}
          media={item.lot.media}
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white/94 px-2.5 py-1 text-[0.68rem] font-black text-[#075f42] shadow-sm">
          <span className={cn("grid size-5 place-items-center rounded-[0.35rem]", mode.tone)}>
            {mode.icon}
          </span>
          {mode.label}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-black/18 p-0.5 shadow-[0_18px_30px_-22px_rgba(0,0,0,0.75)]">
          <FavoriteToggleButton favorited={favorite} itemName={item.lot.name} onClick={onToggleFavorite} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="min-h-[4rem] min-w-0">
          <h3 className="line-clamp-2 font-headline text-base font-black leading-[1.18] text-[#13211c]">{item.lot.name}</h3>
          <p className="mt-0.5 text-xs font-semibold text-black/48">{item.lot.code}</p>
        </div>

        <div className="mt-2.5 flex min-h-[4.2rem] flex-wrap content-start gap-1.5 overflow-hidden text-[0.7rem] font-bold text-black/58">
          {metadataItems.map((entry) => (
            <span
              className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-[#f4f3ef] px-2 py-[0.34rem]"
              key={`${item.lot.id}-${entry.label}`}
            >
              <span className="shrink-0 text-[#075f42]">{entry.icon}</span>
              <span className="min-w-0 truncate">{entry.label}</span>
            </span>
          ))}
        </div>

        <LotRealtimeStats
          className="mt-2 flex min-h-[1.2rem] items-center gap-3.5 overflow-hidden text-[0.72rem] font-semibold text-black/56"
          initialStats={item.lot.insights}
          lotId={item.lot.id}
          mode={item.lot.mode}
        />

        <div className="mt-3 grid content-start gap-2.5">
          <div className={cn("grid items-start gap-2.5", showAuctionCountdown ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1")}>
            <div className="min-w-0 flex-1">
              <p className="text-[0.68rem] font-black text-[#075f42]/72">
                {item.lot.mode === "vickrey" ? "Harga Dasar" : "Harga"}
              </p>
              <p className={cn("mt-0.5 font-headline text-lg font-black", isFixedPrice ? "text-[#d28b00]" : "text-[#075f42]")}>
                {currency.format(item.lot.price)}
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
                      fallbackLabel={item.lot.countdown}
                      formatLabel={formatWishlistCountdownLabel}
                      serverNow={serverNow}
                      targetAt={item.lot.endsAt}
                      updateIntervalMs={60_000}
                    />
                  </span>
                </span>
                <span className="pl-5 text-[0.62rem] font-semibold leading-tight text-black/46">
                  {formatAppDateTime(item.lot.endsAt)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex min-h-[1.05rem] flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.66rem] font-semibold text-black/56">
            {detailTags.map((entry) => (
              <span className="inline-flex items-center gap-1 whitespace-nowrap" key={`${item.lot.id}-${entry.label}`}>
                <span className="text-[#075f42]">{entry.icon}</span>
                {entry.label}
              </span>
            ))}
          </div>

          <Link
            aria-label={`${actionLabel} ${item.lot.name}`}
            className={cn(
              buttonVariants({ variant: isFixedPrice ? "accent" : "default" }),
              "min-h-11 w-full rounded-md text-sm font-black",
            )}
            href={`/katalog/${item.lot.id}`}
          >
            {actionLabel}
            {isFixedPrice ? <ShoppingBag className="size-4" /> : <Gavel className="size-4" />}
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
  onPageSizeChange,
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
                  : "border border-black/8 bg-white text-black/58 hover:border-[#0b6a49]/18 hover:bg-[#f2faf5] hover:text-[#075f42]",
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
          ),
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
          ariaLabel="Jumlah wishlist per halaman"
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

export function WishlistPage({ activeItems, unavailableItems, serverNow }: WishlistPageProps) {
  const router = useRouter();
  const [currentActiveItems, setCurrentActiveItems] = useState(activeItems);
  const [currentUnavailableItems, setCurrentUnavailableItems] = useState(unavailableItems);
  const [mode, setMode] = useState<SaleMode>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [unitQuery, setUnitQuery] = useState("");
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [sortBy, setSortBy] = useState<SortMode>("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setCurrentActiveItems(activeItems);
  }, [activeItems]);

  useEffect(() => {
    setCurrentUnavailableItems(unavailableItems);
  }, [unavailableItems]);

  async function handleRemoveFavorite(lotId: string) {
    const previousActiveItems = currentActiveItems;
    const previousUnavailableItems = currentUnavailableItems;

    setCurrentActiveItems((items) => items.filter((item) => item.lot.id !== lotId));
    setCurrentUnavailableItems((items) => items.filter((item) => item.lot.id !== lotId));

    try {
      const response = await fetch(`/api/user/wishlist/${lotId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove wishlist item");
      }

      window.dispatchEvent(new CustomEvent("pegadaian:lot-stats-refresh", { detail: { lotId } }));
      router.refresh();
    } catch {
      setCurrentActiveItems(previousActiveItems);
      setCurrentUnavailableItems(previousUnavailableItems);
    }
  }

  const itemsWithInsights = useMemo(
    () =>
      currentActiveItems.map((item) => ({
        insights: getWishlistInsights(item),
        item,
      })),
    [currentActiveItems],
  );

  const modeCounts = useMemo(
    () => ({
      all: currentActiveItems.length,
      fixed_price: currentActiveItems.filter((item) => item.lot.mode === "fixed_price").length,
      vickrey: currentActiveItems.filter((item) => item.lot.mode === "vickrey").length,
    }),
    [currentActiveItems],
  );

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    currentActiveItems.forEach((item) => map.set(item.lot.category, (map.get(item.lot.category) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "id"));
  }, [currentActiveItems]);

  const conditions = useMemo(() => {
    const map = new Map<string, number>();
    currentActiveItems.forEach((item) => {
      const condition = titleCase(item.lot.condition);
      map.set(condition, (map.get(condition) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "id"));
  }, [currentActiveItems]);

  const units = useMemo(() => {
    const map = new Map<string, number>();
    currentActiveItems.forEach((item) => map.set(item.lot.unitName, (map.get(item.lot.unitName) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id"));
  }, [currentActiveItems]);

  const priceUpperBound = useMemo(() => {
    const highestPrice = currentActiveItems.reduce((max, item) => Math.max(max, item.lot.price), 0);
    const roundedLimit = Math.ceil(highestPrice / 100000) * 100000;
    return Math.max(roundedLimit, 1000000);
  }, [currentActiveItems]);

  const visibleCategories = categories.filter(([category]) => normalize(category).includes(normalize(categoryQuery)));
  const matchingUnits = units.filter(([unit]) => normalize(unit).includes(normalize(unitQuery)));
  const hiddenUnitCount = unitQuery.trim() ? 0 : Math.max(0, matchingUnits.length - 4);
  const visibleUnits = unitQuery.trim() || showAllUnits ? matchingUnits : matchingUnits.slice(0, 4);
  const totalCount = currentActiveItems.length + currentUnavailableItems.length;

  const filteredItems = useMemo(() => {
    const parsedMinPrice = minPrice.trim() ? Number(minPrice) : null;
    const parsedMaxPrice = maxPrice.trim() ? Number(maxPrice) : null;

    const filtered = itemsWithInsights.filter(({ item }) => {
      if (mode !== "all" && item.lot.mode !== mode) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(item.lot.category)) return false;
      if (selectedConditions.length > 0 && !selectedConditions.includes(titleCase(item.lot.condition))) return false;
      if (selectedUnits.length > 0 && !selectedUnits.includes(item.lot.unitName)) return false;
      if (parsedMinPrice !== null && Number.isFinite(parsedMinPrice) && item.lot.price < parsedMinPrice) return false;
      if (parsedMaxPrice !== null && Number.isFinite(parsedMaxPrice) && item.lot.price > parsedMaxPrice) return false;
      return true;
    });

    if (sortBy === "popular") {
      return [...filtered].sort((a, b) => b.insights.views - a.insights.views);
    }

    if (sortBy === "lowest") {
      return [...filtered].sort((a, b) => a.item.lot.price - b.item.lot.price);
    }

    if (sortBy === "highest") {
      return [...filtered].sort((a, b) => b.item.lot.price - a.item.lot.price);
    }

    if (sortBy === "ending") {
      return [...filtered].sort((a, b) => {
        const first = a.item.lot.endsAt ? new Date(a.item.lot.endsAt).getTime() : Number.MAX_SAFE_INTEGER;
        const second = b.item.lot.endsAt ? new Date(b.item.lot.endsAt).getTime() : Number.MAX_SAFE_INTEGER;
        return first - second;
      });
    }

    return filtered;
  }, [
    itemsWithInsights,
    maxPrice,
    minPrice,
    mode,
    selectedCategories,
    selectedConditions,
    selectedUnits,
    sortBy,
  ]);

  useEffect(() => {
    setPageIndex(0);
  }, [filteredItems.length, mode, pageSize, selectedCategories, selectedConditions, selectedUnits, minPrice, maxPrice, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const visibleItems = filteredItems.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  if (currentActiveItems.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-md border border-[#eadfca] bg-[#fff9ee] p-8 text-center shadow-[0_28px_80px_-62px_rgba(84,63,20,0.42)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(217,153,0,0.12),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(7,95,66,0.10),transparent_24%)]" />
        <span className="relative mx-auto grid size-14 place-items-center rounded-full bg-white text-[#075f42] shadow-[0_18px_44px_-34px_rgba(84,63,20,0.44)]">
          <Heart className="size-6" />
        </span>
        <h1 className="relative mt-5 font-headline text-3xl font-black text-[#161b17]">Belum ada barang disukai</h1>
        <p className="relative mx-auto mt-2 max-w-xl text-sm leading-6 text-black/56">
          Simpan barang dari katalog agar Anda bisa membandingkan harga tetap dan Lelang Tertutup tanpa mencari ulang.
        </p>
        <Link className={cn(buttonVariants({ variant: "default" }), "relative mt-6 rounded-md")} href="/katalog">
          Jelajahi Katalog
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <WishlistHero activeCount={currentActiveItems.length} totalCount={totalCount} />

      <section className="overflow-hidden rounded-md border border-black/10 bg-white shadow-[0_30px_80px_-62px_rgba(8,69,50,0.48)]">
        <div className="border-b border-black/8 bg-[#fbfaf6] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="grid size-10 place-items-center rounded-md bg-[#eef5f0] text-[#075f42]">
                <SlidersHorizontal className="size-4" />
              </span>
              <WishlistPill active={mode === "all"} count={modeCounts.all} label="Semua Barang" onClick={() => setMode("all")} />
              <WishlistPill
                active={mode === "fixed_price"}
                count={modeCounts.fixed_price}
                label="Harga Tetap"
                onClick={() => setMode("fixed_price")}
              />
              <WishlistPill
                active={mode === "vickrey"}
                count={modeCounts.vickrey}
                label="Lelang Tertutup"
                onClick={() => setMode("vickrey")}
              />
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <AdminSelect
                ariaLabel="Urutkan wishlist"
                className="w-56"
                options={sortOptions}
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortMode)}
              />
              <div className="inline-flex rounded-md border border-black/10 bg-white p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]">
                <button
                  aria-label="Tampilan grid"
                  aria-pressed={viewMode === "grid"}
                  className={cn(
                    "grid size-8 place-items-center rounded-md transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    viewMode === "grid" ? "bg-[#f2faf5] text-[#075f42]" : "text-black/48 hover:text-[#075f42]",
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
                    "grid size-8 place-items-center rounded-md transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    viewMode === "list" ? "bg-[#f2faf5] text-[#075f42]" : "text-black/48 hover:text-[#075f42]",
                  )}
                  type="button"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutList className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#fbfaf6] p-5">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-headline text-2xl font-black text-[#13211c]">Masih tersedia</h2>
              <p className="mt-1 text-sm text-black/52">
                {getCountLabel(filteredItems.length)} dari {getCountLabel(currentActiveItems.length)} barang aktif tampil sesuai filter.
              </p>
            </div>
          </div>
          <div
            className={cn(
              "grid gap-4",
              viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
            )}
          >
            {visibleItems.map(({ item }) => (
              <WishlistCard
                favorite
                item={item}
                key={item.lot.id}
                serverNow={serverNow}
                viewMode={viewMode}
                onToggleFavorite={() => void handleRemoveFavorite(item.lot.id)}
              />
            ))}
          </div>

          {visibleItems.length === 0 ? (
            <div className="rounded-md border border-dashed border-black/14 bg-white p-10 text-center">
              <p className="font-headline text-xl font-black text-[#14211b]">Belum ada barang sesuai filter ini.</p>
              <p className="mt-2 text-sm leading-6 text-black/56">
                Coba ubah mode penjualan, kategori, kondisi, lokasi, atau rentang harga.
              </p>
            </div>
          ) : null}
        </div>

        <PaginationFooter
          pageIndex={currentPage}
          pageSize={pageSize}
          totalItems={filteredItems.length}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
        />
      </section>
    </div>
  );
}
