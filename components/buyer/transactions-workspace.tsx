"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleX,
  Clock3,
  Gavel,
  Grid2X2,
  Hourglass,
  ShoppingBag,
  ShieldCheck,
  Trophy,
  FileText,
} from "lucide-react";

import { LiveCountdown } from "@/components/buyer/live-countdown";
import { Button } from "@/components/ui/button";
import {
  getBuyerLoserAnnouncementHref,
  getBuyerBidMonitoringHref,
  getBuyerBidTransactionHref,
  getBuyerTransactionHref,
} from "@/lib/buyer/transaction-links";
import type {
  BuyerBid,
  BuyerBidStatus,
  BuyerTransaction,
  BuyerTransactionStatus,
} from "@/lib/contracts/buyer";
import { currency } from "@/lib/formatters/currency";
import { formatAppDateTime } from "@/lib/timezone";
import { cn } from "@/lib/utils";

type TransactionsWorkspaceProps = {
  bids: BuyerBid[];
  highlightedBidLotId?: string | null;
  initialTab?: TransactionTab;
  transactions: BuyerTransaction[];
};

type TransactionTab = "transactions" | "bids";
type TransactionFilter = "all" | "action" | "verifying" | "done" | "cancelled";
type BidFilter = "all" | "awaiting" | "won" | "lost" | "failed";
type FilterTone = "green" | "orange" | "amber" | "red" | "slate";

function getTransactionModeMeta(kind: BuyerTransaction["kind"]) {
  return kind === "VICKREY_WIN"
    ? {
        label: "Lelang Tertutup",
        className: "bg-[#eaf7ef] text-[#0b7a4a]",
      }
    : {
        label: "Harga Tetap",
        className: "bg-[#eaf7ef] text-[#0b7a4a]",
      };
}

function getTransactionStatusMeta(status: BuyerTransactionStatus) {
  switch (status) {
    case "MENUNGGU_PEMBAYARAN":
    case "MENUNGGU_KONFIRMASI_LANGSUNG":
      return {
        label: "Perlu Pembayaran",
        className: "bg-orange-50 text-orange-700",
        matchesFilter: "action" as TransactionFilter,
      };
    case "BUKTI_DIUNGGAH":
    case "MENUNGGU_VERIFIKASI":
      return {
        label: "Menunggu Verifikasi",
        className: "bg-amber-50/80 text-amber-700",
        matchesFilter: "verifying" as TransactionFilter,
      };
    case "LUNAS":
    case "SELESAI":
      return {
        label: "Selesai",
        className: "bg-emerald-50 text-[#137333]",
        matchesFilter: "done" as TransactionFilter,
      };
    case "DITOLAK_BUKTI":
      return {
        label: "Dibatalkan",
        className: "bg-red-50 text-red-600",
        matchesFilter: "cancelled" as TransactionFilter,
      };
    case "GAGAL":
    default:
      return {
        label: "Gagal",
        className: "bg-red-50 text-red-600",
        matchesFilter: "cancelled" as TransactionFilter,
      };
  }
}

function getTransactionDescription(transaction: BuyerTransaction) {
  switch (transaction.status) {
    case "MENUNGGU_PEMBAYARAN":
      return transaction.kind === "VICKREY_WIN"
        ? "Anda memenangkan lelang. Segera selesaikan pembayaran sebelum batas waktu berakhir."
        : "Transaksi harga tetap. Segera selesaikan pembayaran sebelum batas waktu berakhir.";
    case "DITOLAK_BUKTI":
      return "Bukti pembayaran ditolak admin unit. Transaksi dibatalkan dan barang kembali tersedia di katalog.";
    case "BUKTI_DIUNGGAH":
    case "MENUNGGU_VERIFIKASI":
      return "Pembayaran telah kami terima. Transaksi sedang diverifikasi oleh tim admin unit.";
    case "MENUNGGU_KONFIRMASI_LANGSUNG":
      return "Pembayaran langsung sedang menunggu konfirmasi dari admin unit terkait.";
    case "LUNAS":
    case "SELESAI":
      return "Transaksi telah selesai. Barang telah diterima oleh Anda.";
    case "GAGAL":
    default:
      return "Pembayaran Lelang Tertutup gagal karena melewati batas 24 jam. Akses lelang dapat dibatasi sesuai aturan.";
  }
}

