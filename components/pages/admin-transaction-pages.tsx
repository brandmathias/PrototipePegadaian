"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarClock,
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
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminUnitActionButton } from "@/components/admin-unit/admin-unit-action-button";
import { TransactionReceiptAutoPrint } from "@/components/shared/transaction-receipt-auto-print";
import { TransactionReceiptDocument } from "@/components/shared/transaction-receipt-document";
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

function transactionDeadlineLabel(transaction: AdminTransactionItem) {
  return (
    <AdminLiveCountdown
      className="text-sm font-medium text-black/72"
      expiredLabel="Batas waktu terlewati"
      fallbackLabel={transaction.deadline}
      prefix="Sisa"
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
  return transactions.filter((transaction) => transaction.pemasaranMode === "Fixed Price");
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
    <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white p-5 text-sm leading-7 text-black/55">
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
    <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-gradient-to-br from-[#f4f8f6] via-white to-[#f9fbfa] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-black/45 sm:text-xs">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-headline text-3xl font-black tracking-tight text-black/88 sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-black/64 sm:text-lg">{description}</p>
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
      className="group rounded-[1.75rem] border border-black/10 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[#0a6a49]/18"
      href={href}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#eef6f1] text-[#0a6a49]">
          {icon}
        </span>
        <ArrowRight className="size-4 text-black/28 transition duration-200 group-hover:text-[#0a6a49]" />
      </div>
      <p className="mt-5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-black/45">{label}</p>
      <p className="mt-3 font-headline text-4xl font-black tracking-tight text-black/88">{value}</p>
      <p className="mt-2 text-sm leading-6 text-black/58">{detail}</p>
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
    <div className="rounded-2xl border border-black/8 bg-[#fbfbfa] p-4">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">{label}</p>
      <div className="mt-2 text-sm font-semibold leading-6 text-black/82">{value}</div>
    </div>
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

function AdminPurchaseTimeline({ transaction }: { transaction: AdminTransactionItem }) {
  const isVerified = transaction.status === "LUNAS" || transaction.status === "SELESAI";
  const steps = [
    {
      id: "payment",
      label: "Melakukan Pembayaran",
      detail:
        transaction.status === "MENUNGGU_PEMBAYARAN"
          ? "Menunggu pembayaran"
          : transaction.proofFile
            ? "Bukti diterima"
            : transaction.method === "BAYAR_LANGSUNG"
              ? "Menunggu pembayaran di loket"
              : "Belum ada bukti"
    },
    {
      id: "verified",
      label: "Verifikasi",
      detail: isVerified
        ? transaction.verifiedAt || "Terverifikasi admin"
        : transaction.status === "BUKTI_DIUNGGAH" || transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG"
          ? "Menunggu keputusan admin"
          : "Belum masuk verifikasi"
    },
    {
      id: "completed",
      label: "Selesai",
      detail:
        transaction.status === "SELESAI"
          ? "Buyer sudah menekan pembelian selesai"
          : transaction.status === "LUNAS"
            ? "Menunggu buyer menutup pembelian"
            : "Belum selesai"
    }
  ];
  const currentIndex =
    transaction.status === "SELESAI"
      ? 2
      : isVerified || transaction.status === "BUKTI_DIUNGGAH" || transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG"
        ? 1
        : 0;

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const complete = index < currentIndex;
        const active = index === currentIndex;

        return (
          <div className="grid grid-cols-[1.7rem_1fr] gap-3" key={step.id}>
            <div className="flex flex-col items-center">
              <span
                className={`mt-0.5 grid size-5 place-items-center rounded-full border ${
                  complete || active
                    ? "border-[#0a6a49] bg-[#0a6a49] text-white"
                    : "border-black/10 bg-[#efefed] text-black/35"
                }`}
              >
                {complete ? <CheckCircle2 className="size-3" /> : null}
              </span>
              {index < steps.length - 1 ? <span className="mt-1 h-9 w-px bg-black/10" /> : null}
            </div>
            <div>
              <p className={`text-sm font-semibold ${active ? "text-[#0a6a49]" : "text-black/78"}`}>
                {step.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-black/48">{step.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QueueCard({
  transaction,
  selected = false,
  onSelect
}: {
  transaction: AdminTransactionItem;
  selected?: boolean;
  onSelect?: (transactionId: string) => void;
}) {
  const needsAction = transaction.status === "BUKTI_DIUNGGAH" || transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG";
  const body = (
    <Card
      className={`overflow-hidden rounded-[1.6rem] border bg-white transition duration-200 ${
        selected
          ? "border-[#0a6a49]/35 shadow-[0_18px_40px_rgba(10,106,73,0.08)]"
          : "border-black/10 hover:border-[#0a6a49]/18"
      }`}
    >
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={transaction.method === "TRANSFER_BANK" ? "accent" : "default"}>
                {paymentChannelLabel(transaction.method)}
              </Badge>
              <Badge variant="muted">{transaction.pemasaranMode}</Badge>
            </div>
            <h3 className="mt-3 line-clamp-2 font-headline text-xl font-black tracking-tight text-black/88">
              {transaction.lot}
            </h3>
            <p className="mt-1 text-sm text-black/56">{transaction.id}</p>
          </div>
          <AdminStatusBadge status={transaction.status} />
        </div>

        <div className="divide-y divide-black/8 rounded-[1.25rem] border border-black/8 bg-[#fbfbfa]">
          <div className="grid gap-3 px-4 py-3 sm:grid-cols-[0.9fr_1.1fr]">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">
              Pembeli
            </span>
            <span className="text-sm font-semibold text-black/82">{transaction.buyer}</span>
          </div>
          <div className="grid gap-3 px-4 py-3 sm:grid-cols-[0.9fr_1.1fr]">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">
              Nominal
            </span>
            <span className="text-sm font-black text-[#0a6a49]">{currency.format(transaction.total)}</span>
          </div>
          <div className="grid gap-3 px-4 py-3 sm:grid-cols-[0.9fr_1.1fr]">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">
              Status kerja
            </span>
            <span className="text-sm font-semibold text-black/82">
              {needsAction
                ? "Perlu keputusan admin"
                : transaction.status === "LUNAS"
                  ? "Menunggu buyer selesai"
                  : transaction.status === "SELESAI"
                    ? "Selesai oleh buyer"
                    : "Pantau perkembangan"}
            </span>
          </div>
          <div className="grid gap-3 px-4 py-3 sm:grid-cols-[0.9fr_1.1fr]">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">
              Batas waktu
            </span>
            <span>{transactionDeadlineLabel(transaction)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onSelect ? (
            <Button
              className="flex-1"
              type="button"
              variant={selected ? "default" : "secondary"}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(transaction.id);
              }}
            >
              {selected ? "Sedang ditinjau" : "Tinjau di panel"}
            </Button>
          ) : null}
        <Link
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-black/12 bg-[#f4f4f1] px-4 py-3 text-sm font-semibold text-black/78 transition hover:bg-[#ecece7]"
          href={`/admin/transaksi/${transaction.id}?from=verification`}
          onClick={(event) => event.stopPropagation()}
        >
          Buka halaman detail
          <ArrowRight className="size-4" />
        </Link>
        </div>
      </CardContent>
    </Card>
  );

  if (onSelect) {
    return (
      <div
        aria-label={`Pilih transaksi ${transaction.lot}`}
        className="block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6a49]/35"
        role="button"
        tabIndex={0}
        onClick={() => onSelect(transaction.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(transaction.id);
          }
        }}
      >
        {body}
      </div>
    );
  }

  return body;
}

export function VerificationWorkspace({
  transaction,
  title = "Panel Verifikasi Pembayaran",
  description = "Periksa pembayaran fixed price, cocokkan bukti atau pembayaran langsung, lalu putuskan status transaksi."
}: {
  transaction: AdminTransactionItem;
  title?: string;
  description?: string;
}) {
  return (
    <Card className="overflow-hidden rounded-[1.8rem] border border-black/10 bg-white">
      <CardHeader className="border-b border-black/8 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-[2rem] font-black tracking-tight text-black/88">{title}</CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm leading-6 text-black/58">
              {description}
            </CardDescription>
          </div>
          <Badge variant={VERIFICATION_STATUSES.has(transaction.status) ? "accent" : "muted"}>
            {VERIFICATION_STATUSES.has(transaction.status) ? "Butuh keputusan" : humanize(transaction.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-black/8 bg-[#fbfbfa] p-4">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-[#0a6a49]" />
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">
                  Informasi Pembeli
                </p>
              </div>
              <div className="mt-4 divide-y divide-black/8 rounded-[1.25rem] bg-white">
                {[
                  ["Nama lengkap", transaction.buyer],
                  ["Email", transaction.buyerEmail || "-"],
                  ["Nomor HP", transaction.buyerPhone || "-"],
                  ["NIK", transaction.buyerNationalId || "-"]
                ].map(([label, value]) => (
                  <div className="grid gap-2 px-4 py-3 sm:grid-cols-[0.42fr_0.58fr]" key={label}>
                    <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">
                      {label}
                    </span>
                    <span className="break-words text-sm font-semibold leading-6 text-black/82">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-black/8 bg-white p-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">
                Ringkasan transaksi
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailStat label="Barang" value={transaction.lot} />
                <DetailStat label="Nominal" value={currency.format(transaction.total)} />
                <DetailStat label="Metode bayar" value={paymentChannelLabel(transaction.method)} />
                <DetailStat label="Deadline" value={transactionDeadlineLabel(transaction)} />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-black/8 bg-[#fbfbfa] p-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">
                Ringkasan keputusan
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <DetailStat label="Status" value={<AdminStatusBadge status={transaction.status} />} />
                <DetailStat label="Referensi" value={buildTransactionReference(transaction)} />
              </div>
              {transaction.rejectionReason ? (
                <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-700">
                  Catatan penolakan sebelumnya: {transaction.rejectionReason}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-black/8 bg-[#fbfbfa] p-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-[#0a6a49]" />
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">
                  Status Alur Pembelian
                </p>
              </div>
              <div className="mt-4">
                <AdminPurchaseTimeline transaction={transaction} />
              </div>
            </div>

            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">
                Bukti Pembayaran
              </p>
              <div className="mt-3">
                <ProofPreview transaction={transaction} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-black/8 bg-[#fcfcfb] p-4 sm:p-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">
            Tindakan Admin
          </p>
          <div className="mt-4">
            <TransactionActionPanel transaction={transaction} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProofPreview({ transaction }: { transaction: AdminTransactionItem }) {
  if (transaction.method !== "TRANSFER_BANK") {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-[#fafaf8] p-6 text-sm leading-7 text-black/58">
        Pembayaran dilakukan langsung di unit. Admin cukup memastikan dana benar-benar diterima lalu mengonfirmasi transaksi.
      </div>
    );
  }

  if (!transaction.proofFile) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-[#fafaf8] p-6 text-sm leading-7 text-black/58">
        Bukti pembayaran belum tersedia pada transaksi ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-[#f7f7f4]">
        {isProofPreviewable(transaction.proofFile) ? (
          <Image
            alt={`Bukti pembayaran ${transaction.id}`}
            className="aspect-[4/3] w-full object-cover"
            height={900}
            src={transaction.proofFile}
            width={1200}
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-[#f4f4ef] text-black/46">
            <FileText className="size-12" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-black/54">
          {transaction.method === "TRANSFER_BANK"
            ? "Bukti transfer ini tersimpan dari transaksi buyer dan dibaca langsung dari database."
            : "Dokumen transaksi tersimpan di database unit."}
        </p>
        <a
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a6a49] underline-offset-4 hover:underline"
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
            successDescription="Pembayaran sudah tervalidasi. Buyer dapat membuka nota dan menandai pembelian selesai."
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
        <Link
          className={`${baseClass} inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/12 bg-[#f4f4f1] px-4 py-3 text-sm font-semibold text-black/78 transition hover:bg-[#ecece7]`}
          href={`/admin/transaksi/${transaction.id}/nota?output=print`}
          rel="noreferrer"
          target="_blank"
        >
          <Printer className="size-4" />
          Cetak nota
        </Link>
      ) : null}

      {!canVerifyTransfer && !canConfirmDirect && !canPrint ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-[#fafaf8] p-4 text-sm leading-7 text-black/56">
          Belum ada tindakan yang perlu dijalankan admin untuk transaksi ini. Pantau status buyer atau buka riwayat transaksi.
        </div>
      ) : null}
    </div>
  );
}

function HistoryCard({ transaction }: { transaction: AdminTransactionItem }) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">{transaction.pemasaranMode}</Badge>
              <Badge variant={transaction.method === "TRANSFER_BANK" ? "accent" : "default"}>
                {paymentChannelLabel(transaction.method)}
              </Badge>
            </div>
            <h3 className="mt-3 line-clamp-2 font-headline text-[1.35rem] font-black tracking-tight text-black/88">
              {transaction.lot}
            </h3>
            <p className="mt-1 text-sm text-black/56">{transaction.buyer}</p>
          </div>
          <AdminStatusBadge status={transaction.status} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailStat label="Total" value={currency.format(transaction.total)} />
          <DetailStat label="Referensi" value={transaction.reference || "-"} />
          <DetailStat label="Deadline akhir" value={transaction.deadline || "-"} />
          <DetailStat label="Saluran bayar" value={paymentChannelLabel(transaction.method)} />
        </div>

        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a6a49] underline-offset-4 hover:underline"
          href={`/admin/transaksi/${transaction.id}?from=history`}
        >
          Buka detail transaksi
          <ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
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
          href="/admin/transaksi/verifikasi-pembayaran"
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

export function AdminTransactionVerificationPage({ transactions }: { transactions: AdminTransactionItem[] }) {
  const fixedPriceTransactions = getFixedPriceTransactions(transactions);
  const actionableQueue = getVerificationTransactions(fixedPriceTransactions);
  const [activeFilter, setActiveFilter] = useState<string>("SEMUA");
  const verificationQueue = getFilteredVerificationTransactions(fixedPriceTransactions, activeFilter);
  const [selectedId, setSelectedId] = useState<string | null>(verificationQueue[0]?.id ?? null);
  const selectedTransaction =
    verificationQueue.find((transaction) => transaction.id === selectedId) ?? verificationQueue[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Unit / Transaksi"
        title="Verifikasi Pembayaran"
        description="Review pengajuan fixed price, bukti pembayaran, pembayaran langsung di unit, dan cetak nota setelah transaksi diverifikasi."
        actions={<Badge variant="accent">{actionableQueue.length} perlu tindakan</Badge>}
      />

      <div className="flex gap-2 overflow-x-auto rounded-[1.35rem] bg-white p-2 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
        {VERIFICATION_FILTERS.map((filter) => {
          const count =
            filter.id === "SEMUA"
              ? fixedPriceTransactions.length
              : fixedPriceTransactions.filter((transaction) => transaction.status === filter.id).length;
          const active = activeFilter === filter.id;

          return (
            <button
              className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                active ? "bg-[#0a6a49] text-white" : "text-black/58 hover:bg-[#f3f3f0] hover:text-black/82"
              }`}
              key={filter.id}
              type="button"
              onClick={() => {
                setActiveFilter(filter.id);
                const next = getFilteredVerificationTransactions(fixedPriceTransactions, filter.id)[0];
                setSelectedId(next?.id ?? null);
              }}
            >
              {filter.label}
              <span className={active ? "ml-2 text-white/72" : "ml-2 text-black/38"}>{count}</span>
            </button>
          );
        })}
      </div>

      {selectedTransaction ? (
        <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-4">
            {verificationQueue.map((transaction) => (
              <QueueCard
                key={transaction.id}
                selected={transaction.id === selectedTransaction.id}
                transaction={transaction}
                onSelect={setSelectedId}
              />
            ))}
          </div>
          <VerificationWorkspace transaction={selectedTransaction} />
        </div>
      ) : (
        <EmptyPanel text="Belum ada transaksi yang menunggu verifikasi pembayaran. Jika semua sudah selesai, Anda bisa membuka halaman riwayat untuk melihat arsip transaksi unit." />
      )}
    </div>
  );
}

export function AdminTransactionHistoryPage({ transactions }: { transactions: AdminTransactionItem[] }) {
  const history = getHistoryTransactions(transactions);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Unit / Transaksi"
        title="Riwayat"
        description="Arsip transaksi yang sudah selesai, ditolak, atau tidak lagi menunggu tindakan verifikasi admin."
        actions={<Badge variant="muted">{history.length} arsip</Badge>}
      />

      {history.length ? (
        <div className="grid gap-4 2xl:grid-cols-2">
          {history.map((transaction) => (
            <HistoryCard key={transaction.id} transaction={transaction} />
          ))}
        </div>
      ) : (
        <EmptyPanel text="Belum ada transaksi arsip untuk unit ini." />
      )}
    </div>
  );
}

export function AdminTransactionDetailWorkspacePage({
  transaction,
  backHref = "/admin/transaksi",
  backLabel = "Kembali ke transaksi"
}: {
  transaction: AdminTransactionItem;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Unit / Detail Transaksi"
        title={transaction.id}
        description="Detail transaksi, bukti pembayaran, dan tindakan admin dirangkum di satu workspace agar keputusan verifikasi lebih cepat."
        actions={
          <>
            <AdminStatusBadge className="text-[0.95rem]" status={transaction.status} />
            <Link href={backHref}>
              <Button variant="secondary">{backLabel}</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.76fr_1.24fr]">
        <Card className="rounded-[1.8rem] border border-black/10 bg-white">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={transaction.method === "TRANSFER_BANK" ? "accent" : "default"}>
                {paymentChannelLabel(transaction.method)}
              </Badge>
              <Badge variant="muted">{transaction.pemasaranMode}</Badge>
            </div>

            <div className="space-y-2">
              <h3 className="font-headline text-[2rem] font-black tracking-tight text-black/88">
                {transaction.lot}
              </h3>
              <p className="text-sm leading-6 text-black/58">
                Buyer: {transaction.buyer}
              </p>
            </div>

            <div className="grid gap-3">
              <DetailStat label="Nominal transaksi" value={currency.format(transaction.total)} />
              <DetailStat label="Status saat ini" value={<AdminStatusBadge status={transaction.status} />} />
              <DetailStat label="Referensi" value={buildTransactionReference(transaction)} />
              <DetailStat label="Batas pembayaran" value={transactionDeadlineLabel(transaction)} />
            </div>

            <div className="rounded-[1.5rem] border border-black/8 bg-[#fbfbfa] p-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/42">
                Jalur cepat
              </p>
              <div className="mt-4 space-y-3">
                <Link href="/admin/transaksi/verifikasi-pembayaran">
                  <Button className="w-full" variant="secondary">
                    <ReceiptText className="size-4" />
                    Buka verifikasi pembayaran
                  </Button>
                </Link>
                <Link href="/admin/transaksi/riwayat">
                  <Button className="w-full" variant="ghost">
                    <History className="size-4" />
                    Buka riwayat
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <VerificationWorkspace
          description="Panel ini menampilkan bukti, ringkasan, dan tombol aksi yang semuanya tetap tersambung ke endpoint verifikasi transaksi admin unit."
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
      className={
        isAutoOutput
          ? "mx-auto max-w-[980px] space-y-0 py-5 md:py-6 print:max-w-none print:py-0"
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
        extraMeta={[
          { label: "Jenis transaksi", value: transaction.pemasaranMode },
          { label: "Nomor referensi", value: transaction.reference },
          { label: "Status", value: isCompleted ? "Selesai" : "Terverifikasi" },
          { label: "Tanggal verifikasi", value: transaction.verifiedAt || "-" }
        ]}
        footerText="Dokumen ini diterbitkan oleh admin unit Pegadaian Lelang."
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


