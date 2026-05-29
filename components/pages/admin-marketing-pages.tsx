"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  Clock3,
  FileText,
  Gavel,
  Landmark,
  MapPin,
  Megaphone,
  ReceiptText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import { AdminPaginationFooter, useAdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { LotMediaGallery } from "@/components/shared/lot-media-gallery";
import { LotFigure } from "@/components/shared/lot-figure";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { currency } from "@/lib/formatters/currency";
import { formatAppDateTime } from "@/lib/timezone";

type MarketingMedia = {
  id: string;
  type: string;
  url: string;
  fileName?: string;
};

export type MarketingSession = {
  id: string;
  lotId: string;
  lot: string;
  code?: string;
  category?: string;
  condition?: string;
  status: string;
  mode: string;
  media?: MarketingMedia[];
  primaryMedia?: MarketingMedia | null;
  startsAt?: string | null;
  ending?: string;
  endingAt?: string;
  revealDeadline?: string | null;
  revealDeadlineAt?: string | null;
  participants?: number;
  participantPreviews?: Array<{
    bidderId: string;
    bidderName: string;
    bidderImage?: string | null;
  }>;
  revealedBidCount?: number;
  pendingRevealCount?: number;
  price?: number | null;
  transactionId?: string | null;
  transactionStatus?: string | null;
  buyerName?: string | null;
  paymentMethod?: string | null;
  proofUrl?: string | null;
  reference?: string | null;
  soldAt?: string | null;
  paymentDeadline?: string | null;
  basePrice?: number | null;
  finalPrice?: number | null;
  winner?: string | null;
  visibility?: string;
  note?: string;
  bids?: Array<{
    id: string;
    bidderId: string;
    bidderName: string;
    submittedAtLabel: string;
    isRevealed?: boolean;
    rank: number;
    isWinner: boolean;
    determinesFinalPrice: boolean;
  }>;
};

function humanize(value?: string | null) {
  if (!value) {
    return "-";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (match) => match.toUpperCase());
}

function toBuyerMedia(
  media: MarketingMedia[] = []
): Array<{ id: string; type: "foto" | "video"; url: string; fileName: string }> {
  return media.map((item) => ({
    id: item.id,
    type: (item.type === "video" ? "video" : "foto") as "foto" | "video",
    url: item.url,
    fileName: item.fileName || ""
  }));
}

function SessionHeader({
  eyebrow,
  title,
  description,
  accent = "green",
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent?: "green" | "amber";
  action?: ReactNode;
}) {
  const tone =
    accent === "green"
      ? "bg-gradient-to-br from-[#eef7f1] via-white to-[#f8fbf8]"
      : "bg-gradient-to-br from-[#fff7e8] via-white to-[#fffaf1]";

  return (
    <section className={`overflow-hidden rounded-[1.85rem] border border-black/10 p-5 sm:p-6 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-black/45 sm:text-xs">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-headline text-[2.3rem] font-black tracking-tight text-black/88 sm:text-[2.7rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-black/65 sm:text-base">{description}</p>
        </div>
        {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
      </div>
    </section>
  );
}

function SessionMetric({
  label,
  value,
  tone = "green"
}: {
  label: string;
  value: ReactNode;
  tone?: "green" | "amber" | "neutral";
}) {
  const styles =
    tone === "green"
      ? "border-[#dce9df] bg-[#f6fbf7]"
      : tone === "amber"
        ? "border-[#eadbbc] bg-[#fffaf0]"
        : "border-black/10 bg-white";

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/45">{label}</p>
      <div className="mt-2 text-base font-semibold text-black/82">{value}</div>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white p-5 text-sm leading-7 text-black/55">
      {text}
    </div>
  );
}

function dateLabel(value?: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return formatAppDateTime(date);
}

const VICKREY_PAYMENT_STATUSES = new Set([
  "MENUNGGU_PEMBAYARAN",
  "BUKTI_DIUNGGAH",
  "DITOLAK_BUKTI",
  "MENUNGGU_KONFIRMASI_LANGSUNG"
]);

function getVickreyStage(auction: MarketingSession) {
  const transactionStatus = auction.transactionStatus ?? "";

  if (auction.visibility === "TERKUNCI") {
    return {
      label: "Sesi aktif",
      detail: "Bid tersegel. Admin hanya memantau jumlah peserta dan countdown.",
      tone: "amber" as const,
      icon: Clock3
    };
  }

  if (auction.visibility === "MENUNGGU_REVEAL") {
    return {
      label: "Menunggu reveal",
      detail: "Deadline lewat. Buyer perlu reveal nominal sebelum pemenang dihitung.",
      tone: "amber" as const,
      icon: ShieldCheck
    };
  }

  if (VICKREY_PAYMENT_STATUSES.has(transactionStatus)) {
    return {
      label: transactionStatus === "BUKTI_DIUNGGAH" ? "Perlu verifikasi" : "Antrian pembayaran",
      detail: auction.buyerName
        ? `${auction.buyerName} masuk alur pembayaran pemenang.`
        : "Transaksi pemenang sudah terbentuk dan menunggu tindak lanjut.",
      tone: "green" as const,
      icon: WalletCards
    };
  }

  if (transactionStatus === "LUNAS" || transactionStatus === "SELESAI") {
    return {
      label: transactionStatus === "SELESAI" ? "Selesai" : "Terverifikasi",
      detail: "Pembayaran pemenang sudah diputuskan dan arsip transaksi tersedia.",
      tone: "green" as const,
      icon: BadgeCheck
    };
  }

  if (!auction.winner && auction.visibility === "HASIL_DIBUKA") {
    return {
      label: "Gagal / tanpa pemenang",
      detail: "Tidak ada transaksi pemenang yang perlu diverifikasi.",
      tone: "neutral" as const,
      icon: AlertTriangle
    };
  }

  return {
    label: "Hasil dibuka",
    detail: "Pemenang dan harga final sudah bisa ditinjau.",
    tone: "green" as const,
    icon: ShieldCheck
  };
}

function getVickreySummary(auctions: MarketingSession[]) {
  return {
    active: auctions.filter((auction) => auction.visibility === "TERKUNCI").length,
    pendingReveal: auctions.filter((auction) => auction.visibility === "MENUNGGU_REVEAL").length,
    revealed: auctions.filter((auction) => auction.visibility === "HASIL_DIBUKA").length,
    paymentQueue: auctions.filter((auction) => VICKREY_PAYMENT_STATUSES.has(auction.transactionStatus ?? "")).length,
    completed: auctions.filter((auction) => ["LUNAS", "SELESAI"].includes(auction.transactionStatus ?? "")).length
  };
}

const MARKETING_METHOD_FILTERS = [
  { label: "Semua", value: "ALL" },
  { label: "Fixed Price", value: "FIXED_PRICE" },
  { label: "Vickrey Auction", value: "VICKREY_AUCTION" }
] as const;

const MARKETING_STATUS_FILTERS = ["Semua", "Aktif", "Menunggu Bayar", "Selesai", "Perlu Strategi"] as const;

type MarketingMethodFilter = (typeof MARKETING_METHOD_FILTERS)[number]["value"];
type MarketingStatusFilter = (typeof MARKETING_STATUS_FILTERS)[number];

function isPaymentQueue(auction: MarketingSession) {
  return VICKREY_PAYMENT_STATUSES.has(auction.transactionStatus ?? "");
}

function isMarketingActive(auction: MarketingSession) {
  return auction.status === "AKTIF";
}

function isMarketingSold(auction: MarketingSession) {
  return (
    auction.status === "SELESAI" ||
    auction.transactionStatus === "LUNAS" ||
    auction.transactionStatus === "SELESAI" ||
    Boolean(auction.soldAt)
  );
}

function needsMarketingStrategy(auction: MarketingSession) {
  return (
    auction.status === "GAGAL" ||
    (auction.mode === "VICKREY_AUCTION" &&
      auction.visibility === "HASIL_DIBUKA" &&
      !auction.transactionId &&
      !auction.winner)
  );
}

function getMarketingWorkflowStatus(auction: MarketingSession) {
  if (needsMarketingStrategy(auction)) {
    return "Perlu Strategi";
  }
  if (isMarketingSold(auction)) {
    return "Selesai";
  }
  if (isPaymentQueue(auction)) {
    return "Menunggu Bayar";
  }
  if (isMarketingActive(auction)) {
    return "Aktif";
  }
  return "Tertunda";
}

function getMarketingDateYear(auction: MarketingSession) {
  const value = auction.startsAt ?? auction.endingAt ?? auction.soldAt;
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : String(date.getFullYear());
}

function getMarketingTimeLabel(auction: MarketingSession) {
  if (auction.mode === "VICKREY_AUCTION") {
    return auction.visibility === "TERKUNCI" ? "Sesi Berakhir" : "Sesi Ditutup";
  }
  if (isMarketingSold(auction)) {
    return "Terjual Pada";
  }
  return "Sesi Dimulai";
}

function getMarketingTimeValue(auction: MarketingSession) {
  if (auction.mode === "VICKREY_AUCTION") {
    return auction.endingAt ? dateLabel(auction.endingAt) : auction.ending || "-";
  }
  if (isMarketingSold(auction)) {
    return dateLabel(auction.soldAt);
  }
  return dateLabel(auction.startsAt);
}

function getMarketingPriceLabel(auction: MarketingSession) {
  if (auction.mode === "VICKREY_AUCTION") {
    return auction.finalPrice ? "Harga Final" : "Harga Awal";
  }
  return "Harga Jual";
}

function getMarketingPriceValue(auction: MarketingSession) {
  if (auction.mode === "VICKREY_AUCTION") {
    return auction.finalPrice ?? auction.basePrice ?? 0;
  }
  return auction.price ?? 0;
}

function getMarketingAction(auction: MarketingSession) {
  if (auction.transactionId && isPaymentQueue(auction)) {
    return {
      href: `/admin/transaksi/${auction.transactionId}?from=vickrey`,
      label: "Kelola Transaksi",
      variant: "secondary" as const
    };
  }

  if (auction.mode === "VICKREY_AUCTION") {
    return {
      href: `/admin/pemasaran/vickrey-auction/${auction.id}`,
      label: "Kelola Sesi",
      variant: "default" as const
    };
  }

  return {
    href: `/admin/pemasaran/fixed-price/${auction.id}`,
    label: "Lihat Detail",
    variant: "secondary" as const
  };
}

function getMarketingParticipantNames(auction: MarketingSession) {
  const previewNames = (auction.participantPreviews ?? [])
    .map((entry) => entry.bidderName)
    .filter((name): name is string => Boolean(name));

  if (previewNames.length) {
    return previewNames;
  }

  const bidNames = (auction.bids ?? [])
    .map((bid) => bid.bidderName)
    .filter((name): name is string => Boolean(name));

  if (bidNames.length) {
    return bidNames;
  }

  return Array.from({ length: auction.participants ?? 0 }, (_, index) => `Peserta ${index + 1}`);
}

function getMarketingParticipantPreviews(auction: MarketingSession) {
  const previewEntries = (auction.participantPreviews ?? []).map((entry) => ({
    bidderId: entry.bidderId,
    bidderName: entry.bidderName,
    bidderImage: entry.bidderImage ?? null
  }));

  if (previewEntries.length) {
    return previewEntries;
  }

  const bidEntries = (auction.bids ?? []).map((bid) => ({
    bidderId: bid.bidderId,
    bidderName: bid.bidderName,
    bidderImage: null
  }));

  if (bidEntries.length) {
    return bidEntries;
  }

  return Array.from({ length: auction.participants ?? 0 }, (_, index) => ({
    bidderId: `${auction.id}-participant-${index + 1}`,
    bidderName: `Peserta ${index + 1}`,
    bidderImage: null
  }));
}

function MarketingParticipantStrip({ auction }: { auction: MarketingSession }) {
  const participantCount = auction.participants ?? 0;

  if (participantCount <= 0) {
    return null;
  }

  const previews = getMarketingParticipantPreviews(auction);
  const names = getMarketingParticipantNames(auction);
  const visibleCount = Math.min(participantCount, 10);
  const extraCount = Math.max(participantCount - visibleCount, 0);
  const avatarTones = [
    "from-[#fff3e5] via-[#b77b52] to-[#5d341f]",
    "from-[#f2f7ff] via-[#6283af] to-[#28435d]",
    "from-[#f7efe4] via-[#8b6750] to-[#4a3022]",
    "from-[#eef9f2] via-[#4b8f72] to-[#204a3c]",
    "from-[#fff1f4] via-[#b77287] to-[#633243]"
  ];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[0.76rem] font-bold text-[#31413b] dark:text-slate-300">
      <span className="shrink-0">Peserta</span>
      <div className="flex -space-x-2.5">
        {Array.from({ length: visibleCount }, (_, index) => {
          const preview = previews[index];
          const label = preview?.bidderName ?? names[index] ?? `Peserta ${index + 1}`;
          const initials = label
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("");

          return (
            <div
              aria-label={label}
              className="relative size-8 overflow-hidden rounded-full border-2 border-[#d5eadc] bg-[#d9e3dc] shadow-[0_14px_24px_-18px_rgba(0,0,0,0.5)] ring-1 ring-[#8fd0a9]/85 dark:border-emerald-300/18 dark:ring-emerald-300/26"
              key={preview?.bidderId ?? `${auction.id}-participant-${index}`}
              title={label}
            >
              {preview?.bidderImage ? (
                <Image
                  alt={label}
                  className="object-cover"
                  fill
                  sizes="32px"
                  src={preview.bidderImage}
                />
              ) : (
                <span
                  className={`grid h-full w-full place-items-center bg-gradient-to-br ${avatarTones[index % avatarTones.length]} text-[0.63rem] font-black uppercase tracking-[0.06em] text-white`}
                >
                  {initials || "P"}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {extraCount > 0 ? (
        <span className="grid h-8 min-w-10 place-items-center rounded-full bg-[#e5f6ec] px-2.5 text-[0.72rem] font-black text-[#0a6a49] ring-1 ring-[#c9ebd6] dark:bg-emerald-300/10 dark:text-emerald-200 dark:ring-emerald-300/16">
          +{extraCount}
        </span>
      ) : null}
    </div>
  );
}

function MarketingMetaItem({
  icon: Icon,
  label,
  value,
  rootClassName,
  valueClassName
}: {
  icon: typeof Clock3;
  label: string;
  value: ReactNode;
  rootClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`flex min-w-0 items-center gap-2 px-2 first:pl-0 last:pr-0 ${rootClassName ?? ""}`}>
      <Icon className="size-4 shrink-0 text-black/36 dark:text-slate-500" strokeWidth={1.7} />
      <div className="min-w-0">
        <span className="block text-[0.66rem] font-bold leading-4 text-black/42 dark:text-slate-500">
          {label}
        </span>
        <span
          className={`block text-[0.74rem] font-black leading-[1.08rem] text-[#121c17] dark:text-slate-100 ${valueClassName ?? ""}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function MarketingMetricCard({
  description,
  icon: Icon,
  label,
  meta,
  tone,
  value
}: {
  description: string;
  icon: typeof CalendarDays;
  label: string;
  meta?: string;
  tone: "emerald" | "orange" | "violet";
  value: string;
}) {
  const toneClasses = {
    emerald:
      "border-[#dbece1] bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_64%,#f2faf5_100%)] text-[#006747] dark:border-emerald-300/14 dark:bg-[linear-gradient(135deg,#101a15_0%,#101a15_64%,rgba(24,88,61,0.24)_100%)] dark:text-emerald-200",
    orange:
      "border-[#f1e1ca] bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_64%,#fff8ed_100%)] text-[#d16b00] dark:border-amber-300/16 dark:bg-[linear-gradient(135deg,#101a15_0%,#101a15_64%,rgba(128,74,18,0.22)_100%)] dark:text-amber-200",
    violet:
      "border-[#e5ddf4] bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_64%,#f7f4ff_100%)] text-[#6152de] dark:border-violet-300/16 dark:bg-[linear-gradient(135deg,#101a15_0%,#101a15_64%,rgba(80,67,167,0.22)_100%)] dark:text-violet-200"
  }[tone];

  const iconClasses = {
    emerald: "bg-[#ecf8f0] dark:bg-emerald-300/10",
    orange: "bg-[#fff2e4] dark:bg-amber-300/10",
    violet: "bg-[#f0ecff] dark:bg-violet-300/10"
  }[tone];

  return (
    <article
      className={`group relative overflow-hidden rounded-[1.35rem] border p-4 shadow-[0_20px_52px_-46px_rgba(8,69,50,0.34)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 dark:shadow-[0_22px_58px_-42px_rgba(0,0,0,0.72)] ${toneClasses}`}
    >
      <div className="relative z-[1] flex items-center gap-4">
        <span className={`grid size-14 shrink-0 place-items-center rounded-[1.05rem] border border-current/10 ${iconClasses}`}>
          <Icon className="size-6" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight text-[#1b2721] dark:text-slate-100">{label}</p>
          <p className="mt-1 font-headline text-[2rem] font-black leading-none tracking-[-0.045em] text-[#06472e] dark:text-slate-50">
            {value}
          </p>
          <p className="mt-1 text-[0.82rem] leading-5 text-[#53615b] dark:text-slate-300/72">{description}</p>
          {meta ? <p className="mt-1 text-[0.72rem] font-black uppercase tracking-[0.16em] text-current/70">{meta}</p> : null}
        </div>
      </div>
      <ChevronRight className="absolute right-5 top-1/2 size-5 -translate-y-1/2 text-black/18 transition duration-500 group-hover:translate-x-1 group-hover:text-current/58 dark:text-white/18" />
    </article>
  );
}

function MarketingFeedRow({ auction }: { auction: MarketingSession }) {
  const media = toBuyerMedia(auction.media ?? []);
  const action = getMarketingAction(auction);
  const workflowStatus = getMarketingWorkflowStatus(auction);
  const statusDotClass =
    workflowStatus === "Aktif"
      ? "bg-[#0fa35a]"
      : workflowStatus === "Menunggu Bayar"
        ? "bg-[#d89b12]"
        : "bg-slate-400";
  const modeLabel = auction.mode === "VICKREY_AUCTION" ? "Vickrey Auction" : "Fixed Price";
  const modeTone =
    auction.mode === "VICKREY_AUCTION"
      ? "bg-[#fff3e8] text-[#a8570b] dark:bg-amber-300/10 dark:text-amber-200"
      : "bg-[#e8f6ee] text-[#006747] dark:bg-emerald-300/10 dark:text-emerald-200";

  return (
    <article className="group grid gap-4 rounded-[1.45rem] bg-white p-3 shadow-[0_18px_54px_-48px_rgba(8,69,50,0.38)] ring-1 ring-[#cfe5d6] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:ring-[#0a6a49]/24 dark:bg-[#101a15] dark:shadow-[0_24px_62px_-44px_rgba(0,0,0,0.7)] dark:ring-emerald-300/12 dark:hover:ring-emerald-300/20 lg:grid-cols-[15.5rem_minmax(0,1fr)_19rem] lg:items-stretch">
      <div className="relative min-h-40 overflow-hidden rounded-[1.15rem] bg-[#f4f5ef] dark:bg-[#17241d]">
        <LotFigure
          category={auction.category || "Lainnya"}
          className="h-full min-h-40 rounded-[1.15rem]"
          media={media}
          showCategoryBadge={false}
          variant="pdp"
        />
        <span className="absolute bottom-3 left-3 inline-flex h-6 items-center gap-1.5 rounded-full bg-white/95 px-2.5 text-[0.72rem] font-black text-[#1b251f] shadow-[0_12px_24px_-18px_rgba(0,0,0,0.36)] ring-1 ring-[#d6e7db] dark:bg-white/92 dark:text-[#1b251f]">
          <span className={`size-2 rounded-full ${statusDotClass}`} />
          {workflowStatus}
        </span>
      </div>

      <div className="min-w-0 py-1 lg:py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em] ${modeTone}`}>
            {modeLabel}
          </span>
        </div>

        <div className="mt-3">
          <h3 className="font-headline text-[1.4rem] font-black leading-tight tracking-[-0.035em] text-[#121c17] transition duration-500 group-hover:text-[#006747] dark:text-slate-100 dark:group-hover:text-emerald-200">
            {auction.lot}
          </h3>
          <p className="mt-1 text-sm font-semibold text-black/52 dark:text-slate-300/68">
            {auction.category || "Kategori belum diisi"} - {auction.condition || "Kondisi belum diisi"}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-y-3 border-t border-black/[0.06] pt-3 dark:border-white/8 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.72fr)_minmax(0,0.92fr)_minmax(0,1.46fr)] lg:divide-x lg:divide-black/10 lg:dark:divide-white/10">
          <MarketingMetaItem
            icon={Landmark}
            label="Kode Lot"
            value={auction.code || auction.id}
            valueClassName="whitespace-nowrap"
          />
          <MarketingMetaItem icon={CalendarDays} label="Tahun" value={getMarketingDateYear(auction)} />
          <MarketingMetaItem icon={BadgeCheck} label="Kondisi" value={humanize(auction.condition)} />
          <MarketingMetaItem
            icon={CalendarDays}
            label={getMarketingTimeLabel(auction)}
            rootClassName="col-span-2 lg:col-span-1"
            value={getMarketingTimeValue(auction)}
            valueClassName="text-[0.7rem] sm:text-[0.73rem] xl:text-[0.71rem] 2xl:text-[0.74rem] whitespace-normal xl:whitespace-nowrap"
          />
        </div>

        {auction.mode === "VICKREY_AUCTION" ? (
          <MarketingParticipantStrip auction={auction} />
        ) : null}
      </div>

      <aside className="flex flex-col justify-between gap-4 rounded-[1.15rem] border border-[#d8e8dd] bg-[#fcfcfa] p-4 dark:border-emerald-300/10 dark:bg-white/[0.035]">
        <div className="space-y-3">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-black/40 dark:text-slate-500">
              {getMarketingPriceLabel(auction)}
            </p>
            <p className="mt-1 font-headline text-[1.65rem] font-black leading-none tracking-[-0.04em] text-[#004a23] dark:text-emerald-200">
              {currency.format(getMarketingPriceValue(auction))}
            </p>
          </div>
          <div className="rounded-[0.95rem] bg-white px-3 py-2 text-sm leading-6 text-black/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] ring-1 ring-black/[0.045] dark:bg-[#101a15] dark:text-slate-300/72 dark:ring-white/8">
            <p className="font-bold text-[#15211b] dark:text-slate-100">
              {auction.buyerName || auction.winner || (auction.mode === "VICKREY_AUCTION" ? "Bid masih tertutup" : "Belum ada pembeli")}
            </p>
            <p className="mt-0.5">
              {auction.finalPrice
                ? `${currency.format(auction.finalPrice)} harga final`
                : auction.mode === "VICKREY_AUCTION"
                  ? `${auction.participants ?? 0} penawaran tercatat`
                  : humanize(auction.transactionStatus) || "Menunggu transaksi pembeli"}
            </p>
          </div>
        </div>

        <Link href={action.href}>
          <Button
            className="h-10 w-full rounded-xl font-black shadow-[0_16px_28px_-22px_rgba(0,74,35,0.42)]"
            variant={action.variant}
          >
            {action.label}
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </aside>
    </article>
  );
}

export function AdminMarketingUnifiedPage({
  auctions,
  unitName = "Unit aktif"
}: {
  auctions: MarketingSession[];
  unitName?: string;
}) {
  const [methodFilter, setMethodFilter] = useState<MarketingMethodFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<MarketingStatusFilter>("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const metrics = useMemo(() => {
    const activeSessions = auctions.filter(isMarketingActive);
    const fixedActive = activeSessions.filter((auction) => auction.mode === "FIXED_PRICE").length;
    const vickreyActive = activeSessions.filter((auction) => auction.mode === "VICKREY_AUCTION").length;

    return {
      active: activeSessions.length,
      fixedActive,
      vickreyActive,
      sold: auctions.filter(isMarketingSold).length,
      strategy: auctions.filter(needsMarketingStrategy).length
    };
  }, [auctions]);

  const filteredAuctions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return auctions.filter((auction) => {
      const matchesMethod = methodFilter === "ALL" || auction.mode === methodFilter;
      const matchesStatus = statusFilter === "Semua" || getMarketingWorkflowStatus(auction) === statusFilter;
      const matchesSearch =
        !normalizedQuery ||
        [auction.lot, auction.code, auction.id, auction.category, auction.condition]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return matchesMethod && matchesStatus && matchesSearch;
    });
  }, [auctions, methodFilter, searchQuery, statusFilter]);

  const pagination = useAdminPagination(filteredAuctions, `${methodFilter}-${statusFilter}-${searchQuery}`);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2.35rem] bg-[radial-gradient(circle_at_top_left,rgba(193,255,226,0.95),transparent_28%),linear-gradient(135deg,#fffdfa_0%,#f6f4ee_42%,#ffffff_100%)] px-6 py-6 shadow-[0_28px_90px_-72px_rgba(8,69,50,0.42)] sm:px-7 lg:px-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[28rem] bg-[radial-gradient(circle_at_center,rgba(9,111,78,0.12),transparent_62%)] lg:block" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4 md:items-center">
            <span className="grid size-16 shrink-0 place-items-center rounded-[1.35rem] bg-[linear-gradient(180deg,#fdfcf8,#edf7ef)] text-[#0a6a49] shadow-[0_20px_45px_-28px_rgba(10,106,73,0.38),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[#8fd0a9]/65">
              <Megaphone className="size-7" />
            </span>
            <div className="min-w-0">
              <p className="page-heading-eyebrow">Admin Unit / Pemasaran</p>
              <h1 className="mt-2 font-headline text-3xl font-black tracking-[-0.04em] text-[#13211c] sm:text-4xl lg:text-[2.85rem]">
                Pemasaran Barang
              </h1>
              <p className="mt-2 text-sm font-semibold text-[#006747] dark:text-emerald-200/78">{unitName}</p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-black/60 sm:text-base">
                Kelola sesi pemasaran aktif, pantau peserta lelang, dan buka tindak lanjut transaksi dari satu workspace operasional yang compact.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#0a6a49] shadow-[0_16px_34px_-28px_rgba(8,69,50,0.35)] ring-1 ring-[#8fd0a9]/65 backdrop-blur">
              <BadgeCheck className="size-4" />
              Workspace pemasaran unit
            </span>
            <Link href="#marketing-session-list">
              <Button className="h-12 w-full rounded-2xl px-5 text-sm shadow-[0_18px_32px_-24px_rgba(10,106,73,0.55)] sm:w-auto sm:text-base">
                <Gavel className="size-4" />
                Lihat Sesi Aktif
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3" aria-label="Ringkasan pemasaran">
        <MarketingMetricCard
          description={`${metrics.fixedActive} Beli Putus / ${metrics.vickreyActive} Lelang`}
          icon={CalendarDays}
          label="Sesi Sedang Berjalan"
          meta="Etalase aktif"
          tone="emerald"
          value={`${metrics.active} Sesi`}
        />
        <MarketingMetricCard
          description="Periode minggu ini"
          icon={CheckCircle2}
          label="Produk Terjual"
          meta="Pembayaran selesai"
          tone="orange"
          value={`${metrics.sold} Produk`}
        />
        <MarketingMetricCard
          description="Sesi gagal / kedaluwarsa"
          icon={Target}
          label="Perlu Strategi Ulang"
          meta="Butuh evaluasi"
          tone="violet"
          value={`${metrics.strategy} Produk`}
        />
      </section>

      <section className="rounded-[1.45rem] border border-[#d8e8dd] bg-white p-3 shadow-[0_18px_54px_-50px_rgba(8,69,50,0.28)] dark:border-emerald-300/10 dark:bg-[#101a15] dark:shadow-[0_24px_62px_-44px_rgba(0,0,0,0.72)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative min-w-0 flex-1 xl:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-black/38 dark:text-slate-500" />
            <input
              className="h-11 w-full rounded-2xl border border-[#dce9df] bg-[#fbfbfa] pl-11 pr-4 text-sm font-semibold text-[#15211b] outline-none transition duration-300 placeholder:text-black/36 focus:border-[#0a6a49]/30 focus:bg-white focus:ring-4 focus:ring-[#0a6a49]/8 dark:border-emerald-300/10 dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-300/20 dark:focus:bg-white/[0.06] dark:focus:ring-emerald-300/10"
              placeholder="Cari nama barang atau Lot ID..."
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-2xl bg-[#f4f5f1] p-1 dark:bg-white/[0.045]">
              {MARKETING_METHOD_FILTERS.map((filter) => (
                <button
                  className={`rounded-xl px-4 py-2 text-xs font-black transition duration-300 ${
                    methodFilter === filter.value
                      ? "bg-[#006747] text-white shadow-[0_12px_24px_-18px_rgba(0,103,71,0.5)]"
                      : "text-black/56 hover:text-[#006747] dark:text-slate-300/72 dark:hover:text-emerald-200"
                  }`}
                  key={filter.value}
                  type="button"
                  onClick={() => setMethodFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <span className="hidden h-6 w-px bg-black/10 dark:bg-white/10 sm:block" />

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-black/40 dark:text-slate-500">
                Status
              </span>
              {MARKETING_STATUS_FILTERS.map((filter) => (
                <button
                  className={`rounded-xl px-4 py-2 text-xs font-black transition duration-300 ${
                    statusFilter === filter
                      ? "bg-[#006747] text-white shadow-[0_12px_24px_-18px_rgba(0,103,71,0.5)]"
                      : "border border-[#dce9df] bg-white text-black/58 hover:border-[#0a6a49]/18 hover:text-[#006747] dark:border-emerald-300/10 dark:bg-white/[0.04] dark:text-slate-300/72 dark:hover:border-emerald-300/18 dark:hover:text-emerald-200"
                  }`}
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button
              aria-label="Filter lanjutan"
              className="grid size-11 place-items-center rounded-2xl border border-[#dce9df] bg-white text-black/56 transition duration-300 hover:border-[#0a6a49]/18 hover:text-[#006747] dark:border-emerald-300/10 dark:bg-white/[0.04] dark:text-slate-300/72 dark:hover:border-emerald-300/18 dark:hover:text-emerald-200"
              type="button"
            >
              <SlidersHorizontal className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {filteredAuctions.length ? (
        <section
          className="overflow-hidden rounded-[1.6rem] border border-[#d8e8dd] bg-[#f8f9f6] shadow-[0_22px_70px_-60px_rgba(8,69,50,0.42)] dark:border-emerald-300/10 dark:bg-[#0d1712] dark:shadow-[0_24px_68px_-44px_rgba(0,0,0,0.72)]"
          id="marketing-session-list"
        >
          <div className="space-y-3 p-3 sm:p-4">
            {pagination.visibleItems.map((auction) => (
              <MarketingFeedRow auction={auction} key={auction.id} />
            ))}
          </div>
          <AdminPaginationFooter
            itemLabel="sesi"
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageIndexChange={pagination.setPageIndex}
            onPageSizeChange={pagination.setPageSize}
          />
        </section>
      ) : (
        <EmptyPanel text="Tidak ada sesi pemasaran yang cocok dengan filter saat ini." />
      )}
    </div>
  );
}

function FixedPriceCard({ auction }: { auction: MarketingSession }) {
  const transactionLabel = auction.transactionStatus ? humanize(auction.transactionStatus) : "Belum ada transaksi";
  const paymentMethod = auction.paymentMethod ? humanize(auction.paymentMethod) : "-";
  const media = toBuyerMedia(auction.media ?? []);

  return (
    <Card className="group w-full max-w-[23.5rem] overflow-hidden rounded-[1.55rem] bg-white p-0 transition-transform duration-300 hover:-translate-y-1">
      <LotFigure
        category={auction.category || "Lainnya"}
        className="aspect-[4/3] rounded-b-none rounded-t-[1.55rem]"
        media={media}
      />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Fixed Price</Badge>
            <Badge variant="muted">{auction.code || "BRG"}</Badge>
          </div>
          <AdminStatusBadge status={auction.status as any} />
        </div>

        <div className="space-y-2">
          <h3 className="font-headline text-lg font-bold tracking-tight text-foreground">{auction.lot}</h3>
          <p className="line-clamp-2 text-[0.92rem] text-muted-foreground">
            {auction.note || "Pilih sesi untuk memeriksa pembayaran dan kelanjutan verifikasi."}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Harga Jual
          </p>
          <p className="font-headline text-[1.65rem] font-extrabold tracking-tight text-primary">
            {currency.format(auction.price ?? 0)}
          </p>
          <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Clock3 className="size-3.5 text-[#d72b43]" />
            {transactionLabel}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white/80 p-3 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">{auction.buyerName || "Belum ada pembeli"}</p>
          <p className="mt-1">{paymentMethod === "-" ? "Menunggu pembeli memilih metode bayar." : paymentMethod}</p>
        </div>

        <div className="rounded-2xl bg-surface-low p-3 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{auction.category || "Kategori belum diisi"}</p>
          <p className="mt-1">{auction.condition || "Kondisi belum diisi"}</p>
        </div>

        <Link href={`/admin/pemasaran/fixed-price/${auction.id}`}>
          <Button className="h-11 w-full" variant="default">
            Lihat Sesi
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function VickreyCard({ auction }: { auction: MarketingSession }) {
  const visibilityLabel = humanize(auction.visibility);
  const media = toBuyerMedia(auction.media ?? []);
  const stage = getVickreyStage(auction);
  const StageIcon = stage.icon;
  const waitingReveal = auction.visibility === "MENUNGGU_REVEAL";
  const serverNow = new Date().toISOString();

  return (
    <Card className="group w-full max-w-[23.5rem] overflow-hidden rounded-[1.55rem] bg-white p-0 transition-transform duration-300 hover:-translate-y-1">
      <LotFigure
        category={auction.category || "Lainnya"}
        className="aspect-[4/3] rounded-b-none rounded-t-[1.55rem]"
        media={media}
      />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">Vickrey</Badge>
            <Badge variant="muted">{auction.code || "BRG"}</Badge>
          </div>
          <AdminStatusBadge status={auction.status as any} />
        </div>

        <div className="space-y-2">
          <h3 className="font-headline text-lg font-bold tracking-tight text-foreground">{auction.lot}</h3>
          <p className="line-clamp-2 text-[0.92rem] text-muted-foreground">
            {auction.note || "Pantau sesi lelang, peserta, dan pembukaan hasil setelah deadline."}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Harga Dasar
          </p>
          <p className="font-headline text-[1.65rem] font-extrabold tracking-tight text-primary">
            {currency.format(auction.basePrice ?? 0)}
          </p>
          <p className="inline-flex items-center gap-1 text-xs font-medium text-tertiary-container">
            <Clock3 className="size-3.5 text-[#d72b43]" />
            <AdminLiveCountdown
              className="text-xs font-medium"
              expiredLabel={waitingReveal ? "Batas reveal terlewati" : "Deadline terlewati"}
              fallbackLabel={waitingReveal ? auction.revealDeadline ?? "-" : auction.ending || "-"}
              prefix={waitingReveal ? "Batas reveal" : undefined}
              serverNow={serverNow}
              targetAt={waitingReveal ? auction.revealDeadlineAt ?? undefined : auction.endingAt}
            />
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white/80 p-3 text-sm leading-relaxed text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#fff7dc] text-[#8a5b00]">
              <StageIcon className="size-4" />
            </span>
            <div>
              <p className="font-semibold text-foreground">{stage.label}</p>
              <p className="mt-1">{stage.detail}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-low p-3 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">
            {auction.winner ||
              (waitingReveal
                ? `${auction.revealedBidCount ?? 0}/${auction.participants ?? 0} reveal`
                : `${auction.participants ?? 0} peserta`)}
          </p>
          <p className="mt-1">
            {auction.finalPrice ? currency.format(auction.finalPrice) : visibilityLabel}
          </p>
        </div>

        {auction.transactionId && VICKREY_PAYMENT_STATUSES.has(auction.transactionStatus ?? "") ? (
          <Link href={`/admin/transaksi/${auction.transactionId}?from=vickrey`}>
            <Button className="h-11 w-full" variant="secondary">
              <WalletCards className="size-4" />
              Kelola transaksi pemenang
            </Button>
          </Link>
        ) : null}

        <Link href={`/admin/pemasaran/vickrey-auction/${auction.id}`}>
          <Button className="h-11 w-full" variant="default">
            Lihat Sesi
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function AdminFixedPriceListPage({
  auctions,
  emptyDescription = "Belum ada sesi fixed price untuk unit ini."
}: {
  auctions: MarketingSession[];
  emptyDescription?: string;
}) {
  const pagination = useAdminPagination(auctions, "fixed-price");

  return (
    <div className="space-y-6">
      <SessionHeader
        accent="green"
        description="Pantau sesi penjualan harga tetap, media barang, dan status pembayaran tanpa unsur lelang."
        eyebrow="Admin Unit / Pemasaran"
        title="Fixed Price"
      />

      {auctions.length ? (
        <section className="overflow-hidden rounded-[1.7rem] border border-[#d8e8dd] bg-white/50 shadow-[0_22px_70px_-60px_rgba(8,69,50,0.42)]">
          <div className="grid justify-start gap-4 p-4 [grid-template-columns:repeat(auto-fit,minmax(18.5rem,23.5rem))]">
            {pagination.visibleItems.map((auction) => (
              <FixedPriceCard auction={auction} key={auction.id} />
            ))}
          </div>
          <AdminPaginationFooter
            itemLabel="sesi"
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageIndexChange={pagination.setPageIndex}
            onPageSizeChange={pagination.setPageSize}
          />
        </section>
      ) : (
        <EmptyPanel text={emptyDescription} />
      )}
    </div>
  );
}

export function AdminVickreyAuctionListPage({
  auctions,
  emptyDescription = "Belum ada sesi vickrey auction untuk unit ini."
}: {
  auctions: MarketingSession[];
  emptyDescription?: string;
}) {
  const summary = getVickreySummary(auctions);
  const paymentQueue = auctions.filter((auction) => VICKREY_PAYMENT_STATUSES.has(auction.transactionStatus ?? ""));
  const serverNow = new Date().toISOString();
  const pagination = useAdminPagination(auctions, "vickrey-auction");

  return (
    <div className="space-y-6">
      <SessionHeader
        accent="amber"
        description="Ruang kerja lelang tertutup untuk memantau sesi aktif, pembukaan hasil, pembayaran pemenang, dan arsip tanpa membuka nominal bid sebelum deadline."
        eyebrow="Admin Unit / Pemasaran"
        title="Vickrey Auction"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SessionMetric
          label="Sesi aktif"
          tone="amber"
          value={
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-[#8a5b00]" />
              {summary.active} sesi
            </span>
          }
        />
        <SessionMetric
          label="Menunggu reveal"
          tone="amber"
          value={
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#8a5b00]" />
              {summary.pendingReveal} sesi
            </span>
          }
        />
        <SessionMetric
          label="Hasil dibuka"
          tone="neutral"
          value={
            <span className="inline-flex items-center gap-2">
              <Gavel className="size-4 text-[#0a6a49]" />
              {summary.revealed} sesi
            </span>
          }
        />
        <SessionMetric
          label="Antrian pembayaran"
          tone="green"
          value={
            <span className="inline-flex items-center gap-2">
              <WalletCards className="size-4 text-[#0a6a49]" />
              {summary.paymentQueue} sesi
            </span>
          }
        />
        <SessionMetric
          label="Terverifikasi"
          tone="green"
          value={
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="size-4 text-[#0a6a49]" />
              {summary.completed} transaksi
            </span>
          }
        />
      </div>

      {paymentQueue.length ? (
        <section className="rounded-[1.4rem] border border-[#dce9df] bg-[#f6fbf7] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a6a49]/65">
                Antrian pembayaran
              </p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                Pemenang Vickrey yang perlu dipantau
              </h3>
            </div>
            <Badge variant="default">{paymentQueue.length} sesi</Badge>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {paymentQueue.map((auction) => (
              <div className="rounded-2xl border border-[#dce9df] bg-white p-4" key={auction.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{auction.lot}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {auction.buyerName || "Pemenang"} - {humanize(auction.transactionStatus)}
                    </p>
                  </div>
                  <p className="font-headline text-lg font-extrabold text-primary">
                    {currency.format(auction.finalPrice ?? auction.basePrice ?? 0)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>
                    <AdminLiveCountdown
                      expiredLabel="Batas bayar terlewati"
                      fallbackLabel={dateLabel(auction.paymentDeadline)}
                      prefix="Sisa"
                      serverNow={serverNow}
                      targetAt={auction.paymentDeadline}
                    />
                  </span>
                  {auction.transactionId ? (
                    <Link href={`/admin/transaksi/${auction.transactionId}?from=vickrey`}>
                      <Button size="sm" variant="secondary">
                        <WalletCards className="size-4" />
                        Buka transaksi pemenang
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {auctions.length ? (
        <section className="overflow-hidden rounded-[1.7rem] border border-[#d8e8dd] bg-white/50 shadow-[0_22px_70px_-60px_rgba(8,69,50,0.42)]">
          <div className="grid justify-start gap-4 p-4 [grid-template-columns:repeat(auto-fit,minmax(18.5rem,23.5rem))]">
            {pagination.visibleItems.map((auction) => (
              <VickreyCard auction={auction} key={auction.id} />
            ))}
          </div>
          <AdminPaginationFooter
            itemLabel="sesi"
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageIndexChange={pagination.setPageIndex}
            onPageSizeChange={pagination.setPageSize}
          />
        </section>
      ) : (
        <EmptyPanel text={emptyDescription} />
      )}
    </div>
  );
}

export function AdminFixedPriceDetailPage({
  auction
}: {
  auction: MarketingSession;
}) {
  const media = auction.media ?? [];
  const sold = auction.transactionStatus === "LUNAS";
  const buyerMedia = toBuyerMedia(media);
  const serverNow = new Date().toISOString();

  return (
    <div className="space-y-6">
      <SessionHeader
        accent="green"
        description="Halaman ini menampilkan media barang, status pembayaran, dan langkah admin berikutnya untuk sesi harga tetap."
        eyebrow="Admin Unit / Detail Pemasaran"
        title={auction.lot}
        action={<AdminStatusBadge className="text-[0.95rem]" status={auction.status as any} />}
      />

      <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-5">
          <LotMediaGallery
            category={auction.category || "Lainnya"}
            className="min-h-[22rem] rounded-[2rem] md:min-h-[34rem]"
            media={buyerMedia}
            showVideoControls
            title={auction.lot}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Kode barang</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{auction.code || "-"}</p>
            </Card>
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Kategori</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{auction.category || "-"}</p>
            </Card>
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Kondisi</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{auction.condition || "-"}</p>
            </Card>
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Harga tetap</p>
              <p className="mt-2 text-sm font-semibold text-primary">{currency.format(auction.price ?? 0)}</p>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border border-border/70 bg-white">
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">Fixed Price</Badge>
                <Badge variant="muted">{auction.code || "BRG"}</Badge>
              </div>
              <div className="space-y-2">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                  {auction.lot}
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {auction.note || "Pantau verifikasi pembayaran dan penyelesaian sesi harga tetap."}
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4 text-primary" />
                  {auction.buyerName ? `Pembeli: ${auction.buyerName}` : "Belum ada pembeli"}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {sold ? "Transaksi selesai" : "Status transaksi"}
                </p>
                <p className="mt-3 font-headline text-5xl font-extrabold tracking-tight text-primary">
                  {currency.format(auction.price ?? 0)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {auction.transactionStatus ? humanize(auction.transactionStatus) : "Belum ada transaksi"}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-surface-low p-4 text-sm leading-relaxed text-muted-foreground">
                {auction.paymentMethod ? (
                  <p>
                    Metode bayar: <span className="font-semibold text-foreground">{humanize(auction.paymentMethod)}</span>
                  </p>
                ) : (
                  <p>Menunggu pembeli memilih metode bayar.</p>
                )}
                <p className="mt-2">
                  {auction.paymentDeadline ? (
                    <AdminLiveCountdown
                      className="font-semibold text-foreground"
                      expiredLabel="Batas waktu terlewati"
                      fallbackLabel={auction.paymentDeadline || "-"}
                      prefix="Sisa"
                      serverNow={serverNow}
                      targetAt={auction.paymentDeadline}
                    />
                  ) : (
                    "Tidak ada batas verifikasi aktif."
                  )}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SessionMetric label="Dipasarkan sejak" tone="neutral" value={dateLabel(auction.startsAt)} />
                <SessionMetric label="Referensi" tone="neutral" value={auction.reference || "-"} />
              </div>

              <div className="rounded-2xl bg-surface-low p-4 text-sm leading-relaxed text-muted-foreground">
                {auction.proofUrl ? (
                  <a
                    className="inline-flex items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
                    href={auction.proofUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <FileText className="size-4" />
                    Lihat bukti pembayaran
                  </a>
                ) : (
                  <p>Belum ada bukti pembayaran yang diunggah.</p>
                )}
              </div>

              <Link href={`/admin/pemasaran/fixed-price/${auction.id}`}>
                <Button className="w-full" variant="default">
                  Lihat sesi
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-[#fbfefb]">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">Langkah Berikutnya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-black/70">
              {sold ? (
                <p>Transaksi selesai. Admin dapat mencetak nota dan menutup alur penjualan.</p>
              ) : auction.transactionStatus ? (
                <p>Periksa bukti pembayaran lalu verifikasi agar sesi berpindah ke status terjual.</p>
              ) : (
                <p>Belum ada pembeli yang memulai pembayaran. Pantau sesi ini sampai ada transaksi masuk.</p>
              )}
              {auction.note ? <p>{auction.note}</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function VickreyPaymentPanel({ auction }: { auction: MarketingSession }) {
  if (auction.visibility !== "HASIL_DIBUKA") {
    return null;
  }

  const hasTransaction = Boolean(auction.transactionId);
  const statusLabel = auction.transactionStatus ? humanize(auction.transactionStatus) : "Belum ada transaksi";
  const serverNow = new Date().toISOString();

  return (
    <Card className="border border-border/70 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl sm:text-[1.45rem]">
          <WalletCards className="size-5 text-primary" />
          Pembayaran Pemenang
        </CardTitle>
        <CardDescription>
          {hasTransaction
            ? "Transaksi pemenang terbaca dari database. Untuk lelang Vickrey, pembayaran diproses langsung di unit."
            : "Belum ada transaksi pemenang yang perlu diverifikasi dari sesi ini."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <SessionMetric label="Pemenang" tone="neutral" value={auction.buyerName || auction.winner || "-"} />
          <SessionMetric label="Status pembayaran" tone="green" value={statusLabel} />
          <SessionMetric
            label="Metode"
            tone="neutral"
            value={auction.paymentMethod ? humanize(auction.paymentMethod) : "-"}
          />
          <SessionMetric
            label="Batas bayar"
            tone="amber"
            value={
              auction.paymentDeadline ? (
                <AdminLiveCountdown
                  expiredLabel="Batas bayar terlewati"
                  fallbackLabel={dateLabel(auction.paymentDeadline)}
                  prefix="Sisa"
                  serverNow={serverNow}
                  targetAt={auction.paymentDeadline}
                />
              ) : (
                "-"
              )
            }
          />
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface-low p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Harga final Vickrey
              </p>
              <p className="mt-1 font-headline text-2xl font-extrabold text-primary">
                {currency.format(auction.finalPrice ?? auction.basePrice ?? 0)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {auction.transactionId ? (
                <Link href={`/admin/transaksi/${auction.transactionId}?from=vickrey`}>
                  <Button variant="default">
                    <WalletCards className="size-4" />
                    Buka transaksi pemenang
                  </Button>
                </Link>
              ) : null}
              {auction.proofUrl ? (
                <Link href={auction.proofUrl} rel="noreferrer" target="_blank">
                  <Button variant="secondary">
                    <ReceiptText className="size-4" />
                    Buka bukti pembayaran
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminVickreyAuctionDetailPage({
  auction
}: {
  auction: MarketingSession;
}) {
  const bidRows = Array.isArray(auction.bids) ? auction.bids : [];
  const revealed = auction.visibility === "HASIL_DIBUKA";
  const waitingReveal = auction.visibility === "MENUNGGU_REVEAL";
  const showBidRows = revealed || waitingReveal;
  const buyerMedia = toBuyerMedia(auction.media ?? []);
  const serverNow = new Date().toISOString();

  return (
    <div className="space-y-6">
      <SessionHeader
        accent="amber"
        description="Halaman ini menjaga aturan sealed-bid tetap jelas, lalu menampilkan hasil setelah deadline terlewati."
        eyebrow="Admin Unit / Detail Pemasaran"
        title={auction.lot}
        action={<AdminStatusBadge className="text-[0.95rem]" status={auction.status as any} />}
      />

      <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-5">
          <LotMediaGallery
            category={auction.category || "Lainnya"}
            className="min-h-[22rem] rounded-[2rem] md:min-h-[34rem]"
            media={buyerMedia}
            showVideoControls
            title={auction.lot}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Kode barang</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{auction.code || "-"}</p>
            </Card>
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Kategori</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{auction.category || "-"}</p>
            </Card>
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Kondisi</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{auction.condition || "-"}</p>
            </Card>
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Harga dasar</p>
              <p className="mt-2 text-sm font-semibold text-primary">{currency.format(auction.basePrice ?? 0)}</p>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border border-border/70 bg-white">
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">Vickrey Auction</Badge>
                <Badge variant="muted">{auction.code || "BRG"}</Badge>
              </div>
              <div className="space-y-2">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                  {auction.lot}
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {auction.note || "Pantau sesi lelang, peserta, dan pembukaan hasil setelah deadline."}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {revealed ? "Hasil terbuka" : waitingReveal ? "Menunggu reveal" : "Hasil terkunci"}
                </p>
                <p className="mt-3 font-headline text-5xl font-extrabold tracking-tight text-primary">
                  {currency.format(auction.basePrice ?? 0)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {revealed
                    ? "Hasil final sudah terbentuk dan transaksi pemenang dapat dipantau."
                    : waitingReveal
                      ? "Deadline lewat. Sistem menunggu buyer reveal nominal tanpa membuka nilai ke admin."
                      : "Nominal bid tetap tersembunyi sampai deadline selesai."}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-surface-low p-4 text-sm leading-relaxed text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <UsersRound className="size-4 text-[#8a5b00]" />
                  {auction.participants ?? 0} peserta
                </p>
                <p className="mt-2">
                  <AdminLiveCountdown
                    className="font-semibold text-foreground"
                    expiredLabel={waitingReveal ? "Batas reveal terlewati" : "Deadline terlewati"}
                    fallbackLabel={waitingReveal ? auction.revealDeadline ?? "-" : auction.ending || "-"}
                    prefix="Sisa"
                    serverNow={serverNow}
                    targetAt={waitingReveal ? auction.revealDeadlineAt ?? undefined : auction.endingAt}
                  />
                </p>
                <p className="mt-2">{humanize(auction.visibility)}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SessionMetric label="Dipasarkan sejak" tone="neutral" value={dateLabel(auction.startsAt)} />
                <SessionMetric label="Berakhir pada" tone="neutral" value={dateLabel(auction.endingAt)} />
              </div>

              <Link href={`/admin/pemasaran/vickrey-auction/${auction.id}`}>
                <Button className="w-full" variant="default">
                  Lihat sesi
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-[#fffaf2]">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">Aturan Hasil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[#ead8b5] bg-white p-5">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#8a5b00]/55">
                  {revealed ? "Hasil terbuka" : waitingReveal ? "Reveal window" : "Hasil terkunci"}
                </p>
                <p className="mt-2 text-lg font-semibold text-black/85">
                  {revealed
                    ? "Pemenang dan harga final sudah terbentuk"
                    : waitingReveal
                      ? "Menunggu buyer reveal nominal"
                      : "Nominal bid belum dapat dibuka"}
                </p>
                <p className="mt-2 text-sm leading-6 text-black/60">
                  {revealed
                    ? "Admin melihat pemenang, harga final, dan status pembayaran setelah settlement selesai."
                    : waitingReveal
                      ? "Buyer perlu membuka nominal dari sisi akunnya. Admin tetap tidak menerima nominal individual sebelum settlement."
                      : "Selama sesi aktif, admin hanya melihat jumlah peserta dan status sesi tanpa nominal bid."}
                </p>
              </div>

              <SessionMetric label="Pemenang" tone="neutral" value={auction.winner || "-"} />
              <SessionMetric label="Harga final" tone="neutral" value={auction.finalPrice ? currency.format(auction.finalPrice) : "-"} />
            </CardContent>
          </Card>

          <VickreyPaymentPanel auction={auction} />

          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">Daftar Bid</CardTitle>
            </CardHeader>
            <CardContent>
              {showBidRows ? (
                bidRows.length ? (
                  <div className="overflow-x-auto rounded-[1.35rem] border border-[#dce9df]">
                    <table className="w-full min-w-[48rem] text-left">
                      <thead className="bg-[#fff6e5] text-xs uppercase tracking-[0.16em] text-black/45">
                        <tr>
                          <th className="px-4 py-3">Urutan</th>
                          <th className="px-4 py-3">Peserta</th>
                          <th className="px-4 py-3">Nilai bid</th>
                          <th className="px-4 py-3">Waktu</th>
                          <th className="px-4 py-3">Peran</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bidRows.map((bid) => (
                          <tr className="border-t border-[#e0ebe3] text-sm text-black/70" key={bid.id}>
                            <td className="px-4 py-3 font-semibold text-[#8a5b00]">#{bid.rank}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold text-black/85">{bid.bidderName}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-black/38">
                                  ID {bid.bidderId}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/55">
                                Tidak dikirim ke admin
                              </span>
                            </td>
                            <td className="px-4 py-3 text-black/55">{bid.submittedAtLabel}</td>
                            <td className="px-4 py-3">
                              {waitingReveal ? (
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  bid.isRevealed ? "bg-[#eef7f1] text-[#0a6a49]" : "bg-[#fff7dc] text-[#8a5b00]"
                                }`}>
                                  {bid.isRevealed ? "Sudah reveal" : "Belum reveal"}
                                </span>
                              ) : bid.isWinner ? (
                                <span className="inline-flex rounded-full bg-[#eef7f1] px-3 py-1 text-xs font-semibold text-[#0a6a49]">
                                  Pemenang (B1)
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/55">
                                  Peserta
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyPanel text={waitingReveal ? "Deadline lewat, tetapi belum ada commitment bid untuk direveal." : "Deadline sudah lewat, tetapi belum ada bid yang tercatat untuk sesi ini."} />
                )
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-[#ead8b5] bg-[#fffcf7] p-5 text-sm leading-7 text-black/55">
                  Nominal bid tetap terkunci sampai waktu penutupan terlewati.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