function getTransactionAmountMeta(transaction: BuyerTransaction) {
  const fallbackMoment = transaction.verifiedAt || transaction.createdAt;

  switch (transaction.status) {
    case "MENUNGGU_PEMBAYARAN":
    case "MENUNGGU_KONFIRMASI_LANGSUNG":
      return {
        amountLabel: transaction.kind === "VICKREY_WIN" ? "Harga akhir lelang" : "Total yang harus dibayar",
        momentLabel: "Batas waktu pembayaran",
        momentValue: transaction.deadlineAt ? formatAppDateTime(transaction.deadlineAt) : transaction.deadline,
      };
    case "BUKTI_DIUNGGAH":
    case "MENUNGGU_VERIFIKASI":
      return {
        amountLabel: transaction.kind === "VICKREY_WIN" ? "Harga akhir lelang" : "Total yang harus dibayar",
        momentLabel: "Pembayaran diterima",
        momentValue: fallbackMoment,
      };
    case "LUNAS":
    case "SELESAI":
      return {
        amountLabel: transaction.kind === "VICKREY_WIN" ? "Harga akhir lelang" : "Total pembayaran",
        momentLabel: "Selesai pada",
        momentValue: transaction.verifiedAt || transaction.createdAt,
      };
    case "DITOLAK_BUKTI":
      return {
        amountLabel: "Total transaksi dibatalkan",
        momentLabel: "Ditolak pada",
        momentValue: transaction.verifiedAt || transaction.createdAt,
      };
    case "GAGAL":
    default:
      return {
        amountLabel: "Nominal lelang gagal",
        momentLabel: "Gagal pada",
        momentValue: transaction.createdAt,
      };
  }
}

function getTransactionActionMeta(transaction: BuyerTransaction) {
  switch (transaction.status) {
    case "MENUNGGU_PEMBAYARAN":
      if (transaction.kind === "VICKREY_WIN") {
        return {
          isPrimary: false,
          label: "Lihat Detail",
        };
      }
      return {
        isPrimary: true,
        label: "Bayar Sekarang",
      };
    case "MENUNGGU_KONFIRMASI_LANGSUNG":
      return {
        isPrimary: false,
        label: "Lihat Detail",
      };
    case "BUKTI_DIUNGGAH":
    case "MENUNGGU_VERIFIKASI":
      return {
        isPrimary: false,
        label: "Lihat Status",
      };
    case "LUNAS":
    case "SELESAI":
    case "GAGAL":
    default:
      return {
        isPrimary: false,
        label: "Lihat Detail",
      };
  }
}

function getTransactionNoticeMeta(transaction: BuyerTransaction) {
  switch (transaction.status) {
    case "MENUNGGU_PEMBAYARAN":
      return {
        title: "Transaksi aman",
        description: "Data dan pembayaran Anda terlindungi.",
        className: "bg-[#f2fbf4] text-[#2e6c4e]",
        icon: <ShieldCheck className="size-5" />,
      };
    case "MENUNGGU_KONFIRMASI_LANGSUNG":
      return {
        title: "Bayar langsung di unit",
        description: "Datang ke unit dan tunggu admin mengonfirmasi pembayaran langsung Anda.",
        className: "bg-[#f9f5eb] text-[#8b6a1d]",
        icon: <Building2 className="size-5" strokeWidth={1.85} />,
      };
    case "BUKTI_DIUNGGAH":
    case "MENUNGGU_VERIFIKASI":
      return {
        title: "Sedang diverifikasi",
        description: "Kami akan mengirimkan update segera setelah selesai.",
        className: "bg-[#fff8ea] text-[#c88812]",
        icon: <Hourglass className="size-5" strokeWidth={1.85} />,
      };
    case "LUNAS":
    case "SELESAI":
      return {
        title: "Transaksi selesai",
        description: "Terima kasih telah bertransaksi di Ruang Agunan.",
        className: "bg-[#f2fbf4] text-[#2e8a57]",
        icon: <CheckCircle2 className="size-5" />,
      };
    case "DITOLAK_BUKTI":
      return {
        title: "Verifikasi ditolak",
        description: "Bukti pembayaran tidak disetujui admin unit.",
        className: "bg-[#fff5f5] text-[#d84b4b]",
        icon: <CircleX className="size-5" />,
      };
    case "GAGAL":
    default:
      return {
        title: "Pembayaran gagal",
        description: "Batas pembayaran 24 jam telah lewat.",
        className: "bg-[#fff5f5] text-[#d84b4b]",
        icon: <CircleX className="size-5" />,
      };
  }
}

