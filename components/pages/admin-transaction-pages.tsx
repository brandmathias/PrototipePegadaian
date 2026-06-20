"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FileText,
  History,
  Printer,
  ReceiptText,
  UserRound,
  WalletCards,
  XCircle
} from "lucide-react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import { AdminPaginationFooter, useAdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { HandoverProofUploadForm } from "@/components/admin-unit/handover-proof-upload-form";
import { AdminUnitActionButton } from "@/components/admin-unit/admin-unit-action-button";
import { PaymentWorkflowRail, type PaymentWorkflowStep } from "@/components/shared/payment-workflow-rail";
import { TransactionReceiptAutoPrint } from "@/components/shared/transaction-receipt-auto-print";
import { TransactionReceiptDocument } from "@/components/shared/transaction-receipt-document";
import { TransactionReceiptInlinePrint } from "@/components/shared/transaction-receipt-inline-print";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { currency } from "@/lib/formatters/currency";

type AdminTransactionItem = Record<string, any>;

const VERIFICATION_STATUSES = new Set(["BUKTI_DIUNGGAH", "MENUNGGU_KONFIRMASI_LANGSUNG"]);
const HISTORY_EXCLUDED_STATUSES = new Set(["BUKTI_DIUNGGAH", "MENUNGGU_KONFIRMASI_LANGSUNG", "MENUNGGU_PEMBAYARAN"]);
const VERIFICATION_FILTERS = [
  { id: "SEMUA", label: "Semua" },
  { id: "MENUNGGU_PEMBAYARAN", label: "Menunggu Pembayaran" },
  { id: "BUKTI_DIUNGGAH", label: "Bukti Diunggah" },
  { id: "MENUNGGU_KONFIRMASI_LANGSUNG", label: "Bayar Langsung" },
  { id: "LUNAS", label: "Terverifikasi" },
  { id: "SELESAI", label: "Selesai" },
  { id: "DITOLAK_BUKTI", label: "Ditolak" }
] as const;

function humanize(value?: string | null) {
  if (!value) {
    return "-";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (match) => match.toUpperCase());
}

function isPaymentVerified(transaction: AdminTransactionItem) {
  return transaction.status === "LUNAS" || transaction.status === "SELESAI";
}

function transactionDeadlineLabel(transaction: AdminTransactionItem, serverNow?: string) {
  if (isPaymentVerified(transaction)) {
    return (
      <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#bfe8cf] bg-[#effbf4] px-3 py-1.5 text-xs font-black leading-5 text-[#075b3f] dark:border-emerald-300/18 dark:bg-emerald-300/10 dark:text-emerald-200">
        <CheckCircle2 className="size-3.5 shrink-0" />
        <span>Selesai</span>
      </span>
    );
  }

  return (
    <AdminLiveCountdown
      className="text-sm font-medium text-black/72 dark:text-slate-200/78"
      expiredLabel="Batas waktu terlewati"
      fallbackLabel={transaction.deadline}
      prefix="Sisa"
      serverNow={serverNow}
      targetAt={transaction.deadlineAt}
    />
  );
}

function paymentChannelLabel(method?: string | null) {
  if (method === "TRANSFER_BANK") {
    return "Transfer";
  }

  if (method === "BAYAR_LANGSUNG") {
    return "Langsung di unit";
  }

  return humanize(method);
}

function receiptMarketingLabel(mode?: string | null) {
  if (mode?.toLowerCase().includes("vickrey")) {
    return "Lelang";
  }

  return mode || "Harga Tetap";
}

function isProofPreviewable(url?: string | null) {
  if (!url) {
    return false;
  }

  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(url);
}

function buildTransactionReference(transaction: AdminTransactionItem) {
  if (transaction.reference && transaction.reference !== "-") {
    return transaction.reference;
  }

  const suffix = String(transaction.id ?? "0000").slice(-6).toUpperCase();
  return `${transaction.method === "BAYAR_LANGSUNG" ? "CASH" : "REF"}-${suffix}`;
}

function getVerificationTransactions(transactions: AdminTransactionItem[]) {
  return transactions.filter((transaction) => VERIFICATION_STATUSES.has(transaction.status));
}

function getFixedPriceTransactions(transactions: AdminTransactionItem[]) {
  return transactions.filter((transaction) => transaction.pemasaranMode === "Harga Tetap");
}

function getHistoryTransactions(transactions: AdminTransactionItem[]) {
  return transactions.filter((transaction) => !HISTORY_EXCLUDED_STATUSES.has(transaction.status));
}

