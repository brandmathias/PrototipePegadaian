"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal, flushSync } from "react-dom";
import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Camera,
  CarFront,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Gavel,
  Gem,
  Hash,
  Info,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  Maximize2,
  Medal,
  Megaphone,
  MonitorSmartphone,
  Package2,
  Phone,
  Printer,
  ReceiptText,
  PencilLine,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Target,
  Trophy,
  UserRound,
  UsersRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import { AdminPaginationFooter, useAdminPagination } from "@/components/admin/admin-pagination";
import { AdminSelect, type AdminSelectOption } from "@/components/admin/admin-select";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminMarketingForm } from "@/components/admin-unit/admin-marketing-form";
import { HandoverProofUploadForm } from "@/components/admin-unit/handover-proof-upload-form";
import { AdminUnitActionButton } from "@/components/admin-unit/admin-unit-action-button";
import { CompactTransactionProgress } from "@/components/shared/compact-transaction-progress";
import { LotFigure } from "@/components/shared/lot-figure";
import { MarketingPerformancePanel } from "@/components/shared/marketing-performance-panel";
import { StatusSyncRefresh } from "@/components/shared/status-sync-refresh";
import { TransactionReceiptDocument } from "@/components/shared/transaction-receipt-document";
import {
  printReceiptElementInIsolatedFrame,
  shouldUseIsolatedReceiptPrintFrame,
  TransactionReceiptInlinePrint
} from "@/components/shared/transaction-receipt-inline-print";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LotInsights } from "@/lib/contracts/catalog";
import { getBarangSpecificationRows } from "@/lib/admin-unit/specifications";
import { currency } from "@/lib/formatters/currency";
import { formatAppDateTime } from "@/lib/timezone";
import { cn } from "@/lib/utils";

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
  description?: string;
  unitName?: string | null;
  unitAddress?: string | null;
  status: string;
  mode: string;
  iteration?: number;
  createdAt?: string;
  updatedAt?: string;
  totalIterations?: number;
  iterationHistory?: MarketingSession[];
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
    submittedAtLabel?: string | null;
  }>;
  revealedBidCount?: number;
  pendingRevealCount?: number;
  price?: number | null;
  transactionId?: string | null;
  transactionStatus?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  buyerNationalId?: string | null;
  paymentMethod?: string | null;
  proofUrl?: string | null;
  verifiedBy?: string | null;
  handoverProofUrl?: string | null;
  handoverProofUploadedAt?: string | null;
  handoverProofUploadedBy?: string | null;
  handoverAutoCompleteAt?: string | null;
  completionSource?: string | null;
  reference?: string | null;
  soldAt?: string | null;
  completedAt?: string | null;
  transactionCreatedAt?: string | null;
  paymentDeadline?: string | null;
  insights?: LotInsights | null;
  basePrice?: number | null;
  appraisalValue?: number | null;
  finalPrice?: number | null;
  winner?: string | null;
  visibility?: string;
  specifications?: Record<string, string> | null;
  note?: string;
  bids?: Array<{
    id: string;
    bidderId: string;
    bidderName: string;
    submittedAtLabel: string;
    amount?: number | null;
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

function formatCountdownUnit(value: number) {
  return value > 99 ? String(value) : String(value).padStart(2, "0");
}

function getCountdownParts(targetAt?: string | null) {
  const targetTime = targetAt ? new Date(targetAt).getTime() : Number.NaN;
  if (!Number.isFinite(targetTime)) {
    return { days: "--", hours: "--", minutes: "--", seconds: "--" };
  }

  const diff = Math.max(targetTime - Date.now(), 0);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return {
    days: formatCountdownUnit(days),
    hours: formatCountdownUnit(hours),
    minutes: formatCountdownUnit(minutes),
    seconds: formatCountdownUnit(seconds)
  };
}

function isCountdownExpired(targetAt?: string | null) {
  const targetTime = targetAt ? new Date(targetAt).getTime() : Number.NaN;

  return Number.isFinite(targetTime) && targetTime <= Date.now();
}

function getVickreyHighestBidAmountClass(amountText: string) {
  if (amountText.length >= 10) {
    return "text-[1.72rem] sm:text-[1.86rem] lg:text-[2rem]";
  }

  if (amountText.length >= 8) {
    return "text-[1.92rem] sm:text-[2.08rem] lg:text-[2.2rem]";
  }

  return "text-[2.45rem] sm:text-[2.6rem] lg:text-[2.75rem]";
}

function getVickreyHighestBidDisplay(auction: MarketingSession) {
  if (auction.visibility !== "HASIL_DIBUKA" || typeof auction.finalPrice !== "number") {
    return {
      prefix: "Rp",
      amount: "******",
      amountClass: getVickreyHighestBidAmountClass("******")
    };
  }

  const amount = currency.format(auction.finalPrice).replace(/^Rp\s*/u, "").trim();

  return {
    prefix: "Rp",
    amount,
    amountClass: getVickreyHighestBidAmountClass(amount)
  };
}

function VickreyCountdownGrid({
  onExpired,
  targetAt
}: {
  onExpired?: () => void;
  targetAt?: string | null;
}) {
  const [parts, setParts] = useState(() => ({ days: "--", hours: "--", minutes: "--", seconds: "--" }));

  useEffect(() => {
    let hasNotifiedExpired = false;
    const update = () => {
      setParts(getCountdownParts(targetAt));

      if (!hasNotifiedExpired && isCountdownExpired(targetAt)) {
        hasNotifiedExpired = true;
        onExpired?.();
      }
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [onExpired, targetAt]);

  const items = [
    { label: "Hari", value: parts.days },
    { label: "Jam", value: parts.hours },
    { label: "Menit", value: parts.minutes },
    { label: "Detik", value: parts.seconds }
  ];

  return (
    <div className="grid w-full grid-cols-[3.45rem_0.45rem_3.45rem_0.45rem_3.45rem_0.45rem_3.45rem] items-stretch justify-start gap-1 sm:grid-cols-[3.55rem_0.5rem_3.55rem_0.5rem_3.55rem_0.5rem_3.55rem] sm:gap-1">
      {items.map((item, index) => (
        <Fragment key={item.label}>
          <div
            className="grid h-[3.75rem] w-[3.45rem] min-w-0 place-items-center rounded-[0.9rem] border border-white/14 bg-white/[0.09] px-1 py-1 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:h-[3.95rem] sm:w-[3.55rem] sm:px-1.5 sm:py-1.5"
            data-countdown-tile="true"
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
              <p className="w-full text-center font-headline text-[1.14rem] font-black leading-none text-white tabular-nums [font-variant-numeric:tabular-nums] sm:text-[1.22rem]">
                {item.value}
              </p>
              <p className="w-full text-center text-[0.54rem] font-bold leading-none text-white/78 sm:text-[0.56rem]">
                {item.label}
              </p>
            </div>
          </div>
          {index < items.length - 1 ? (
            <span className="grid h-[3.75rem] w-[0.45rem] place-items-center text-center font-headline text-[1rem] font-black leading-none text-white/82 sm:h-[3.95rem] sm:w-[0.5rem] sm:text-[1.08rem]">
              :
            </span>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}

function VickreyLiveBadge({ status }: { status: string }) {
  const isFailed = status === "GAGAL";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.08em] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
        isFailed
          ? "border border-[#d61f1f]/14 bg-[#fdeeee] text-[#b42318]"
          : "border border-[#0b7a56]/12 bg-[#e9f8ef] text-[#006747]"
      )}
    >
      <span className="relative flex size-2.5">
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-70",
            isFailed ? "bg-[#ef4444]/55" : "bg-[#00a86b]/55"
          )}
        />
        <span className={cn("relative inline-flex size-2.5 rounded-full", isFailed ? "bg-[#d61f1f]" : "bg-[#007a53]")} />
      </span>
      {status === "AKTIF" ? "Live / Berlangsung" : humanize(status)}
    </span>
  );
}

function VickreyAssetNotice({ auction }: { auction: MarketingSession }) {
  return (
    <section className="relative overflow-hidden rounded-[1.45rem] border border-[#d6e6de] bg-[radial-gradient(circle_at_94%_18%,rgba(0,122,83,0.10),transparent_22%),linear-gradient(135deg,#ffffff_0%,#fbfefc_48%,#f4fbf7_100%)] p-4 shadow-[0_22px_58px_-48px_rgba(8,69,50,0.58)]">
      <div className="pointer-events-none absolute inset-y-4 right-4 hidden w-24 rounded-full bg-[#007a53]/[0.06] blur-2xl lg:block" />
      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_0.45fr_0.5fr_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span className="relative grid size-16 shrink-0 place-items-center rounded-[1.3rem] border border-[#cde9db] bg-white text-[#007a53] shadow-[0_16px_34px_-26px_rgba(0,103,71,0.72),inset_0_1px_0_rgba(255,255,255,0.92)]">
            <span className="absolute inset-2 rounded-[1rem] bg-[#e9f8ef]" />
            <LockKeyhole className="relative size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.78rem] font-black uppercase tracking-[0.12em] text-[#0b1f18]">
              Informasi Jaminan Utama
            </p>
            <p className="mt-2 max-w-xl text-[0.84rem] leading-6 text-[#52655d]">
              Data ini bersifat referensi utama dan tidak dapat diubah selama lelang berlangsung.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dce8e2] bg-white/72 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] lg:border-l lg:border-y-0 lg:border-r-0 lg:bg-transparent lg:pl-5 lg:shadow-none">
          <p className="text-[0.72rem] font-semibold text-[#64756e]">Kode Aset</p>
          <p className="mt-2 text-[1.05rem] font-black text-[#006747]">{auction.code || "-"}</p>
        </div>
        <div className="rounded-2xl border border-[#dce8e2] bg-white/72 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] lg:border-l lg:border-y-0 lg:border-r-0 lg:bg-transparent lg:pl-5 lg:shadow-none">
          <p className="text-[0.72rem] font-semibold text-[#64756e]">Nilai Taksiran</p>
          <p className={`mt-2 max-w-full whitespace-nowrap font-black tracking-[-0.03em] text-[#006747] [font-variant-numeric:tabular-nums] ${getCompactCurrencyTextClass(auction.appraisalValue ?? auction.basePrice ?? 0)}`}>
            {currency.format(auction.appraisalValue ?? auction.basePrice ?? 0)}
          </p>
        </div>
        <div className="hidden size-16 place-items-center rounded-[1.2rem] border border-[#d7eadf] bg-white/78 text-[#0b1f18] shadow-[0_16px_34px_-28px_rgba(0,103,71,0.55),inset_0_1px_0_rgba(255,255,255,0.9)] lg:grid">
          <ShieldCheck className="size-8 text-[#1b2a24]" />
        </div>
      </div>
    </section>
  );
}

function getMaskedBidderLabel() {
  return "************";
}

function getBidDisplayRows(auction: MarketingSession, showBidRows: boolean) {
  const bids = Array.isArray(auction.bids) ? auction.bids : [];
  const maskBidderNames = auction.visibility !== "HASIL_DIBUKA";

  if (showBidRows && bids.length) {
    return bids.map((bid, index) => ({
      id: bid.id,
      rank: bid.rank || index + 1,
      bidder: maskBidderNames ? getMaskedBidderLabel() : bid.bidderName?.trim() || `Peserta ${index + 1}`,
      time: bid.submittedAtLabel || "-",
      status: auction.visibility === "MENUNGGU_REVEAL"
        ? bid.isRevealed
          ? "Sudah reveal"
          : "Belum reveal"
        : bid.isWinner
          ? "Pemenang (B1)"
          : "Peserta",
      tone: auction.visibility === "MENUNGGU_REVEAL"
        ? bid.isRevealed
          ? "green"
          : "amber"
        : bid.isWinner
          ? "green"
          : "neutral"
    }));
  }

  const previewRows = auction.participantPreviews ?? [];
  const lockedCount = Math.min(Math.max(Number(auction.participants ?? 0), previewRows.length, 0), 5);
  return Array.from({ length: lockedCount }, (_, index) => ({
    id: `locked-${auction.id}-${index}`,
    rank: index + 1,
    bidder: maskBidderNames ? getMaskedBidderLabel() : previewRows[index]?.bidderName?.trim() || `Peserta ${index + 1}`,
    time: previewRows[index]?.submittedAtLabel || "-",
    status: index === 0 ? "Tertinggi" : "-",
    tone: index === 0 ? "green" : "neutral"
  }));
}

function BidStatusPill({ status, tone }: { status: string; tone: string }) {
  const style =
    tone === "green"
      ? "bg-[#e9f8ef] text-[#007a53]"
      : tone === "amber"
        ? "bg-[#fff4d7] text-[#8a5b00]"
        : "bg-slate-100 text-slate-500";

  return (
    <span
      className={`inline-flex max-w-full items-center justify-center rounded-full px-2 py-1 text-center text-[0.52rem] font-black uppercase leading-none tracking-[0.04em] whitespace-nowrap sm:text-[0.56rem] ${style}`}
    >
      {status.toLowerCase() === "tertinggi" ? <BadgeCheck className="mr-1 size-3 shrink-0" /> : null}
      <span className="min-w-0 whitespace-nowrap">{status}</span>
    </span>
  );
}

function VickreyBidLogTable({
  auction,
  showBidRows
}: {
  auction: MarketingSession;
  showBidRows: boolean;
}) {
  const rows = getBidDisplayRows(auction, showBidRows);

  return (
    <section className="overflow-hidden rounded-[1.45rem] border border-[#dfe9e3] bg-white shadow-[0_18px_48px_-42px_rgba(8,69,50,0.38)]">
      <div className="border-b border-[#e7eee9] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-headline text-[1rem] font-black uppercase tracking-[0.02em] text-[#0b1f18]">
            Riwayat Penawaran (Bid Log)
          </h3>
        </div>
      </div>

      {rows.length ? (
        <>
          <div className="overflow-hidden transform-gpu transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <table className="w-full table-fixed text-left">
              <colgroup>
                <col className="w-[6%]" />
                <col className="w-[25%]" />
                <col className="w-[30%]" />
                <col className="w-[21%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="bg-[#f8faf9] text-[0.66rem] font-black text-[#566861] sm:text-[0.7rem]">
                <tr>
                  <th className="px-3 py-3">#</th>
                  <th className="px-2.5 py-3">Nama Penawar</th>
                  <th className="px-2.5 py-3">Waktu Penawaran</th>
                  <th className="px-2.5 py-3">Nominal Penawaran</th>
                  <th className="px-2.5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    className={`transform-gpu border-t border-[#edf2ee] text-sm opacity-100 transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform hover:-translate-y-[1px] hover:shadow-[inset_3px_0_0_#007a53] ${
                      index === 0 ? "bg-[#f1fbf5]/65" : "bg-white"
                    }`}
                    key={row.id}
                    style={{ transitionDelay: `${Math.min(index, 4) * 45}ms` }}
                  >
                    <td className="px-3 py-3 font-black text-[#007a53]">{row.rank}</td>
                    <td className="max-w-0 overflow-hidden px-2.5 py-3 font-bold text-[#14241e]">
                      <span className="block truncate">{row.bidder}</span>
                    </td>
                    <td className="max-w-0 overflow-hidden px-2.5 py-3 text-[0.72rem] leading-4 text-[#52655d] sm:text-[0.78rem] sm:leading-5">
                      <span className="block truncate whitespace-nowrap">{row.time}</span>
                    </td>
                    <td className="max-w-0 overflow-hidden px-2.5 py-3 font-black text-[#14241e]">
                      <span className="block truncate">Rp ********</span>
                    </td>
                    <td className="max-w-0 overflow-hidden px-1.5 py-3 sm:px-2">
                      <BidStatusPill status={row.status} tone={row.tone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[#edf2ee] px-4 py-3 text-xs font-semibold text-[#64756e]">
            <span>Total {auction.participants ?? rows.length} penawaran</span>
            <div className="flex gap-1.5">
              <span className="grid size-7 place-items-center rounded-full border border-[#dfe9e3] text-[#98a7a0]">1</span>
              <span className="grid size-7 place-items-center rounded-full border border-[#dfe9e3] text-[#98a7a0]">2</span>
              <span className="grid size-7 place-items-center rounded-full border border-[#dfe9e3] text-[#98a7a0]">3</span>
            </div>
          </div>
        </>
      ) : (
        <div className="p-4">
          <div className="relative min-h-[9.5rem] overflow-hidden rounded-[1.2rem] border border-dashed border-[#cfe0d8] bg-[radial-gradient(circle_at_50%_0%,rgba(0,122,83,0.08),transparent_42%),linear-gradient(135deg,#ffffff_0%,#fbfdfb_100%)] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] transform-gpu transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div className="pointer-events-none absolute inset-x-10 top-1/2 h-px bg-[linear-gradient(90deg,transparent,rgba(0,122,83,0.18),transparent)]" />
            <div className="relative mx-auto flex max-w-[33rem] flex-col items-center text-center">
              <div className="relative grid size-16 place-items-center rounded-[1.25rem] border border-[#d8efe3] bg-white text-[#007a53] shadow-[0_18px_36px_-30px_rgba(0,103,71,0.72),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <span className="absolute inset-2 rounded-[0.95rem] bg-[#f0fbf5]" />
                <ReceiptText className="relative size-6" />
              </div>
              <p className="mt-4 font-headline text-[1.05rem] font-black text-[#10231b]">
                Belum ada penawaran masuk
              </p>
              <p className="mt-2 max-w-[30rem] text-sm leading-6 text-[#64756e]">
                Belum ada penawaran yang tercatat pada sesi lelang ini. Bid akan tampil otomatis saat buyer mengirim penawaran.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#8a9891]">
                <span className="size-1.5 rounded-full bg-[#007a53]" />
                Live bid monitor
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function VickreySpecificationPanel({ auction }: { auction: MarketingSession }) {
  const rows = getBarangSpecificationRows(auction.category ?? "", auction.specifications ?? {});
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const description = auction.description?.trim() || "Deskripsi barang belum tercatat pada data jaminan ini.";

  return (
    <section className="relative overflow-hidden rounded-[1.45rem] border border-[#d7e7df] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)] shadow-[0_22px_58px_-48px_rgba(8,69,50,0.36)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#007a53_0%,#cfeee0_44%,transparent_100%)]" />
      <div className="px-5 pb-2 pt-4">
        <div>
          <p className="text-[0.76rem] font-black uppercase tracking-[0.09em] text-[#10231b]">
            Deskripsi Barang
          </p>
          <p className="mt-1.5 text-[0.72rem] font-semibold text-[#64756e]">
            Ringkasan kondisi dan konteks jaminan
          </p>
        </div>
      </div>
      <div className="px-4 pb-4 pt-2">
        <div className="relative overflow-hidden rounded-[1.15rem] border border-[#dbe9e2] bg-[radial-gradient(circle_at_95%_0%,rgba(0,122,83,0.08),transparent_30%),linear-gradient(135deg,#ffffff_0%,#fbfdfb_100%)] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <p className="line-clamp-3 text-justify text-[0.92rem] font-semibold leading-7 text-[#24352e]">
            {description}
          </p>

          <div className="mt-3 flex justify-end">
            <button
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#007a53]/18 bg-[#007a53] px-4 text-[0.78rem] font-black text-white shadow-[0_14px_28px_-20px_rgba(0,103,71,0.75)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#006747] active:scale-[0.98]"
              onClick={() => setIsDetailOpen(true)}
              type="button"
            >
              Lihat detail
              <span className="grid size-6 place-items-center rounded-full bg-white/14 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5">
                <ArrowRight className="size-3.5" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {isDetailOpen ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto overscroll-contain bg-[#10231b]/42 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 sm:py-6">
          <div className="modal-viewport my-auto w-full max-w-3xl overflow-hidden rounded-[1.35rem] border border-[#d7e7df] bg-white shadow-[0_32px_90px_-44px_rgba(8,69,50,0.62)] sm:rounded-[1.6rem]">
            <div className="flex items-start justify-between gap-4 border-b border-[#edf2ee] px-5 py-4">
              <div>
                <p className="text-[0.76rem] font-black uppercase tracking-[0.1em] text-[#10231b]">
                  Detail Barang
                </p>
                <p className="mt-1.5 text-[0.78rem] font-semibold text-[#64756e]">
                  Deskripsi lengkap dan data teknis asli barang jaminan
                </p>
              </div>
              <button
                aria-label="Tutup detail spesifikasi"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-[#dbe9e2] bg-white text-[#52655d] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:text-[#10231b] active:scale-[0.98]"
                onClick={() => setIsDetailOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="max-h-[min(70dvh,calc(100dvh-9rem))] overflow-y-auto p-4 sm:p-5">
              <div className="mb-4 rounded-[1.15rem] border border-[#dbe9e2] bg-[linear-gradient(135deg,#ffffff_0%,#fbfdfb_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#8a9891]">
                  Deskripsi Barang
                </p>
                <p className="mt-2 text-justify text-[0.95rem] font-semibold leading-7 text-[#24352e]">
                  {description}
                </p>
              </div>

              {rows.length ? (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#10231b]">
                      Spesifikasi Teknis
                    </p>
                    <span className="rounded-full border border-[#d8efe3] bg-[#f2fbf6] px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-[#007a53]">
                      {rows.length} Data
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                  {rows.map((row, index) => (
                    <div
                      className="relative min-h-[6rem] overflow-hidden rounded-[1.05rem] border border-[#dbe9e2] bg-white px-4 py-3.5 shadow-[0_18px_38px_-34px_rgba(8,69,50,0.42),inset_0_1px_0_rgba(255,255,255,0.9)] even:bg-slate-50/55"
                      key={`${row.label}-${row.value}`}
                    >
                      <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#cfe8db]" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#8a9891]">
                            {String(index + 1).padStart(2, "0")}
                          </p>
                          <p className="mt-1.5 text-[0.78rem] font-bold leading-5 text-[#52655d]">{row.label}</p>
                        </div>
                        <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[#007a53]/50" />
                      </div>
                      <p className="mt-3 min-w-0 break-words text-[0.94rem] font-black leading-6 text-[#10231b]">
                        {row.value || "-"}
                      </p>
                    </div>
                  ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.15rem] border border-dashed border-[#d6e2dc] bg-[linear-gradient(135deg,#ffffff_0%,#fbfdfb_100%)] px-5 py-6">
                  <p className="font-headline text-[1rem] font-black text-[#10231b]">
                    Spesifikasi barang belum tercatat
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-[#64756e]">
                    Panel ini hanya menampilkan spesifikasi asli yang tersimpan pada data barang.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function isMarketingVideoMedia(media: MarketingMedia | null | undefined) {
  if (!media) {
    return false;
  }
  return media.type === "video" || /\.(mp4|mov|webm|mkv)$/i.test(media.url);
}

function revealVideoPreviewFrame(event: SyntheticEvent<HTMLVideoElement>) {
  const video = event.currentTarget;
  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    return;
  }

  try {
    video.currentTime = Math.min(0.2, video.duration / 4);
  } catch {
    // Some browsers block seeking before enough metadata is available.
  }
}

function VickreyMediaManifest({ auction }: { auction: MarketingSession }) {
  const media = auction.media ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const activeMedia = media[Math.min(activeIndex, Math.max(media.length - 1, 0))] ?? null;
  const activeIsVideo = isMarketingVideoMedia(activeMedia);

  return (
    <section className="overflow-hidden rounded-[1.45rem] border border-[#d7e7df] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)] p-2.5 shadow-[0_22px_58px_-48px_rgba(8,69,50,0.36)]">
      <div className="mb-1 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[0.76rem] font-black uppercase tracking-[0.08em] text-[#1b2a24]">
            Manifes Fisik & Media Aset
          </p>
          <p className="mt-1 text-[0.74rem] font-semibold text-[#64756e]">Preview Utama</p>
        </div>
        <span className="hidden rounded-full border border-[#d8efe3] bg-[#f2fbf6] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#007a53] sm:inline-flex">
          {media.length || 0} Media
        </span>
      </div>

      <div className="relative rounded-[1.15rem] border border-dashed border-[#b8dcca] bg-white p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <button
          aria-label="Buka preview penuh media barang"
          className="absolute right-5 top-5 z-[2] grid size-9 place-items-center rounded-full bg-white/92 text-[#10231b] shadow-[0_12px_28px_-18px_rgba(8,69,50,0.62)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
          onClick={() => setIsFullscreenOpen(true)}
          type="button"
        >
          <Maximize2 className="size-4" />
        </button>
        <div className="relative aspect-[16/6.65] w-full overflow-hidden rounded-[0.95rem] bg-[#f6f2eb]">
          {activeMedia ? (
            activeIsVideo ? (
              <video
                className="size-full object-cover"
                muted
                onLoadedMetadata={revealVideoPreviewFrame}
                playsInline
                preload="metadata"
                src={activeMedia.url}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`Preview utama ${auction.lot}`} className="size-full object-cover" src={activeMedia.url} />
            )
          ) : (
            <div className="flex size-full items-center justify-center bg-[#f6f8f5] text-sm font-semibold text-[#8a9891]">
              Media barang belum tersedia
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,36,25,0.10)_0%,transparent_34%,rgba(4,36,25,0.12)_100%)]" />
        </div>
      </div>

      {media.length > 1 ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="grid flex-1 grid-cols-5 gap-2">
            {media.slice(0, 5).map((item, index) => {
              const isVideo = isMarketingVideoMedia(item);
              const active = index === activeIndex;

              return (
                <button
                  aria-label={`Lihat media ${index + 1}`}
                  className={`aspect-square overflow-hidden rounded-xl border bg-white p-0.5 shadow-[0_12px_26px_-24px_rgba(8,69,50,0.44)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 ${
                    active ? "border-[#007a53] ring-2 ring-[#d8efe3]" : "border-[#e4ece7]"
                  }`}
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  {isVideo ? (
                    <video
                      className="size-full rounded-[0.6rem] bg-[#0b1d15] object-cover"
                      muted
                      onLoadedMetadata={revealVideoPreviewFrame}
                      playsInline
                      preload="metadata"
                      src={item.url}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={item.fileName || `Media ${index + 1}`} className="size-full rounded-[0.6rem] object-cover" src={item.url} />
                  )}
                </button>
              );
            })}
          </div>
          <button
            aria-label="Lihat media berikutnya"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#174e3b] shadow-[0_14px_32px_rgba(8,69,50,0.08)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
            onClick={() => setActiveIndex((current) => (current + 1) % media.length)}
            type="button"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : null}

      {isFullscreenOpen && activeMedia
        ? createPortal(
            <div
              aria-modal="true"
              className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#081b14]/72 px-3 py-3 backdrop-blur-md sm:px-6 sm:py-6"
              onClick={() => setIsFullscreenOpen(false)}
              role="dialog"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,184,93,0.16),transparent_36%)]" />
              <div
                className="modal-viewport relative z-[141] my-auto w-full max-w-6xl rounded-[2rem] border border-white/28 bg-[linear-gradient(180deg,rgba(248,246,239,0.96),rgba(255,255,255,0.92))] p-2 shadow-[0_48px_120px_-40px_rgba(3,21,14,0.82)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] border border-black/5 bg-[#fbfbf8]">
                  <div className="flex items-start justify-between gap-4 border-b border-black/6 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <p className="font-body text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#8d6c08]">
                        Media Barang
                      </p>
                      <h3 className="mt-1 truncate font-headline text-[1.35rem] font-black tracking-tight text-[#13211c]">
                        {activeMedia.fileName || `Media ${activeIndex + 1}`}
                      </h3>
                    </div>
                    <button
                      aria-label="Tutup preview media barang"
                      className="grid size-11 shrink-0 place-items-center rounded-full border border-black/8 bg-white text-primary transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f5f7f2] active:scale-[0.97]"
                      onClick={() => setIsFullscreenOpen(false)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="bg-[linear-gradient(180deg,#f7f8f4,#eef1ea)] p-3 sm:p-4">
                    <div className="overflow-hidden rounded-[1.5rem] border border-black/6 bg-white shadow-[0_24px_60px_-36px_rgba(8,69,50,0.28)]">
                      {activeIsVideo ? (
                        <video
                          aria-label="Preview penuh video barang"
                          className="media-preview-frame w-full bg-[#0d1712] object-contain"
                          controls
                          key={activeMedia.id}
                          playsInline
                          src={activeMedia.url}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt="Preview penuh media barang"
                          className="media-preview-frame w-full bg-[#f8f8f5] object-contain"
                          src={activeMedia.url}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}

function VickreyActivityPanel({
  auction,
  onCountdownExpired
}: {
  auction: MarketingSession;
  onCountdownExpired?: () => void;
}) {
  const countdownTarget = auction.visibility === "MENUNGGU_REVEAL" ? auction.revealDeadlineAt : auction.endingAt;
  const highestBid = getVickreyHighestBidDisplay(auction);

  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-[#0b7a56]/18 bg-[radial-gradient(circle_at_top_left,rgba(36,197,117,0.18),transparent_34%),linear-gradient(135deg,#073a2a_0%,#006747_52%,#043c2c_100%)] p-6 text-white shadow-[0_28px_70px_-44px_rgba(0,63,42,0.72)]">
      <span className="sr-only">Nominal bid tetap tersembunyi sampai deadline selesai.</span>
      {auction.visibility === "MENUNGGU_REVEAL" ? (
        <span className="sr-only">Menunggu buyer reveal nominal.</span>
      ) : null}
      <div className="flex items-center gap-2">
        <span className="size-3 rounded-full bg-[#52d45d] shadow-[0_0_0_5px_rgba(82,212,93,0.12)]" />
        <p className="text-[0.83rem] font-black uppercase tracking-[0.03em] text-white/88">
          Aktivitas Lelang Live
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,0.74fr)_minmax(0,1.06fr)] md:items-center">
        <div className="min-w-0">
          <p className="text-[0.76rem] font-black uppercase tracking-[0.03em] text-white/82">
            Penawaran Tertinggi Saat Ini
          </p>
          <div className="mt-5 flex min-w-0 items-end gap-2 whitespace-nowrap">
            <span className="shrink-0 font-headline text-[1.5rem] font-black leading-none tracking-tight text-white sm:text-[1.7rem]">
              {highestBid.prefix}
            </span>
            <span
              className={`min-w-0 font-headline font-black leading-none tracking-tight text-white [font-variant-numeric:tabular-nums] ${highestBid.amountClass}`}
            >
              {highestBid.amount}
            </span>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 text-[0.86rem] font-semibold text-white/82">
            oleh ************
            <CheckCircle2 className="size-4 rounded-full bg-[#20bd6b] text-white" />
          </p>
        </div>

        <div className="border-t border-white/14 pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <p className="mb-4 text-[0.76rem] font-black uppercase tracking-[0.03em] text-white/82">
            Waktu Tersisa
          </p>
          <VickreyCountdownGrid onExpired={onCountdownExpired} targetAt={countdownTarget} />
        </div>
      </div>

      <div className="mt-6 border-t border-white/14 pt-4 text-sm text-white/80">
        <p className="inline-flex items-center gap-2">
          <CalendarDays className="size-4 text-white/56" />
          Batas Akhir Lelang: <span className="font-semibold text-white">{dateLabel(auction.endingAt)}</span>
        </p>
      </div>
    </section>
  );
}

const VICKREY_PAYMENT_STATUSES = new Set([
  "MENUNGGU_PEMBAYARAN",
  "BUKTI_DIUNGGAH",
  "DITOLAK_BUKTI",
  "MENUNGGU_KONFIRMASI_LANGSUNG"
]);

function getVickreyStage(auction: MarketingSession) {
  const transactionStatus = auction.transactionStatus ?? "";

  if (isFailedAuction(auction)) {
    return {
      label: getAuctionFailureReason(auction),
      detail: "Detail barang bisa dievaluasi lalu dijadwalkan untuk dipasarkan ulang.",
      tone: "neutral" as const,
      icon: AlertTriangle
    };
  }

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

  if (transactionStatus === "SELESAI") {
    return {
      label: isAutoCompletedMarketing(auction) ? "Selesai otomatis" : "Selesai",
      detail: isAutoCompletedMarketing(auction)
        ? "Sistem menutup transaksi otomatis setelah masa konfirmasi serah-terima berakhir tanpa komplain."
        : "Buyer sudah menekan Pembelian Selesai dan arsip transaksi tersedia.",
      tone: "green" as const,
      icon: BadgeCheck
    };
  }

  if (transactionStatus === "LUNAS") {
    return {
      label: "Terverifikasi",
      detail: getMarketingVerifiedDetail(auction),
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
    detail: "Pemenang dan harga akhir sudah bisa ditinjau.",
    tone: "green" as const,
    icon: ShieldCheck
  };
}

function getVickreySummary(auctions: MarketingSession[]) {
  return {
    active: auctions.filter((auction) => auction.visibility === "TERKUNCI").length,
    pendingReveal: auctions.filter((auction) => auction.visibility === "MENUNGGU_REVEAL").length,
    revealed: auctions.filter((auction) => auction.visibility === "HASIL_DIBUKA").length,
    paymentQueue: auctions.filter((auction) => isPaymentQueue(auction)).length,
    completed: auctions.filter((auction) => auction.transactionStatus === "SELESAI").length
  };
}

const MARKETING_METHOD_FILTERS = [
  { label: "Semua", value: "ALL" },
  { label: "Harga Tetap", value: "FIXED_PRICE" },
  { label: "Lelang Tertutup", value: "VICKREY_AUCTION" }
] as const;

const MARKETING_STATUS_FILTERS = ["Semua", "Aktif", "Menunggu Bayar", "Menunggu Buyer", "Selesai", "Gagal"] as const;

type MarketingMethodFilter = (typeof MARKETING_METHOD_FILTERS)[number]["value"];
type MarketingStatusFilter = (typeof MARKETING_STATUS_FILTERS)[number];

function isAutoCompletedMarketing(auction: Pick<MarketingSession, "completionSource">) {
  return auction.completionSource === "auto_handover_grace";
}

function getMarketingCompletionLabel(auction: Pick<MarketingSession, "completionSource">) {
  return isAutoCompletedMarketing(auction) ? "Selesai otomatis" : "Selesai oleh buyer";
}

function getMarketingProgressCompletionLabel(auction: Pick<MarketingSession, "completionSource">) {
  return isAutoCompletedMarketing(auction) ? "Selesai otomatis" : "Selesai";
}

function getMarketingVerifiedDetail(auction: Pick<MarketingSession, "handoverAutoCompleteAt">) {
  if (auction.handoverAutoCompleteAt) {
    return `Menunggu buyer menekan Pembelian Selesai. Auto-selesai pada ${dateLabel(auction.handoverAutoCompleteAt)}.`;
  }

  return "Pembayaran sudah diverifikasi. Menunggu buyer menekan Pembelian Selesai.";
}

function isPaymentQueue(auction: MarketingSession) {
  return auction.mode === "VICKREY_AUCTION" && VICKREY_PAYMENT_STATUSES.has(auction.transactionStatus ?? "");
}

function isMarketingActive(auction: MarketingSession) {
  return auction.status === "AKTIF";
}

function isMarketingSold(auction: MarketingSession) {
  if (auction.transactionStatus) {
    return auction.transactionStatus === "SELESAI";
  }

  return (
    auction.status === "SELESAI" ||
    Boolean(auction.soldAt)
  );
}

function hasFixedPricePaymentSubmission(auction: MarketingSession) {
  const transactionStatus = auction.transactionStatus ?? "";

  return (
    hasFixedPricePaymentProof(auction) ||
    transactionStatus === "BUKTI_DIUNGGAH" ||
    transactionStatus === "LUNAS" ||
    transactionStatus === "SELESAI" ||
    Boolean(auction.soldAt)
  );
}

function hasFixedPricePaymentProof(auction: MarketingSession) {
  return Boolean(auction.proofUrl);
}

function hasFixedPriceVerificationReady(auction: MarketingSession) {
  return Boolean(auction.transactionId) && auction.transactionStatus === "BUKTI_DIUNGGAH";
}

function getFixedPriceWorkflowStatus(auction: MarketingSession) {
  if (auction.transactionStatus === "LUNAS") {
    return "Menunggu Buyer";
  }

  return isMarketingSold(auction) ? "Selesai" : "Aktif";
}

function getFixedPriceOperationalNote(auction: MarketingSession) {
  if (isMarketingSold(auction)) {
    return "Pembelian harga tetap selesai";
  }

  if (auction.transactionStatus === "LUNAS") {
    return "Menunggu buyer menyelesaikan pembelian";
  }

  if (hasFixedPricePaymentSubmission(auction)) {
    return "Pembelian harga tetap tercatat";
  }

  return "Menunggu pembeli dari katalog";
}

function getFixedPriceVisibleBuyerName(auction: MarketingSession) {
  if (!hasFixedPricePaymentSubmission(auction)) {
    return null;
  }

  return auction.buyerName ?? null;
}

function isFailedAuction(auction: MarketingSession) {
  return (
    (auction.mode === "VICKREY_AUCTION" && auction.status === "GAGAL") ||
    (auction.mode === "VICKREY_AUCTION" &&
      auction.visibility === "HASIL_DIBUKA" &&
      !auction.transactionId &&
      !auction.winner)
  );
}

function getAuctionFailureReason(auction: MarketingSession) {
  if (auction.transactionStatus === "GAGAL" || auction.winner || auction.buyerName) {
    return "Pemenang gagal bayar 24 jam";
  }

  return "Tidak ada peserta";
}

function getMarketingWorkflowStatus(auction: MarketingSession) {
  if (auction.mode === "FIXED_PRICE") {
    return getFixedPriceWorkflowStatus(auction);
  }
  if (isFailedAuction(auction)) {
    return "Gagal";
  }
  if (auction.transactionStatus === "LUNAS") {
    return "Menunggu Buyer";
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

function getVickreyWinnerWorkspaceHref(auction: MarketingSession) {
  return `/admin/pemasaran/vickrey-auction/${auction.id}`;
}

function getMarketingDetailHref(auction: MarketingSession) {
  return auction.mode === "VICKREY_AUCTION"
    ? `/admin/pemasaran/vickrey-auction/${auction.id}`
    : `/admin/pemasaran/fixed-price/${auction.id}`;
}

function getMarketingAction(auction: MarketingSession) {
  if (isFailedAuction(auction)) {
    return {
      href: getMarketingDetailHref(auction),
      label: "Lihat Detail",
      variant: "default" as const
    };
  }

  if (auction.mode === "VICKREY_AUCTION" && auction.transactionId && isPaymentQueue(auction)) {
    return {
      href: getMarketingDetailHref(auction),
      label: "Lihat Detail",
      variant: "secondary" as const
    };
  }

  if (auction.mode === "VICKREY_AUCTION" && isVickreyPaymentFulfilled(auction)) {
    return {
      href: getMarketingDetailHref(auction),
      label: "Lihat Detail",
      variant: "secondary" as const
    };
  }

  if (auction.mode === "VICKREY_AUCTION") {
    return {
      href: getMarketingDetailHref(auction),
      label: "Lihat Detail",
      variant: "default" as const
    };
  }

  return {
    href: getMarketingDetailHref(auction),
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
  tone: "emerald" | "orange" | "violet" | "red";
  value: string;
}) {
  const toneClasses = {
    emerald:
      "border-[#dbece1] bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_64%,#f2faf5_100%)] text-[#006747] dark:border-emerald-300/14 dark:bg-[linear-gradient(135deg,#101a15_0%,#101a15_64%,rgba(24,88,61,0.24)_100%)] dark:text-emerald-200",
    orange:
      "border-[#f1e1ca] bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_64%,#fff8ed_100%)] text-[#d16b00] dark:border-amber-300/16 dark:bg-[linear-gradient(135deg,#101a15_0%,#101a15_64%,rgba(128,74,18,0.22)_100%)] dark:text-amber-200",
    violet:
      "border-[#e5ddf4] bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_64%,#f7f4ff_100%)] text-[#6152de] dark:border-violet-300/16 dark:bg-[linear-gradient(135deg,#101a15_0%,#101a15_64%,rgba(80,67,167,0.22)_100%)] dark:text-violet-200",
    red:
      "border-[#f2d7d7] bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_64%,#fff4f4_100%)] text-[#b42318] dark:border-red-300/16 dark:bg-[linear-gradient(135deg,#101a15_0%,#101a15_64%,rgba(138,36,36,0.22)_100%)] dark:text-red-200"
  }[tone];

  const iconClasses = {
    emerald: "bg-[#ecf8f0] dark:bg-emerald-300/10",
    orange: "bg-[#fff2e4] dark:bg-amber-300/10",
    violet: "bg-[#f0ecff] dark:bg-violet-300/10",
    red: "bg-[#fff1f1] dark:bg-red-300/10"
  }[tone];

  return (
    <article
      className={`relative overflow-hidden rounded-[1.35rem] border p-4 shadow-[0_20px_52px_-46px_rgba(8,69,50,0.34)] dark:shadow-[0_22px_58px_-42px_rgba(0,0,0,0.72)] ${toneClasses}`}
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
    </article>
  );
}

function MarketingFeedRow({ auction }: { auction: MarketingSession }) {
  const media = toBuyerMedia(auction.media ?? []);
  const action = getMarketingAction(auction);
  const workflowStatus = getMarketingWorkflowStatus(auction);
  const CategoryIcon = getMarketingCategoryIcon(auction.category);
  const visibleBuyerName = auction.mode === "FIXED_PRICE" ? getFixedPriceVisibleBuyerName(auction) : auction.buyerName;
  const failureReason = isFailedAuction(auction) ? getAuctionFailureReason(auction) : null;
  const statusDotClass =
    workflowStatus === "Aktif"
      ? "bg-[#0fa35a]"
      : workflowStatus === "Menunggu Bayar"
        ? "bg-[#d89b12]"
        : workflowStatus === "Gagal"
          ? "bg-[#d61f1f]"
          : "bg-slate-400";
  const modeLabel = auction.mode === "VICKREY_AUCTION" ? "Lelang Tertutup" : "Harga Tetap";
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
          {(auction.totalIterations ?? 0) > 1 ? (
            <span className="rounded-full bg-[#f4f7f4] px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#40558b] ring-1 ring-[#d9e7df] dark:bg-white/[0.045] dark:text-slate-300 dark:ring-white/10">
              Iterasi {auction.iteration ?? auction.totalIterations}/{auction.totalIterations}
            </span>
          ) : null}
        </div>

        <div className="mt-3">
          <h3 className="font-headline text-[1.4rem] font-black leading-tight tracking-[-0.035em] text-[#121c17] transition duration-500 group-hover:text-[#006747] dark:text-slate-100 dark:group-hover:text-emerald-200">
            {auction.lot}
          </h3>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-black/52 dark:text-slate-300/68">
            <CategoryIcon className="size-4 text-[#006747] dark:text-emerald-200" />
            {auction.category ? humanize(auction.category) : "Kategori belum diisi"}
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
              {failureReason ||
                visibleBuyerName ||
                auction.winner ||
                (auction.mode === "VICKREY_AUCTION" ? "Bid masih tertutup" : "Belum ada pembeli")}
            </p>
            <p className="mt-0.5">
              {failureReason
                ? "Buka detail untuk jadwalkan pasarkan ulang"
                : auction.finalPrice
                ? `${currency.format(auction.finalPrice)} harga akhir`
                : (auction.totalIterations ?? 0) > 1
                  ? `Riwayat ${auction.totalIterations} sesi pemasaran`
                  : auction.mode === "VICKREY_AUCTION"
                  ? `${auction.participants ?? 0} penawaran tercatat`
                  : getFixedPriceOperationalNote(auction)}
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

function getMarketingSessionTimestamp(auction: MarketingSession) {
  const value = auction.updatedAt ?? auction.createdAt ?? auction.startsAt ?? auction.endingAt ?? auction.soldAt;
  const time = value ? new Date(value).getTime() : Number.NaN;

  return Number.isFinite(time) ? time : 0;
}

function getMarketingIterationNumber(auction: MarketingSession) {
  return typeof auction.iteration === "number" && Number.isFinite(auction.iteration) ? auction.iteration : 0;
}

function compareMarketingRecency(left: MarketingSession, right: MarketingSession) {
  const timestampDiff = getMarketingSessionTimestamp(right) - getMarketingSessionTimestamp(left);
  if (timestampDiff !== 0) {
    return timestampDiff;
  }

  return getMarketingIterationNumber(right) - getMarketingIterationNumber(left);
}

function buildLatestMarketingFeedItems(auctions: MarketingSession[]) {
  const groups = new Map<string, MarketingSession[]>();

  for (const auction of auctions) {
    const key = auction.lotId || auction.id;
    const collection = groups.get(key) ?? [];
    collection.push(auction);
    groups.set(key, collection);
  }

  return Array.from(groups.values())
    .map((group) => {
      const sortedHistory = [...group].sort(compareMarketingRecency);
      const latest = sortedHistory[0];

      return {
        ...latest,
        totalIterations: sortedHistory.length,
        iterationHistory: sortedHistory
      };
    })
    .sort(compareMarketingRecency);
}

function getMarketingSearchValues(auction: MarketingSession) {
  const history = auction.iterationHistory?.length ? auction.iterationHistory : [auction];

  return [
    auction.lot,
    auction.code,
    auction.id,
    auction.category,
    auction.condition,
    ...history.flatMap((entry) => [
      entry.id,
      entry.code,
      getMarketingWorkflowStatus(entry),
      isFailedAuction(entry) ? getAuctionFailureReason(entry) : null,
      entry.winner,
      entry.buyerName
    ])
  ];
}

function getMarketingIterationDateLabel(auction: MarketingSession) {
  return getMarketingTimeValue(auction).replace(/\.(?=\d{2}\s*WIB)/u, ":").toUpperCase();
}

function getMarketingIterationSummary(auction: MarketingSession) {
  if (isFailedAuction(auction)) {
    return getAuctionFailureReason(auction);
  }

  if (auction.mode === "VICKREY_AUCTION") {
    if (auction.winner || auction.buyerName) {
      return `${auction.winner || auction.buyerName} - ${auction.finalPrice ? currency.format(auction.finalPrice) : "hasil dibuka"}`;
    }

    if (auction.visibility === "TERKUNCI") {
      return `${auction.participants ?? 0} peserta tercatat`;
    }

    return auction.note || "Hasil lelang sudah dibuka";
  }

  return auction.buyerName || getFixedPriceOperationalNote(auction);
}

function MarketingIterationHistoryPanel({ auction }: { auction: MarketingSession }) {
  const router = useRouter();
  const history = useMemo(() => {
    const rows = auction.iterationHistory?.length ? auction.iterationHistory : [auction];
    const uniqueRows = new Map<string, MarketingSession>();

    for (const row of rows) {
      uniqueRows.set(row.id, row);
    }

    return Array.from(uniqueRows.values()).sort(compareMarketingRecency);
  }, [auction]);
  const [selectedIterationId, setSelectedIterationId] = useState(() => auction.id);

  useEffect(() => {
    setSelectedIterationId(auction.id);
  }, [auction.id]);

  const handleIterationChange = useCallback(
    (nextId: string) => {
      const nextIteration = history.find((entry) => entry.id === nextId);
      if (!nextIteration) {
        return;
      }

      setSelectedIterationId(nextId);

      if (nextIteration.id !== auction.id) {
        router.push(getMarketingDetailHref(nextIteration));
      }
    },
    [auction.id, history, router]
  );

  if (history.length <= 1) {
    return null;
  }

  const selectedIteration = history.find((entry) => entry.id === selectedIterationId) ?? history[0];
  const latestIterationId = history[0]?.id;
  const selectedStatus = getMarketingWorkflowStatus(selectedIteration);
  const selectedFailed = selectedStatus === "Gagal";
  const selectedSettled = selectedStatus === "Selesai" || selectedStatus === "Menunggu Buyer";
  const selectedActive = selectedStatus === "Aktif" || selectedStatus === "Menunggu Bayar";
  const iterationOptions: AdminSelectOption[] = history.map((entry, index) => ({
    value: entry.id,
    label: `Iterasi ${entry.iteration ?? history.length - index}${entry.id === latestIterationId ? " (Terkini)" : ""}`
  }));

  return (
    <section className="overflow-hidden rounded-[1.15rem] border border-[#d8e8dd] border-l-[5px] border-l-[#008f4a] bg-white px-5 py-5 shadow-[0_22px_58px_-42px_rgba(15,23,42,0.28)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] print:hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#006747]">
            Riwayat Iterasi Pemasaran
          </p>
          <h2 className="mt-2 font-headline text-[1.48rem] font-black leading-none text-[#13211c]">
            {auction.lot}
          </h2>
        </div>
        <AdminSelect
          ariaLabel="Pilih iterasi pemasaran"
          className="w-full sm:w-[13.75rem] [&_.admin-select-trigger]:h-11 [&_.admin-select-trigger]:rounded-[0.72rem] [&_.admin-select-trigger]:border-[#d7e0ec] [&_.admin-select-trigger]:bg-[#fbfcfe] [&_.admin-select-trigger]:px-3 [&_.admin-select-trigger]:text-[0.92rem] [&_.admin-select-trigger]:font-semibold [&_.admin-select-trigger]:text-[#192333] [&_.admin-select-trigger]:shadow-[0_12px_28px_-24px_rgba(15,23,42,0.35)] [&_.admin-select-trigger[aria-expanded='true']]:border-[#006747]/45 [&_.admin-select-trigger[aria-expanded='true']]:bg-white [&_.admin-select-trigger[aria-expanded='true']]:shadow-[0_0_0_4px_rgba(189,232,208,0.48),0_18px_38px_-30px_rgba(0,103,71,0.34)] [&_.admin-select-icon]:text-[#15231d] [&_.admin-select-menu]:border-[#d7e0ec] [&_.admin-select-menu]:bg-white [&_.admin-select-menu]:shadow-[0_24px_54px_-34px_rgba(15,23,42,0.26)] [&_.admin-select-option]:min-h-11 [&_.admin-select-option]:rounded-[0.72rem] [&_.admin-select-option]:text-[0.9rem] [&_.admin-select-option]:font-semibold [&_.admin-select-option]:text-[#192333] [&_.admin-select-option:hover]:bg-[#f0f7f3] [&_.admin-select-option[data-active='true']]:bg-[#e7f5ed] [&_.admin-select-check]:text-[#006747]"
          options={iterationOptions}
          value={selectedIteration.id}
          onValueChange={handleIterationChange}
        />
      </div>

      <div className="mt-5 border-t border-[#e6eee9] pt-5">
        <Link
          aria-current={selectedIteration.id === auction.id ? "page" : undefined}
          className="group grid gap-3 rounded-[0.95rem] text-sm transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 sm:grid-cols-[11.5rem_minmax(0,1fr)_11.5rem] sm:items-center"
          href={getMarketingDetailHref(selectedIteration)}
        >
          <span
            className={cn(
              "inline-flex h-9 w-fit items-center gap-2 rounded-[0.45rem] px-3.5 text-[0.82rem] font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]",
              selectedFailed
                ? "bg-[#fff1f1] text-[#b42318]"
                : selectedSettled
                  ? "bg-[#eaf8f0] text-[#006747]"
                  : selectedActive
                    ? "bg-[#fff6df] text-[#9b5c00]"
                    : "bg-[#eef3f1] text-[#52655d]"
            )}
          >
            <span
              className={cn(
                "relative size-3 rounded-full",
                selectedFailed
                  ? "bg-[#d61f1f]"
                  : selectedSettled
                    ? "bg-[#00a85a]"
                    : selectedActive
                      ? "bg-[#d89b12]"
                      : "bg-[#94a3a0]"
              )}
            >
              <span className="absolute inset-0 rounded-full bg-current opacity-20 transition duration-700 group-hover:scale-[1.85]" />
            </span>
            {selectedStatus}
          </span>
          <span className="min-w-0 truncate font-black text-[#0f172a]">
            {getMarketingIterationSummary(selectedIteration)}
          </span>
          <span className="inline-flex items-center gap-2 font-mono text-[0.76rem] font-black uppercase tracking-[0.04em] text-[#40558b] sm:justify-end">
            <Clock3 className="size-4 shrink-0" />
            {getMarketingIterationDateLabel(selectedIteration)}
          </span>
        </Link>
      </div>
    </section>
  );
}

export function AdminMarketingUnifiedPage({
  auctions,
  catalogMetrics
}: {
  auctions: MarketingSession[];
  catalogMetrics?: {
    total: number;
    fixedPrice: number;
    vickrey: number;
  };
  unitName?: string;
}) {
  const [methodFilter, setMethodFilter] = useState<MarketingMethodFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<MarketingStatusFilter>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const marketingFeedItems = useMemo(() => buildLatestMarketingFeedItems(auctions), [auctions]);

  const metrics = useMemo(() => {
    const activeSessions = marketingFeedItems.filter(isMarketingActive);
    const fixedActive =
      catalogMetrics?.fixedPrice ??
      activeSessions.filter((auction) => auction.mode === "FIXED_PRICE").length;
    const vickreyActive =
      catalogMetrics?.vickrey ??
      activeSessions.filter((auction) => auction.mode === "VICKREY_AUCTION").length;

    return {
      active: catalogMetrics?.total ?? activeSessions.length,
      fixedActive,
      vickreyActive,
      sold: marketingFeedItems.filter(isMarketingSold).length,
      failed: marketingFeedItems.filter(isFailedAuction).length
    };
  }, [catalogMetrics, marketingFeedItems]);

  const filteredAuctions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return marketingFeedItems.filter((auction) => {
      const matchesMethod = methodFilter === "ALL" || auction.mode === methodFilter;
      const matchesStatus = statusFilter === "Semua" || getMarketingWorkflowStatus(auction) === statusFilter;
      const matchesSearch =
        !normalizedQuery ||
        getMarketingSearchValues(auction)
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return matchesMethod && matchesStatus && matchesSearch;
    });
  }, [marketingFeedItems, methodFilter, searchQuery, statusFilter]);

  const pagination = useAdminPagination(filteredAuctions, `${methodFilter}-${statusFilter}-${searchQuery}`);
  const hasActiveFilter =
    searchQuery.trim().length > 0 || methodFilter !== "ALL" || statusFilter !== "Semua";

  function resetFilters() {
    setSearchQuery("");
    setMethodFilter("ALL");
    setStatusFilter("Semua");
  }

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
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3" aria-label="Ringkasan pemasaran">
        <MarketingMetricCard
          description={`${metrics.fixedActive} Harga Tetap / ${metrics.vickreyActive} Lelang Tertutup`}
          icon={CalendarDays}
          label="Barang Dipasarkan"
          meta="Etalase aktif"
          tone="emerald"
          value={`${metrics.active} Barang`}
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
          description="Pemenang gagal bayar 24 jam / tanpa peserta"
          icon={Target}
          label="Lelang Gagal"
          meta="Perlu tindakan"
          tone="red"
          value={`${metrics.failed} Produk`}
        />
      </section>

      <section className="rounded-[1.45rem] border border-[#d8e8dd] bg-[linear-gradient(180deg,#fffefb,#fbfcfa)] p-3 shadow-[0_18px_54px_-50px_rgba(8,69,50,0.28)] dark:border-emerald-300/10 dark:bg-[#101a15] dark:shadow-[0_24px_62px_-44px_rgba(0,0,0,0.72)]">
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(20rem,1fr)_14rem_14rem_auto]">
          <label className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-black/38 dark:text-slate-500" />
            <input
              className="h-12 w-full rounded-[1.15rem] border border-[#dce9df] bg-white pl-11 pr-4 text-sm font-semibold text-[#15211b] shadow-[0_14px_30px_-28px_rgba(8,69,50,0.32)] outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-black/36 focus:border-[#0a6a49]/38 focus:ring-4 focus:ring-[#0a6a49]/8 dark:border-emerald-300/10 dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500"
              placeholder="Cari nama barang atau Lot ID..."
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <AdminSelect
            ariaLabel="Filter metode pemasaran"
            className="w-full"
            options={MARKETING_METHOD_FILTERS.map((filter) => ({
              label: filter.value === "ALL" ? "Semua Mode" : filter.label,
              value: filter.value
            }))}
            value={methodFilter}
            onValueChange={(value) => setMethodFilter(value as MarketingMethodFilter)}
          />
          <AdminSelect
            ariaLabel="Filter status pemasaran"
            className="w-full"
            options={MARKETING_STATUS_FILTERS.map((filter) => ({
              label: filter === "Semua" ? "Semua Status" : filter,
              value: filter
            }))}
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as MarketingStatusFilter)}
          />
          <button
            className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[1.15rem] px-4 text-[0.78rem] font-black text-[#536279] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-[#006747] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!hasActiveFilter}
            type="button"
            onClick={resetFilters}
          >
            <RefreshCcw className="size-4" />
            Reset Filter
          </button>
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
  const sessionStatusLabel = getFixedPriceWorkflowStatus(auction);
  const buyerName = getFixedPriceVisibleBuyerName(auction);
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
            <Badge variant="default">Harga Tetap</Badge>
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
            <BadgeCheck className="size-3.5 text-[#0a6a49]" />
            {sessionStatusLabel}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white/80 p-3 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">{buyerName || "Belum ada pembeli"}</p>
          <p className="mt-1">{getFixedPriceOperationalNote(auction)}</p>
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
            <Badge variant="accent">Lelang Tertutup</Badge>
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
          <Link href={getVickreyWinnerWorkspaceHref(auction)}>
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
  emptyDescription = "Belum ada sesi harga tetap untuk unit ini."
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
        title="Harga Tetap"
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
  emptyDescription = "Belum ada sesi lelang tertutup untuk unit ini."
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
        title="Lelang Tertutup"
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
                Pemenang Lelang Tertutup yang perlu dipantau
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
                    <Link href={getVickreyWinnerWorkspaceHref(auction)}>
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

function FixedPriceProgressPanel({ auction }: { auction: MarketingSession }) {
  const fulfilled = auction.transactionStatus === "SELESAI";
  const verified = auction.transactionStatus === "LUNAS" || fulfilled;
  const submitted = hasFixedPricePaymentSubmission(auction) || verified;
  const buyerActor = auction.buyerName ? `Buyer: ${auction.buyerName}` : "Buyer";
  const adminActor = auction.verifiedBy ? `Admin: ${auction.verifiedBy}` : null;
  const completionActor = auction.completionSource === "auto_handover_grace" ? "Sistem" : buyerActor;
  const steps = [
    {
      label: "Pembayaran",
      status: submitted ? "Selesai" : auction.transactionId ? "Berjalan" : "Belum terjadi",
      actor: submitted || auction.transactionId ? buyerActor : null,
      occurredAt: submitted ? dateLabel(auction.transactionCreatedAt) : null,
      icon: WalletCards,
      tone: submitted ? ("done" as const) : auction.transactionId ? ("current" as const) : ("pending" as const)
    },
    {
      label: "Verifikasi",
      status: verified ? "Selesai" : submitted ? "Menunggu admin" : "Belum terjadi",
      actor: verified ? adminActor : null,
      occurredAt: verified ? dateLabel(auction.soldAt) : null,
      icon: ShieldCheck,
      tone: verified ? ("done" as const) : submitted ? ("current" as const) : ("pending" as const)
    },
    {
      label: "Selesai",
      status: fulfilled ? getMarketingProgressCompletionLabel(auction) : verified ? "Menunggu buyer" : "Belum terjadi",
      actor: fulfilled ? completionActor : verified ? buyerActor : null,
      occurredAt: fulfilled ? dateLabel(auction.completedAt) : null,
      icon: CheckCircle2,
      tone: fulfilled ? ("done" as const) : verified ? ("current" as const) : ("pending" as const)
    }
  ];

  return <CompactTransactionProgress steps={steps} title="Progress Penyelesaian" />;
}

function FixedPriceHandoverProofSection({ auction }: { auction: MarketingSession }) {
  return (
    <div aria-label="Area upload bukti serah-terima harga tetap" className="w-full">
      <HandoverProofUploadForm
        canUpload={auction.transactionStatus === "LUNAS" || auction.transactionStatus === "SELESAI"}
        itemTitle={auction.lot}
        location={auction.unitName ?? auction.unitAddress ?? undefined}
        proof={{
          fileUrl: auction.handoverProofUrl,
          uploadedAt: auction.handoverProofUploadedAt ? dateLabel(auction.handoverProofUploadedAt) : null,
          uploadedBy: auction.handoverProofUploadedBy,
          location: auction.unitName ?? auction.unitAddress
        }}
        transactionId={auction.transactionId ?? `pending-${auction.id}`}
      />
    </div>
  );
}

export function AdminFixedPriceDetailPage({
  auction
}: {
  auction: MarketingSession;
}) {
  const [isRelistModalOpen, setIsRelistModalOpen] = useState(false);
  const serverNow = useMemo(() => new Date().toISOString(), []);
  const media = auction.media ?? [];
  const buyerName = getFixedPriceVisibleBuyerName(auction);
  const statusMeta = getFixedPriceCatalogStatusMeta(auction);
  const StatusIcon = statusMeta.icon;
  const unitLabel = auction.unitName || auction.unitAddress || "Unit belum tercatat";
  const specTiles = getFixedPriceSpecificationTiles(auction);
  const lastUpdated = dateLabel(auction.soldAt ?? auction.startsAt);
  const canShowReceiptAction = isMarketingPaymentVerifiedForReceipt(auction);
  const fixedPriceReceiptLockMessage = getMarketingReceiptLockMessage(auction);
  const fixedPriceAmount = currency.format(auction.price ?? 0);
  const fixedPriceAmountClass = getFixedPriceAmountClass(auction.price);
  const canScheduleRemarketing = auction.status === "AKTIF" && !auction.transactionId;
  const shouldAutoRefresh =
    Boolean(auction.transactionId) &&
    !["SELESAI", "DITOLAK_BUKTI", "GAGAL"].includes(auction.transactionStatus ?? "");

  return (
    <div className="space-y-4">
      <StatusSyncRefresh enabled={shouldAutoRefresh} />
      <section className="rounded-[1.45rem] border border-[#d8e8dd] bg-white/90 p-4 shadow-[0_24px_70px_-56px_rgba(8,69,50,0.45)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.17em] text-[#14352b]/58">
              <span>Admin Unit</span>
              <ChevronRight className="size-3.5 text-[#8fa59a]" />
              <span className="text-[#13211c]">Detail Pemasaran Harga Tetap</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="font-headline text-[2rem] font-black leading-none text-[#101921] sm:text-[2.45rem]">
                {auction.lot}
              </h1>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#cbd7e7] bg-white px-3.5 py-2 text-[0.84rem] font-black text-[#111b46] shadow-[0_12px_28px_-24px_rgba(16,25,33,0.32)]">
                <FileText className="size-4 text-[#50607a]" />
                {auction.code || "BRG"}
              </span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#b7e7cf] bg-[#effaf4] px-3.5 py-2 text-[0.84rem] font-black text-[#006747]">
                <Tag className="size-4" />
                Harga Tetap
              </span>
              <span className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3.5 py-2 text-[0.84rem] font-black ${statusMeta.badgeClassName}`}>
                <StatusIcon className="size-4" />
                {statusMeta.label}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="interactive-tap inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#ccd6e5] bg-white px-5 text-sm font-black text-[#111827] shadow-[0_18px_32px_-26px_rgba(16,25,33,0.32)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#9fb0c7] active:scale-[0.99]"
              href="/admin/pemasaran"
            >
              <ChevronRight className="size-4 rotate-180" />
              Kembali ke Daftar
            </Link>
          </div>
        </div>
      </section>

      <MarketingIterationHistoryPanel auction={auction} />

      <div
        className="grid gap-4 xl:grid-cols-[minmax(0,1.03fr)_minmax(24rem,0.92fr)] xl:items-start"
        data-testid="fixed-price-primary-layout"
      >
        <div className="space-y-4">
          <FixedPriceAuditGallery auction={auction} media={media} />

          <section className="rounded-[1.35rem] border border-[#d8e8dd] bg-white p-4 shadow-[0_20px_58px_-50px_rgba(8,69,50,0.42)]">
            <FixedPricePanelTitle icon={ClipboardList} title="Spesifikasi Lengkap" />
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {specTiles.map((item) => (
                <div
                  className="grid min-h-[5.4rem] place-items-center rounded-xl border border-[#dde8e1] bg-[#fbfdfb] p-3.5 text-center"
                  key={`${item.label}-${item.value}`}
                >
                  <span className="min-w-0">
                    <span className="block text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#53655e]">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-[0.93rem] font-black leading-5 text-[#111827]">
                      {item.value}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-[#d8e8dd] bg-white p-4 shadow-[0_20px_58px_-50px_rgba(8,69,50,0.42)]">
            <FixedPricePanelTitle icon={FileText} title="Deskripsi Barang" />
            <div className="mt-3 rounded-xl border border-[#dfe9e3] bg-[#fbfdfb] p-4">
              <p className="text-[0.92rem] font-semibold leading-7 text-[#31433b]">
                {auction.description ||
                  auction.note ||
                  "Deskripsi katalog belum tersedia. Lengkapi narasi barang agar buyer memahami kondisi, kelengkapan, dan nilai jual harga tetap."}
              </p>
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-[#dce9df] bg-white px-3.5 py-3 text-[0.76rem] font-semibold text-[#52675e] sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#006747]" />
                  Pastikan informasi produk akurat dan sesuai kebijakan platform sebelum perubahan ditayangkan.
                </span>
                <span className="font-mono text-[#33443d]">Terakhir diperbarui: {lastUpdated}</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4" data-testid="fixed-price-secondary-layout">
          <section className="rounded-[1.35rem] border border-[#d8e8dd] bg-white p-4 shadow-[0_20px_58px_-50px_rgba(8,69,50,0.42)]">
            <FixedPricePanelTitle icon={Tag} title="Harga Barang" />
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#dbe8e2] bg-[linear-gradient(135deg,#f8fafc_0%,#eff7f2_54%,#e7f1ec_100%)] p-5 sm:p-6">
              <div className="min-w-0">
                <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#53655e]">Harga Tetap</p>
                <p
                  className={cn(
                    "mt-3 block max-w-full overflow-hidden whitespace-nowrap font-headline font-black leading-none text-[#070b16] tabular-nums",
                    fixedPriceAmountClass
                  )}
                  title={fixedPriceAmount}
                >
                  {fixedPriceAmount}
                </p>
                <p className="mt-5 inline-flex items-center gap-2 text-[1.02rem] font-black text-[#13211c]">
                  <MapPin className="size-5 text-[#006747]" />
                  {unitLabel}
                </p>
              </div>
            </div>
          </section>

          {auction.transactionId ? <FixedPriceProgressPanel auction={auction} /> : null}

          <MarketingPerformancePanel insights={auction.insights} testId="admin-fixed-price-performance-panel" />

          <section className="rounded-[1.35rem] border border-[#d8e8dd] bg-white p-4 shadow-[0_20px_58px_-50px_rgba(8,69,50,0.42)]">
            <FixedPricePanelTitle
              description="Kelola data produk, visibilitas katalog, dan pantau aktivitas sesi."
              icon={SlidersHorizontal}
              title="Konsol Manajemen"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {canShowReceiptAction ? (
                <Button
                  className="h-12 rounded-xl border border-[#d9e1dc] bg-[#f5f7f6] px-4 text-sm font-black text-[#8a9891]"
                  disabled
                  title="Data barang tidak dapat diedit setelah pembayaran diverifikasi."
                  variant="secondary"
                >
                  <PencilLine className="size-4" />
                  Edit Data
                </Button>
              ) : (
                <Link
                  className="interactive-tap inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#ccd6e5] bg-white px-4 text-sm font-black text-[#13211c] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#9fb0c7] active:scale-[0.99]"
                  href={`/admin/barang/${auction.lotId}/edit`}
                >
                  <PencilLine className="size-4 text-[#526072]" />
                  Edit Data
                </Link>
              )}
              <FixedPricePaymentVerificationButton
                auction={auction}
                className="interactive-tap inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#c8d9d0] bg-[#edf5f1] px-4 text-sm font-black text-[#285445] shadow-[0_18px_32px_-26px_rgba(15,51,38,0.28)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#a9c7b8] hover:bg-[#e4f0ea] active:scale-[0.99]"
                label={canShowReceiptAction ? "Lihat Pembayaran" : "Verifikasi Pembayaran"}
              />
              {canShowReceiptAction ? (
                <div className="sm:col-span-2 [&>span]:w-full">
                  <FixedPriceReceiptInlinePrint
                    auction={auction}
                    buttonClassName="interactive-tap inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#006747] px-4 text-sm font-black text-white shadow-[0_18px_32px_-24px_rgba(0,103,71,0.58)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#00543a] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 sm:col-span-2"
                    disabledReason={fixedPriceReceiptLockMessage}
                    label="Cetak Nota"
                  />
                </div>
              ) : null}
              {canScheduleRemarketing ? (
                <button
                  className="interactive-tap inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#006747] px-4 text-sm font-black text-white shadow-[0_18px_32px_-24px_rgba(0,103,71,0.58)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#00543a] active:scale-[0.99] sm:col-span-2"
                  onClick={() => setIsRelistModalOpen(true)}
                  type="button"
                >
                  <RefreshCcw className="size-4" />
                  Jadwalkan Pasarkan Ulang
                </button>
              ) : null}
            </div>
            <div className="mt-4 rounded-xl border border-[#dde8e1] bg-[#fbfdfb] p-3 text-[0.82rem] font-semibold leading-6 text-[#53655e]">
              {buyerName ? (
                <p>
                  Pembeli tercatat: <span className="font-black text-[#13211c]">{buyerName}</span>.
                </p>
              ) : (
                <p>Belum ada pembeli dengan bukti pembayaran masuk pada sesi harga tetap ini.</p>
              )}
              <p className="mt-1">{statusMeta.detail}</p>
            </div>
          </section>
        </aside>
      </div>

      <FixedPriceHandoverProofSection auction={auction} />

      {isRelistModalOpen ? (
        <AdminMarketingForm
          barangId={auction.lotId}
          defaultMode="fixed_price"
          defaultPrice={Number(auction.price ?? auction.appraisalValue ?? auction.basePrice ?? 1000000)}
          endpoint={`/api/admin/barang/${auction.lotId}/pasarkan-ulang`}
          heroIcon={<RefreshCcw className="size-6 text-white" strokeWidth={2.2} />}
          onCancel={() => setIsRelistModalOpen(false)}
          presentation="modal"
          redirectTo="/admin/pemasaran"
          serverNow={serverNow}
          submitIcon={<RefreshCcw className="size-4" />}
          submitLabel="Pasarkan ulang"
          successDescription="Sesi harga tetap lama ditutup dan barang dipublikasikan ulang."
          successTitle="Barang dipasarkan ulang"
        />
      ) : null}
    </div>
  );
}

function getFixedPriceAmountClass(value?: number | null) {
  const normalized = Number(value ?? 0);
  const digits = Math.max(1, Math.trunc(Math.abs(normalized)).toString().length);

  if (digits >= 10) {
    return "text-[1.9rem] sm:text-[2.35rem] 2xl:text-[2.75rem]";
  }

  if (digits >= 9) {
    return "text-[2.05rem] sm:text-[2.65rem] 2xl:text-[3rem]";
  }

  return "text-[2.35rem] sm:text-[3.1rem] 2xl:text-[3.35rem]";
}

function getFixedPriceCatalogStatusMeta(auction: MarketingSession) {
  if (isMarketingSold(auction)) {
    return {
      badgeClassName: "border-[#b7e7cf] bg-[#effaf4] text-[#006747]",
      detail: isAutoCompletedMarketing(auction)
        ? "Penjualan harga tetap selesai otomatis setelah masa konfirmasi serah-terima berakhir tanpa komplain."
        : "Penjualan harga tetap sudah selesai dan siap masuk arsip transaksi.",
      icon: BadgeCheck,
      label: isAutoCompletedMarketing(auction) ? "Selesai Otomatis" : "Selesai"
    };
  }

  if (auction.transactionStatus === "LUNAS") {
    return {
      badgeClassName: "border-[#b7e7cf] bg-[#effaf4] text-[#006747]",
      detail: getMarketingVerifiedDetail(auction),
      icon: BadgeCheck,
      label: "Terverifikasi"
    };
  }

  if (hasFixedPricePaymentSubmission(auction)) {
    return {
      badgeClassName: "border-[#fed7aa] bg-[#fff7ed] text-[#b45309]",
      detail: "Buyer sudah mengirim bukti pembayaran. Admin unit dapat meninjau status pembayaran dari alur verifikasi.",
      icon: ReceiptText,
      label: "Pembayaran Masuk"
    };
  }

  return {
    badgeClassName: "border-[#fed7aa] bg-[#fff8e8] text-[#b45309]",
    detail: "Barang tersedia di katalog publik dan masih menunggu buyer menyelesaikan pembelian harga tetap.",
    icon: CheckCircle2,
    label: "Tersedia di Katalog"
  };
}

function getFixedPriceSpecificationTiles(auction: MarketingSession) {
  const categoryRows = getBarangSpecificationRows(auction.category ?? "", auction.specifications ?? {})
    .filter((row) => row.value && row.value !== "-");
  const fallbackRows = [
    { label: "Kode Barang", value: auction.code || "-" },
    { label: "Kategori", value: auction.category ? humanize(auction.category) : "-" },
    { label: "Kondisi", value: auction.condition ? humanize(auction.condition) : "-" },
    { label: "Unit", value: auction.unitName || auction.unitAddress || "-" },
    { label: "Harga Tetap", value: currency.format(auction.price ?? 0) },
    { label: "Status Katalog", value: getFixedPriceWorkflowStatus(auction) }
  ];
  const seenLabels = new Set<string>();

  return [...categoryRows, ...fallbackRows]
    .filter((row) => {
      const labelKey = row.label.toLowerCase();
      if (seenLabels.has(labelKey)) {
        return false;
      }
      seenLabels.add(labelKey);
      return Boolean(row.value && row.value !== "-");
    })
    .slice(0, 6);
}

function FixedPricePanelTitle({
  description,
  icon: Icon,
  title
}: {
  description?: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#edf9f2] text-[#006747]">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[1rem] font-black leading-tight text-[#111827]">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-[0.76rem] font-semibold leading-5 text-[#6b7a73]">{description}</span>
        ) : null}
      </span>
    </div>
  );
}

function fixedPriceMediaLabel(item: { type: "foto" | "video" }, index: number) {
  return `${item.type === "video" ? "Video" : "Foto"} ${index + 1}`;
}

function FixedPriceAuditGallery({
  auction,
  media
}: {
  auction: MarketingSession;
  media: MarketingMedia[];
}) {
  const galleryMedia = toBuyerMedia(media).slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [media]);

  const activeMedia = galleryMedia[activeIndex] ?? null;
  const activeIsVideo = activeMedia?.type === "video";

  return (
    <section className="rounded-[1.35rem] border border-[#d8e8dd] bg-white p-4 shadow-[0_20px_58px_-50px_rgba(8,69,50,0.42)]">
      <FixedPricePanelTitle icon={Camera} title="Galeri Media Barang" />
      <div className="mt-3">
        <div className="relative overflow-hidden rounded-2xl border border-[#dfe9e3] bg-[#f5f7f4]" data-testid="lot-media-active">
          <div className="relative aspect-[16/10] min-h-[19rem] w-full">
            {activeMedia ? (
              <button
                aria-label="Buka preview penuh media barang"
                className="absolute right-4 top-4 z-[2] grid size-10 place-items-center rounded-full bg-white/94 text-[#264139] shadow-[0_18px_42px_rgba(8,69,50,0.08)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f7faf8] sm:right-5 sm:top-5 md:right-6 md:top-6"
                onClick={() => setIsFullscreenOpen(true)}
                type="button"
              >
                <Maximize2 className="size-4" />
              </button>
            ) : null}
            {activeMedia ? (
              activeIsVideo ? (
                <video
                  aria-label={`${auction.lot} video ${activeIndex + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  controls
                  key={activeMedia.id}
                  muted
                  playsInline
                  preload="metadata"
                  src={activeMedia.url}
                />
              ) : (
                <Image
                  alt={`${auction.lot} foto ${activeIndex + 1}`}
                  fill
                  className="object-cover transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  sizes="(min-width: 1536px) 44vw, (min-width: 1280px) 54vw, (min-width: 768px) 82vw, 100vw"
                  src={activeMedia.url}
                />
              )
            ) : (
              <div className="absolute inset-0">
                <LotFigure
                  category={auction.category || "Lainnya"}
                  className="h-full w-full"
                  showCategoryBadge={false}
                  variant="pdp"
                />
              </div>
            )}
          </div>
        </div>

        {galleryMedia.length > 1 ? (
          <div className="mt-3 grid grid-cols-5 gap-2.5">
            {galleryMedia.map((item, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  aria-label={`Lihat ${fixedPriceMediaLabel(item, index)}`}
                  className={`relative overflow-hidden rounded-xl border-2 bg-[#f5f7f4] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 ${
                    isActive ? "border-[#006747] ring-2 ring-[#006747]/15" : "border-transparent hover:border-[#b7d7c7]"
                  }`}
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <span className="relative block aspect-[16/10]">
                    {item.type === "video" ? (
                      <video
                        aria-label={`${auction.lot} video thumbnail ${index + 1}`}
                        className="size-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        src={item.url}
                      />
                    ) : (
                      <Image
                        alt={`${auction.lot} foto thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1280px) 8vw, 20vw"
                        src={item.url}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {isFullscreenOpen && activeMedia
          ? createPortal(
              <div
                aria-label="Preview media barang"
                aria-modal="true"
                className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#081b14]/72 px-3 py-3 backdrop-blur-md sm:px-6 sm:py-6"
                onClick={() => setIsFullscreenOpen(false)}
                role="dialog"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,184,93,0.16),transparent_36%)]" />
                <div
                  className="modal-viewport relative z-[141] my-auto w-full max-w-6xl rounded-[2rem] border border-white/28 bg-[linear-gradient(180deg,rgba(248,246,239,0.96),rgba(255,255,255,0.92))] p-2 shadow-[0_48px_120px_-40px_rgba(3,21,14,0.82)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] border border-black/5 bg-[#fbfbf8]">
                    <div className="flex items-start justify-between gap-4 border-b border-black/6 px-5 py-4 sm:px-6">
                      <div className="min-w-0">
                        <p className="font-body text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#8d6c08]">
                          Media Barang
                        </p>
                        <h3 className="mt-1 truncate font-headline text-[1.35rem] font-black tracking-tight text-[#13211c]">
                          {activeMedia.fileName || fixedPriceMediaLabel(activeMedia, activeIndex)}
                        </h3>
                      </div>
                      <button
                        aria-label="Tutup preview media barang"
                        className="grid size-11 shrink-0 place-items-center rounded-full border border-black/8 bg-white text-primary transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f5f7f2] active:scale-[0.97]"
                        onClick={() => setIsFullscreenOpen(false)}
                        type="button"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <div className="bg-[linear-gradient(180deg,#f7f8f4,#eef1ea)] p-3 sm:p-4">
                      <div className="overflow-hidden rounded-[1.5rem] border border-black/6 bg-white shadow-[0_24px_60px_-36px_rgba(8,69,50,0.28)]">
                        {activeIsVideo ? (
                          <video
                            aria-label="Preview penuh video barang"
                            className="media-preview-frame w-full bg-[#0d1712] object-contain"
                            controls
                            key={activeMedia.id}
                            playsInline
                            src={activeMedia.url}
                          />
                        ) : (
                          <img
                            alt="Preview penuh media barang"
                            className="media-preview-frame w-full bg-[#f8f8f5] object-contain"
                            src={activeMedia.url}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )
          : null}
      </div>
    </section>
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
            ? "Transaksi pemenang terbaca dari database. Untuk Lelang Tertutup, pembayaran diproses langsung di unit."
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
                Harga akhir Lelang Tertutup
              </p>
              <p className={`mt-1 max-w-full whitespace-nowrap font-headline font-extrabold tracking-[-0.03em] text-primary [font-variant-numeric:tabular-nums] ${getCompactCurrencyTextClass(auction.finalPrice ?? auction.basePrice ?? 0)}`}>
                {currency.format(auction.finalPrice ?? auction.basePrice ?? 0)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {auction.transactionId ? (
                <VickreyPaymentVerificationButton
                  auction={auction}
                  className="interactive-tap inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-inset transition-[transform,background-color,border-color,color,opacity,box-shadow] duration-200 ease-out hover:opacity-95 active:scale-[0.99]"
                  label="Verifikasi pembayaran"
                />
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

function compactCountdownValue(value: string) {
  return value.length > 3 ? "99+" : value;
}

function VickreySettlementCountdownGrid({
  targetAt
}: {
  targetAt?: string | null;
}) {
  const [parts, setParts] = useState(() => ({ days: "--", hours: "--", minutes: "--", seconds: "--" }));

  useEffect(() => {
    setParts(getCountdownParts(targetAt));
    const timer = window.setInterval(() => setParts(getCountdownParts(targetAt)), 1000);
    return () => window.clearInterval(timer);
  }, [targetAt]);

  const items = [
    { label: "HARI", value: compactCountdownValue(parts.days) },
    { label: "JAM", value: compactCountdownValue(parts.hours) },
    { label: "MENIT", value: compactCountdownValue(parts.minutes) },
    { label: "DETIK", value: compactCountdownValue(parts.seconds) }
  ];

  return (
    <div className="grid grid-cols-[3.25rem_3.25rem_3.25rem_3.25rem] gap-2 text-center sm:gap-3">
      {items.map((item) => (
        <div
          className="grid h-[3.35rem] min-w-0 place-items-center rounded-lg border border-[#e9edf1] bg-white px-1.5 py-1 shadow-[0_10px_24px_-20px_rgba(8,69,50,0.25)]"
          data-settlement-countdown-tile="true"
          key={item.label}
        >
          <div className="min-w-0">
            <p className="w-full text-center font-mono text-[1.05rem] font-black leading-none text-[#006747] [font-variant-numeric:tabular-nums]">
              {item.value}
            </p>
            <p className="mt-1 w-full text-center text-[0.56rem] font-black leading-none text-[#006747]">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function getWinnerBid(auction: MarketingSession) {
  return (auction.bids ?? []).find((bid) => bid.isWinner) ?? null;
}

function getHighestBidAmount(auction: MarketingSession) {
  const amounts = (auction.bids ?? [])
    .map((bid) => bid.amount)
    .filter((amount): amount is number => typeof amount === "number" && Number.isFinite(amount))
    .sort((left, right) => right - left);

  return amounts[0] ?? auction.finalPrice ?? null;
}

function formatOptionalCurrency(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? currency.format(value) : "Rp ********";
}

function getCurrencyDigitCount(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return String(Math.trunc(Math.abs(value))).length;
}

function getCompactCurrencyTextClass(value?: number | null) {
  const digits = getCurrencyDigitCount(value);

  if (digits >= 12) {
    return "text-[0.64rem] sm:text-[0.74rem] xl:text-[0.82rem] 2xl:text-[0.9rem]";
  }

  if (digits >= 10) {
    return "text-[0.74rem] sm:text-[0.84rem] xl:text-[0.92rem] 2xl:text-[1rem]";
  }

  if (digits >= 8) {
    return "text-[0.84rem] sm:text-[0.94rem] xl:text-[1.02rem] 2xl:text-[1.1rem]";
  }

  return "text-[0.98rem] sm:text-[1.08rem] xl:text-[1.16rem]";
}

function isVickreyPaymentVerified(auction: MarketingSession) {
  return auction.transactionStatus === "LUNAS" || auction.transactionStatus === "SELESAI";
}

function isVickreyPaymentFulfilled(auction: MarketingSession) {
  return auction.transactionStatus === "SELESAI";
}

const FAILED_VICKREY_TRANSACTION_STATUSES = new Set(["GAGAL", "DIBATALKAN", "DIBATALKAN_OTOMATIS"]);

function getVickreyFailureKind(auction: MarketingSession) {
  const hasWinnerTrace = Boolean(auction.winner || auction.buyerName || auction.transactionId);
  const failedTransaction = FAILED_VICKREY_TRANSACTION_STATUSES.has(auction.transactionStatus ?? "");

  return hasWinnerTrace || failedTransaction ? "unpaid" : "no_bids";
}

function isVickreyFailureArchive(auction: MarketingSession) {
  if (auction.mode !== "VICKREY_AUCTION" || auction.visibility !== "HASIL_DIBUKA") {
    return false;
  }

  const noWinnerAfterReveal = !auction.transactionId && !auction.winner && !auction.buyerName;

  return (
    auction.status === "GAGAL" ||
    FAILED_VICKREY_TRANSACTION_STATUSES.has(auction.transactionStatus ?? "") ||
    noWinnerAfterReveal
  );
}

function getVickreyArchiveDate(auction: MarketingSession) {
  return dateLabel(auction.soldAt ?? auction.paymentDeadline ?? auction.endingAt);
}

function getInitials(name?: string | null) {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "AU";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function getSpecValue(auction: MarketingSession, keywords: string[]) {
  const rows = getBarangSpecificationRows(auction.category ?? "", auction.specifications ?? {});
  const match = rows.find((row) => {
    const label = row.label.toLowerCase();
    return keywords.some((keyword) => label.includes(keyword));
  });

  return match?.value || "-";
}

function getVickreyAssetDetailRows(auction: MarketingSession, fulfilled = false) {
  const categoryRows = getBarangSpecificationRows(auction.category ?? "", auction.specifications ?? {})
    .filter((row) => row.value && row.value !== "-")
    .slice(0, 3);

  const rows = fulfilled
    ? [
        { label: "Kode Aset", value: auction.code || "-" },
        ...categoryRows,
        { label: "Kategori", value: auction.category ? humanize(auction.category) : "-" },
        { label: "Lokasi Barang", value: auction.unitName || auction.unitAddress || "-" }
      ]
    : [
        { label: "Kode Aset", value: auction.code || "-" },
        ...categoryRows,
        { label: "Kondisi", value: auction.condition ? humanize(auction.condition) : "-" }
      ];

  return rows.slice(0, 5);
}

function VickreySettlementDeadlineBanner({ auction }: { auction: MarketingSession }) {
  if (isVickreyPaymentFulfilled(auction)) {
    return (
      <section className="rounded-[1.1rem] border border-[#86d9ad] bg-[#f0fdf4] px-4 py-4 shadow-[0_18px_42px_-36px_rgba(0,103,71,0.34)] print:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#006747] text-white shadow-[0_18px_30px_-20px_rgba(0,103,71,0.74)]">
              <CheckCircle2 className="size-7" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <h2 className="font-headline text-[1rem] font-black uppercase tracking-[0.02em] text-[#006747] sm:text-[1.12rem]">
                Lelang Selesai Sempurna - Aset Telah Diserahkan
              </h2>
              <p className="mt-1 text-[0.8rem] font-semibold leading-5 text-[#2f6a52]">
                Pembayaran telah dilunasi 100% oleh pemenang dan barang telah diserahkan kepada pemenang.
              </p>
            </div>
          </div>

          <div className="border-t border-[#b7e8cc] pt-3 lg:min-w-[22rem] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <span className="inline-flex rounded-full border border-[#a7d9c7] bg-white/68 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-[#006747]">
              Status Arsip
            </span>
            <p className="mt-2 font-headline text-[0.92rem] font-black uppercase tracking-[0.01em] text-[#006747]">
              Pembayaran & Penyerahan Selesai
            </p>
            <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-[#2f6a52]">
              Arsip ini bersifat final dan telah ditutup.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (isVickreyPaymentVerified(auction)) {
    return (
      <section className="rounded-[1.1rem] border border-[#b9e4cc] bg-[#f4fcf6] px-4 py-4 shadow-[0_18px_42px_-36px_rgba(0,103,71,0.28)] print:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#20b96b] text-white shadow-[0_18px_30px_-20px_rgba(32,185,107,0.64)]">
              <ShieldCheck className="size-7" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <h2 className="font-headline text-[1rem] font-black uppercase tracking-[0.02em] text-[#075b3f] sm:text-[1.12rem]">
                Pembayaran Terverifikasi - Menunggu Buyer Selesai
              </h2>
              <p className="mt-1 text-[0.8rem] font-semibold leading-5 text-[#2f6a52]">
                Admin sudah memverifikasi pembayaran. Tahap final baru tercapai setelah buyer menekan Pembelian Selesai.
              </p>
            </div>
          </div>

          <div className="border-t border-[#c9ead3] pt-3 lg:min-w-[22rem] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <span className="inline-flex rounded-full border border-[#b9e4cc] bg-white/72 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-[#075b3f]">
              Status Transaksi
            </span>
            <p className="mt-2 font-headline text-[0.92rem] font-black uppercase tracking-[0.01em] text-[#075b3f]">
              Nota tersedia, arsip final belum ditutup
            </p>
            <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-[#2f6a52]">
              Buyer perlu mengonfirmasi dari halaman transaksi.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.1rem] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 shadow-[0_18px_42px_-36px_rgba(146,64,14,0.34)] print:shadow-none">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_34%_22%,#facc15_0%,#f59e0b_48%,#b45309_100%)] text-white shadow-[0_14px_26px_-18px_rgba(180,83,9,0.72)]">
            <Trophy className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-headline text-[0.92rem] font-black uppercase tracking-[0.02em] text-[#7c2d12]">
              Lelang Selesai - Menunggu Pelunasan Nasabah
            </h2>
            <p className="mt-1 text-[0.78rem] font-semibold leading-5 text-[#9a3412]">
              Pemenang wajib melakukan pelunasan sebelum batas waktu berakhir.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.13em] text-[#162461]">
            Batas Waktu Pelunasan
          </p>
          <VickreySettlementCountdownGrid targetAt={auction.paymentDeadline} />
        </div>
      </div>
    </section>
  );
}

function VickreyWinnerProfilePanel({ auction }: { auction: MarketingSession }) {
  const winnerName = auction.buyerName || auction.winner || "Pemenang belum tercatat";
  const winnerBid = getWinnerBid(auction);
  const winnerId = winnerBid?.bidderId || auction.buyerNationalId || auction.reference || "-";
  const fulfilled = isVickreyPaymentFulfilled(auction);
  const verified = isVickreyPaymentVerified(auction);

  return (
    <section className="relative overflow-hidden rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      {verified ? (
        <CheckCircle2 className="pointer-events-none absolute -right-5 -top-6 size-24 text-[#f0f6f2]" strokeWidth={2.6} />
      ) : null}
      <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
        {fulfilled ? "Manifes Penyerahan & Pemenang" : verified ? "Pemenang Terverifikasi" : "Detail Pemenang Lelang"}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.62fr)] md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[#d9e8df] bg-[#eef3f1] font-headline text-[1.25rem] font-black text-[#006747]">
            {getInitials(winnerName)}
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="truncate font-headline text-[1.08rem] font-black leading-tight text-[#111b46]">
                {winnerName}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#d6efe1] bg-[#f1fbf6] px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.08em] text-[#006747]">
                <CheckCircle2 className="size-3" />
                Terverifikasi
              </span>
            </div>
            <p className="mt-2 text-[0.74rem] font-bold text-[#52655d]">
              Member ID: <span className="font-mono text-[#111b46]">{winnerId}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-2 border-t border-[#edf2ee] pt-3 text-[0.76rem] font-bold text-[#111b46] md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <p className="flex min-w-0 items-center gap-2">
            <Phone className="size-4 shrink-0 text-[#40558b]" />
            <span className="min-w-0 truncate">{auction.buyerPhone || "Nomor telepon belum tercatat"}</span>
          </p>
          <p className="flex min-w-0 items-center gap-2">
            <Mail className="size-4 shrink-0 text-[#40558b]" />
            <span className="min-w-0 truncate font-mono text-[0.72rem]">
              {auction.buyerEmail || "email-belum-tercatat"}
            </span>
          </p>
        </div>
      </div>
      {verified ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#edf2ee] pt-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#006747] px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.06em] text-white">
            <CheckCircle2 className="size-3.5" />
            Pembayaran Terverifikasi
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#2463eb] px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.06em] text-white">
            <ShieldCheck className="size-3.5" />
            {fulfilled ? "Barang Sudah Diambil" : "Menunggu Buyer Selesai"}
          </span>
        </div>
      ) : null}
    </section>
  );
}

function VickreyMechanismPanel({ auction }: { auction: MarketingSession }) {
  const highestBid = getHighestBidAmount(auction);
  const paymentPrice = auction.finalPrice ?? auction.basePrice ?? null;
  const fulfilled = isVickreyPaymentFulfilled(auction);
  const verified = isVickreyPaymentVerified(auction);

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <div className="flex items-center gap-2">
        <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
          {fulfilled ? "Mekanisme Lelang (Arsip)" : "Mekanisme Lelang: Lelang Tertutup"}
        </p>
        <Info className="size-3.5 text-[#2f6fff]" />
      </div>

      <div className={`mt-4 grid gap-3 ${fulfilled ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"}`}>
        <div className="min-w-0 rounded-lg border border-[#d6efe1] bg-[#f1fbf6] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#006747]">Penawaran Tertinggi</p>
          <p className={`mt-2 max-w-full whitespace-nowrap font-headline font-black leading-tight tracking-[-0.03em] text-[#006747] [font-variant-numeric:tabular-nums] ${getCompactCurrencyTextClass(highestBid)}`}>
            {formatOptionalCurrency(highestBid)}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#2f6a52]">
            Penawaran tertinggi oleh pemenang
          </p>
        </div>

        <div className="min-w-0 rounded-lg border border-[#fde2a5] bg-[#fff8e7] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#92400e]">Harga Bayar</p>
          <p className={`mt-2 max-w-full whitespace-nowrap font-headline font-black leading-tight tracking-[-0.03em] text-[#f59e0b] [font-variant-numeric:tabular-nums] ${getCompactCurrencyTextClass(paymentPrice)}`}>
            {formatOptionalCurrency(paymentPrice)}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#b45309]">
            Harga yang harus dibayarkan pemenang
          </p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-lg border border-[#e7ece9] bg-[#f8faf9] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#40558b]">{fulfilled ? "Status Lelang" : "Status"}</p>
          <span className="mt-2 inline-flex min-w-0 max-w-full items-center gap-1 whitespace-nowrap rounded-full bg-[#e9f8ef] px-2 py-1 text-[0.52rem] font-black uppercase leading-none text-[#006747]">
            {fulfilled ? "Selesai & Diarsipkan" : verified ? "Terverifikasi" : "Menang"} <Trophy className="size-3 shrink-0" />
          </span>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#40558b]">
            {fulfilled ? "Berkas final pemenang" : verified ? "Menunggu konfirmasi buyer" : "Pemenang utama lelang"}
          </p>
        </div>

        {fulfilled ? (
          <div className="rounded-lg border border-[#e7ece9] bg-[#f8faf9] px-3.5 py-3">
            <p className="text-[0.66rem] font-black text-[#40558b]">Waktu Pelaksanaan</p>
            <p className="mt-2 font-mono text-[0.78rem] font-black leading-tight text-[#111b46]">
              {dateLabel(auction.endingAt)}
            </p>
            <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#40558b]">
              Tanggal sesi ditutup
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#edf2ee] bg-[#f8faf9] px-3 py-2.5 text-[0.72rem] font-semibold leading-5 text-[#52655d]">
        <ReceiptText className="mt-0.5 size-4 shrink-0 text-[#006747]" />
        {fulfilled ? (
          <div className="grid flex-1 gap-2 sm:grid-cols-3">
            <p>
              <span className="block text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
                Mekanisme
              </span>
              e-Bidding - Lelang Tertutup
            </p>
            <p>
              <span className="block text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
                Pemenang
              </span>
              {auction.buyerName || auction.winner || "-"}
            </p>
            <p>
              <span className="block text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
                Tanggal Arsip
              </span>
              {getVickreyArchiveDate(auction)}
            </p>
          </div>
        ) : (
          <p>
            <span className="font-black text-[#006747]">Catatan Admin:</span> Harga akhir mengikuti mekanisme lelang
            dan dihitung dari penawaran tertinggi kedua.
          </p>
        )}
      </div>
    </section>
  );
}

function VickreyWinnerRankingTable({ auction }: { auction: MarketingSession }) {
  const rows = [...(auction.bids ?? [])].sort((left, right) => (left.rank || 0) - (right.rank || 0));
  const fulfilled = isVickreyPaymentFulfilled(auction);

  return (
    <section className="overflow-hidden rounded-xl border border-[#dfe7e2] bg-white shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <div className="border-b border-[#edf2ee] bg-[#fbfcfb] px-4 py-3">
        <h3 className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
          {fulfilled ? "Bidders Ranking Table (Arsip)" : "Ranking Peserta Lelang (Admin View)"}
        </h3>
      </div>
      <div>
        <table className="w-full table-fixed text-left text-[0.72rem]">
          <colgroup>
            <col className="w-[7%]" />
            <col className="w-[25%]" />
            <col className="w-[22%]" />
            <col className="w-[24%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-[#edf2ee] bg-[#f8faf9] text-[0.56rem] font-black uppercase tracking-[0.04em] text-[#40558b] sm:text-[0.6rem]">
              <th className="px-2 py-2.5 text-center">#</th>
              <th className="px-2 py-2.5">Nama Peserta</th>
              <th className="px-2 py-2.5">Waktu Penawaran</th>
              <th className="px-2 py-2.5 text-right">Nominal Penawaran</th>
              <th className="px-2 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf2ee] font-bold text-[#111b46]">
            {rows.map((bid) => {
              const isRunnerUp = bid.determinesFinalPrice;
              const rowTone = fulfilled
                ? bid.isWinner
                  ? "bg-[#e9f8ef]"
                  : "bg-white text-[#8b9a93]"
                : bid.isWinner
                  ? "bg-[#e9f8ef]"
                  : isRunnerUp
                    ? "bg-[#fff8e7]"
                    : "bg-white";
              const status = fulfilled
                ? bid.isWinner
                  ? "Lunas & Diserahkan"
                  : "Tidak Menang"
                : bid.isWinner
                  ? "Pemenang"
                  : isRunnerUp
                    ? "Harga Bayar"
                    : "-";
              const statusTone = fulfilled
                ? bid.isWinner
                  ? "bg-[#e9f8ef] text-[#006747]"
                  : "bg-[#eef2f0] text-[#8b9a93]"
                : bid.isWinner
                  ? "bg-[#006747] text-white"
                  : isRunnerUp
                    ? "bg-[#f59e0b] text-white"
                    : "text-[#40558b]";

              return (
                <tr className={`${rowTone} transition-colors duration-200 hover:bg-[#f4fbf7]`} key={bid.id}>
                  <td className="px-2 py-2.5 text-center font-mono text-[#006747]">{bid.rank}</td>
                  <td className="break-words px-2 py-2.5 text-[0.68rem] leading-4 sm:text-[0.72rem]">{bid.bidderName}</td>
                  <td className="break-words px-2 py-2.5 font-mono text-[0.62rem] leading-4 text-[#40558b]">
                    {bid.submittedAtLabel}
                  </td>
                  <td className="break-words px-2 py-2.5 text-right font-mono text-[0.68rem] font-black leading-4">
                    {formatOptionalCurrency(bid.amount)}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {status === "-" ? (
                      <span className="font-black text-[#40558b]">-</span>
                    ) : (
                      <span className={`inline-flex max-w-full items-center justify-center gap-1 rounded-full px-2 py-1 text-[0.55rem] font-black uppercase leading-3 sm:text-[0.58rem] ${statusTone}`}>
                        {fulfilled ? (
                          bid.isWinner ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <X className="size-3" />
                          )
                        ) : bid.isWinner ? (
                          <Trophy className="size-3" />
                        ) : (
                          <ReceiptText className="size-3" />
                        )}
                        <span className="min-w-0 whitespace-normal break-words text-center">{status}</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#edf2ee] bg-[#fbfcfb] px-4 py-2.5 text-[0.68rem] font-black text-[#40558b]">
        Total {auction.participants ?? rows.length} peserta
      </div>
    </section>
  );
}

function VickreyWinnerAssetPanel({ auction }: { auction: MarketingSession }) {
  const media = auction.primaryMedia ?? auction.media?.[0] ?? null;
  const isVideo = isMarketingVideoMedia(media);
  const fulfilled = isVickreyPaymentFulfilled(auction);
  const detailRows = getVickreyAssetDetailRows(auction, fulfilled);

  return (
    <section className="flex flex-col rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)] lg:min-h-[18.75rem]">
      <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
        {fulfilled ? "Detail Aset Lelang (Arsip)" : "Detail Aset Lelang"}
      </p>
      <div className="mt-4 grid flex-1 gap-4 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,0.9fr)] sm:items-center">
        <div className="aspect-[16/9] overflow-hidden rounded-lg border border-[#edf2ee] bg-[#f6f2eb]">
          {media ? (
            isVideo ? (
              <video className="size-full object-cover" muted playsInline preload="metadata" src={media.url} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`Foto ${auction.lot}`} className="size-full object-cover" src={media.url} />
            )
          ) : (
            <div className="grid size-full place-items-center text-sm font-semibold text-[#8a9891]">
              Media barang belum tersedia
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-headline text-[1.1rem] font-black leading-tight text-[#111b46]">
            {auction.lot}
          </h3>
          <div className="mt-4 divide-y divide-[#edf2ee] text-[0.76rem] font-bold text-[#111b46]">
            {detailRows.map(({ label, value }) => (
              <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2 first:pt-0" key={label}>
                <span className="text-[#40558b]">{label}</span>
                <span className="min-w-0 break-words text-right">{value}</span>
              </div>
            ))}
          </div>
          <Link href={`/admin/barang/${auction.lotId}`}>
            <Button className="mt-3 w-full justify-between rounded-lg border-[#d8e4de] text-[0.78rem]" variant="secondary">
              Lihat Detail Aset
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function VickreyPaymentProgressPanel({ auction }: { auction: MarketingSession }) {
  const fulfilled = isVickreyPaymentFulfilled(auction);
  const verified = isVickreyPaymentVerified(auction);
  const buyerActor = auction.buyerName || auction.winner ? `Buyer: ${auction.buyerName || auction.winner}` : "Buyer";
  const adminActor = auction.verifiedBy ? `Admin: ${auction.verifiedBy}` : null;
  const completionActor = auction.completionSource === "auto_handover_grace" ? "Sistem" : buyerActor;
  const steps = fulfilled
    ? [
        { label: "Pembayaran", status: "Selesai", actor: buyerActor, occurredAt: dateLabel(auction.transactionCreatedAt), icon: CheckCircle2, tone: "done" as const },
        { label: "Verifikasi", status: "Selesai", actor: adminActor, occurredAt: dateLabel(auction.soldAt), icon: ShieldCheck, tone: "done" as const },
        { label: "Selesai", status: getMarketingProgressCompletionLabel(auction), actor: completionActor, occurredAt: dateLabel(auction.completedAt), icon: CheckCircle2, tone: "done" as const }
      ]
    : verified
      ? [
          { label: "Pembayaran", status: "Selesai", actor: buyerActor, occurredAt: dateLabel(auction.transactionCreatedAt), icon: CheckCircle2, tone: "done" as const },
          { label: "Verifikasi", status: "Selesai", actor: adminActor, occurredAt: dateLabel(auction.soldAt), icon: ShieldCheck, tone: "done" as const },
          { label: "Selesai", status: "Menunggu buyer", actor: buyerActor, icon: CheckCircle2, tone: "current" as const }
        ]
    : [
        { label: "Pembayaran", status: "Berjalan", actor: buyerActor, occurredAt: dateLabel(auction.transactionCreatedAt), icon: WalletCards, tone: "current" as const },
        { label: "Verifikasi", status: "Belum terjadi", icon: FileText, tone: "pending" as const },
        { label: "Selesai", status: "Belum terjadi", icon: CheckCircle2, tone: "pending" as const }
      ];

  return <CompactTransactionProgress steps={steps} title={verified ? "Progress Penyelesaian" : "Progress Pembayaran Lelang"} />;
}

function VickreyPaymentTotalPanel({
  auction,
  onPrintReceipt
}: {
  auction: MarketingSession;
  onPrintReceipt?: () => Promise<void>;
}) {
  const paymentPrice = auction.finalPrice ?? auction.basePrice ?? 0;
  const statusLabel = auction.transactionStatus ? humanize(auction.transactionStatus) : "Menunggu pembayaran";
  const fulfilled = isVickreyPaymentFulfilled(auction);
  const verified = isVickreyPaymentVerified(auction);
  const receiptLockMessage = getMarketingReceiptLockMessage(auction);
  const canPrintReceipt = Boolean(auction.transactionId && onPrintReceipt && !receiptLockMessage);
  const handleReceiptPrint = onPrintReceipt ?? (async () => undefined);

  if (fulfilled) {
    return (
      <section className="w-full rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)] sm:px-5">
        <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#111b46]">
          Nota Dokumen Final
        </p>
        <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-[#52655d]">
          Cetak nota resmi dan arsipkan berkas lelang setelah buyer menutup pembelian.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.5fr)] lg:items-stretch">
          <div className="space-y-2 rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 py-3 text-[0.76rem] font-bold text-[#52655d]">
            <div className="flex min-h-10 items-center justify-between gap-4">
              <span>Harga akhir lelang</span>
              <span className="whitespace-nowrap font-mono text-[#111b46]">{currency.format(paymentPrice)}</span>
            </div>
            <div className="border-t border-[#dfe7e2] pt-2">
              <div className="flex min-h-10 items-center justify-between gap-4">
                <span className="text-[0.66rem] font-black uppercase tracking-[0.06em] text-[#006747]">
                  Total Pelunasan Kasir
                </span>
                <span className={`whitespace-nowrap font-mono font-black leading-none tracking-[-0.03em] text-[#006747] ${getCompactCurrencyTextClass(paymentPrice)}`}>
                  {currency.format(paymentPrice)}
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-3 print:hidden">
            {canPrintReceipt ? (
              <VickreyReceiptPrintButton
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d8e4de] bg-white px-5 text-[0.86rem] font-black text-[#111b46] shadow-[0_18px_34px_-28px_rgba(8,69,50,0.28)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#f8faf9] active:scale-[0.99]"
                onPrint={handleReceiptPrint}
              />
            ) : (
              <Button
                className="h-12 rounded-lg border border-[#d8e4de] bg-white px-5 text-[0.86rem] font-black text-[#111b46]"
                disabled
                title={receiptLockMessage ?? undefined}
                variant="secondary"
              >
                <Printer className="size-4" />
                Cetak Nota
              </Button>
            )}
            {receiptLockMessage ? (
              <p className="text-[0.72rem] font-semibold leading-5 text-[#52655d]">{receiptLockMessage}</p>
            ) : null}
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white shadow-[0_18px_34px_-24px_rgba(0,103,71,0.75)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99]"
              href="/admin/pemasaran"
            >
              <LockKeyhole className="size-4.5" />
              Tutup & Arsipkan Berkas Lelang
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (verified) {
    return (
      <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)] sm:px-5">
        <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#111b46]">
          Nota & Konfirmasi Buyer
        </p>
        <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-[#52655d]">
          Nota sudah dapat dicetak, tetapi arsip final menunggu buyer menekan Pembelian Selesai.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.5fr)] lg:items-stretch">
          <div className="rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 py-3 text-[0.76rem] font-bold text-[#52655d]">
            <div className="flex min-h-10 items-center justify-between gap-4">
              <span>Harga akhir lelang</span>
              <span className="whitespace-nowrap font-mono text-[#111b46]">{currency.format(paymentPrice)}</span>
            </div>
            <div className="border-t border-[#dfe7e2] pt-3">
              <div className="flex min-h-10 items-center justify-between gap-4">
                <span className="text-[0.66rem] font-black uppercase tracking-[0.06em] text-[#006747]">
                  Status Admin
                </span>
                <span className="text-right font-mono text-[0.9rem] font-black leading-tight text-[#006747]">
                  Terverifikasi
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-3 print:hidden">
            {canPrintReceipt ? (
              <VickreyReceiptPrintButton
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white shadow-[0_18px_34px_-24px_rgba(0,103,71,0.75)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99]"
                onPrint={handleReceiptPrint}
              />
            ) : (
              <Button
                className="h-12 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white"
                disabled
                title={receiptLockMessage ?? undefined}
              >
                <Printer className="size-4" />
                Cetak Nota
              </Button>
            )}
            {receiptLockMessage ? (
              <p className="text-[0.72rem] font-semibold leading-5 text-[#52655d]">{receiptLockMessage}</p>
            ) : null}
            <Button
              className="h-12 rounded-lg border border-[#d8e4de] bg-white px-5 text-[0.86rem] font-black text-[#6f83b6]"
              disabled
              variant="secondary"
            >
              <Clock3 className="size-4" />
              Menunggu Buyer Selesai
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">Total Pembayaran</p>
      <div className="mt-4 space-y-3 text-[0.8rem] font-bold text-[#111b46]">
        <div className="flex items-center justify-between gap-4">
          <span>Harga Bayar (Second Price)</span>
          <span className="font-mono">{currency.format(paymentPrice)}</span>
        </div>
        <div className="border-t border-[#edf2ee] pt-3">
          <div className="flex items-end justify-between gap-4">
            <span className="text-[0.84rem] font-black">Total Pembayaran</span>
            <span className="font-headline text-[1.55rem] font-black leading-none text-[#006747]">
              {currency.format(paymentPrice)}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-[#fde2a5] bg-[#fffbeb] px-3 py-2.5 text-[0.72rem] font-semibold leading-5 text-[#9a3412]">
          Status saat ini: <span className="font-black">{statusLabel}</span>. Menunggu pelunasan oleh pemenang hingga
          batas waktu yang ditentukan.
        </div>
      </div>
    </section>
  );
}

function getMarketingCategoryIcon(category: unknown) {
  const normalized = String(category ?? "").toLowerCase();

  if (normalized.includes("emas") || normalized.includes("perhias")) {
    return Gem;
  }
  if (normalized.includes("logam")) {
    return Medal;
  }
  if (normalized.includes("kendara") || normalized.includes("motor") || normalized.includes("mobil")) {
    return CarFront;
  }
  if (normalized.includes("elektronik") || normalized.includes("televisi") || normalized.includes("gadget")) {
    return MonitorSmartphone;
  }
  return Package2;
}

function buildMarketingPaymentReference(auction: MarketingSession) {
  if (auction.reference && auction.reference !== "-") {
    return auction.reference;
  }

  const seed = (auction.transactionId || auction.id).slice(0, 6).toUpperCase();

  return auction.paymentMethod === "BAYAR_LANGSUNG" ? `CASH-${seed}` : `PGJ-${seed}`;
}

function getVickreyVerificationAction(auction: MarketingSession) {
  if (!auction.transactionId) {
    return null;
  }

  if (auction.transactionStatus === "BUKTI_DIUNGGAH") {
    return {
      endpoint: `/api/admin/transaksi/${auction.transactionId}/verifikasi`,
      label: "Verifikasi pembayaran transfer",
      pendingTitle: "Memverifikasi pembayaran",
      pendingDescription: "Sistem sedang menutup transaksi transfer dan memperbarui status barang.",
      successTitle: "Pembayaran disetujui",
      successDescription: "Pembayaran sudah terverifikasi. Buyer dapat membuka nota dan menandai pembelian selesai.",
      note: "Periksa bukti transfer, nominal, referensi, dan nama buyer sebelum pembayaran disetujui.",
      icon: ReceiptText
    };
  }

  if (auction.transactionStatus === "MENUNGGU_KONFIRMASI_LANGSUNG") {
    return {
      endpoint: `/api/admin/transaksi/${auction.transactionId}/konfirmasi-langsung`,
      label: "Konfirmasi pembayaran langsung",
      pendingTitle: "Mengonfirmasi pembayaran",
      pendingDescription: "Status pembayaran langsung sedang ditandai terverifikasi.",
      successTitle: "Pembayaran langsung terverifikasi",
      successDescription: "Pembayaran langsung sudah dikonfirmasi. Tahap selesai menunggu konfirmasi buyer.",
      note: "Gunakan tindakan ini hanya jika dana tunai atau pembayaran loket sudah benar-benar diterima unit.",
      icon: WalletCards
    };
  }

  return null;
}

function getFixedPriceVerificationAction(auction: MarketingSession) {
  if (!auction.transactionId || !hasFixedPriceVerificationReady(auction)) {
    return null;
  }

  return {
    endpoint: `/api/admin/transaksi/${auction.transactionId}/verifikasi`,
    label: "Setujui Pembayaran",
    pendingTitle: "Memverifikasi pembayaran harga tetap",
    pendingDescription: "Sistem sedang memverifikasi pembayaran harga tetap dan membuka nota transaksi.",
    successTitle: "Pembayaran harga tetap disetujui",
    successDescription: "Pembayaran buyer sudah terverifikasi. Tahap selesai tetap menunggu buyer menekan Pembelian Selesai.",
    note: "Periksa bukti transfer, nominal harga jual, dan identitas buyer sebelum pembayaran disetujui.",
    icon: ReceiptText
  };
}

const fixedPriceRejectionReasons = [
  "Nominal uang yang dikirim tidak sesuai harga barang",
  "Uang dikirim bukan ke rekening tujuan"
] as const;

const fixedPriceRejectionReasonOptions: AdminSelectOption[] = [
  {
    value: "",
    label: "Pilih alasan penolakan"
  },
  {
    value: fixedPriceRejectionReasons[0],
    label: fixedPriceRejectionReasons[0]
  },
  {
    value: fixedPriceRejectionReasons[1],
    label: fixedPriceRejectionReasons[1]
  }
];

function VickreyPaymentVerificationModal({
  auction,
  onOpenChange,
  open
}: {
  auction: MarketingSession;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const action = getVickreyVerificationAction(auction);
  const paymentPrice = auction.finalPrice ?? auction.basePrice ?? 0;
  const reference = buildMarketingPaymentReference(auction);
  const referenceDisplay = reference.startsWith("#") ? reference : `#${reference}`;
  const CategoryIcon = getMarketingCategoryIcon(auction.category);
  const categoryLabel = humanize(auction.category);
  const paymentMethodLabel = auction.paymentMethod ? humanize(auction.paymentMethod) : "Bayar Langsung";
  const statusLabel =
    auction.transactionStatus === "MENUNGGU_KONFIRMASI_LANGSUNG"
      ? "MENUNGGU KONFIRMASI LANGSUNG"
      : humanize(auction.transactionStatus).toUpperCase();
  const isDirectPayment =
    auction.paymentMethod === "BAYAR_LANGSUNG" ||
    auction.transactionStatus === "MENUNGGU_KONFIRMASI_LANGSUNG";
  const serverNow = new Date().toISOString();

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[150] overflow-y-auto overscroll-contain px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] print:hidden sm:px-6 sm:py-6 lg:py-8">
      <button
        aria-label="Tutup pop up verifikasi pembayaran"
        className="fixed inset-0 bg-[#07131e]/60 backdrop-blur-[5px]"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <section
        aria-labelledby="vickrey-payment-verification-title"
        aria-modal="true"
        className="relative z-[151] mx-auto w-full max-w-[64rem] rounded-[2rem] border border-[#dce7e1] bg-white shadow-[0_42px_120px_-52px_rgba(3,21,14,0.82),0_18px_38px_-28px_rgba(8,69,50,0.24)]"
        role="dialog"
      >
        <div className="relative rounded-t-[2rem] bg-white px-5 pb-7 pt-10 sm:px-7 sm:pb-8 sm:pt-11">
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="grid size-16 place-items-center rounded-full border-[5px] border-white bg-[#006747] text-white shadow-[0_18px_30px_-18px_rgba(0,103,71,0.7)]">
              <CheckCircle2 className="size-6" strokeWidth={2.2} />
            </div>
          </div>
          <button
            aria-label="Tutup"
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-lg text-slate-400 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-100 hover:text-slate-700 active:scale-[0.97] sm:right-7 sm:top-7 sm:size-9"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <X className="size-4.5" strokeWidth={2.2} />
          </button>

          <div className="space-y-2 text-center">
            <h2
              className="mx-auto max-w-[42rem] font-headline text-[1.55rem] font-black leading-tight tracking-tight text-[#15231d] sm:text-[1.78rem]"
              id="vickrey-payment-verification-title"
            >
              Verifikasi Transaksi Pemenang Lelang
            </h2>
            <p className="mx-auto max-w-[36rem] text-[0.9rem] font-semibold leading-7 text-slate-500">
              Cocokkan nominal, pemenang, dan metode bayar sebelum transaksi dinyatakan terverifikasi.
            </p>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-7">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.46fr)_minmax(20rem,0.9fr)]">
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[1.05rem] border border-[#cce6da] bg-[radial-gradient(circle_at_88%_38%,rgba(46,196,125,0.20),transparent_27%),linear-gradient(135deg,#fbfffd_0%,#eef9f3_100%)] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
                <div className="relative z-10 sm:pr-28">
                  <p className="text-[0.82rem] font-semibold leading-none text-[#25312b]">
                    Jumlah Pelunasan yang Dibayarkan
                  </p>
                  <p className="mt-4 break-words font-headline text-[2.45rem] font-black leading-none tracking-[-0.055em] text-[#00593b] [font-variant-numeric:tabular-nums] sm:text-[3.2rem]">
                    {currency.format(paymentPrice)}
                  </p>
                </div>
                <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 items-center justify-center text-[#0a7b55]/42 sm:flex">
                  <div className="relative grid size-24 place-items-center rounded-[1.25rem] bg-[#dff4e7]/65 ring-1 ring-[#bfe4d0]/75">
                    <ReceiptText className="size-14" />
                    <span className="absolute -bottom-2 -right-2 grid size-9 place-items-center rounded-full bg-[#77d5a1] font-headline text-[0.82rem] font-black text-white ring-4 ring-white">
                      Rp
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <PaymentVerificationInfoCard
                  icon={CategoryIcon}
                  iconLabel={`Ikon kategori ${categoryLabel}`}
                  label="Barang Jaminan"
                  value={auction.lot}
                />
                <PaymentVerificationInfoCard
                  icon={UserRound}
                  label="Pemenang"
                  value={auction.buyerName || auction.winner || "-"}
                />
                <PaymentVerificationInfoCard icon={Hash} label="Kode Referensi" tone="code" value={referenceDisplay} />
                <PaymentVerificationInfoCard
                  icon={WalletCards}
                  label="Metode Bayar"
                  value={
                    <span className="inline-flex items-center gap-1.5 text-[#006747]">
                      <CheckCircle2 className="size-4" />
                      {paymentMethodLabel}
                    </span>
                  }
                />
              </div>

              <div className="flex flex-col gap-3 rounded-[1rem] border border-[#dfe8e3] bg-white px-4 py-4 text-[0.82rem] font-bold text-[#26342e] shadow-[0_18px_40px_-34px_rgba(8,69,50,0.28)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[0.75rem] bg-[#fff0f0] text-[#e11d48]">
                    <Clock3 className="size-5" />
                  </span>
                  <span>Batas Waktu Pelunasan:</span>
                </div>
                <span className="font-headline text-[0.92rem] font-black leading-5 text-[#dc2626] [font-variant-numeric:tabular-nums]">
                  {auction.paymentDeadline ? (
                    <AdminLiveCountdown
                      expiredLabel="Batas bayar terlewati"
                      fallbackLabel={dateLabel(auction.paymentDeadline)}
                      prefix="Sisa"
                      serverNow={serverNow}
                      targetAt={auction.paymentDeadline}
                    />
                  ) : (
                    "-"
                  )}
                </span>
              </div>
            </div>

            <div className="flex min-h-full flex-col justify-between gap-4 rounded-[1.05rem] border border-[#dde7e2] bg-white p-5 shadow-[0_20px_54px_-44px_rgba(8,69,50,0.38)]">
              <div className="space-y-5">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#f6c45f] bg-[#fff8eb] px-4 py-2 text-center text-[0.72rem] font-black uppercase leading-4 tracking-[0.055em] text-[#c15f00] shadow-[0_14px_30px_-24px_rgba(214,126,22,0.7)]">
                  <span className="size-2.5 shrink-0 rounded-full bg-[#f59e0b]" />
                  <span className="min-w-0 whitespace-normal break-words">{statusLabel}</span>
                </div>
                <p className="text-[0.9rem] font-semibold leading-6 text-[#47564f]">
                  {isDirectPayment
                    ? "Status pembayaran akan diperbarui setelah konfirmasi pembayaran tunai langsung dilakukan oleh Admin Unit."
                    : "Status pembayaran akan diperbarui setelah bukti dan nominal pembayaran diverifikasi oleh Admin Unit."}
                </p>
              </div>

              <div className="rounded-[1rem] border border-[#e5ebee] bg-[#f8faf9] p-4 text-[0.82rem] font-semibold leading-6 text-[#52625b]">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 size-5 shrink-0 text-[#006747]" />
                  <p>
                    Harga akhir mengikuti mekanisme lelang. Pemenang wajib membayar sesuai jumlah pelunasan yang sah
                    dan berlaku sebagaimana ditetapkan oleh sistem.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[1rem] border border-[#f5d48e] bg-[#fffbf2] p-4 text-[0.84rem] leading-6 text-[#6f4c16] shadow-[0_18px_44px_-38px_rgba(180,83,9,0.42)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="grid size-14 shrink-0 place-items-center rounded-[0.95rem] bg-[#fff5db] text-[#a16207] ring-1 ring-[#f4d08b]">
                <AlertTriangle className="size-8" />
              </span>
              <div className="min-w-0">
                <p className="font-headline text-[0.94rem] font-black leading-tight text-[#8a4b00]">
                  Perhatian: Keamanan Transaksi & Kepatuhan
                </p>
                <p className="mt-2 font-semibold">
                  Pastikan dana telah diterima secara tunai dan sesuai dengan jumlah yang tertera. Verifikasi dilakukan
                  secara cermat untuk menjaga keamanan transaksi, mencegah kecurangan, dan memastikan kepatuhan
                  terhadap ketentuan platform.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 rounded-b-[2rem] border-t border-[#edf2ee] bg-[#fbfdfb] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <Button
            className="min-h-12 w-full rounded-[0.82rem] border-[#dbe4df] bg-white px-9 text-[0.92rem] font-bold text-[#26342e] hover:bg-[#f6faf8] sm:w-auto"
            onClick={() => onOpenChange(false)}
            type="button"
            variant="secondary"
          >
            Batal
          </Button>
          {action ? (
            <AdminUnitActionButton
              className="min-h-12 w-full rounded-[0.82rem] bg-[#006747] px-7 text-[0.92rem] font-black text-white shadow-[0_18px_34px_-22px_rgba(0,103,71,0.72)] transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99] sm:w-auto"
              endpoint={action.endpoint}
              payload={{ reference }}
              pendingDescription={action.pendingDescription}
              pendingTitle={action.pendingTitle}
              successDescription={action.successDescription}
              successTitle={action.successTitle}
            >
              {action.label}
            </AdminUnitActionButton>
          ) : (
            <Button className="min-h-12 w-full rounded-[0.82rem] sm:w-auto" disabled>
              Belum bisa diverifikasi
            </Button>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}

function PaymentVerificationInfoCard({
  icon: Icon,
  hoverable = true,
  iconLabel,
  label,
  tone = "default",
  value
}: {
  icon: typeof Package2;
  hoverable?: boolean;
  iconLabel?: string;
  label: string;
  tone?: "default" | "code";
  value: ReactNode;
}) {
  return (
    <div
      className={`group flex min-w-0 items-center gap-3 rounded-[1rem] border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_16px_38px_-34px_rgba(8,69,50,0.32)] ${
        hoverable
          ? "transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#c7ded2] hover:bg-[#fbfdfb]"
          : ""
      }`}
    >
      <span
        aria-hidden={iconLabel ? undefined : true}
        aria-label={iconLabel}
        className="grid size-12 shrink-0 place-items-center rounded-[0.85rem] border border-[#cfe6dc] bg-[#edf8f2] text-[#006747] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]"
        role={iconLabel ? "img" : undefined}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.72rem] font-semibold leading-none text-[#64756e]">{label}</p>
        <div
          className={`mt-2 min-w-0 break-words text-[1rem] font-black leading-5 ${
            tone === "code" ? "font-mono text-[#006747]" : "text-[#101827]"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function VickreyPaymentVerificationButton({
  auction,
  className,
  label = "Verifikasi Pembayaran"
}: {
  auction: MarketingSession;
  className?: string;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const action = getVickreyVerificationAction(auction);

  if (!auction.transactionId || !action) {
    return (
      <Button className={className} disabled>
        <CheckCircle2 className="size-5" />
        {label}
      </Button>
    );
  }

  return (
    <>
      <button className={className} onClick={() => setIsOpen(true)} type="button">
        <CheckCircle2 className="size-5" />
        {label}
      </button>
      <VickreyPaymentVerificationModal auction={auction} onOpenChange={setIsOpen} open={isOpen} />
    </>
  );
}

function FixedPricePaymentVerificationModal({
  auction,
  onOpenChange,
  open
}: {
  auction: MarketingSession;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const action = getFixedPriceVerificationAction(auction);
  const isReadOnly = isMarketingPaymentVerifiedForReceipt(auction);
  const [isProofPreviewOpen, setIsProofPreviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const paymentPrice = auction.price ?? 0;
  const reference = buildMarketingPaymentReference(auction);
  const referenceDisplay = reference.startsWith("#") ? reference : `#${reference}`;
  const CategoryIcon = getMarketingCategoryIcon(auction.category);
  const categoryLabel = humanize(auction.category);
  const paymentMethodLabel = auction.paymentMethod ? humanize(auction.paymentMethod) : "Transfer Bank";
  const statusLabel = humanize(auction.transactionStatus).toUpperCase();
  const verificationStatusLabel = isReadOnly
    ? "PEMBAYARAN DISETUJUI"
    : auction.transactionStatus === "BUKTI_DIUNGGAH"
      ? "MENUNGGU VERIFIKASI STAF"
      : statusLabel;
  const serverNow = new Date().toISOString();
  const rejectEndpoint = auction.transactionId ? `/api/admin/transaksi/${auction.transactionId}/tolak-bukti` : undefined;
  const hasRejectionReason = rejectionReason.length > 0;

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setRejectionReason("");
      setIsProofPreviewOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isProofPreviewOpen) {
          setIsProofPreviewOpen(false);
          return;
        }
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProofPreviewOpen, onOpenChange, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="scrollbar-none fixed inset-0 z-[150] overflow-y-auto overscroll-contain px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] print:hidden sm:px-6 sm:py-6 lg:py-8">
      <button
        aria-label="Tutup pop up verifikasi pembayaran harga tetap"
        className="fixed inset-0 bg-[#07131e]/66 backdrop-blur-[5px]"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <section
        aria-labelledby="fixed-price-payment-verification-title"
        aria-modal="true"
        className="relative z-[151] mx-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[74rem] flex-col overflow-visible pt-8 sm:max-h-[calc(100dvh-2.5rem)] sm:pt-9"
        role="dialog"
      >
        <div className="pointer-events-none absolute left-1/2 top-8 z-20 -translate-x-1/2 -translate-y-1/2 sm:top-9">
          <div className="grid size-16 place-items-center rounded-full border-[5px] border-white bg-[#006747] text-white shadow-[0_18px_30px_-18px_rgba(0,103,71,0.7)]">
            <ShieldCheck className="size-6" strokeWidth={2.2} />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] border border-[#d8e4de] bg-white shadow-[0_42px_118px_-46px_rgba(3,21,14,0.84),0_18px_38px_-28px_rgba(8,69,50,0.24)]">
          <div className="relative shrink-0 rounded-t-[1.45rem] bg-white px-5 pb-7 pt-10 sm:px-7 sm:pb-8 sm:pt-11">
            <button
              aria-label="Tutup"
              className="absolute right-4 top-4 grid size-10 place-items-center rounded-lg text-slate-400 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-100 hover:text-slate-700 active:scale-[0.97] sm:right-7 sm:top-7 sm:size-9"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              <X className="size-4.5" strokeWidth={2.2} />
            </button>

            <div className="space-y-2 text-center">
              <h2
                className="mx-auto max-w-[42rem] font-headline text-[1.55rem] font-black leading-tight tracking-tight text-[#15231d] sm:text-[1.78rem]"
                id="fixed-price-payment-verification-title"
              >
                {isReadOnly ? "Detail Pembayaran Terverifikasi" : "Verifikasi Pelunasan Dana Harga Tetap"}
              </h2>
              <p className="mx-auto max-w-[36rem] text-[0.9rem] font-semibold leading-7 text-slate-500">
                {isReadOnly
                  ? "Informasi verifikasi sebelumnya hanya dapat dilihat dan tidak dapat diubah."
                  : "Pastikan bukti pembayaran sesuai dengan kewajiban nominal tetap."}
              </p>
            </div>
          </div>

          <div className="scrollbar-none min-h-0 overflow-y-auto px-4 py-4 sm:px-7 sm:py-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[1.05rem] border border-[#cce6da] bg-[radial-gradient(circle_at_88%_32%,rgba(46,196,125,0.18),transparent_29%),linear-gradient(135deg,#fbfffd_0%,#eef9f3_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.82rem] font-black leading-none text-[#18231e]">
                      Kewajiban Nominal Harga Tetap
                    </p>
                    <p className="mt-3 break-words font-headline text-[2.55rem] font-black leading-none tracking-[-0.04em] text-[#00593b] [font-variant-numeric:tabular-nums] sm:text-[3.15rem]">
                      {currency.format(paymentPrice)}
                    </p>
                  </div>
                  <div className="inline-flex h-12 max-w-full items-center gap-2 rounded-[0.8rem] border border-[#c9d7e9] bg-white px-4 font-headline text-[0.9rem] font-black text-[#111827] shadow-[0_18px_36px_-32px_rgba(15,23,42,0.35)]">
                    <span className="truncate">{auction.code ?? auction.lotId}</span>
                    <ClipboardList className="size-4.5 shrink-0 text-[#64748b]" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <PaymentVerificationInfoCard
                  icon={CategoryIcon}
                  iconLabel={`Ikon kategori ${categoryLabel}`}
                  label="Nama Barang"
                  hoverable={false}
                  value={auction.lot}
                />
                <PaymentVerificationInfoCard
                  icon={UserRound}
                  hoverable={false}
                  label="Nasabah / Buyer"
                  value={auction.buyerName || "-"}
                />
                <PaymentVerificationInfoCard
                  icon={Landmark}
                  hoverable={false}
                  label="Rekening Asal"
                  value={auction.buyerName ? `a.n. ${auction.buyerName}` : "-"}
                />
                <PaymentVerificationInfoCard
                  icon={WalletCards}
                  hoverable={false}
                  label="Virtual Account Tujuan"
                  value={paymentMethodLabel}
                />
              </div>

              <div className="rounded-[1rem] border border-[#dfe8e3] bg-white p-4 shadow-[0_18px_40px_-34px_rgba(8,69,50,0.28)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.84rem] font-black leading-none text-[#15231d]">
                    Bukti Transfer dari Pembeli
                  </p>
                  <span className="rounded-full border border-[#d7e3dd] bg-[#f8faf9] px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#52625b]">
                    {referenceDisplay}
                  </span>
                </div>
                {auction.proofUrl ? (
                  <div className="mt-3 overflow-hidden rounded-[0.9rem] border border-[#d4dce8] bg-[#1e293b]">
                    <div className="relative h-52 w-full overflow-hidden bg-[#111827] sm:h-60">
                      <Image
                        alt={`Bukti pembayaran ${auction.lot}`}
                        className="object-cover opacity-72 transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        fill
                        sizes="(min-width: 1280px) 44vw, (min-width: 768px) 60vw, 100vw"
                        src={auction.proofUrl}
                        unoptimized
                      />
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.08),transparent_34%,rgba(17,24,39,0.28))]" />
                      <button
                        aria-label="Buka fullscreen bukti pembayaran"
                        className="absolute right-4 top-4 z-[2] grid size-10 place-items-center rounded-full bg-white/94 text-[#264139] shadow-[0_18px_42px_rgba(8,69,50,0.08)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f7faf8] sm:right-5 sm:top-5"
                        onClick={() => setIsProofPreviewOpen(true)}
                        type="button"
                      >
                        <Maximize2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-[0.9rem] border border-dashed border-[#ccd8d2] bg-[#f8faf9] px-4 py-6 text-[0.85rem] font-semibold text-[#64756e]">
                    Bukti pembayaran belum tersedia.
                  </div>
                )}

                <div className="mt-3 flex flex-col gap-3 rounded-[0.9rem] border border-[#dfe8e3] bg-[#fbfdfb] px-4 py-3 text-[0.82rem] font-bold text-[#26342e] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[0.75rem] bg-[#fff0f0] text-[#e11d48]">
                      <Clock3 className="size-5" />
                    </span>
                    <span>Batas Waktu Pelunasan:</span>
                  </div>
                  <span className="font-headline text-[0.92rem] font-black leading-5 text-[#dc2626] [font-variant-numeric:tabular-nums]">
                    {auction.paymentDeadline ? (
                      <AdminLiveCountdown
                        expiredLabel="Batas bayar terlewati"
                        fallbackLabel={dateLabel(auction.paymentDeadline)}
                        prefix="Sisa"
                        serverNow={serverNow}
                        targetAt={auction.paymentDeadline}
                      />
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex min-h-full flex-col gap-4 rounded-[1.05rem] border border-[#f4c979] bg-[linear-gradient(180deg,#fffdf9_0%,#fff7f7_58%,#fffefe_100%)] p-4 shadow-[0_20px_54px_-44px_rgba(120,53,15,0.35)]">
              <div
                className={cn(
                  "rounded-[0.95rem] border px-4 py-4",
                  isReadOnly
                    ? "border-[#b9dec9] bg-[#eff9f3] shadow-[0_16px_34px_-30px_rgba(0,103,71,0.5)]"
                    : "border-[#fde3b2] bg-[#fff8eb] shadow-[0_16px_34px_-30px_rgba(214,126,22,0.7)]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={cn(
                      "inline-flex max-w-full items-center gap-2 rounded-full px-1 text-[0.78rem] font-black uppercase leading-4 tracking-[0.045em]",
                      isReadOnly ? "text-[#006747]" : "text-[#b45309]"
                    )}
                  >
                    <span
                      className={cn(
                        "size-3 shrink-0 rounded-full ring-4",
                        isReadOnly ? "bg-[#16a36a] ring-[#d7f2e3]" : "bg-[#f59e0b] ring-[#fff0cf]"
                      )}
                    />
                    <span className="min-w-0 whitespace-normal break-words">{verificationStatusLabel}</span>
                  </div>
                  {isReadOnly ? (
                    <CheckCircle2 className="size-7 shrink-0 text-[#087a50]" />
                  ) : (
                    <span className="size-7 shrink-0 animate-spin rounded-full border-[3px] border-[#f7c873] border-t-transparent" />
                  )}
                </div>
                <p className="mt-4 text-[0.88rem] font-semibold leading-6 text-[#47564f]">
                  {isReadOnly
                    ? "Pembayaran disetujui admin unit. Bukti, nominal, dan rekening tujuan berikut disimpan sebagai catatan verifikasi."
                    : "Pembayaran telah diterima. Cocokkan nominal transfer dan rekening tujuan sebelum transaksi harga tetap dicairkan."}
                </p>
              </div>

              {!isReadOnly ? (
                <div className="rounded-[0.95rem] border border-[#fecaca] bg-[linear-gradient(180deg,#fff7f7_0%,#fff1f2_100%)] px-4 py-4 shadow-[0_18px_34px_-28px_rgba(190,24,93,0.2)]">
                <label
                  className="block font-headline text-[0.88rem] font-black leading-tight text-[#991b1b]"
                  htmlFor="fixed-price-rejection-reason"
                >
                  Jika Ditolak, Pilih Alasan Penolakan
                </label>
                <div className="mt-4">
                  <AdminSelect
                    ariaLabel="Alasan penolakan pembayaran harga tetap"
                    allowWrap
                    className="[&_.admin-select-trigger]:h-auto [&_.admin-select-trigger]:min-h-14 [&_.admin-select-trigger]:items-start [&_.admin-select-trigger]:rounded-[1rem] [&_.admin-select-trigger]:border-[#006747]/35 [&_.admin-select-trigger]:bg-white [&_.admin-select-trigger]:px-4 [&_.admin-select-trigger]:py-3 [&_.admin-select-trigger]:text-[0.9rem] [&_.admin-select-trigger]:font-black [&_.admin-select-trigger]:text-[#111827] [&_.admin-select-trigger]:shadow-[0_18px_36px_-28px_rgba(15,23,42,0.26)] [&_.admin-select-trigger[aria-expanded='true']]:border-[#006747] [&_.admin-select-trigger[aria-expanded='true']]:shadow-[0_0_0_4px_rgba(189,232,208,0.55),0_20px_40px_-30px_rgba(0,103,71,0.4)] [&_.admin-select-trigger[data-active='true']]:border-[#006747]/55 [&_.admin-select-trigger[data-active='true']]:bg-white [&_.admin-select-trigger[data-active='true']]:text-[#111827] [&_.admin-select-menu]:border-[#cfe1d8] [&_.admin-select-menu]:shadow-[0_28px_58px_-34px_rgba(15,23,42,0.26)] [&_.admin-select-option]:min-h-[3.25rem] [&_.admin-select-option]:items-start [&_.admin-select-option]:py-3 [&_.admin-select-option]:text-[0.9rem] [&_.admin-select-option[data-active='true']]:bg-[#e7f5ed]"
                    id="fixed-price-rejection-reason"
                    onValueChange={setRejectionReason}
                    options={fixedPriceRejectionReasonOptions}
                    value={rejectionReason}
                  />
                </div>
              </div>
              ) : (
                <div className="rounded-[0.95rem] border border-[#cfe3d7] bg-white p-4 text-[0.84rem] leading-6 text-[#456057]">
                  <div className="flex items-start gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-[0.85rem] bg-[#e9f7ef] text-[#006747] ring-1 ring-[#c7e5d4]">
                      <ShieldCheck className="size-6" />
                    </span>
                    <div>
                      <p className="font-headline text-[0.92rem] font-black text-[#164b38]">Data verifikasi terkunci</p>
                      <p className="mt-1 font-semibold">
                        Hasil persetujuan ini hanya dapat dilihat untuk menjaga konsistensi riwayat transaksi.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isReadOnly ? (
                <div className="rounded-[0.95rem] border border-[#f5d48e] bg-[#fffbf2] p-4 text-[0.84rem] leading-6 text-[#6f4c16]">
                <div className="flex items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-[0.85rem] bg-[#fff5db] text-[#a16207] ring-1 ring-[#f4d08b]">
                    <AlertTriangle className="size-7" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-headline text-[0.92rem] font-black leading-tight text-[#7c3f00]">Perhatian</p>
                    <p className="mt-2 font-semibold">
                      Pastikan nominal yang diterima sesuai harga harga tetap dan dana masuk ke rekening tujuan unit.
                      Penolakan hanya dipakai jika bukti pembayaran tidak valid.
                    </p>
                  </div>
                </div>
              </div>
              ) : null}

              <div className="rounded-[0.95rem] border border-[#e5ebee] bg-white p-4 text-[0.82rem] font-semibold leading-6 text-[#52625b]">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 size-5 shrink-0 text-[#006747]" />
                  <p>
                    Fixed price dinyatakan terverifikasi setelah bukti bayar disetujui Admin Unit. Tahap selesai tetap
                    menunggu buyer menekan Pembelian Selesai.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex shrink-0 flex-col gap-3 border-t border-[#edf2ee] bg-[#fbfdfb] px-5 py-5 sm:flex-row sm:items-center sm:px-7",
            isReadOnly ? "sm:justify-end" : "sm:justify-between"
          )}
        >
          {!isReadOnly ? (hasRejectionReason && rejectEndpoint ? (
            <AdminUnitActionButton
              className="min-h-12 w-full rounded-[0.82rem] border border-[#dc2626] bg-white px-6 text-[0.92rem] font-black text-[#b91c1c] shadow-[0_18px_34px_-28px_rgba(185,28,28,0.46)] transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#fff1f2] active:scale-[0.99] sm:w-auto"
              endpoint={rejectEndpoint}
              payload={{ reason: rejectionReason }}
              pendingDescription="Sistem sedang mengembalikan transaksi ke buyer dengan alasan penolakan yang dipilih."
              pendingTitle="Menolak pembayaran harga tetap"
              successDescription="Buyer akan menerima alasan penolakan dan transaksi masuk arsip dibatalkan."
              successTitle="Pembayaran harga tetap ditolak"
              variant="secondary"
            >
              <X className="size-4.5" />
              Tolak Pembayaran
            </AdminUnitActionButton>
          ) : (
            <Button
              className="min-h-12 w-full rounded-[0.82rem] border border-[#f0b8b8] bg-white px-6 text-[0.92rem] font-black text-[#b91c1c] sm:w-auto"
              disabled
              type="button"
              variant="secondary"
            >
              <X className="size-4.5" />
              Tolak Pembayaran
            </Button>
          )) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              className="min-h-12 w-full rounded-[0.82rem] border-[#dbe4df] bg-white px-9 text-[0.92rem] font-bold text-[#26342e] shadow-[0_14px_30px_-28px_rgba(15,23,42,0.32)] hover:bg-[#f6faf8] sm:w-auto"
              onClick={() => onOpenChange(false)}
              type="button"
              variant="secondary"
            >
              Kembali
            </Button>

            {!isReadOnly ? (action && !hasRejectionReason ? (
              <AdminUnitActionButton
                className="min-h-12 w-full rounded-[0.82rem] bg-[#006747] px-7 text-[0.92rem] font-black text-white shadow-[0_18px_34px_-22px_rgba(0,103,71,0.72)] transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99] sm:w-auto"
                endpoint={action.endpoint}
                payload={{ reference }}
                pendingDescription={action.pendingDescription}
                pendingTitle={action.pendingTitle}
                successDescription={action.successDescription}
                successTitle={action.successTitle}
              >
                <CheckCircle2 className="size-4.5" />
                {action.label}
              </AdminUnitActionButton>
            ) : (
              <Button className="min-h-12 w-full rounded-[0.82rem] bg-[#006747] px-7 text-[0.92rem] font-black text-white sm:w-auto" disabled>
                <CheckCircle2 className="size-4.5" />
                {action?.label ?? "Setujui Pembayaran"}
              </Button>
            )) : null}
          </div>
        </div>
        </div>
      </section>
      {isProofPreviewOpen && auction.proofUrl ? (
        <div
          aria-label="Preview bukti pembayaran"
          aria-modal="true"
          className="fixed inset-0 z-[170] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#081b14]/72 px-3 py-3 backdrop-blur-md sm:px-6 sm:py-6"
          onClick={() => setIsProofPreviewOpen(false)}
          role="dialog"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,184,93,0.16),transparent_36%)]" />
          <div
            className="modal-viewport relative z-[171] my-auto w-full max-w-6xl rounded-[2rem] border border-white/28 bg-[linear-gradient(180deg,rgba(248,246,239,0.96),rgba(255,255,255,0.92))] p-2 shadow-[0_48px_120px_-40px_rgba(3,21,14,0.82)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] border border-black/5 bg-[#fbfbf8]">
              <div className="flex items-start justify-between gap-4 border-b border-black/6 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="font-body text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#8d6c08]">
                    Bukti Pembayaran
                  </p>
                  <h3 className="mt-1 truncate font-headline text-[1.35rem] font-black tracking-tight text-[#13211c]">
                    {auction.buyerName || auction.lot}
                  </h3>
                </div>
                <button
                  aria-label="Tutup preview bukti pembayaran"
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-black/8 bg-white text-primary transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f5f7f2] active:scale-[0.97]"
                  onClick={() => setIsProofPreviewOpen(false)}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>

                  <div className="bg-[linear-gradient(180deg,#f7f8f4,#eef1ea)] p-3 sm:p-4">
                    <div className="overflow-hidden rounded-[1.5rem] border border-black/6 bg-white shadow-[0_24px_60px_-36px_rgba(8,69,50,0.28)]">
                      <img
                        alt={`Preview bukti pembayaran ${auction.buyerName || auction.lot}`}
                        className="media-preview-frame w-full bg-[#f8f8f5] object-contain"
                        src={auction.proofUrl}
                      />
                    </div>
                  </div>
                </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body
  );
}

function FixedPricePaymentVerificationButton({
  auction,
  className,
  label = "Verifikasi Pembayaran"
}: {
  auction: MarketingSession;
  className?: string;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isReady = hasFixedPriceVerificationReady(auction);
  const isReadOnly = isMarketingPaymentVerifiedForReceipt(auction);

  if (!isReady && !isReadOnly) {
    return (
      <Button className={className} disabled>
        <ReceiptText className="size-5" />
        {label}
      </Button>
    );
  }

  return (
    <>
      <button className={className} onClick={() => setIsOpen(true)} type="button">
        <ReceiptText className="size-5" />
        {label}
      </button>
      <FixedPricePaymentVerificationModal auction={auction} onOpenChange={setIsOpen} open={isOpen} />
    </>
  );
}

function getMarketingReceiptImageUrl(auction: MarketingSession) {
  if (auction.primaryMedia?.type !== "video" && auction.primaryMedia?.url) {
    return auction.primaryMedia.url;
  }

  return auction.media?.find((item) => item.type !== "video")?.url ?? undefined;
}

function getVickreyReceiptTerms(auction: MarketingSession) {
  const unitName = auction.unitName || auction.unitAddress || "-";

  return [
    "Tunjukkan nota ini beserta kartu identitas asli (KTP) saat pengambilan barang.",
    `Pengambilan barang dilakukan di unit ${unitName}.`,
    "Pembayaran hasil lelang sudah diverifikasi admin unit dan nota ini sah sebagai bukti pembelian.",
    "Simpan nota ini untuk keperluan administrasi atau pengambilan barang."
  ];
}

function isMarketingPaymentVerifiedForReceipt(auction: MarketingSession) {
  return auction.transactionStatus === "LUNAS" || auction.transactionStatus === "SELESAI";
}

function getMarketingReceiptLockMessage(auction: MarketingSession) {
  return isMarketingPaymentVerifiedForReceipt(auction) && !auction.handoverProofUrl
    ? "Nota belum tersedia. Unggah dokumentasi serah-terima barang fisik terlebih dahulu."
    : null;
}

function getFixedPriceReceiptPrintRootId(auction: MarketingSession) {
  return `fixed-price-receipt-print-root-${String(auction.transactionId || auction.id).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function getFixedPriceReceiptTerms(auction: MarketingSession) {
  const unitName = auction.unitName || auction.unitAddress || "-";

  return [
    "Tunjukkan nota ini beserta kartu identitas asli (KTP) saat pengambilan barang.",
    `Pengambilan barang dilakukan di unit ${unitName}.`,
    "Pembayaran harga tetap sudah diverifikasi admin unit dan nota ini sah sebagai bukti pembelian.",
    "Simpan nota ini untuk keperluan administrasi atau pengambilan barang."
  ];
}

function getMarketingPaymentMethodLabel(auction: MarketingSession) {
  if (auction.paymentMethod === "BAYAR_LANGSUNG") {
    return "Langsung di unit";
  }

  if (auction.paymentMethod === "TRANSFER_BANK") {
    return "Transfer Bank";
  }

  return auction.paymentMethod ? humanize(auction.paymentMethod) : "Bayar Langsung";
}

function FixedPriceReceiptInlinePrint({
  auction,
  buttonClassName,
  disabledReason,
  label = "Cetak Nota"
}: {
  auction: MarketingSession;
  buttonClassName: string;
  disabledReason?: string | null;
  label?: string;
}) {
  const total = auction.price ?? auction.finalPrice ?? auction.basePrice ?? 0;
  const imageUrl = getMarketingReceiptImageUrl(auction);
  const isCompleted = auction.transactionStatus === "SELESAI";
  const paymentMethodLabel = getMarketingPaymentMethodLabel(auction);
  const verifiedAt = dateLabel(auction.soldAt ?? auction.paymentDeadline ?? auction.startsAt);
  const reference = buildMarketingPaymentReference(auction).replace(/^#/, "");

  return (
    <TransactionReceiptInlinePrint
      buttonClassName={buttonClassName}
      disabledReason={disabledReason}
      label={label}
      rootId={getFixedPriceReceiptPrintRootId(auction)}
    >
      <TransactionReceiptDocument
        buyerEmail={auction.buyerEmail ?? undefined}
        buyerName={auction.buyerName || auction.winner || "-"}
        buyerPhone={auction.buyerPhone ?? undefined}
        extraMeta={[{ label: "Jenis transaksi", value: "Harga Tetap" }]}
        footerText="Dokumen ini diterbitkan oleh admin unit Ruang Agunan."
        handoverByName={auction.handoverProofUploadedBy ?? undefined}
        imageUrl={imageUrl}
        itemSubtitle={paymentMethodLabel}
        itemTitle={auction.lot}
        noteNumber={reference}
        paymentMethodLabel={paymentMethodLabel}
        statusLabel={isCompleted ? getMarketingCompletionLabel(auction) : "Terverifikasi admin"}
        subtotal={total}
        terms={getFixedPriceReceiptTerms(auction)}
        total={total}
        transactionId={auction.transactionId || auction.id}
        unitAddress={auction.unitAddress || "-"}
        unitName={auction.unitName || auction.unitAddress || "-"}
        receiverName={auction.buyerName || auction.winner || "-"}
        verifiedByName={auction.verifiedBy ?? undefined}
        verifiedAt={verifiedAt}
        outputLayout
      />
    </TransactionReceiptInlinePrint>
  );
}

function VickreyReceiptPrintSheet({
  auction,
  rootId
}: {
  auction: MarketingSession;
  rootId: string;
}) {
  const total = auction.finalPrice ?? auction.basePrice ?? auction.price ?? 0;
  const reference = buildMarketingPaymentReference(auction).replace(/^#/, "");
  const imageUrl = getMarketingReceiptImageUrl(auction);
  const isCompleted = auction.transactionStatus === "SELESAI";
  const verifiedAt = dateLabel(auction.soldAt ?? auction.paymentDeadline ?? auction.endingAt);
  const paymentMethodLabel = auction.paymentMethod === "BAYAR_LANGSUNG" ? "Langsung di unit" : humanize(auction.paymentMethod);

  return (
    <div
      className="vickrey-receipt-print-document hidden bg-white text-[#10251c] print:block"
      data-testid="vickrey-receipt-print-document"
      id={rootId}
    >
      <TransactionReceiptDocument
        buyerEmail={auction.buyerEmail ?? undefined}
        buyerName={auction.buyerName || auction.winner || "-"}
        buyerPhone={auction.buyerPhone ?? undefined}
        extraMeta={[{ label: "Jenis transaksi", value: "Lelang" }]}
        footerText="Dokumen ini diterbitkan oleh admin unit Ruang Agunan."
        handoverByName={auction.handoverProofUploadedBy ?? undefined}
        imageUrl={imageUrl}
        itemSubtitle={paymentMethodLabel}
        itemTitle={auction.lot}
        noteNumber={reference}
        paymentMethodLabel={paymentMethodLabel}
        statusLabel={isCompleted ? getMarketingCompletionLabel(auction) : "Terverifikasi admin"}
        subtotal={total}
        terms={getVickreyReceiptTerms(auction)}
        total={total}
        transactionId={auction.transactionId || auction.id}
        unitAddress={auction.unitAddress || "-"}
        unitName={auction.unitName || auction.unitAddress || "-"}
        receiverName={auction.buyerName || auction.winner || "-"}
        verifiedByName={auction.verifiedBy ?? undefined}
        verifiedAt={verifiedAt}
        outputLayout
      />
    </div>
  );
}

async function waitForVickreyReceiptPrintAssets(root: HTMLElement) {
  const ownerDocument = root.ownerDocument || document;
  const ownerWindow = ownerDocument.defaultView || window;

  if ("fonts" in ownerDocument) {
    await Promise.race([
      ownerDocument.fonts.ready.catch(() => undefined),
      new Promise((resolve) => ownerWindow.setTimeout(resolve, 320))
    ]);
  }

  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          let fallback: number | undefined;
          const finish = async () => {
            if (fallback) {
              ownerWindow.clearTimeout(fallback);
            }
            if (image.naturalWidth > 0 && "decode" in image) {
              try {
                await image.decode();
              } catch {
                // Continue printing with the loaded bitmap even if decode rejects.
              }
            }
            resolve();
          };

          if (image.complete && image.naturalWidth > 0) {
            void finish();
            return;
          }

          fallback = ownerWindow.setTimeout(() => void finish(), 360);

          image.addEventListener("load", () => void finish(), { once: true });
          image.addEventListener("error", finish, { once: true });
        })
    )
  );

  await new Promise((resolve) => ownerWindow.setTimeout(resolve, 40));
}

function VickreyReceiptPrintButton({
  className,
  onPrint
}: {
  className: string;
  onPrint: () => Promise<void>;
}) {
  const handleClick = () => {
    void onPrint();
  };

  return (
    <button className={className} onClick={handleClick} type="button">
      <Printer className="size-4" />
      Cetak Nota
    </button>
  );
}

function VickreyWinnerActionFooter({
  auction,
  onPrintReceipt
}: {
  auction: MarketingSession;
  onPrintReceipt: () => Promise<void>;
}) {
  const receiptLockMessage = getMarketingReceiptLockMessage(auction);
  const canPrintReceipt = Boolean(auction.transactionId && !receiptLockMessage);

  if (isVickreyPaymentFulfilled(auction)) {
    return (
      <div className="grid gap-3 print:hidden">
        {canPrintReceipt ? (
          <VickreyReceiptPrintButton
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d8e4de] bg-white px-5 text-[0.86rem] font-black text-[#111b46] shadow-[0_18px_34px_-28px_rgba(8,69,50,0.28)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#f8faf9] active:scale-[0.99]"
            onPrint={onPrintReceipt}
          />
        ) : (
          <Button
            className="h-12 rounded-lg border border-[#d8e4de] bg-white px-5 text-[0.86rem] font-black text-[#111b46]"
            disabled
            title={receiptLockMessage ?? undefined}
            variant="secondary"
          >
            <Printer className="size-4" />
            Cetak Nota
          </Button>
        )}
        {receiptLockMessage ? (
          <p className="text-[0.72rem] font-semibold leading-5 text-[#52655d]">{receiptLockMessage}</p>
        ) : null}
        <Link
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white shadow-[0_18px_34px_-24px_rgba(0,103,71,0.75)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99]"
          href="/admin/pemasaran"
        >
          <LockKeyhole className="size-4.5" />
          Tutup & Arsipkan Berkas Lelang
        </Link>
      </div>
    );
  }

  if (isVickreyPaymentVerified(auction)) {
    return (
      <div className="grid gap-3 print:hidden">
        {canPrintReceipt ? (
          <VickreyReceiptPrintButton
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white shadow-[0_18px_34px_-24px_rgba(0,103,71,0.75)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99]"
            onPrint={onPrintReceipt}
          />
        ) : (
          <Button
            className="h-12 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white"
            disabled
            title={receiptLockMessage ?? undefined}
          >
            <Printer className="size-4" />
            Cetak Nota
          </Button>
        )}
        {receiptLockMessage ? (
          <p className="text-[0.72rem] font-semibold leading-5 text-[#52655d]">{receiptLockMessage}</p>
        ) : null}
        <Button
          className="h-12 rounded-lg border border-[#d8e4de] bg-white px-5 text-[0.86rem] font-black text-[#111b46]"
          disabled
          variant="secondary"
        >
          <CheckCircle2 className="size-4" />
          Menunggu Buyer Selesai
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 print:hidden">
      <VickreyPaymentVerificationButton
        auction={auction}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white shadow-[0_18px_34px_-24px_rgba(0,103,71,0.75)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
      />
    </div>
  );
}

function VickreyFailureBanner({ auction }: { auction: MarketingSession }) {
  const failureKind = getVickreyFailureKind(auction);
  const unpaid = failureKind === "unpaid";

  return (
    <section className="rounded-[1.1rem] border border-[#fecaca] bg-[#fff1f2] px-4 py-4 shadow-[0_18px_42px_-36px_rgba(185,28,28,0.34)] print:shadow-none">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#b91c1c] text-white shadow-[0_18px_30px_-20px_rgba(185,28,28,0.72)]">
            <AlertTriangle className="size-7" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <h2 className="font-headline text-[1rem] font-black uppercase tracking-[0.02em] text-[#7f1d1d] sm:text-[1.12rem]">
              {unpaid ? "Lelang Gagal - Pemenang Dikenakan Sanksi" : "Lelang Gagal - Tidak Ada Peserta"}
            </h2>
            <p className="mt-1 max-w-3xl text-[0.8rem] font-semibold leading-5 text-[#9f1239]">
              {unpaid
                ? "Pemenang tidak melakukan pelunasan dalam batas waktu 24 jam setelah hasil lelang diumumkan, sehingga sesi dinyatakan gagal dan akun pemenang dikenai sanksi."
                : "Sesi berakhir tanpa peserta yang mengirim bid, sehingga tidak ada pemenang dan barang perlu dijadwalkan untuk lelang ulang."}
            </p>
          </div>
        </div>

        <div className="border-t border-[#fecdd3] pt-3 lg:min-w-[20rem] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <span className="inline-flex rounded-full border border-[#fecaca] bg-white/72 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-[#991b1b]">
            Status Arsip
          </span>
          <p className="mt-2 font-headline text-[0.92rem] font-black uppercase tracking-[0.01em] text-[#7f1d1d]">
            {unpaid ? "Batas 24 Jam Terlewati" : "Tidak Ada Bid Masuk"}
          </p>
          <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-[#9f1239]">
            {dateLabel(auction.endingAt)} - {auction.code || auction.id}
          </p>
        </div>
      </div>
    </section>
  );
}

function VickreyFailureProfilePanel({ auction }: { auction: MarketingSession }) {
  const failureKind = getVickreyFailureKind(auction);
  const unpaid = failureKind === "unpaid";
  const winnerName = auction.buyerName || auction.winner || "Pemenang tidak tercatat";
  const winnerBid = getWinnerBid(auction);
  const winnerId = winnerBid?.bidderId || auction.buyerNationalId || auction.reference || "-";

  return (
    <section className="relative overflow-hidden rounded-xl border border-[#e5d8d8] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(127,29,29,0.34)]">
      <X className="pointer-events-none absolute -right-5 -top-6 size-24 text-[#fff1f2]" strokeWidth={2.6} />
      <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
        {unpaid ? "Manifes Penyerahan & Pemenang" : "Manifes Kegagalan Sesi"}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.56fr)] md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span
            className={`grid size-14 shrink-0 place-items-center rounded-full border font-headline text-[1.1rem] font-black ${
              unpaid ? "border-[#fecaca] bg-[#fff1f2] text-[#991b1b]" : "border-[#dfe7e2] bg-[#eef3f1] text-[#006747]"
            }`}
          >
            {unpaid ? getInitials(winnerName) : <UsersRound className="size-6" />}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-headline text-[1.08rem] font-black leading-tight text-[#111b46]">
              {unpaid ? winnerName : "Pemenang Belum Tersedia"}
            </h3>
            <p className="mt-2 text-[0.74rem] font-bold leading-5 text-[#52655d]">
              {unpaid ? (
                <>
                  Member ID: <span className="font-mono text-[#111b46]">{winnerId}</span>
                </>
              ) : (
                "Tidak ada peserta mengirim bid pada sesi ini."
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-2 border-t border-[#edf2ee] pt-3 text-[0.76rem] font-bold text-[#111b46] md:border-l md:border-t-0 md:pl-5 md:pt-0">
          {unpaid ? (
            <>
              <p className="flex min-w-0 items-center gap-2">
                <Phone className="size-4 shrink-0 text-[#40558b]" />
                <span className="min-w-0 truncate">{auction.buyerPhone || "Nomor telepon belum tercatat"}</span>
              </p>
              <p className="flex min-w-0 items-center gap-2">
                <Mail className="size-4 shrink-0 text-[#40558b]" />
                <span className="min-w-0 truncate font-mono text-[0.72rem]">
                  {auction.buyerEmail || "email-belum-tercatat"}
                </span>
              </p>
            </>
          ) : (
            <>
              <p className="flex min-w-0 items-center gap-2">
                <UsersRound className="size-4 shrink-0 text-[#40558b]" />
                <span>{auction.participants ?? 0} peserta tercatat</span>
              </p>
              <p className="flex min-w-0 items-center gap-2">
                <Gavel className="size-4 shrink-0 text-[#40558b]" />
                <span>Tidak ada penawaran valid</span>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#edf2ee] pt-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#b91c1c] px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.06em] text-white">
          <X className="size-3.5" />
          {unpaid ? "Gagal Pelunasan" : "0 Peserta"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f59e0b] px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.06em] text-white">
          <AlertTriangle className="size-3.5" />
          {unpaid ? "Pelanggaran Dicatat" : "Siap Lelang Ulang"}
        </span>
      </div>
    </section>
  );
}

function VickreyFailureMechanismPanel({ auction }: { auction: MarketingSession }) {
  const failureKind = getVickreyFailureKind(auction);
  const unpaid = failureKind === "unpaid";
  const highestBid = getHighestBidAmount(auction);
  const paymentPrice = auction.finalPrice ?? auction.basePrice ?? null;

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <div className="flex items-center gap-2">
        <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
          Mekanisme Lelang (Arsip)
        </p>
        <Info className="size-3.5 text-[#2f6fff]" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 overflow-hidden rounded-lg border border-[#d6efe1] bg-[#f1fbf6] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#006747]">Penawaran Tertinggi</p>
          <p className={`mt-2 max-w-full whitespace-nowrap font-headline font-black leading-tight tracking-tight text-[#006747] [font-variant-numeric:tabular-nums] ${getCompactCurrencyTextClass(highestBid)}`}>
            {unpaid ? formatOptionalCurrency(highestBid) : "Belum ada bid"}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#2f6a52]">
            {unpaid ? "Bid tertinggi dari pemenang gagal bayar" : "Tidak ada penawaran yang tersimpan"}
          </p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-lg border border-[#fde2a5] bg-[#fff8e7] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#92400e]">{unpaid ? "Harga Bayar" : "Harga Dasar"}</p>
          <p className={`mt-2 max-w-full whitespace-nowrap font-headline font-black leading-tight tracking-tight text-[#f59e0b] [font-variant-numeric:tabular-nums] ${getCompactCurrencyTextClass(paymentPrice)}`}>
            {formatOptionalCurrency(paymentPrice)}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#b45309]">
            {unpaid ? "Nilai final sebelum sesi dibatalkan" : "Nilai awal untuk penjadwalan ulang"}
          </p>
        </div>

        <div className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#991b1b]">Status Lelang</p>
          <span className="mt-2 inline-flex min-w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-[#b91c1c] px-3 py-1 text-[0.62rem] font-black uppercase text-white">
            {unpaid ? "Batal / Gagal" : "Tanpa Bid"}
            <X className="size-3.5" />
          </span>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#9f1239]">
            {unpaid ? "Pemenang gagal memenuhi batas bayar" : "Sesi belum menghasilkan pemenang"}
          </p>
        </div>

        <div className="rounded-lg border border-[#e7ece9] bg-[#f8faf9] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#40558b]">Waktu Pelaksanaan</p>
          <p className="mt-2 font-mono text-[0.76rem] font-black leading-tight text-[#111b46]">
            {dateLabel(auction.endingAt)}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#40558b]">
            Tanggal sesi ditutup
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 rounded-lg border border-[#edf2ee] bg-[#f8faf9] px-3 py-2.5 text-[0.72rem] font-semibold leading-5 text-[#52655d] sm:grid-cols-3">
        <p>
          <span className="block text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
            Mekanisme
          </span>
          e-Bidding - Lelang Tertutup
        </p>
        <p>
          <span className="block text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
            Hasil
          </span>
          {unpaid ? auction.buyerName || auction.winner || "-" : "Belum menghasilkan pemenang"}
        </p>
        <p>
          <span className="block text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
            Tanggal Arsip
          </span>
          {getVickreyArchiveDate(auction)}
        </p>
      </div>
    </section>
  );
}

function VickreyFailureRankingTable({ auction }: { auction: MarketingSession }) {
  const rows = [...(auction.bids ?? [])].sort((left, right) => (left.rank || 0) - (right.rank || 0));

  return (
    <section className="overflow-hidden rounded-xl border border-[#dfe7e2] bg-white shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <div className="border-b border-[#edf2ee] bg-[#fbfcfb] px-4 py-3">
        <h3 className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
          Bidders Ranking Table (Arsip)
        </h3>
      </div>
      <table className="w-full table-fixed text-left text-[0.72rem]">
        <colgroup>
          <col className="w-[7%]" />
          <col className="w-[25%]" />
          <col className="w-[22%]" />
          <col className="w-[24%]" />
          <col className="w-[22%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-[#edf2ee] bg-[#f8faf9] text-[0.56rem] font-black uppercase tracking-[0.04em] text-[#40558b] sm:text-[0.6rem]">
            <th className="px-2 py-2.5 text-center">#</th>
            <th className="px-2 py-2.5">Nama Peserta</th>
            <th className="px-2 py-2.5">Waktu Penawaran</th>
            <th className="px-2 py-2.5 text-right">Nominal Penawaran</th>
            <th className="px-2 py-2.5 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2ee] font-bold text-[#111b46]">
          {rows.length ? (
            rows.map((bid) => {
              const rowTone = bid.isWinner ? "bg-[#fff1f2]" : bid.determinesFinalPrice ? "bg-[#fff8e7]" : "bg-white";
              const status = bid.isWinner ? "Gagal / Pelanggaran" : bid.determinesFinalPrice ? "Harga Pembanding" : "Tidak Menang";
              const statusTone = bid.isWinner
                ? "bg-[#b91c1c] text-white"
                : bid.determinesFinalPrice
                  ? "bg-[#f59e0b] text-white"
                  : "bg-[#eef2f0] text-[#40558b]";

              return (
                <tr className={`${rowTone} transition-colors duration-200 hover:bg-[#fef2f2]`} key={bid.id}>
                  <td className="px-2 py-2.5 text-center font-mono text-[#991b1b]">{bid.rank}</td>
                  <td className="break-words px-2 py-2.5 text-[0.68rem] leading-4 sm:text-[0.72rem]">
                    {bid.bidderName}
                  </td>
                  <td className="break-words px-2 py-2.5 font-mono text-[0.62rem] leading-4 text-[#40558b]">
                    {bid.submittedAtLabel}
                  </td>
                  <td className="break-words px-2 py-2.5 text-right font-mono text-[0.68rem] font-black leading-4">
                    {formatOptionalCurrency(bid.amount)}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className={`inline-flex max-w-full items-center justify-center gap-1 rounded-full px-2 py-1 text-[0.55rem] font-black uppercase leading-3 sm:text-[0.58rem] ${statusTone}`}>
                      {bid.isWinner ? <X className="size-3" /> : bid.determinesFinalPrice ? <ReceiptText className="size-3" /> : <CheckCircle2 className="size-3" />}
                      <span className="min-w-0 whitespace-normal break-words text-center">{status}</span>
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="px-4 py-5 text-center text-[0.78rem] font-semibold leading-5 text-[#52655d]" colSpan={5}>
                Belum ada peserta yang mengirim penawaran.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="border-t border-[#edf2ee] bg-[#fbfcfb] px-4 py-2.5 text-[0.68rem] font-black text-[#40558b]">
        Total {auction.participants ?? rows.length} peserta
      </div>
    </section>
  );
}

function VickreyFailureAssetPanel({ auction }: { auction: MarketingSession }) {
  const media = auction.primaryMedia ?? auction.media?.[0] ?? null;
  const isVideo = isMarketingVideoMedia(media);
  const detailRows = getVickreyAssetDetailRows(auction, true);

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
        Detail Aset Lelang (Arsip)
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,0.9fr)] sm:items-center">
        <div className="aspect-[16/9] overflow-hidden rounded-lg border border-[#edf2ee] bg-[#f6f2eb]">
          {media ? (
            isVideo ? (
              <video className="size-full object-cover" muted playsInline preload="metadata" src={media.url} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`Foto ${auction.lot}`} className="size-full object-cover" src={media.url} />
            )
          ) : (
            <div className="grid size-full place-items-center text-sm font-semibold text-[#8a9891]">
              Media barang belum tersedia
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-headline text-[1.1rem] font-black leading-tight text-[#111b46]">
            {auction.lot}
          </h3>
          <div className="mt-4 divide-y divide-[#edf2ee] text-[0.76rem] font-bold text-[#111b46]">
            {detailRows.map(({ label, value }) => (
              <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2 first:pt-0" key={label}>
                <span className="text-[#40558b]">{label}</span>
                <span className="min-w-0 break-words text-right">{value}</span>
              </div>
            ))}
          </div>
          <Link href={`/admin/barang/${auction.lotId}`}>
            <Button className="mt-3 w-full justify-between rounded-lg border-[#d8e4de] text-[0.78rem]" variant="secondary">
              Lihat Detail Aset
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function VickreyFailureProgressPanel({ auction }: { auction: MarketingSession }) {
  const unpaid = getVickreyFailureKind(auction) === "unpaid";
  const steps = unpaid
    ? [
        { label: "Pemenang Diumumkan", status: "Selesai", actor: "Sistem", occurredAt: dateLabel(auction.endingAt), icon: Trophy, tone: "done" as const },
        { label: "Gagal Bayar", status: "Terjadi", actor: "Sistem", occurredAt: dateLabel(auction.paymentDeadline), icon: X, tone: "failed" as const },
        { label: "Selesai", status: "Belum tercapai", icon: CheckCircle2, tone: "pending" as const }
      ]
    : [
        { label: "Sesi Ditutup", status: "Selesai", actor: "Sistem", occurredAt: dateLabel(auction.endingAt), icon: CheckCircle2, tone: "done" as const },
        { label: "Tanpa Bid", status: "Terjadi", actor: "Sistem", occurredAt: dateLabel(auction.endingAt), icon: X, tone: "failed" as const },
        { label: "Lelang Ulang", status: "Belum dijadwalkan", icon: RefreshCcw, tone: "pending" as const }
      ];

  return <CompactTransactionProgress steps={steps} title="Progress Penyelesaian" />;
}

function VickreyFailureActionFooter({
  onRelist
}: {
  onRelist: () => void;
}) {
  return (
    <div className="grid gap-3 print:hidden">
      <button
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white shadow-[0_18px_34px_-24px_rgba(0,103,71,0.75)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99]"
        onClick={onRelist}
        type="button"
      >
        <RefreshCcw className="size-4.5" />
        Jadwalkan Pasarkan Ulang
      </button>
    </div>
  );
}

function VickreyFailureAuditFooter({ auction }: { auction: MarketingSession }) {
  const unpaid = getVickreyFailureKind(auction) === "unpaid";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#dfe7e2] bg-[#fbfcfb] px-4 py-3 text-[0.72rem] font-semibold leading-5 text-[#52655d] sm:flex-row sm:items-center sm:justify-between">
      <p className="flex min-w-0 items-start gap-2">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#7eb7a5]" />
        <span>
          {unpaid
            ? "Riwayat gagal bayar, pelanggaran pemenang, dan ranking bid diarsipkan sebagai bukti audit."
            : "Riwayat sesi tanpa peserta diarsipkan sebagai dasar penjadwalan lelang ulang."}
        </span>
      </p>
      <span className="font-mono text-[0.66rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
        {auction.id}
      </span>
    </div>
  );
}

function VickreyFailedArchiveWorkspace({ auction }: { auction: MarketingSession }) {
  const [isRelistModalOpen, setIsRelistModalOpen] = useState(false);
  const serverNow = useMemo(() => new Date().toISOString(), []);

  return (
    <div className="space-y-4 print:space-y-3">
      <VickreyFailureBanner auction={auction} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <div className="space-y-4">
          <VickreyFailureProfilePanel auction={auction} />
          <VickreyFailureMechanismPanel auction={auction} />
          <VickreyFailureRankingTable auction={auction} />
        </div>

        <div className="space-y-4 lg:sticky lg:top-4">
          <VickreyFailureAssetPanel auction={auction} />
          <VickreyFailureProgressPanel auction={auction} />
          <MarketingPerformancePanel insights={auction.insights} testId="admin-vickrey-failure-performance-panel" />
          <VickreyFailureActionFooter onRelist={() => setIsRelistModalOpen(true)} />
        </div>
      </div>

      <VickreyFailureAuditFooter auction={auction} />

      {isRelistModalOpen ? (
        <AdminMarketingForm
          barangId={auction.lotId}
          defaultMode="vickrey"
          defaultPrice={Number(auction.basePrice ?? auction.price ?? auction.appraisalValue ?? 1000000)}
          endpoint={`/api/admin/barang/${auction.lotId}/pasarkan-ulang`}
          heroIcon={<RefreshCcw className="size-6 text-white" strokeWidth={2.2} />}
          onCancel={() => setIsRelistModalOpen(false)}
          presentation="modal"
          redirectTo="/admin/pemasaran"
          serverNow={serverNow}
          submitIcon={<RefreshCcw className="size-4" />}
          submitLabel="Lelang lagi"
          successDescription="Barang sudah aktif kembali sebagai sesi lelang baru."
          successTitle="Barang dilelang ulang"
        />
      ) : null}
    </div>
  );
}

function VickreyWinnerSettlementWorkspace({ auction }: { auction: MarketingSession }) {
  const [isPrintSheetReady, setIsPrintSheetReady] = useState(false);
  const hasIntegratedNoteActions = isVickreyPaymentVerified(auction) || isVickreyPaymentFulfilled(auction);
  const receiptPrintRootId = useMemo(
    () => `vickrey-receipt-print-root-${(auction.transactionId || auction.id).replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    [auction.id, auction.transactionId]
  );

  useEffect(() => {
    if (!isPrintSheetReady) {
      return;
    }

    const clearPrintSheet = () => setIsPrintSheetReady(false);

    window.addEventListener("afterprint", clearPrintSheet);

    return () => window.removeEventListener("afterprint", clearPrintSheet);
  }, [isPrintSheetReady]);

  const handlePrintReceipt = useCallback(async () => {
    if (getMarketingReceiptLockMessage(auction)) {
      return;
    }

    flushSync(() => setIsPrintSheetReady(true));
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));

    const root = document.getElementById(receiptPrintRootId);

    if (root) {
      await waitForVickreyReceiptPrintAssets(root);
    }

    if (root && shouldUseIsolatedReceiptPrintFrame()) {
      await printReceiptElementInIsolatedFrame(root);
      setIsPrintSheetReady(false);
      return;
    }

    window.print();
  }, [auction, receiptPrintRootId]);

  return (
    <div className="space-y-4 print:space-y-0">
      <div className={isPrintSheetReady ? "space-y-4 print:hidden" : "space-y-4 print:space-y-3"}>
        <VickreySettlementDeadlineBanner auction={auction} />

        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
          <div className="space-y-4">
            <VickreyWinnerProfilePanel auction={auction} />
            <VickreyMechanismPanel auction={auction} />
            <VickreyWinnerRankingTable auction={auction} />
            <div className="flex items-center gap-2 px-1 text-[0.72rem] font-semibold text-[#6f83b6]">
              <ShieldCheck className="size-4 text-[#7eb7a5]" />
              Seluruh data dilindungi sistem keamanan berlapis dan tidak dapat diubah secara manual.
            </div>
          </div>

          <div className="grid min-h-0 gap-4 lg:grid-rows-[minmax(0,1fr)_auto]">
            <VickreyWinnerAssetPanel auction={auction} />
            <VickreyPaymentProgressPanel auction={auction} />
          </div>
        </div>

        <MarketingPerformancePanel insights={auction.insights} testId="admin-vickrey-settlement-performance-panel" />

        {auction.transactionId ? (
          <div aria-label="Area upload bukti serah-terima pemenang" className="w-full">
            <HandoverProofUploadForm
              canUpload={isVickreyPaymentVerified(auction)}
              itemTitle={auction.lot}
              location={auction.unitName ?? auction.unitAddress ?? undefined}
              proof={{
                fileUrl: auction.handoverProofUrl,
                uploadedAt: auction.handoverProofUploadedAt
                  ? dateLabel(auction.handoverProofUploadedAt)
                  : null,
                uploadedBy: auction.handoverProofUploadedBy,
                location: auction.unitName ?? auction.unitAddress
              }}
              transactionId={auction.transactionId}
            />
          </div>
        ) : null}

        {hasIntegratedNoteActions ? (
          <VickreyPaymentTotalPanel auction={auction} onPrintReceipt={handlePrintReceipt} />
        ) : (
          <div className="space-y-4">
            <VickreyPaymentTotalPanel auction={auction} />
            <VickreyWinnerActionFooter auction={auction} onPrintReceipt={handlePrintReceipt} />
          </div>
        )}
      </div>
      {isPrintSheetReady ? <VickreyReceiptPrintSheet auction={auction} rootId={receiptPrintRootId} /> : null}
    </div>
  );
}

export function AdminVickreyAuctionDetailPage({
  auction
}: {
  auction: MarketingSession;
}) {
  const router = useRouter();
  const revealed = auction.visibility === "HASIL_DIBUKA";
  const waitingReveal = auction.visibility === "MENUNGGU_REVEAL";
  const showBidRows = revealed || waitingReveal;
  const showFailureArchive = isVickreyFailureArchive(auction);
  const showWinnerSettlement = revealed && Boolean(auction.winner || auction.buyerName || auction.transactionId);
  const handleCountdownExpired = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-4 print:space-y-0">
      <section className="rounded-[1.35rem] border border-[#edf2ee] bg-white px-4 py-3 shadow-[0_14px_36px_-34px_rgba(8,69,50,0.22)] print:hidden">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-[0.82rem] font-semibold text-[#566861]">
            <span>Dashboard</span>
            <span className="text-[#b4bdb8]">/</span>
            <span>Kelola Lelang</span>
            <span className="text-[#b4bdb8]">/</span>
            <span>Detail</span>
            <span className="text-[#b4bdb8]">/</span>
            <span className="font-black text-[#006747]">{auction.code || auction.id}</span>
          </div>
          <VickreyLiveBadge status={auction.status} />
        </div>
      </section>

      <MarketingIterationHistoryPanel auction={auction} />

      {showFailureArchive ? (
        <VickreyFailedArchiveWorkspace auction={auction} />
      ) : showWinnerSettlement ? (
        <VickreyWinnerSettlementWorkspace auction={auction} />
      ) : (
        <>
          <VickreyAssetNotice auction={auction} />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(30rem,0.95fr)]">
            <div className="space-y-4">
              <VickreyActivityPanel auction={auction} onCountdownExpired={handleCountdownExpired} />
              <VickreyBidLogTable auction={auction} showBidRows={showBidRows} />
              <VickreyPaymentPanel auction={auction} />
            </div>

            <div className="space-y-4">
              <VickreyMediaManifest auction={auction} />
              <VickreySpecificationPanel auction={auction} />
              <MarketingPerformancePanel insights={auction.insights} testId="admin-vickrey-active-performance-panel" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