function getFilterToneMeta(tone: FilterTone) {
  switch (tone) {
    case "orange":
      return {
        activeClass: "border-[#fde7d1] bg-[#fff4e8] text-[#d97706] shadow-[0_10px_24px_-18px_rgba(217,119,6,0.24)]",
        iconClass: "text-[#f08a19]",
      };
    case "amber":
      return {
        activeClass: "border-[#f8ebc9] bg-[#fff8e8] text-[#b7791f] shadow-[0_10px_24px_-18px_rgba(217,153,0,0.22)]",
        iconClass: "text-[#d5a018]",
      };
    case "red":
      return {
        activeClass: "border-[#f8d9d9] bg-[#fff1f1] text-[#dc3d3d] shadow-[0_10px_24px_-18px_rgba(220,61,61,0.22)]",
        iconClass: "text-[#e24444]",
      };
    case "slate":
      return {
        activeClass: "border-[#e4e8ea] bg-[#f4f6f7] text-[#5d6972] shadow-[0_10px_24px_-18px_rgba(100,116,139,0.18)]",
        iconClass: "text-[#64748b]",
      };
    case "green":
    default:
      return {
        activeClass: "border-[#d7ebde] bg-[#e6f4ea] text-[#006747] shadow-[0_10px_24px_-18px_rgba(0,103,71,0.22)]",
        iconClass: "text-[#0d7a4b]",
      };
  }
}

function needsTransactionCountdown(status: BuyerTransactionStatus) {
  return ["MENUNGGU_PEMBAYARAN", "MENUNGGU_KONFIRMASI_LANGSUNG"].includes(status);
}

function formatCompactCountdownLabel(label: string) {
  const tokens = label.split(" ");
  if (tokens.length < 2) {
    return `${label} tersisa`;
  }

  const unitMap: Record<string, string> = {
    hari: "h",
    jam: "j",
    menit: "m",
    detik: "d",
  };

  const pairs: string[] = [];
  for (let index = 0; index < tokens.length - 1; index += 2) {
    const value = tokens[index];
    const unit = unitMap[tokens[index + 1]] ?? "";
    if (!value || !unit) {
      continue;
    }

    pairs.push(`${value}${unit}`);
  }

  if (pairs.length === 0) {
    return `${label} tersisa`;
  }

  return `${pairs.slice(0, 2).join(" ")} tersisa`;
}

function TransactionDeadlineCard({
  transaction,
  label,
  value,
}: {
  transaction: BuyerTransaction;
  label: string;
  value: string;
}) {
  const serverNow = useMemo(() => new Date().toISOString(), []);

  return (
    <div className="rounded-[1rem] bg-[#fffaf1] px-3.5 py-3 ring-1 ring-[#f7e8ca]">
      <span className="inline-flex items-center rounded-full bg-[#fff2dd] px-2.5 py-1 text-[0.72rem] font-bold tracking-[-0.01em] text-[#d97706]">
        Perlu Tindakan
      </span>
      <div className="mt-2.5">
        <p className="text-[0.74rem] font-medium tracking-[-0.01em] text-slate-500">{label}</p>
        <p className="mt-1 text-[0.92rem] font-semibold tracking-[-0.01em] text-[#ef5b2a]">{value}</p>
      </div>
      <div className="mt-2.5 inline-flex items-center gap-2 text-[0.84rem] font-semibold tracking-[-0.01em] text-[#7d6028]">
        <span className="size-1.5 rounded-full bg-[#f08a19] animate-pulse" />
        <LiveCountdown
          expiredLabel="Waktu pembayaran berakhir"
          fallbackLabel={transaction.deadline}
          formatLabel={(text, state) => (state.isExpired ? text : formatCompactCountdownLabel(text))}
          serverNow={serverNow}
          targetAt={transaction.deadlineAt}
        />
      </div>
    </div>
  );
}

