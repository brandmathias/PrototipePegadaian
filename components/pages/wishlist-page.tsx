"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  CarFront,
  ChevronDown,
  Cpu,
  Gavel,
  Gem,
  Heart,
  MapPin,
  Medal,
  PackagePlus,
  Share2,
  Shapes,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Timer,
  XCircle
} from "lucide-react";

import { LiveCountdown } from "@/components/buyer/live-countdown";
import { LotFigure } from "@/components/shared/lot-figure";
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

type WishlistFilter = "all" | AuctionMode;
type WishlistSort = "recent" | "price-high" | "price-low";

const ALL_CATEGORIES = "all";
const filterOptions: Array<{ value: WishlistFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "fixed_price", label: "Harga Tetap" },
  { value: "vickrey", label: "Lelang Vickrey" }
];

const modeCopy: Record<AuctionMode, { label: string; icon: ReactNode; tone: string }> = {
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

function formatWishlistCountdownLabel(label: string, state: CountdownState) {
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

function getCategoryIcon(category: string) {
  const normalized = normalize(category);

  if (normalized.includes("emas")) return Gem;
  if (normalized.includes("perhiasan")) return Shapes;
  if (normalized.includes("logam")) return Medal;
  if (normalized.includes("elektronik")) return Cpu;
  if (normalized.includes("kendaraan")) return CarFront;
  return PackagePlus;
}

function getFilterCount(items: BuyerWishlistItem[], filter: WishlistFilter) {
  if (filter === "all") return items.length;
  return items.filter((item) => item.lot.mode === filter).length;
}

function WishlistPill({
  active,
  count,
  label,
  onClick
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
          : "border-[#d8ded6] bg-white text-[#314139] hover:border-[#0b6a49]/28 hover:bg-[#f2faf5] hover:text-[#075f42]"
      )}
      type="button"
      onClick={onClick}
    >
      <span>{label}</span>
      <span
        className={cn(
          "grid min-w-5 place-items-center rounded-full px-1 text-[0.62rem] leading-5 transition duration-500",
          active ? "bg-white/18 text-white" : "bg-[#eef5f0] text-[#075f42] group-hover:bg-white"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ToolbarSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="relative inline-flex h-10 min-w-[10.5rem] items-center rounded-md border border-black/10 bg-white pl-3 pr-9 text-xs font-bold text-[#28372f] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-within:border-[#0b6a49]/30 focus-within:ring-4 focus-within:ring-[#0b6a49]/8">
      <span className="mr-2 text-black/42">{label}</span>
      <select
        className="min-w-0 flex-1 appearance-none bg-transparent font-black text-[#075f42] outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-black/42" />
    </label>
  );
}

function WishlistHero({
  activeCount,
  archivedCount,
  totalCount
}: {
  activeCount: number;
  archivedCount: number;
  totalCount: number;
}) {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  function handleShare() {
    if (typeof window === "undefined") return;

    const url = `${window.location.origin}/wishlist`;
    void navigator.clipboard?.writeText(url).then(() => {
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1600);
    });
  }

  return (
    <section className="relative overflow-hidden rounded-md border border-[#eadfca] bg-[#fff9ee] px-5 py-6 shadow-[0_28px_80px_-62px_rgba(84,63,20,0.42)] md:px-7 md:py-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_12%,rgba(217,153,0,0.13),transparent_28%),radial-gradient(circle_at_88%_4%,rgba(7,95,66,0.10),transparent_24%)]" />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.24em] text-[#b98200]">
            Barang tersimpan
            <Sparkles className="size-3.5" />
          </p>
          <h1 className="mt-2 font-headline text-5xl font-black leading-none text-[#161b17] md:text-6xl">
            Wishlist
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4f5b54]">
            Pilihan barang yang Anda simpan dari katalog, disusun agar mudah dibandingkan sebelum membeli atau mengikuti lelang.
          </p>
          <p className="mt-3 text-sm font-black text-[#075f42]">{totalCount} barang disukai</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[26rem]">
          {[
            ["Total", totalCount],
            ["Tersedia", activeCount],
            ["Arsip", archivedCount]
          ].map(([label, value]) => (
            <div
              className="rounded-md border border-[#eadfca] bg-white/76 px-4 py-3 shadow-[0_18px_44px_-36px_rgba(84,63,20,0.42)]"
              key={label}
            >
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-black/42">{label}</p>
              <p className="mt-1 font-headline text-2xl font-black text-[#075f42]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        className="relative mt-5 inline-flex h-10 items-center gap-2 rounded-md border border-[#d8bf8a] bg-white/78 px-4 text-xs font-black text-[#28372f] shadow-[0_18px_42px_-34px_rgba(84,63,20,0.5)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-white active:scale-[0.98] md:absolute md:right-7 md:top-6 md:mt-0"
        type="button"
        onClick={handleShare}
      >
        <Share2 className="size-4 text-[#075f42]" />
        {shareState === "copied" ? "Tautan disalin" : "Bagikan Wishlist"}
      </button>
    </section>
  );
}

function WishlistToolbar({
  activeItems,
  category,
  filter,
  sort,
  onCategoryChange,
  onFilterChange,
  onSortChange
}: {
  activeItems: BuyerWishlistItem[];
  category: string;
  filter: WishlistFilter;
  sort: WishlistSort;
  onCategoryChange: (value: string) => void;
  onFilterChange: (value: WishlistFilter) => void;
  onSortChange: (value: WishlistSort) => void;
}) {
  const categories = Array.from(new Set(activeItems.map((item) => item.lot.category))).sort((a, b) =>
    a.localeCompare(b, "id")
  );

  return (
    <section className="overflow-hidden rounded-md border border-black/10 bg-white shadow-[0_30px_80px_-62px_rgba(8,69,50,0.48)]">
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid size-10 place-items-center rounded-md bg-[#eef5f0] text-[#075f42]">
            <SlidersHorizontal className="size-4" />
          </span>
          {filterOptions.map((option) => (
            <WishlistPill
              active={filter === option.value}
              count={getFilterCount(activeItems, option.value)}
              key={option.value}
              label={option.label}
              onClick={() => onFilterChange(option.value)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToolbarSelect
            label="Kategori"
            options={[
              { value: ALL_CATEGORIES, label: "Semua" },
              ...categories.map((item) => ({ value: item, label: item }))
            ]}
            value={category}
            onChange={onCategoryChange}
          />
          <ToolbarSelect
            label="Urut"
            options={[
              { value: "recent", label: "Terbaru" },
              { value: "price-high", label: "Harga Tinggi" },
              { value: "price-low", label: "Harga Rendah" }
            ]}
            value={sort}
            onChange={(value) => onSortChange(value as WishlistSort)}
          />
        </div>
      </div>
    </section>
  );
}

function WishlistCard({
  item,
  onRemoveFavorite,
  serverNow
}: {
  item: BuyerWishlistItem;
  onRemoveFavorite: (lotId: string) => void;
  serverNow?: string;
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
          { icon: <BadgeCheck className="size-3" />, label: "Aturan transparan" }
        ]
      : [
          { icon: <BadgeCheck className="size-3" />, label: "Pembayaran aman" },
          { icon: <Tag className="size-3" />, label: "Harga pasti" }
        ];
  const metadataItems = [
    {
      icon: <CategoryIcon className="size-3.5" />,
      label: titleCase(item.lot.category)
    },
    {
      icon: <Tag className="size-3.5" />,
      label: getSubtype(item)
    },
    {
      icon: <MapPin className="size-3.5" />,
      label: item.lot.unitName
    },
    {
      icon: <BadgeCheck className="size-3.5" />,
      label: titleCase(item.lot.condition)
    }
  ].filter((entry) => !isCodeLikeChip(entry.label, item.lot.code));

  return (
    <article
      className="group h-full overflow-hidden rounded-md border border-black/10 bg-white shadow-[0_20px_54px_-44px_rgba(8,69,50,0.42)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[#0b6a49]/22 hover:shadow-[0_26px_70px_-48px_rgba(8,69,50,0.52)]"
    >
      <div className="relative">
        <LotFigure
          category={item.lot.category}
          className="aspect-[1.78] rounded-none"
          media={item.lot.media}
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white/92 px-2.5 py-1 text-[0.68rem] font-black text-[#075f42] shadow-sm backdrop-blur">
          <span className={cn("grid size-5 place-items-center rounded-[0.35rem]", mode.tone)}>
            {mode.icon}
          </span>
          {mode.label}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-black/18 p-0.5 shadow-[0_18px_30px_-22px_rgba(0,0,0,0.75)] backdrop-blur-sm">
          <button
            aria-label={`Hapus suka ${item.lot.name}`}
            className="grid size-9 place-items-center rounded-full border border-[#f2d17d] bg-[#fff4cf] text-[#bd7a00] shadow-[0_16px_28px_-18px_rgba(189,122,0,0.45),inset_0_1px_0_rgba(255,255,255,0.98)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.03] hover:text-[#9f3030] active:scale-[0.96]"
            title="Hapus dari wishlist"
            type="button"
            onClick={() => onRemoveFavorite(item.lot.id)}
          >
            <Heart className="size-4.5 fill-current" strokeWidth={2.15} />
          </button>
        </div>
      </div>

      <div className="flex h-full min-h-0 flex-col p-4">
        <div className="min-h-[3rem] min-w-0">
          <h3 className="truncate font-headline text-base font-black text-[#13211c]">{item.lot.name}</h3>
          <p className="mt-0.5 text-xs font-semibold text-black/48">{item.lot.code}</p>
        </div>

        <div className="mt-2.5 flex flex-wrap content-start gap-1.5 overflow-hidden text-[0.7rem] font-bold text-black/58">
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

        <div className="mt-2 flex min-h-[1.2rem] items-center gap-3.5 overflow-hidden text-[0.72rem] font-semibold text-black/56">
          <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
            <Heart className="size-3.5 shrink-0 fill-[#d72b43] text-[#d72b43]" />
            <span className="min-w-0 truncate">Disukai {item.likedAt}</span>
          </span>
        </div>

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
                  <Timer className="size-3.5 text-[#2f8f6b]" />
                  <span>Berakhir</span>
                  <span className="font-black text-[#34423c] [font-variant-numeric:tabular-nums]">
                    <LiveCountdown
                      expiredLabel="Menunggu hasil"
                      fallbackLabel={item.lot.countdown}
                      formatLabel={formatWishlistCountdownLabel}
                      serverNow={serverNow}
                      targetAt={item.lot.endsAt}
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
              "h-10 w-full rounded-md text-sm font-black"
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

function UnavailableWishlistItem({
  item,
  onRemoveFavorite
}: {
  item: BuyerWishlistItem;
  onRemoveFavorite: (lotId: string) => void;
}) {
  return (
    <div className="grid gap-4 rounded-md border border-black/10 bg-white p-3 shadow-[0_18px_46px_-38px_rgba(8,69,50,0.34)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#0b6a49]/20 sm:grid-cols-[7rem_1fr_auto] sm:items-center">
      <LotFigure category={item.lot.category} className="aspect-[1.4] rounded-md opacity-80" media={item.lot.media} />
      <div className="min-w-0">
        <p className="font-headline text-base font-black text-[#13211c]">{item.lot.name}</p>
        <p className="mt-1 text-xs font-semibold text-black/46">{item.lot.code} | Disukai {item.likedAt}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#f8efef] px-2 py-1 text-xs font-bold text-[#9f3030]">
          <XCircle className="size-3.5" />
          {item.unavailableReason ?? "Tidak tersedia"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <button
          aria-label={`Hapus suka ${item.lot.name}`}
          className="grid size-9 place-items-center rounded-full border border-[#f2d17d] bg-[#fff4cf] text-[#bd7a00] shadow-[0_16px_28px_-18px_rgba(189,122,0,0.45),inset_0_1px_0_rgba(255,255,255,0.98)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:text-[#9f3030] active:scale-[0.96]"
          type="button"
          onClick={() => onRemoveFavorite(item.lot.id)}
        >
          <Heart className="size-4.5 fill-current" strokeWidth={2.15} />
        </button>
        <Link className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm font-black text-[#075f42] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f2faf5] hover:text-[#0b3f2e]" href={`/katalog/${item.lot.id}`}>
          Lihat detail
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function WishlistPage({ activeItems, unavailableItems, serverNow }: WishlistPageProps) {
  const router = useRouter();
  const [currentActiveItems, setCurrentActiveItems] = useState(activeItems);
  const [currentUnavailableItems, setCurrentUnavailableItems] = useState(unavailableItems);
  const [filter, setFilter] = useState<WishlistFilter>("all");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [sort, setSort] = useState<WishlistSort>("recent");
  const totalCount = currentActiveItems.length + currentUnavailableItems.length;

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
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to remove wishlist item");
      }

      router.refresh();
    } catch {
      setCurrentActiveItems(previousActiveItems);
      setCurrentUnavailableItems(previousUnavailableItems);
    }
  }

  const filteredActiveItems = useMemo(() => {
    const items = currentActiveItems.filter((item) => {
      const matchesMode = filter === "all" || item.lot.mode === filter;
      const matchesCategory = category === ALL_CATEGORIES || item.lot.category === category;
      return matchesMode && matchesCategory;
    });

    return [...items].sort((first, second) => {
      if (sort === "price-high") return second.lot.price - first.lot.price;
      if (sort === "price-low") return first.lot.price - second.lot.price;
      return 0;
    });
  }, [category, currentActiveItems, filter, sort]);

  if (totalCount === 0) {
    return (
      <section className="relative overflow-hidden rounded-md border border-[#eadfca] bg-[#fff9ee] p-8 text-center shadow-[0_28px_80px_-62px_rgba(84,63,20,0.42)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(217,153,0,0.12),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(7,95,66,0.10),transparent_24%)]" />
        <span className="relative mx-auto grid size-14 place-items-center rounded-full bg-white text-[#075f42] shadow-[0_18px_44px_-34px_rgba(84,63,20,0.44)]">
          <Heart className="size-6" />
        </span>
        <h1 className="relative mt-5 font-headline text-3xl font-black text-[#161b17]">Belum ada barang disukai</h1>
        <p className="relative mx-auto mt-2 max-w-xl text-sm leading-6 text-black/56">
          Simpan barang dari katalog agar Anda bisa membandingkan harga tetap dan lelang Vickrey tanpa mencari ulang.
        </p>
        <Link className={cn(buttonVariants({ variant: "default" }), "relative mt-6 rounded-md")} href="/katalog">
          Jelajahi Katalog
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <WishlistHero activeCount={currentActiveItems.length} archivedCount={currentUnavailableItems.length} totalCount={totalCount} />

      <WishlistToolbar
        activeItems={currentActiveItems}
        category={category}
        filter={filter}
        sort={sort}
        onCategoryChange={setCategory}
        onFilterChange={setFilter}
        onSortChange={setSort}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-headline text-2xl font-black text-[#13211c]">Masih tersedia</h2>
            <p className="mt-1 text-sm text-black/52">
              {filteredActiveItems.length} dari {currentActiveItems.length} barang aktif tampil sesuai filter.
            </p>
          </div>
        </div>

        {filteredActiveItems.length > 0 ? (
          <div className="grid auto-rows-auto gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredActiveItems.map((item) => (
              <WishlistCard
                item={item}
                key={item.lot.id}
                serverNow={serverNow}
                onRemoveFavorite={handleRemoveFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[#d8c49b] bg-[#fffaf0] p-6 text-sm font-semibold text-black/52">
            Belum ada barang aktif untuk filter ini.
          </div>
        )}
      </section>

      {currentUnavailableItems.length > 0 ? (
        <section className="rounded-md border border-black/10 bg-white p-4 shadow-[0_24px_64px_-52px_rgba(8,69,50,0.36)]">
          <div className="mb-4">
            <h2 className="font-headline text-xl font-black text-[#13211c]">Tidak tersedia</h2>
            <p className="mt-1 text-sm text-black/52">Barang tetap ditampilkan agar riwayat pilihan Anda tidak hilang tiba-tiba.</p>
          </div>
          <div className="grid gap-3">
            {currentUnavailableItems.map((item) => (
              <UnavailableWishlistItem
                item={item}
                key={item.lot.id}
                onRemoveFavorite={handleRemoveFavorite}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
