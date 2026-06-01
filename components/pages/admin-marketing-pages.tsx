"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
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
  Info,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  Maximize2,
  Megaphone,
  Phone,
  Printer,
  ReceiptText,
  PencilLine,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Trophy,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import { AdminPaginationFooter, useAdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { LotMediaGallery } from "@/components/shared/lot-media-gallery";
import { LotFigure } from "@/components/shared/lot-figure";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBarangSpecificationRows } from "@/lib/admin-unit/specifications";
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
  description?: string;
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
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  buyerNationalId?: string | null;
  paymentMethod?: string | null;
  proofUrl?: string | null;
  reference?: string | null;
  soldAt?: string | null;
  paymentDeadline?: string | null;
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
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-[#0b7a56]/12 bg-[#e9f8ef] px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.08em] text-[#006747] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#00a86b]/55 opacity-70" />
        <span className="relative inline-flex size-2.5 rounded-full bg-[#007a53]" />
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
          <p className="mt-2 text-[1.05rem] font-black text-[#006747]">
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

function getMaskedBidderLabel(name: string | undefined, index: number) {
  if (!name) {
    return `USR-${String(index + 1).padStart(3, "0")}****`;
  }

  const trimmed = name.trim();
  if (trimmed.length <= 3) {
    return `${trimmed[0] ?? "U"}***`;
  }

  return `${trimmed.slice(0, 2)}***${trimmed.slice(-1)}`;
}

function getBidDisplayRows(auction: MarketingSession, showBidRows: boolean) {
  const bids = Array.isArray(auction.bids) ? auction.bids : [];

  if (showBidRows && bids.length) {
    return bids.map((bid, index) => ({
      id: bid.id,
      rank: bid.rank || index + 1,
      bidder: getMaskedBidderLabel(bid.bidderName || bid.bidderId, index),
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

  const lockedCount = Math.min(Math.max(Number(auction.participants ?? 0), 0), 5);
  return Array.from({ length: lockedCount }, (_, index) => ({
    id: `locked-${auction.id}-${index}`,
    rank: index + 1,
    bidder: "****************",
    time: index === 0 ? dateLabel(auction.startsAt) : "-",
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
    <span className={`inline-flex rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] ${style}`}>
      {status.toLowerCase() === "tertinggi" ? <BadgeCheck className="mr-1.5 size-3.5" /> : null}
      {status}
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
          <div className="overflow-x-auto transform-gpu transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <table className="w-full min-w-[46rem] text-left">
              <thead className="bg-[#f8faf9] text-[0.7rem] font-black text-[#566861]">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">ID Penawar</th>
                  <th className="px-4 py-3">Waktu Penawaran</th>
                  <th className="px-4 py-3">Nominal Penawaran</th>
                  <th className="px-4 py-3">Status</th>
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
                    <td className="px-4 py-3 font-black text-[#007a53]">{row.rank}</td>
                    <td className="px-4 py-3 font-bold text-[#14241e]">{row.bidder}</td>
                    <td className="px-4 py-3 text-[#52655d]">{row.time}</td>
                    <td className="px-4 py-3 font-black text-[#14241e]">Rp ********</td>
                    <td className="px-4 py-3">
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#10231b]/42 px-4 py-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-[1.6rem] border border-[#d7e7df] bg-white shadow-[0_32px_90px_-44px_rgba(8,69,50,0.62)]">
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

            <div className="max-h-[70dvh] overflow-y-auto p-5">
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

function VickreyMediaManifest({ auction }: { auction: MarketingSession }) {
  const media = auction.media ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
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
          type="button"
        >
          <Maximize2 className="size-4" />
        </button>
        <div className="relative aspect-[16/6.65] w-full overflow-hidden rounded-[0.95rem] bg-[#f6f2eb]">
          {activeMedia ? (
            activeIsVideo ? (
              <video className="size-full object-cover" muted playsInline preload="metadata" src={activeMedia.url} />
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
                    <video className="size-full rounded-[0.6rem] bg-[#0b1d15] object-cover" muted playsInline preload="metadata" src={item.url} />
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
    </section>
  );
}

function VickreyActivityPanel({
  auction
}: {
  auction: MarketingSession;
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
          <VickreyCountdownGrid targetAt={countdownTarget} />
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

  if (needsMarketingStrategy(auction)) {
    return {
      label: getAuctionStrategyReason(auction),
      detail: "Detail barang bisa dievaluasi lalu dibuatkan sesi lelang baru.",
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
    (auction.mode === "VICKREY_AUCTION" && auction.status === "GAGAL") ||
    (auction.mode === "VICKREY_AUCTION" &&
      auction.visibility === "HASIL_DIBUKA" &&
      !auction.transactionId &&
      !auction.winner)
  );
}

function getAuctionStrategyReason(auction: MarketingSession) {
  if (auction.transactionStatus === "GAGAL" || auction.winner || auction.buyerName) {
    return "Pemenang gagal bayar 24 jam";
  }

  return "Tidak ada peserta";
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

function getVickreyWinnerWorkspaceHref(auction: MarketingSession) {
  return `/admin/pemasaran/vickrey-auction/${auction.id}`;
}

function getMarketingAction(auction: MarketingSession) {
  if (needsMarketingStrategy(auction)) {
    return {
      href: `/admin/barang/${auction.lotId}/pasarkan-ulang`,
      label: "Lelang Lagi",
      variant: "default" as const
    };
  }

  if (auction.transactionId && isPaymentQueue(auction)) {
    return {
      href: getVickreyWinnerWorkspaceHref(auction),
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
  const strategyReason = needsMarketingStrategy(auction) ? getAuctionStrategyReason(auction) : null;
  const statusDotClass =
    workflowStatus === "Aktif"
      ? "bg-[#0fa35a]"
      : workflowStatus === "Menunggu Bayar"
        ? "bg-[#d89b12]"
        : workflowStatus === "Perlu Strategi"
          ? "bg-[#6f58e8]"
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
              {strategyReason ||
                auction.buyerName ||
                auction.winner ||
                (auction.mode === "VICKREY_AUCTION" ? "Bid masih tertutup" : "Belum ada pembeli")}
            </p>
            <p className="mt-0.5">
              {strategyReason
                ? "Edit detail barang lalu buat sesi lelang ulang"
                : auction.finalPrice
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
          description="Pemenang gagal bayar 24 jam / tanpa peserta"
          icon={Target}
          label="Perlu Strategi Ulang"
          meta="Siap lelang ulang"
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

              <div className="grid gap-3 sm:grid-cols-2">
                {auction.status === "AKTIF" ? (
                  <Link href={`/admin/barang/${auction.lotId}/edit`}>
                    <Button className="w-full" variant="secondary">
                      <PencilLine className="size-4" />
                      Edit detail
                    </Button>
                  </Link>
                ) : null}
                <Link href={`/admin/pemasaran/fixed-price/${auction.id}`}>
                  <Button className="w-full" variant="default">
                    Lihat sesi
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
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

function getVickreyAssetDetailRows(auction: MarketingSession) {
  const categoryRows = getBarangSpecificationRows(auction.category ?? "", auction.specifications ?? {})
    .filter((row) => row.value && row.value !== "-")
    .slice(0, 3);

  const rows = [
    { label: "Kode Aset", value: auction.code || "-" },
    ...categoryRows,
    { label: "Kondisi", value: auction.condition ? humanize(auction.condition) : "-" }
  ];

  return rows.slice(0, 5);
}

function VickreySettlementDeadlineBanner({ auction }: { auction: MarketingSession }) {
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

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
        Detail Pemenang Lelang
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
    </section>
  );
}

function VickreyMechanismPanel({ auction }: { auction: MarketingSession }) {
  const highestBid = getHighestBidAmount(auction);
  const paymentPrice = auction.finalPrice ?? auction.basePrice ?? null;

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <div className="flex items-center gap-2">
        <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
          Mekanisme Lelang: Vickrey Second-Price
        </p>
        <Info className="size-3.5 text-[#2f6fff]" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#d6efe1] bg-[#f1fbf6] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#006747]">Penawaran Tertinggi</p>
          <p className="mt-2 font-headline text-[1.25rem] font-black leading-tight text-[#006747]">
            {formatOptionalCurrency(highestBid)}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#2f6a52]">
            Penawaran tertinggi oleh pemenang
          </p>
        </div>

        <div className="rounded-lg border border-[#fde2a5] bg-[#fff8e7] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#92400e]">Harga Bayar</p>
          <p className="mt-2 font-headline text-[1.25rem] font-black leading-tight text-[#f59e0b]">
            {formatOptionalCurrency(paymentPrice)}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#b45309]">
            Harga yang harus dibayarkan pemenang
          </p>
        </div>

        <div className="rounded-lg border border-[#e7ece9] bg-[#f8faf9] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#40558b]">Status</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#e9f8ef] px-3 py-1 text-[0.68rem] font-black uppercase text-[#006747]">
            Menang <Trophy className="size-3.5" />
          </span>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#40558b]">
            Pemenang utama lelang
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#edf2ee] bg-[#f8faf9] px-3 py-2.5 text-[0.72rem] font-semibold leading-5 text-[#52655d]">
        <ReceiptText className="mt-0.5 size-4 shrink-0 text-[#006747]" />
        <p>
          <span className="font-black text-[#006747]">Catatan Admin:</span> Harga menang ditentukan berdasarkan
          penawaran tertinggi kedua sesuai mekanisme Vickrey (second-price).
        </p>
      </div>
    </section>
  );
}

function VickreyWinnerRankingTable({ auction }: { auction: MarketingSession }) {
  const rows = [...(auction.bids ?? [])].sort((left, right) => (left.rank || 0) - (right.rank || 0));

  return (
    <section className="overflow-hidden rounded-xl border border-[#dfe7e2] bg-white shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <div className="border-b border-[#edf2ee] bg-[#fbfcfb] px-4 py-3">
        <h3 className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
          Ranking Peserta Lelang (Admin View)
        </h3>
      </div>
      <div>
        <table className="w-full table-fixed text-left text-[0.72rem]">
          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[19%]" />
            <col className="w-[17%]" />
            <col className="w-[19%]" />
            <col className="w-[18%]" />
            <col className="w-[21%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-[#edf2ee] bg-[#f8faf9] text-[0.56rem] font-black uppercase tracking-[0.04em] text-[#40558b] sm:text-[0.6rem]">
              <th className="px-2 py-2.5 text-center">#</th>
              <th className="px-2 py-2.5">Member ID</th>
              <th className="px-2 py-2.5">Nama Peserta</th>
              <th className="px-2 py-2.5">Waktu Penawaran</th>
              <th className="px-2 py-2.5 text-right">Nominal Penawaran</th>
              <th className="px-2 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf2ee] font-bold text-[#111b46]">
            {rows.map((bid) => {
              const isRunnerUp = bid.determinesFinalPrice;
              const rowTone = bid.isWinner
                ? "bg-[#e9f8ef]"
                : isRunnerUp
                  ? "bg-[#fff8e7]"
                  : "bg-white";
              const status = bid.isWinner ? "Pemenang" : isRunnerUp ? "Harga Bayar" : "-";
              const statusTone = bid.isWinner
                ? "bg-[#006747] text-white"
                : isRunnerUp
                  ? "bg-[#f59e0b] text-white"
                  : "text-[#40558b]";

              return (
                <tr className={`${rowTone} transition-colors duration-200 hover:bg-[#f4fbf7]`} key={bid.id}>
                  <td className="px-2 py-2.5 text-center font-mono text-[#006747]">{bid.rank}</td>
                  <td className="break-all px-2 py-2.5 font-mono text-[0.64rem] leading-4">{bid.bidderId}</td>
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
                        {bid.isWinner ? <Trophy className="size-3" /> : <ReceiptText className="size-3" />}
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
  const detailRows = getVickreyAssetDetailRows(auction);

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
        Detail Aset Lelang
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

function getPaymentStepIndex(status?: string | null) {
  if (status === "LUNAS" || status === "SELESAI") {
    return 3;
  }

  if (status === "BUKTI_DIUNGGAH" || status === "MENUNGGU_KONFIRMASI_LANGSUNG") {
    return 2;
  }

  return 1;
}

function VickreyPaymentProgressPanel({ auction }: { auction: MarketingSession }) {
  const activeStep = getPaymentStepIndex(auction.transactionStatus);
  const steps = [
    { label: "Menunggu Pembayaran", icon: WalletCards },
    { label: "Verifikasi", icon: FileText },
    { label: "Selesai", icon: CheckCircle2 }
  ];

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
        Progress Pembayaran Lelang
      </p>
      <div className="relative mt-5 flex items-start justify-between px-2 text-center">
        <span className="absolute left-[14%] right-[14%] top-6 h-px border-t border-dashed border-[#8bd5f7]" />
        {steps.map((step, index) => {
          const position = index + 1;
          const Icon = step.icon;
          const active = position <= activeStep;

          return (
            <div className="relative z-[1] grid flex-1 justify-items-center gap-2" key={step.label}>
              <span
                className={`grid size-12 place-items-center rounded-full border bg-white shadow-[0_14px_28px_-24px_rgba(8,69,50,0.35)] ${
                  active ? "border-[#006747] text-[#006747]" : "border-[#dfe6e2] text-[#111b46]"
                }`}
              >
                <Icon className="size-5" />
              </span>
              <span
                className={`grid size-4 place-items-center rounded-full text-[0.58rem] font-black ${
                  active ? "bg-[#006747] text-white" : "bg-[#eef2f0] text-[#40558b]"
                }`}
              >
                {position}
              </span>
              <p className="max-w-[6.6rem] text-[0.66rem] font-black leading-4 text-[#006747]">{step.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function VickreyPaymentTotalPanel({ auction }: { auction: MarketingSession }) {
  const paymentPrice = auction.finalPrice ?? auction.basePrice ?? 0;
  const statusLabel = auction.transactionStatus ? humanize(auction.transactionStatus) : "Menunggu pembayaran";

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

function VickreyWinnerActionFooter({ auction }: { auction: MarketingSession }) {
  return (
    <div className="grid gap-3 print:hidden sm:grid-cols-[minmax(0,1fr)_16rem]">
      {auction.transactionId ? (
        <Link
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white shadow-[0_18px_34px_-24px_rgba(0,103,71,0.75)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99]"
          href={`/admin/transaksi/${auction.transactionId}?from=vickrey`}
        >
          <CheckCircle2 className="size-5" />
          Verifikasi Pembayaran
        </Link>
      ) : (
        <Button className="h-12 rounded-lg text-[0.9rem] font-black" disabled>
          <CheckCircle2 className="size-5" />
          Verifikasi Pembayaran
        </Button>
      )}
      <button
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#a7d9c7] bg-white px-5 text-[0.86rem] font-black text-[#006747] shadow-[0_18px_34px_-28px_rgba(0,103,71,0.42)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#f5fbf7] active:scale-[0.99]"
        onClick={() => window.print()}
        type="button"
      >
        <Printer className="size-4" />
        Cetak Ringkasan Lelang
      </button>
    </div>
  );
}

function VickreyWinnerSettlementWorkspace({ auction }: { auction: MarketingSession }) {
  return (
    <div className="space-y-4 print:space-y-3">
      <VickreySettlementDeadlineBanner auction={auction} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <div className="space-y-4">
          <VickreyWinnerProfilePanel auction={auction} />
          <VickreyMechanismPanel auction={auction} />
          <VickreyWinnerRankingTable auction={auction} />
          <div className="flex items-center gap-2 px-1 text-[0.72rem] font-semibold text-[#6f83b6]">
            <ShieldCheck className="size-4 text-[#7eb7a5]" />
            Seluruh data dilindungi sistem keamanan berlapis dan tidak dapat diubah secara manual.
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4">
          <VickreyWinnerAssetPanel auction={auction} />
          <VickreyPaymentProgressPanel auction={auction} />
          <VickreyPaymentTotalPanel auction={auction} />
          <VickreyWinnerActionFooter auction={auction} />
        </div>
      </div>
    </div>
  );
}

export function AdminVickreyAuctionDetailPage({
  auction
}: {
  auction: MarketingSession;
}) {
  const revealed = auction.visibility === "HASIL_DIBUKA";
  const waitingReveal = auction.visibility === "MENUNGGU_REVEAL";
  const showBidRows = revealed || waitingReveal;
  const showWinnerSettlement = revealed && Boolean(auction.winner || auction.buyerName || auction.transactionId);

  return (
    <div className="space-y-4">
      <section className="rounded-[1.35rem] border border-[#edf2ee] bg-white px-4 py-3 shadow-[0_14px_36px_-34px_rgba(8,69,50,0.22)]">
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

      {showWinnerSettlement ? (
        <VickreyWinnerSettlementWorkspace auction={auction} />
      ) : (
        <>
          <VickreyAssetNotice auction={auction} />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(30rem,0.95fr)]">
            <div className="space-y-4">
              <VickreyActivityPanel auction={auction} />
              <VickreyBidLogTable auction={auction} showBidRows={showBidRows} />
              <VickreyPaymentPanel auction={auction} />
            </div>

            <div className="space-y-4">
              <VickreyMediaManifest auction={auction} />
              <VickreySpecificationPanel auction={auction} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