function getBidFilterStatus(status: BuyerBidStatus): BidFilter {
  switch (status) {
    case "MENUNGGU_HASIL":
      return "awaiting";
    case "MENANG":
      return "won";
    case "TIDAK_MENANG":
      return "lost";
    case "GAGAL":
      return "failed";
    case "BID_TERCATAT":
    default:
      return "all";
  }
}

function getBidStatusPill(status: BuyerBidStatus) {
  switch (status) {
    case "MENANG":
      return {
        icon: <Trophy className="size-3.5" data-testid="buyer-bid-status-MENANG-icon" strokeWidth={1.9} />,
        label: "Menang",
        className: "bg-emerald-50 text-[#137333]",
      };
    case "MENUNGGU_HASIL":
      return { icon: null, label: "Menunggu Hasil", className: "bg-amber-50/80 text-amber-700" };
    case "TIDAK_MENANG":
      return {
        icon: <CircleX className="size-3.5" data-testid="buyer-bid-status-TIDAK_MENANG-icon" strokeWidth={1.9} />,
        label: "Tidak Menang",
        className: "bg-slate-100 text-slate-500",
      };
    case "GAGAL":
      return { icon: null, label: "Gagal", className: "bg-red-50 text-red-600" };
    case "BID_TERCATAT":
    default:
      return { icon: <FileText className="size-3.5" data-testid="buyer-bid-status-BID_TERCATAT-icon" strokeWidth={1.9} />, label: "Penawaran Terekam", className: "bg-blue-50 text-blue-600" };
  }
}

function TransactionsTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "relative inline-flex min-w-[14.5rem] items-center justify-center rounded-[1.75rem] px-8 py-6 text-[1.05rem] font-semibold tracking-[-0.015em] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        active
          ? "bg-white text-[#006747] shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
          : "bg-[#f5f5f2] text-slate-500 hover:bg-[#f8f8f5] hover:text-slate-700"
      )}
      type="button"
      onClick={onClick}
    >
      {label}
      {active ? <span className="absolute inset-x-5 bottom-0 h-[2px] rounded-full bg-[#006747]" /> : null}
    </button>
  );
}

function FilterChip({
  active,
  icon,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone: FilterTone;
}) {
  const toneMeta = getFilterToneMeta(tone);

  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-[0.98rem] font-medium tracking-[-0.012em] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        active
          ? toneMeta.activeClass
          : "border-slate-100 bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#dfe7de] hover:bg-[#fcfcfa]"
      )}
      type="button"
      onClick={onClick}
    >
      <span className={cn("shrink-0 transition-colors duration-500", toneMeta.iconClass)}>
        {icon}
      </span>
      <span className={cn("transition-colors duration-500", active ? "text-current" : "text-slate-900")}>{label}</span>
    </button>
  );
}

function TransactionImage({
  imageUrl,
  title,
  tone = "transaction",
}: {
  imageUrl?: string;
  title: string;
  tone?: "transaction" | "bid";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const canShowImage = Boolean(imageUrl) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <div className="relative h-[9.35rem] overflow-hidden rounded-xl bg-[#f4f4ef] shadow-[0_4px_18px_rgba(0,0,0,0.018)]">
      {canShowImage ? (
        <Image
          alt={`Foto transaksi ${title}`}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          decoding="async"
          fill
          loading="lazy"
          onError={() => setImageFailed(true)}
          sizes="(min-width: 1280px) 224px, (min-width: 1024px) 192px, (min-width: 640px) 45vw, 100vw"
          src={imageUrl ?? ""}
        />
      ) : (
        <div
          className={cn(
            "flex h-full items-center justify-center",
            tone === "bid"
              ? "bg-[radial-gradient(circle_at_30%_20%,#fff1cd,#f4c666_42%,#bb7c10_100%)] text-white"
              : "bg-[radial-gradient(circle_at_30%_20%,#eaf6ef,#b8d8c4_42%,#5e8e73_100%)] text-white"
          )}
        >
          {tone === "bid" ? <Gavel className="size-12" /> : <ShoppingBag className="size-12" />}
        </div>
      )}
    </div>
  );
}