function getFilteredVerificationTransactions(transactions: AdminTransactionItem[], filter: string) {
  if (filter === "SEMUA") {
    return transactions;
  }

  return transactions.filter((transaction) => transaction.status === filter);
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white p-5 text-sm leading-7 text-black/55 dark:border-white/10 dark:bg-[#101a15] dark:text-slate-300/72">
      {text}
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-gradient-to-br from-[#f4f8f6] via-white to-[#f9fbfa] p-5 shadow-[0_22px_52px_-44px_rgba(10,74,51,0.18)] dark:border-white/8 dark:bg-[linear-gradient(145deg,rgba(16,29,23,0.98),rgba(10,19,15,0.98))] dark:shadow-[0_24px_60px_-42px_rgba(0,0,0,0.6)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-black/45 dark:text-emerald-100/48 sm:text-xs">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-headline text-3xl font-black tracking-tight text-black/88 dark:text-slate-100 sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-black/64 dark:text-slate-300/74 sm:text-lg">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  href
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      className="group rounded-[1.75rem] border border-black/10 bg-white p-5 shadow-[0_18px_44px_-38px_rgba(10,74,51,0.18)] transition duration-200 hover:-translate-y-1 hover:border-[#0a6a49]/18 dark:border-white/8 dark:bg-[#101a15] dark:shadow-[0_24px_56px_-40px_rgba(0,0,0,0.58)] dark:hover:border-emerald-300/16"
      href={href}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#eef6f1] text-[#0a6a49] dark:bg-emerald-300/10 dark:text-emerald-200">
          {icon}
        </span>
        <ArrowRight className="size-4 text-black/28 transition duration-200 group-hover:text-[#0a6a49] dark:text-slate-400 dark:group-hover:text-emerald-200" />
      </div>
      <p className="mt-5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-black/45 dark:text-emerald-100/46">{label}</p>
      <p className="mt-3 font-headline text-4xl font-black tracking-tight text-black/88 dark:text-slate-100">{value}</p>
      <p className="mt-2 text-sm leading-6 text-black/58 dark:text-slate-300/72">{detail}</p>
    </Link>
  );
}

function DetailStat({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-black/8 bg-[#fbfbfa] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-white/8 dark:bg-[#14201a] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42 dark:text-slate-400">{label}</p>
      <div className="mt-2 min-w-0 break-words text-sm font-semibold leading-6 text-black/82 dark:text-slate-100">{value}</div>
    </div>
  );
}

function MarketingModeChip({ mode }: { mode?: string | null }) {
  const label = mode || "-";
  const isVickrey = label.toLowerCase().includes("vickrey");

  return (
    <Badge
      className={
        isVickrey
          ? "bg-[#ecefed] text-[#263f34] dark:bg-white/8 dark:text-slate-200"
          : "bg-[#e7f4ee] text-[#075b3f] dark:bg-emerald-300/10 dark:text-emerald-200"
      }
      variant="muted"
    >
      {label}
    </Badge>
  );
}

function getAdminWorkspaceStatusText(transaction: AdminTransactionItem) {
  if (transaction.status === "SELESAI") {
    return "Transaksi sudah ditutup buyer dan masuk arsip.";
  }

  if (transaction.status === "LUNAS") {
    return "Pembayaran sudah diverifikasi. Menunggu buyer menekan Pembelian Selesai.";
  }

  if (transaction.status === "BUKTI_DIUNGGAH") {
    return "Bukti transfer sudah masuk. Admin perlu memeriksa dan memutuskan.";
  }

  if (transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG") {
    return "Buyer memilih bayar langsung. Cocokkan pembayaran loket sebelum konfirmasi.";
  }

  if (transaction.status === "DITOLAK_BUKTI") {
    return "Bukti ditolak dan transaksi dibatalkan.";
  }

  return "Transaksi masih menunggu pembayaran buyer.";
}

function TransactionSummaryDossier({
  transaction,
  backHref,
  serverNow
}: {
  transaction: AdminTransactionItem;
  backHref: string;
  serverNow?: string;
}) {
  return (
    <Card className="self-start overflow-hidden rounded-[1.9rem] border border-black/10 bg-white shadow-[0_24px_60px_-48px_rgba(10,74,51,0.44)] dark:border-white/8 dark:bg-[#101a15] dark:shadow-[0_26px_64px_-40px_rgba(0,0,0,0.62)] xl:sticky xl:top-28">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="overflow-hidden rounded-[1.45rem] border border-black/8 bg-[#f6f7f3] dark:border-white/8 dark:bg-[#14201a]">
          {transaction.imageUrl ? (
            <Image
              alt={`Foto barang ${transaction.lot}`}
              className="aspect-[16/10] w-full object-cover"
              height={720}
              src={transaction.imageUrl}
              width={960}
            />
          ) : (
            <div className="relative grid aspect-[16/10] place-items-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(215,173,47,0.28),transparent_30%),linear-gradient(135deg,#0a6a49_0%,#073f30_100%)] text-white">
              <ReceiptText className="size-12 opacity-90" />
              <div className="absolute inset-x-6 bottom-5 h-px bg-white/20" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MarketingModeChip mode={transaction.pemasaranMode} />
        </div>

        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-black/42 dark:text-slate-400">
            Dossier Transaksi
          </p>
          <h3 className="mt-2 font-headline text-[2rem] font-black tracking-tight text-black/88 dark:text-slate-100">
            {transaction.lot}
          </h3>
          <p className="mt-2 text-sm leading-6 text-black/58 dark:text-slate-300/72">Buyer: {transaction.buyer}</p>
          <p className="mt-3 text-sm leading-6 text-black/58 dark:text-slate-300/72">{getAdminWorkspaceStatusText(transaction)}</p>
        </div>

        <div className="rounded-[1.35rem] border border-[#dfe7df] bg-[#f8fbf8] p-4 dark:border-emerald-300/10 dark:bg-emerald-300/[0.06]">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-black/42 dark:text-slate-400">
            Nominal transaksi
          </p>
          <p className="mt-2 font-headline text-3xl font-black tracking-tight text-[#0a6a49] dark:text-emerald-200">
            {currency.format(transaction.total)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <DetailStat label="Referensi" value={buildTransactionReference(transaction)} />
          <DetailStat label="Batas pembayaran" value={transactionDeadlineLabel(transaction, serverNow)} />
          <DetailStat label="Email buyer" value={transaction.buyerEmail || "-"} />
          <DetailStat label="Nomor HP" value={transaction.buyerPhone || "-"} />
        </div>

        <div className="rounded-[1.5rem] border border-black/8 bg-[#fbfbfa] p-4 dark:border-white/8 dark:bg-[#14201a]">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42 dark:text-slate-400">
            Jalur cepat
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Link href="/admin/pemasaran">
              <Button className="w-full" variant="secondary">
                <ReceiptText className="size-4" />
                Kembali ke pemasaran
              </Button>
            </Link>
            <Link href={backHref}>
              <Button className="w-full" variant="ghost">
                <History className="size-4" />
                Kembali ke daftar
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkspacePanel({
  icon,
  label,
  children,
  className = ""
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.55rem] border border-black/8 bg-[#fbfbfa] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-white/8 dark:bg-[#14201a] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e8f4ee] text-[#0a6a49] dark:bg-emerald-300/10 dark:text-emerald-200">
          {icon}
        </span>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/46 dark:text-slate-400">{label}</p>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function getReceiptTerms(transaction: AdminTransactionItem) {
  return [
    "Tunjukkan nota ini beserta kartu identitas asli (KTP) saat pengambilan barang.",
    `Pengambilan barang dilakukan di unit ${transaction.unit ?? "-"}.`,
    "Pembayaran sudah diverifikasi admin unit dan nota ini sah sebagai bukti pembelian.",
    "Simpan nota ini untuk keperluan administrasi atau pengambilan barang."
  ];
}

function getTransactionReceiptPrintRootId(transaction: AdminTransactionItem) {
  return `transaction-receipt-print-root-${String(transaction.id).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function AdminTransactionInlineReceiptPrint({
  buttonClassName,
  label,
  transaction
}: {
  buttonClassName: string;
  label?: string;
  transaction: AdminTransactionItem;
}) {
  const isCompleted = transaction.status === "SELESAI";

  return (
    <TransactionReceiptInlinePrint
      buttonClassName={buttonClassName}
      label={label}
      rootId={getTransactionReceiptPrintRootId(transaction)}
    >
      <TransactionReceiptDocument
        buyerEmail={transaction.buyerEmail}
        buyerName={transaction.buyer}
        buyerPhone={transaction.buyerPhone}
        extraMeta={[{ label: "Jenis transaksi", value: receiptMarketingLabel(transaction.pemasaranMode) }]}
        footerText="Dokumen ini diterbitkan oleh admin unit Ruang Agunan."
        imageUrl={transaction.imageUrl}
        itemSubtitle={transaction.method === "TRANSFER_BANK" ? "Transfer Bank" : "Bayar Langsung"}
        itemTitle={transaction.lot}
        noteNumber={transaction.receiptNumber ?? `PEG-${String(transaction.id).slice(0, 8).toUpperCase()}`}
        paymentMethodLabel={paymentChannelLabel(transaction.method)}
        statusLabel={isCompleted ? "Selesai oleh buyer" : "Terverifikasi admin"}
        subtotal={transaction.total}
        terms={getReceiptTerms(transaction)}
        total={transaction.total}
        transactionId={transaction.id}
        unitAddress={transaction.unitAddress}
        unitName={transaction.unit ?? "-"}
        verifiedAt={transaction.verifiedAt}
        outputLayout
      />
    </TransactionReceiptInlinePrint>
  );
}

function AdminPurchaseTimeline({ transaction }: { transaction: AdminTransactionItem }) {
  const isTransfer = transaction.method === "TRANSFER_BANK";
  const isVerified = transaction.status === "LUNAS" || transaction.status === "SELESAI";
  const completed = transaction.status === "SELESAI";
  const currentIndex =
    transaction.status === "SELESAI"
      ? 2
      : isVerified
        ? 2
        : transaction.status === "BUKTI_DIUNGGAH" || transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG"
        ? 1
        : 0;
  const paymentDetail = isTransfer
    ? transaction.proofFile
      ? "Bukti transfer sudah masuk dan siap diperiksa admin."
      : "Buyer belum mengunggah bukti transfer. Transaksi belum bisa diverifikasi."
    : transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG"
      ? "Buyer membayar langsung di loket. Cocokkan identitas dan nominal sebelum konfirmasi."
      : "Menunggu buyer datang dan menyelesaikan pembayaran langsung di unit.";
  const verificationDetail = isVerified
    ? transaction.verifiedAt || "Pembayaran sudah diverifikasi admin unit."
    : isTransfer
      ? "Periksa bukti transfer, nominal, dan referensi. Setujui atau tolak bukti dari panel tindakan."
      : "Konfirmasi hanya jika dana pembayaran langsung benar-benar sudah diterima.";
  const finishDetail =
    transaction.status === "SELESAI"
      ? "Buyer sudah menekan Pembelian Selesai. Barang keluar dari katalog dan transaksi masuk arsip."
      : isVerified
        ? "Menunggu buyer menekan Pembelian Selesai setelah nota tersedia."
        : "Tahap selesai terbuka setelah admin memverifikasi pembayaran.";
  const steps: PaymentWorkflowStep[] = [
    {
      id: "payment",
      label: "Melakukan Pembayaran",
      headline: isTransfer ? "Bukti Transfer Buyer" : "Pembayaran di Loket",
      detail: paymentDetail,
      meta: isTransfer ? "Sumber: upload buyer" : "Sumber: loket unit",
      occurredAt: transaction.createdAt,
      icon: WalletCards
    },
    {
      id: "verification",
      label: "Verifikasi",
      headline: "Admin Perlu Verifikasi",
      detail: verificationDetail,
      meta: "Tindakan admin",
      occurredAt: transaction.verifiedAt,
      icon: FileCheck2
    },
    {
      id: "completed",
      label: "Selesai Buyer",
      headline: completed ? "Transaksi Selesai" : "Menunggu Buyer Selesai",
      detail: finishDetail,
      meta: "Penutupan transaksi",
      occurredAt: transaction.completedAt,
      icon: CheckCircle2
    }
  ];

  return (
    <PaymentWorkflowRail
      className="rounded-[1.5rem] border-black/8 shadow-none"
      compact
      completed={completed}
      currentStep={currentIndex}
      description={
        transaction.pemasaranMode === "Lelang Tertutup"
          ? "Lelang Tertutup selesai melalui loket unit, tanpa upload bukti online."
          : isTransfer
            ? "Fixed price transfer perlu bukti buyer sebelum tombol verifikasi aktif."
            : "Fixed price bayar langsung cukup dikonfirmasi saat dana diterima di loket."
      }
      steps={steps}
      title="Status Alur Pembelian"
      tone="admin"
    />
  );
}

function getLedgerStatusSignal(transaction: AdminTransactionItem) {
  if (transaction.status === "SELESAI") {
    return {
      title: "Selesai & diarsipkan",
      detail: "Alur selesai",
      shellClass: "border-[#bfe8cf] bg-[#f0fbf4] text-[#075b3f] dark:border-emerald-300/16 dark:bg-emerald-300/[0.08] dark:text-emerald-200",
      iconClass: "bg-[#0a6a49] text-white dark:bg-emerald-300/18 dark:text-emerald-100",
      pulseClass: "bg-[#20b96b]/24",
      icon: CheckCircle2
    };
  }

  if (transaction.status === "LUNAS") {
    return {
      title: "Terverifikasi admin",
      detail: "Menunggu buyer selesai",
      shellClass: "border-[#c9ead3] bg-[#f4fcf6] text-[#075b3f] dark:border-emerald-300/16 dark:bg-emerald-300/[0.08] dark:text-emerald-200",
      iconClass: "bg-[#20b96b] text-white dark:bg-emerald-300/18 dark:text-emerald-100",
      pulseClass: "bg-[#20b96b]/22",
      icon: CheckCircle2
    };
  }

  if (transaction.status === "BUKTI_DIUNGGAH") {
    return {
      title: "Bukti masuk",
      detail: "Perlu verifikasi",
      shellClass: "border-[#eadcae] bg-[#fffaf0] text-[#735a0f] dark:border-amber-300/16 dark:bg-amber-300/[0.08] dark:text-amber-200",
      iconClass: "bg-[#d7ad2f] text-[#3f3002] dark:bg-amber-300/18 dark:text-amber-100",
      pulseClass: "bg-[#d7ad2f]/24",
      icon: FileCheck2
    };
  }

  if (transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG") {
    return {
      title: "Perlu konfirmasi loket",
      detail: "Cocokkan pembayaran",
      shellClass: "border-[#eadcae] bg-[#fffaf0] text-[#735a0f] dark:border-amber-300/16 dark:bg-amber-300/[0.08] dark:text-amber-200",
      iconClass: "bg-[#d7ad2f] text-[#3f3002] dark:bg-amber-300/18 dark:text-amber-100",
      pulseClass: "bg-[#d7ad2f]/24",
      icon: WalletCards
    };
  }

  if (transaction.status === "DITOLAK_BUKTI") {
    return {
      title: "Bukti ditolak",
      detail: "Transaksi dibatalkan",
      shellClass: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/16 dark:bg-rose-300/[0.08] dark:text-rose-200",
      iconClass: "bg-rose-600 text-white dark:bg-rose-300/18 dark:text-rose-100",
      pulseClass: "bg-rose-400/20",
      icon: XCircle
    };
  }

  return {
    title: humanize(transaction.status),
    detail: "Menunggu update",
    shellClass: "border-black/10 bg-[#f7f8f5] text-black/68 dark:border-white/8 dark:bg-white/[0.04] dark:text-slate-300/72",
    iconClass: "bg-black/12 text-black/48 dark:bg-white/10 dark:text-slate-300",
    pulseClass: "bg-black/10",
    icon: FileText
  };
}

function LedgerStatusSignal({ transaction, serverNow }: { transaction: AdminTransactionItem; serverNow?: string }) {
  const signal = getLedgerStatusSignal(transaction);
  const verified = isPaymentVerified(transaction);
  const Icon = signal.icon;

  return (
    <div
      className={`relative max-w-[21rem] overflow-hidden rounded-2xl border px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${signal.shellClass}`}
    >
      {verified ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0a6a49,#20b96b,#d7ad2f)]" />
      ) : null}
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 grid size-7 shrink-0 place-items-center">
          {verified ? <span className={`status-pulse absolute inset-1 rounded-full ${signal.pulseClass}`} /> : null}
          <span className={`relative grid size-7 place-items-center rounded-full ${signal.iconClass}`}>
            <Icon className="size-4" />
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-black leading-5">{signal.title}</span>
          <span className="mt-1 block text-xs font-semibold leading-5 opacity-72">
            {verified
              ? transaction.verifiedAt && transaction.verifiedAt !== "-"
                ? `Diverifikasi ${transaction.verifiedAt}`
                : signal.detail
              : transactionDeadlineLabel(transaction, serverNow)}
          </span>
        </span>
      </div>
    </div>
  );
}

function TransactionLedgerRow({
  transaction,
  href,
  serverNow
}: {
  transaction: AdminTransactionItem;
  href: string;
  serverNow?: string;
}) {
  return (
    <div className="grid gap-4 px-4 py-4 transition duration-200 hover:bg-[#fbfcfa] dark:hover:bg-white/[0.025] lg:grid-cols-[minmax(17rem,1.35fr)_minmax(9rem,0.55fr)_minmax(9rem,0.65fr)_minmax(15rem,0.95fr)_auto] lg:items-center lg:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-black/8 bg-[#f1f3ef] dark:border-white/8 dark:bg-[#17241d]">
          {transaction.imageUrl ? (
            <Image
              alt={`Foto barang ${transaction.lot}`}
              className="size-full object-cover"
              height={112}
              src={transaction.imageUrl}
              width={112}
            />
          ) : (
            <ReceiptText className="size-5 text-[#0a6a49] dark:text-emerald-200" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-headline text-lg font-black tracking-tight text-black/88 dark:text-slate-100">
            {transaction.lot}
          </h3>
          <p className="mt-1 truncate text-sm text-black/56 dark:text-slate-300/68">{transaction.buyer}</p>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-black/36 dark:text-slate-500 lg:hidden">
          Pemasaran
        </p>
        <MarketingModeChip mode={transaction.pemasaranMode} />
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-black/36 dark:text-slate-500 lg:hidden">
          Nominal
        </p>
        <p className="font-semibold text-black/82 dark:text-slate-100">{currency.format(transaction.total)}</p>
        <p className="mt-1 truncate text-xs text-black/42 dark:text-slate-400">{buildTransactionReference(transaction)}</p>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-black/36 dark:text-slate-500 lg:hidden">
          Status
        </p>
        <LedgerStatusSignal serverNow={serverNow} transaction={transaction} />
      </div>

      <div className="flex lg:justify-end">
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-[#075b3f] transition duration-200 hover:-translate-y-0.5 hover:border-[#0a6a49]/24 hover:bg-[#f4faf6] active:translate-y-0 dark:border-white/10 dark:bg-white/[0.04] dark:text-emerald-200 dark:hover:border-emerald-300/20 dark:hover:bg-white/[0.07]"
          href={href}
        >
          Lihat detail
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function TransactionLedgerList({
  transactions,
  getHref,
  emptyText,
  serverNow
}: {
  transactions: AdminTransactionItem[];
  getHref: (transaction: AdminTransactionItem) => string;
  emptyText: string;
  serverNow?: string;
}) {
  const pagination = useAdminPagination(
    transactions,
    transactions.map((transaction) => transaction.id).join("|")
  );

  if (!transactions.length) {
    return <EmptyPanel text={emptyText} />;
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-black/10 bg-white shadow-[0_18px_54px_-46px_rgba(10,74,51,0.38)] dark:border-white/8 dark:bg-[#101a15] dark:shadow-[0_24px_60px_-40px_rgba(0,0,0,0.6)]">
      <div className="hidden grid-cols-[minmax(17rem,1.35fr)_minmax(9rem,0.55fr)_minmax(9rem,0.65fr)_minmax(15rem,0.95fr)_auto] border-b border-black/8 bg-[#f7f8f5] px-5 py-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42 dark:border-white/8 dark:bg-white/[0.04] dark:text-slate-400 lg:grid">
        <span>Transaksi</span>
        <span>Pemasaran</span>
        <span>Nominal</span>
        <span>Status kerja</span>
        <span className="text-right">Aksi</span>
      </div>
      <div className="divide-y divide-black/8 dark:divide-white/8">
        {pagination.visibleItems.map((transaction) => (
          <TransactionLedgerRow
            href={getHref(transaction)}
            key={transaction.id}
            serverNow={serverNow}
            transaction={transaction}
          />
        ))}
      </div>
      <AdminPaginationFooter
        itemLabel="transaksi"
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        onPageIndexChange={pagination.setPageIndex}
        onPageSizeChange={pagination.setPageSize}
      />
    </div>
  );
}

export function VerificationWorkspace({
  transaction,
  title = "Panel Verifikasi Pembayaran",
  description = "Periksa pembayaran harga tetap, cocokkan bukti atau pembayaran langsung, lalu putuskan status transaksi.",
  serverNow
}: {
  transaction: AdminTransactionItem;
  title?: string;
  description?: string;
  serverNow?: string;
}) {
  const needsDecision = VERIFICATION_STATUSES.has(transaction.status);

  return (
    <Card className="self-start overflow-hidden rounded-[1.9rem] border border-black/10 bg-white shadow-[0_24px_70px_-54px_rgba(10,74,51,0.45)] dark:border-white/8 dark:bg-[#101a15] dark:shadow-[0_26px_64px_-40px_rgba(0,0,0,0.62)]">
      <CardHeader className="border-b border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfa_100%)] pb-5 dark:border-white/8 dark:bg-[linear-gradient(180deg,#131f19_0%,#101a15_100%)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <CardTitle className="text-[2rem] font-black tracking-tight text-black/88 dark:text-slate-100">{title}</CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm leading-6 text-black/58 dark:text-slate-300/72">
              {description}
            </CardDescription>
          </div>
          <Badge variant={needsDecision ? "accent" : "muted"}>
            {needsDecision ? "Butuh keputusan" : humanize(transaction.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-6">
        <AdminPurchaseTimeline transaction={transaction} />

        <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.82fr)]">
          <div className="space-y-4">
            <WorkspacePanel icon={<UserRound className="size-4" />} label="Informasi Pembeli">
              <div className="divide-y divide-black/8 overflow-hidden rounded-[1.25rem] border border-black/8 bg-white dark:divide-white/8 dark:border-white/8 dark:bg-[#14201a]">
                {[
                  ["Nama lengkap", transaction.buyer],
                  ["Email", transaction.buyerEmail || "-"],
                  ["Nomor HP", transaction.buyerPhone || "-"],
                  ["NIK", transaction.buyerNationalId || "-"]
                ].map(([label, value]) => (
                  <div className="grid gap-2 px-4 py-3 sm:grid-cols-[0.38fr_0.62fr]" key={label}>
                    <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42 dark:text-slate-400">
                      {label}
                    </span>
                    <span className="break-words text-sm font-semibold leading-6 text-black/82 dark:text-slate-100">{value}</span>
                  </div>
                ))}
              </div>
            </WorkspacePanel>

            <WorkspacePanel icon={<FileCheck2 className="size-4" />} label="Ringkasan Operasional">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailStat label="Barang" value={transaction.lot} />
                <DetailStat label="Nominal" value={currency.format(transaction.total)} />
                <DetailStat label="Metode bayar" value={paymentChannelLabel(transaction.method)} />
                <DetailStat label="Deadline" value={transactionDeadlineLabel(transaction, serverNow)} />
                <DetailStat label="Status" value={<AdminStatusBadge status={transaction.status} />} />
                <DetailStat label="Referensi" value={buildTransactionReference(transaction)} />
              </div>
              {transaction.rejectionReason ? (
                <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-700 dark:border-rose-300/18 dark:bg-rose-300/[0.08] dark:text-rose-200">
                  Catatan penolakan sebelumnya: {transaction.rejectionReason}
                </p>
              ) : null}
            </WorkspacePanel>
          </div>

          <div className="space-y-4">
            <WorkspacePanel icon={<ReceiptText className="size-4" />} label="Bukti Pembayaran">
              <ProofPreview transaction={transaction} />
            </WorkspacePanel>

            <WorkspacePanel icon={<Printer className="size-4" />} label="Tindakan Admin">
              <TransactionActionPanel transaction={transaction} />
            </WorkspacePanel>
          </div>
        </div>

        <WorkspacePanel icon={<FileCheck2 className="size-4" />} label="Bukti Serah Terima">
          <HandoverProofUploadForm
            canUpload={transaction.status === "LUNAS" || transaction.status === "SELESAI"}
            itemTitle={transaction.lot}
            location={transaction.unit}
            proof={{
              fileUrl: transaction.handoverProofFile,
              uploadedAt: transaction.handoverProofUploadedAt,
              uploadedBy: transaction.handoverProofUploadedBy,
              location: transaction.unit
            }}
            transactionId={transaction.id}
          />
        </WorkspacePanel>
      </CardContent>
    </Card>
  );
}

function ProofPreview({ transaction }: { transaction: AdminTransactionItem }) {
  if (transaction.method !== "TRANSFER_BANK") {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-[#fafaf8] p-6 text-sm leading-7 text-black/58 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300/72">
        Pembayaran dilakukan langsung di unit. Admin cukup memastikan dana benar-benar diterima lalu mengonfirmasi transaksi.
      </div>
    );
  }

  if (!transaction.proofFile) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-[#fafaf8] p-6 text-sm leading-7 text-black/58 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300/72">
        Bukti pembayaran belum tersedia pada transaksi ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-[#f7f7f4] dark:border-white/8 dark:bg-[#14201a]">
        {isProofPreviewable(transaction.proofFile) ? (
          <Image
            alt={`Bukti pembayaran ${transaction.id}`}
            className="aspect-[4/3] w-full object-cover"
            height={900}
            src={transaction.proofFile}
            width={1200}
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-[#f4f4ef] text-black/46 dark:bg-[#17241d] dark:text-slate-400">
            <FileText className="size-12" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-black/54 dark:text-slate-300/68">
          {transaction.method === "TRANSFER_BANK"
            ? "Bukti transfer ini tersimpan dari transaksi buyer dan dibaca langsung dari database."
            : "Dokumen transaksi tersimpan di database unit."}
        </p>
        <a
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a6a49] underline-offset-4 hover:underline dark:text-emerald-200"
          href={transaction.proofFile}
          rel="noreferrer"
          target="_blank"
        >
          Buka file asli
          <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  );
}

function TransactionActionPanel({
  transaction
}: {
  transaction: AdminTransactionItem;
}) {
  const canVerifyTransfer = transaction.status === "BUKTI_DIUNGGAH" && transaction.method === "TRANSFER_BANK";
  const canConfirmDirect = transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG";
  const canPrint = transaction.printableReceipt || transaction.status === "LUNAS" || transaction.status === "SELESAI";
  const baseClass = "h-12 rounded-2xl";

  return (
    <div className="space-y-3">
      {canVerifyTransfer ? (
        <>
          <AdminUnitActionButton
            className={`${baseClass} w-full`}
            confirmDescription="Setelah diverifikasi, transaksi masuk tahap terverifikasi. Tahap selesai tetap menunggu buyer menekan Pembelian Selesai."
            confirmLabel="Verifikasi sekarang"
            confirmTitle="Verifikasi pembayaran transfer"
            endpoint={`/api/admin/transaksi/${transaction.id}/verifikasi`}
            payload={{ reference: buildTransactionReference(transaction) }}
            pendingDescription="Sistem sedang menutup transaksi transfer dan memperbarui status barang."
            pendingTitle="Memverifikasi pembayaran"
            refresh
            successDescription="Pembayaran sudah terverifikasi. Buyer dapat membuka nota dan menandai pembelian selesai."
            successTitle="Pembayaran disetujui"
          >
            <CheckCircle2 className="size-4" />
            Verifikasi pembayaran
          </AdminUnitActionButton>
          <AdminUnitActionButton
            className={`${baseClass} w-full`}
            confirmDescription="Pembeli akan diminta mengunggah bukti transfer yang lebih jelas atau benar."
            confirmLabel="Tolak bukti"
            confirmTitle="Kembalikan bukti pembayaran"
            confirmVariant="destructive"
            endpoint={`/api/admin/transaksi/${transaction.id}/tolak-bukti`}
            payload={{ reason: "Bukti pembayaran perlu diperbaiki oleh pembeli." }}
            pendingDescription="Sistem sedang mengembalikan bukti agar pembeli memperbaiki dokumen transfer."
            pendingTitle="Mengembalikan bukti pembayaran"
            refresh
            successDescription="Bukti pembayaran dikembalikan untuk diperbaiki oleh pembeli."
            successTitle="Bukti pembayaran ditolak"
            variant="destructive"
          >
            <XCircle className="size-4" />
            Tolak bukti
          </AdminUnitActionButton>
        </>
      ) : null}

      {canConfirmDirect ? (
        <AdminUnitActionButton
          className={`${baseClass} w-full`}
          confirmDescription="Gunakan tindakan ini hanya jika pembayaran tunai atau langsung di unit sudah benar-benar diterima."
          confirmLabel="Dana sudah diterima"
          confirmTitle="Konfirmasi pembayaran langsung"
          endpoint={`/api/admin/transaksi/${transaction.id}/konfirmasi-langsung`}
          payload={{ reference: buildTransactionReference(transaction) }}
          pendingDescription="Status pembayaran langsung sedang ditandai terverifikasi."
          pendingTitle="Mengonfirmasi pembayaran"
          refresh
          successDescription="Pembayaran langsung sudah dikonfirmasi. Tahap selesai menunggu konfirmasi buyer."
          successTitle="Pembayaran langsung terverifikasi"
          variant="secondary"
        >
          <WalletCards className="size-4" />
          Konfirmasi pembayaran langsung
        </AdminUnitActionButton>
      ) : null}

      {canPrint ? (
        <AdminTransactionInlineReceiptPrint
          buttonClassName={`${baseClass} inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/12 bg-[#f4f4f1] px-4 py-3 text-sm font-semibold text-black/78 transition hover:bg-[#ecece7] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]`}
          label="Cetak Nota"
          transaction={transaction}
        />
      ) : null}

      {!canVerifyTransfer && !canConfirmDirect && !canPrint ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-[#fafaf8] p-4 text-sm leading-7 text-black/56 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300/72">
          Belum ada tindakan yang perlu dijalankan admin untuk transaksi ini. Pantau status buyer atau buka riwayat transaksi.
        </div>
      ) : null}
    </div>
  );
}

export function AdminTransactionHubPage({ transactions }: { transactions: AdminTransactionItem[] }) {
  const verificationQueue = getVerificationTransactions(transactions);
  const history = getHistoryTransactions(transactions);
  const waitingBuyer = transactions.filter((transaction) => transaction.status === "MENUNGGU_PEMBAYARAN");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Unit / Transaksi"
        title="Transaksi"
        description="Masuk ke jalur kerja verifikasi pembayaran atau buka riwayat transaksi unit tanpa kehilangan koneksi ke data database aktif."
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <MetricCard
          detail="Fokus pada transaksi transfer dan pembayaran langsung yang benar-benar menunggu keputusan admin."
          href="/admin/pemasaran"
          icon={<FileCheck2 className="size-5" />}
          label="Verifikasi Pembayaran"
          value={String(verificationQueue.length)}
        />
        <MetricCard
          detail="Buka arsip transaksi yang sudah diputuskan, selesai, atau tersimpan sebagai jejak operasional unit."
          href="/admin/transaksi/riwayat"
          icon={<History className="size-5" />}
          label="Riwayat"
          value={String(history.length)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DetailStat label="Perlu tindakan admin" value={`${verificationQueue.length} transaksi`} />
        <DetailStat label="Menunggu pembeli" value={`${waitingBuyer.length} transaksi`} />
        <DetailStat label="Arsip tersedia" value={`${history.length} transaksi`} />
      </div>
    </div>
  );
}

export function AdminTransactionVerificationPage({
  transactions,
  serverNow
}: {
  transactions: AdminTransactionItem[];
  serverNow?: string;
}) {
  const fixedPriceTransactions = getFixedPriceTransactions(transactions);
  const actionableQueue = getVerificationTransactions(fixedPriceTransactions);
  const [activeFilter, setActiveFilter] = useState<string>("SEMUA");
  const verificationQueue = getFilteredVerificationTransactions(fixedPriceTransactions, activeFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Unit / Transaksi"
        title="Verifikasi Pembayaran"
        description="Review pengajuan harga tetap, bukti pembayaran, pembayaran langsung di unit, dan cetak nota setelah transaksi diverifikasi."
        actions={<Badge variant="accent">{actionableQueue.length} perlu tindakan</Badge>}
      />

      <div className="admin-choice-shell flex gap-2 overflow-x-auto rounded-[1.35rem] p-2">
        {VERIFICATION_FILTERS.map((filter) => {
          const count =
            filter.id === "SEMUA"
              ? fixedPriceTransactions.length
              : fixedPriceTransactions.filter((transaction) => transaction.status === filter.id).length;
          const active = activeFilter === filter.id;

          return (
            <button
              className="admin-choice-button shrink-0 rounded-[1.05rem] px-4 py-2.5 text-sm font-bold"
              aria-pressed={active}
              data-active={active}
              key={filter.id}
              type="button"
              onClick={() => {
                setActiveFilter(filter.id);
              }}
            >
              {filter.label}
              <span className="admin-choice-count">{count}</span>
            </button>
          );
        })}
      </div>

      <TransactionLedgerList
        emptyText="Belum ada transaksi yang menunggu verifikasi pembayaran. Jika semua sudah selesai, Anda bisa membuka halaman riwayat untuk melihat arsip transaksi unit."
        getHref={() => "/admin/pemasaran"}
        serverNow={serverNow}
        transactions={verificationQueue}
      />
    </div>
  );
}

export function AdminTransactionHistoryPage({
  transactions,
  serverNow
}: {
  transactions: AdminTransactionItem[];
  serverNow?: string;
}) {
  const history = getHistoryTransactions(transactions);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Unit / Transaksi"
        title="Riwayat"
        description="Arsip transaksi yang sudah selesai, ditolak, atau tidak lagi menunggu tindakan verifikasi admin."
        actions={<Badge variant="muted">{history.length} arsip</Badge>}
      />

      <TransactionLedgerList
        emptyText="Belum ada transaksi arsip untuk unit ini."
        getHref={() => "/admin/barang/riwayat"}
        serverNow={serverNow}
        transactions={history}
      />
    </div>
  );
}

export function AdminTransactionDetailWorkspacePage({
  transaction,
  backHref = "/admin/transaksi",
  backLabel = "Kembali ke transaksi",
  serverNow
}: {
  transaction: AdminTransactionItem;
  backHref?: string;
  backLabel?: string;
  serverNow?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Unit / Detail Transaksi"
        title={transaction.lot}
        description={`Workspace transaksi ${transaction.id}. Bukti, status pembayaran, dan tindakan admin dirangkum supaya keputusan unit lebih cepat dan tidak rancu.`}
        actions={
          <>
            <AdminStatusBadge className="text-[0.95rem]" status={transaction.status} />
            <Link href={backHref}>
              <Button variant="secondary">{backLabel}</Button>
            </Link>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(22rem,0.72fr)_minmax(0,1.28fr)]">
        <TransactionSummaryDossier backHref={backHref} serverNow={serverNow} transaction={transaction} />
        <VerificationWorkspace
          description="Panel ini menampilkan bukti, ringkasan, dan tombol aksi yang semuanya tetap tersambung ke endpoint verifikasi transaksi admin unit."
          serverNow={serverNow}
          title="Panel Verifikasi"
          transaction={transaction}
        />
      </div>
    </div>
  );
}

export function AdminTransactionReceiptPage({
  transaction,
  backHref = "/admin/transaksi",
  backLabel = "Kembali ke transaksi",
  outputMode
}: {
  transaction: AdminTransactionItem;
  backHref?: string;
  backLabel?: string;
  outputMode?: string;
}) {
  const noteHref = `/admin/transaksi/${transaction.id}/nota`;
  const isCompleted = transaction.status === "SELESAI";
  const isAutoOutput = outputMode === "print" || outputMode === "download";

  return (
    <div
      data-auto-output-mode={isAutoOutput ? outputMode : undefined}
      className={
        isAutoOutput
          ? "receipt-auto-output-stage mx-auto max-w-[980px] space-y-0 py-5 md:py-6 print:max-w-none print:py-0"
          : "space-y-6 print:space-y-0"
      }
    >
      <TransactionReceiptAutoPrint fileName={transaction.receiptNumber ?? transaction.id} mode={outputMode} />
      {!isAutoOutput ? (
        <div className="print:hidden">
          <PageHeader
            eyebrow="Admin Unit / Nota Transaksi"
            title="Nota pengambilan barang"
            description="Gunakan nota ini untuk mencetak, menyimpan PDF, atau menutup transaksi yang sudah diverifikasi."
            actions={
              <div className="flex flex-wrap gap-3">
                <Link href={backHref}>
                  <Button variant="secondary">{backLabel}</Button>
                </Link>
                <Link
                  className={`${buttonVariants({ variant: "default" })}`}
                  href={`${noteHref}?output=download`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ReceiptText className="size-4" />
                  Unduh PDF
                </Link>
              </div>
            }
          />
        </div>
      ) : null}

      <TransactionReceiptDocument
        buyerEmail={transaction.buyerEmail}
        buyerName={transaction.buyer}
        buyerPhone={transaction.buyerPhone}
        extraMeta={[{ label: "Jenis transaksi", value: receiptMarketingLabel(transaction.pemasaranMode) }]}
        footerText="Dokumen ini diterbitkan oleh admin unit Ruang Agunan."
        imageUrl={transaction.imageUrl}
        itemSubtitle={transaction.method === "TRANSFER_BANK" ? "Transfer Bank" : "Bayar Langsung"}
        itemTitle={transaction.lot}
        noteNumber={transaction.receiptNumber ?? `PEG-${transaction.id.slice(0, 8).toUpperCase()}`}
        paymentMethodLabel={paymentChannelLabel(transaction.method)}
        statusLabel={isCompleted ? "Selesai oleh buyer" : "Terverifikasi admin"}
        subtotal={transaction.total}
        terms={getReceiptTerms(transaction)}
        total={transaction.total}
        transactionId={transaction.id}
        unitAddress={transaction.unitAddress}
        unitName={transaction.unit ?? "-"}
        verifiedAt={transaction.verifiedAt}
        outputLayout={isAutoOutput}
      />
    </div>
  );
}