function TransactionBadge({
  className,
  label,
}: {
  className: string;
  label: ReactNode;
}) {
  return <span className={cn("rounded-xl px-3 py-1.5 text-[0.92rem] font-medium tracking-[-0.01em]", className)}>{label}</span>;
}

function TransactionAction({
  isPrimary,
  href,
  label,
}: {
  isPrimary: boolean;
  href: string;
  label: string;
}) {
  if (isPrimary) {
    return (
      <Link href={href}>
        <Button className="h-12 w-full rounded-[1rem] bg-[#006747] px-5 text-[1.02rem] font-semibold text-white shadow-[0_10px_24px_rgba(0,103,71,0.14)] transition-all duration-300 hover:-translate-y-px hover:bg-[#005238]">
          {label}
        </Button>
      </Link>
    );
  }

  return (
    <Link href={href}>
      <span className="inline-flex items-center gap-2 text-[1.02rem] font-semibold tracking-[-0.015em] text-[#006747] transition duration-300 hover:translate-x-0.5 hover:text-[#005238]">
        {label}
        <ArrowRight className="size-5" />
      </span>
    </Link>
  );
}

function TransactionNotice({
  className,
  description,
  icon,
  title,
}: {
  className: string;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className={cn("rounded-[1rem] px-3.5 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.015)]", className)}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5">{icon}</span>
        <div>
          <p className="text-[0.9rem] font-semibold tracking-[-0.01em]">{title}</p>
          <p className="mt-1 text-[0.78rem] leading-5 opacity-90">{description}</p>
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: BuyerTransaction }) {
  const modeMeta = getTransactionModeMeta(transaction.kind);
  const statusMeta = getTransactionStatusMeta(transaction.status);
  const amountMeta = getTransactionAmountMeta(transaction);
  const actionMeta = getTransactionActionMeta(transaction);
  const noticeMeta = getTransactionNoticeMeta(transaction);
  const transactionHref = getBuyerTransactionHref(transaction);

  return (
    <article className="group rounded-[1.55rem] bg-white p-3 shadow-[0_4px_18px_rgba(0,0,0,0.018)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 sm:p-4">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)] lg:items-center xl:grid-cols-[minmax(12rem,14rem)_minmax(0,1.12fr)_minmax(12rem,14.5rem)_minmax(10rem,11.75rem)]">
        <div className="w-full max-w-none">
          <TransactionImage imageUrl={transaction.imageUrl} title={transaction.title} />
        </div>

        <div className="min-w-0">
          <h2 className="line-clamp-2 font-headline text-[1.28rem] font-black leading-[1.08] tracking-[-0.03em] text-slate-800 transition-colors duration-300 group-hover:text-[#006747] sm:text-[1.55rem]">
            {transaction.title}
          </h2>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[0.92rem] font-medium tracking-[-0.01em] text-slate-500">
            <Building2 className="size-3.5" data-testid="buyer-transaction-unit-icon" strokeWidth={1.85} />
            <span>Unit {transaction.unit}</span>
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <TransactionBadge className={modeMeta.className} label={modeMeta.label} />
            <TransactionBadge className={statusMeta.className} label={statusMeta.label} />
          </div>

          <p className="mt-3.5 max-w-[31rem] text-[0.95rem] leading-6 text-slate-600">{getTransactionDescription(transaction)}</p>
        </div>

        <div className="space-y-2.5 lg:pl-1">
          <p className="text-[0.94rem] font-medium tracking-[-0.01em] text-slate-500">{amountMeta.amountLabel}</p>
          <p
            className={cn(
              "font-headline text-[1.55rem] font-black leading-none tracking-[-0.04em] sm:text-[2rem]",
              transaction.status === "GAGAL" || transaction.status === "DITOLAK_BUKTI"
                ? "text-slate-400 line-through"
                : "text-[#006747]"
            )}
          >
            {currency.format(transaction.amount)}
          </p>
          {needsTransactionCountdown(transaction.status) ? (
            <TransactionDeadlineCard
              label={amountMeta.momentLabel}
              transaction={transaction}
              value={amountMeta.momentValue}
            />
          ) : (
            <div className="pt-1.5">
              <p className="text-[0.92rem] font-semibold tracking-[-0.01em] text-slate-500">
                {amountMeta.momentLabel}
              </p>
              <p className="mt-1 text-[0.94rem] font-medium leading-6 text-slate-800">{amountMeta.momentValue}</p>
            </div>
          )}
        </div>

        <div className="space-y-3.5">
          <TransactionAction href={transactionHref} isPrimary={actionMeta.isPrimary} label={actionMeta.label} />
          <TransactionNotice
            className={noticeMeta.className}
            description={noticeMeta.description}
            icon={noticeMeta.icon}
            title={noticeMeta.title}
          />
        </div>
      </div>
    </article>
  );
}

function BidRow({ item }: { item: BuyerBid }) {
  const statusMeta = getBidStatusPill(item.status);
  const amount = item.paymentAmount ?? item.finalPrice ?? item.bidAmount ?? item.basePrice;
  const transactionHref = getBuyerBidTransactionHref(item);
  const actionHref =
    item.status === "TIDAK_MENANG"
      ? getBuyerLoserAnnouncementHref(item.lotId)
      : transactionHref ?? getBuyerBidMonitoringHref(item);
  const actionLabel =
    item.status === "TIDAK_MENANG"
      ? "Lihat Hasil"
      : transactionHref
        ? "Lihat Detail"
        : "Lihat Status";

  return (
    <article className="group rounded-[1.55rem] bg-white p-3 shadow-[0_4px_18px_rgba(0,0,0,0.018)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 sm:p-4">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)] lg:items-center xl:grid-cols-[minmax(12rem,14rem)_minmax(0,1.12fr)_minmax(12rem,14.5rem)_minmax(10rem,11.75rem)]">
        <div className="w-full max-w-none">
          <TransactionImage imageUrl={item.imageUrl} title={item.lot} tone="bid" />
        </div>

        <div className="min-w-0">
          <h2 className="line-clamp-2 font-headline text-[1.28rem] font-black leading-[1.08] tracking-[-0.03em] text-slate-800 transition-colors duration-300 group-hover:text-[#006747] sm:text-[1.55rem]">
            {item.lot}
          </h2>
          <p className="mt-2 text-[0.9rem] font-medium tracking-[-0.01em] text-slate-500">Riwayat Lelang</p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.92rem] font-medium tracking-[-0.01em] text-slate-500">
            <Building2 className="size-3.5" data-testid="buyer-transaction-unit-icon" strokeWidth={1.85} />
            <span>Unit {item.unit}</span>
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            {item.status === "BID_TERCATAT" ? (
              <TransactionBadge
                className="bg-[#eaf7ef] text-[#0b7a4a]"
                label={
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0b7a4a]" />
                    Sesi Berlangsung
                  </span>
                }
              />
            ) : (
              <TransactionBadge className="bg-[#eaf7ef] text-[#0b7a4a]" label="Lelang Tertutup" />
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.92rem] font-medium tracking-[-0.01em]",
                statusMeta.className
              )}
            >
              {statusMeta.icon}
              {statusMeta.label}
            </span>
          </div>

          <p className="mt-3.5 max-w-[31rem] text-[0.95rem] leading-6 text-slate-600">{item.note}</p>
        </div>

        <div className="space-y-2.5 lg:pl-1">
          <p className="text-[0.94rem] font-medium tracking-[-0.01em] text-slate-500">
            {item.status === "MENANG" ? "Harga akhir lelang" : "Nominal bid"}
          </p>
          <p className="font-headline text-[1.55rem] font-black leading-none tracking-[-0.04em] text-[#006747] sm:text-[2rem]">
            {currency.format(amount)}
          </p>
          <div className="pt-1.5">
            <p className="text-[0.92rem] font-semibold tracking-[-0.01em] text-slate-500">Penutupan lelang</p>
            <p className="mt-1 text-[0.94rem] font-medium leading-6 text-slate-800">
              {item.closingAt ? formatAppDateTime(item.closingAt) : item.closing}
            </p>
            {item.status === "BID_TERCATAT" && (
              <p className="mt-1 text-[0.88rem] font-medium text-orange-500">
                (Menunggu Pengumuman Pemenang)
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3.5">
          {item.status !== "BID_TERCATAT" && (
            <Link href={actionHref}>
              <span className="inline-flex items-center gap-2 text-[1.02rem] font-semibold tracking-[-0.015em] text-[#006747] transition duration-300 hover:translate-x-0.5 hover:text-[#005238]">
                {actionLabel}
                <ArrowRight className="size-5" />
              </span>
            </Link>
          )}

          <TransactionNotice
            className="bg-[#f9fbf8] text-[#4f5d56]"
            description="Semua aktivitas bid tetap dapat dipantau dari satu halaman transaksi."
            icon={<Gavel className="size-5" />}
            title="Riwayat lelang tersimpan"
          />
        </div>
      </div>
    </article>
  );
}

export function TransactionsWorkspace({
  bids,
  highlightedBidLotId = null,
  initialTab = "transactions",
  transactions,
}: TransactionsWorkspaceProps) {
  const [tab, setTab] = useState<TransactionTab>(initialTab);
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>("all");
  const [bidFilter, setBidFilter] = useState<BidFilter>("all");
  const highlightedBidRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (tab !== "bids" || !highlightedBidLotId) {
      return;
    }

    if (typeof highlightedBidRef.current?.scrollIntoView === "function") {
      highlightedBidRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedBidLotId, tab]);

  const transactionFilterOptions = useMemo(
    () => [
      {
        key: "all" as const,
        label: "Semua",
        icon: <Grid2X2 className="size-4" strokeWidth={1.85} />,
        tone: "green" as const,
      },
      {
        key: "action" as const,
        label: "Perlu Tindakan",
        icon: <Clock3 className="size-4" strokeWidth={1.85} />,
        tone: "orange" as const,
      },
      {
        key: "verifying" as const,
        label: "Menunggu Verifikasi",
        icon: <Hourglass className="size-4" strokeWidth={1.85} />,
        tone: "amber" as const,
      },
      {
        key: "done" as const,
        label: "Selesai",
        icon: <CheckCircle2 className="size-4" strokeWidth={1.85} />,
        tone: "green" as const,
      },
      {
        key: "cancelled" as const,
        label: "Gagal",
        icon: <CircleX className="size-4" strokeWidth={1.85} />,
        tone: "red" as const,
      },
    ],
    []
  );

  const bidFilterOptions = useMemo(
    () => [
      {
        key: "all" as const,
        label: "Semua",
        icon: <Grid2X2 className="size-4" strokeWidth={1.85} />,
        tone: "green" as const,
      },
      {
        key: "awaiting" as const,
        label: "Menunggu Hasil",
        icon: <Hourglass className="size-4" strokeWidth={1.85} />,
        tone: "amber" as const,
      },
      {
        key: "won" as const,
        label: "Menang",
        icon: <Trophy className="size-4" data-testid="buyer-bid-filter-won-icon" strokeWidth={1.85} />,
        tone: "green" as const,
      },
      {
        key: "lost" as const,
        label: "Tidak Menang",
        icon: <CircleX className="size-4" data-testid="buyer-bid-filter-lost-icon" strokeWidth={1.85} />,
        tone: "slate" as const,
      },
      {
        key: "failed" as const,
        label: "Gagal",
        icon: <CircleX className="size-4" strokeWidth={1.85} />,
        tone: "red" as const,
      },
    ],
    []
  );

  const visibleTransactions = useMemo(() => {
    const recordedTransactions = transactions.filter(
      (item) => !(item.kind === "FIXED_PRICE" && item.status === "MENUNGGU_PEMBAYARAN")
    );

    if (transactionFilter === "all") {
      return recordedTransactions;
    }

    return recordedTransactions.filter(
      (item) => getTransactionStatusMeta(item.status).matchesFilter === transactionFilter
    );
  }, [transactionFilter, transactions]);

  const visibleBids = useMemo(() => {
    if (bidFilter === "all") {
      return bids;
    }

    return bids.filter((item) => getBidFilterStatus(item.status) === bidFilter);
  }, [bidFilter, bids]);

  const currentTransactionFilters = tab === "transactions" ? transactionFilterOptions : bidFilterOptions;
  const combinedTransactionActivities = useMemo(() => {
    const visibleTransactionIds = new Set(visibleTransactions.map((transaction) => transaction.id));
    const standaloneBids = bids.filter(
      (bid) => !bid.linkedTransactionId || !visibleTransactionIds.has(bid.linkedTransactionId)
    );

    if (transactionFilter !== "all") {
      return visibleTransactions.map((transaction) => ({
        id: transaction.id,
        kind: "transaction" as const,
        transaction,
      }));
    }

    return [
      ...visibleTransactions.map((transaction) => ({
        id: transaction.id,
        kind: "transaction" as const,
        transaction,
      })),
      ...standaloneBids.map((bid) => ({
        id: `${bid.lotId}-${bid.status}-${bid.bidHash ?? bid.closingAt ?? bid.closing}`,
        bid,
        kind: "bid" as const,
      })),
    ];
  }, [bids, transactionFilter, visibleTransactions]);
  const hasEmptyState = tab === "transactions" ? combinedTransactionActivities.length === 0 : visibleBids.length === 0;

  return (
    <div className="space-y-6 bg-[#FAFAFA]">
      <div className="flex flex-wrap gap-4">
        <TransactionsTabButton
          active={tab === "transactions"}
          label="Semua Transaksi"
          onClick={() => setTab("transactions")}
        />
        <TransactionsTabButton
          active={tab === "bids"}
          label="Riwayat Lelang"
          onClick={() => setTab("bids")}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {currentTransactionFilters.map((item) => (
          <FilterChip
            active={tab === "transactions" ? transactionFilter === item.key : bidFilter === item.key}
            icon={item.icon}
            key={item.key}
            label={item.label}
            tone={item.tone}
            onClick={() => {
              if (tab === "transactions") {
                setTransactionFilter(item.key as TransactionFilter);
              } else {
                setBidFilter(item.key as BidFilter);
              }
            }}
          />
        ))}
      </div>

      <div className="space-y-5">
        {tab === "transactions" ? (
          combinedTransactionActivities.length > 0 ? (
            combinedTransactionActivities.map((item) =>
              item.kind === "transaction" ? (
                <TransactionRow key={item.id} transaction={item.transaction} />
              ) : (
                <BidRow key={item.id} item={item.bid} />
              )
            )
          ) : null
        ) : visibleBids.length > 0 ? (
          visibleBids.map((item) => (
            <div
              key={`${item.lotId}-${item.status}-${item.bidHash ?? item.closingAt ?? item.closing}`}
              ref={item.lotId === highlightedBidLotId ? highlightedBidRef : null}
            >
              <BidRow item={item} />
            </div>
          ))
        ) : null}

        {hasEmptyState ? (
          <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <p className="font-headline text-[1.6rem] font-black tracking-[-0.03em] text-[#15211b]">
              Belum ada data untuk tampilan ini.
            </p>
            <p className="mt-3 text-[1rem] leading-7 text-[#66706a]">
              Coba pindah tab atau ubah filter status untuk melihat transaksi dan riwayat lelang lain.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
