import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  Gavel,
  Landmark,
  MapPinned,
  Printer,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

import { BuyerPaymentProofForm } from "@/components/buyer/payment-proof-form";
import { CompletePurchaseButton } from "@/components/buyer/complete-purchase-button";
import { BuyerProfileSettingsForm } from "@/components/buyer/profile-settings-form";
import { LiveCountdown } from "@/components/buyer/live-countdown";
import { SectionHeading } from "@/components/shared/section-heading";
import { TransactionReceiptActions } from "@/components/shared/transaction-receipt-actions";
import { TransactionReceiptAutoPrint } from "@/components/shared/transaction-receipt-auto-print";
import { TransactionReceiptDocument } from "@/components/shared/transaction-receipt-document";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import type { BuyerBid, BuyerBidStatus, BuyerTransaction, BuyerTransactionStatus } from "@/lib/contracts/buyer";
import { currency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

type BuyerSummary = {
  name?: string;
  unit?: string;
  accountId?: string;
  email?: string;
  phone: string;
  nationalId?: string;
  nikMasked?: string;
  address?: string;
  memberSince: string;
  verificationStatus: string;
  blacklist: {
    active: boolean;
    until: string;
    reason: string;
    violations: number;
  };
  highlights: string[];
  metrics: Array<{ label: string; value: string; accent?: string }>;
};

const transactionStatusMeta: Record<
  BuyerTransactionStatus,
  {
    label: string;
    variant: "default" | "accent" | "muted" | "danger";
    description: string;
  }
> = {
  MENUNGGU_VERIFIKASI: {
    label: "Menunggu Pembayaran",
    variant: "accent",
    description: "Transaksi sudah dibuat dan menunggu pembayaran atau tindak lanjut dari Anda."
  },
  MENUNGGU_PEMBAYARAN: {
    label: "Menunggu Pembayaran",
    variant: "accent",
    description: "Transaksi aktif dan menunggu pembayaran sebelum bisa diproses lebih lanjut."
  },
  BUKTI_DIUNGGAH: {
    label: "Bukti Diunggah",
    variant: "default",
    description: "Bukti transfer sudah diterima dan sedang diverifikasi admin unit."
  },
  DITOLAK_BUKTI: {
    label: "Bukti Perlu Diperbaiki",
    variant: "danger",
    description: "Admin menolak bukti pembayaran sebelumnya. Unggah ulang bukti yang sesuai."
  },
  MENUNGGU_KONFIRMASI_LANGSUNG: {
    label: "Menunggu Konfirmasi Langsung",
    variant: "accent",
    description: "Pembayaran akan dilakukan langsung di unit dan menunggu konfirmasi admin."
  },
  LUNAS: {
    label: "Terverifikasi",
    variant: "default",
    description: "Pembayaran sudah diverifikasi admin. Konfirmasi pembelian selesai setelah barang dan nota diterima."
  },
  SELESAI: {
    label: "Selesai",
    variant: "default",
    description: "Pembelian sudah Anda selesaikan dan nota digital tetap tersedia."
  },
  GAGAL: {
    label: "Gagal",
    variant: "danger",
    description: "Pembayaran tidak diselesaikan dalam batas waktu dan transaksi gagal."
  }
};

const bidStatusMeta: Record<
  BuyerBidStatus,
  {
    label: string;
    variant: "default" | "accent" | "muted" | "danger";
    description: string;
  }
> = {
  BID_TERCATAT: {
    label: "Bid Tercatat",
    variant: "default",
    description: "Penawaran tersimpan dan menunggu sesi lelang berakhir."
  },
  MENUNGGU_HASIL: {
    label: "Menunggu Hasil",
    variant: "accent",
    description: "Bid tertutup sudah masuk dan menunggu pembukaan hasil."
  },
  MENANG: {
    label: "Menang",
    variant: "default",
    description: "Anda memenangkan lelang dan transaksi pembayaran sudah dibuat."
  },
  TIDAK_MENANG: {
    label: "Tidak Menang",
    variant: "muted",
    description: "Bid tidak menghasilkan transaksi baru."
  }
};

function StatusPill({
  status,
  tone = transactionStatusMeta[status].variant
}: {
  status: BuyerTransactionStatus;
  tone?: "default" | "accent" | "muted" | "danger";
}) {
  return (
    <Badge
      className={cn(
        (status === "LUNAS" || status === "SELESAI") && "bg-primary/10 text-primary",
        status === "GAGAL" && "bg-tertiary-container/10 text-tertiary-container"
      )}
      variant={tone}
    >
      {transactionStatusMeta[status].label}
    </Badge>
  );
}

function BidPill({ status }: { status: BuyerBidStatus }) {
  return <Badge variant={bidStatusMeta[status].variant}>{bidStatusMeta[status].label}</Badge>;
}

function getTimelineLabels(transaction: BuyerTransaction) {
  return [
    transaction.method === "TRANSFER_BANK" ? "Melakukan Pembayaran" : "Bayar di Unit",
    "Verifikasi",
    "Selesai"
  ];
}

function getCurrentStep(transaction: BuyerTransaction) {
  switch (transaction.status) {
    case "BUKTI_DIUNGGAH":
    case "MENUNGGU_KONFIRMASI_LANGSUNG":
    case "LUNAS":
      return 1;
    case "SELESAI":
      return 2;
    case "MENUNGGU_PEMBAYARAN":
    case "MENUNGGU_VERIFIKASI":
    case "DITOLAK_BUKTI":
    case "GAGAL":
      return 0;
    default:
      return 0;
  }
}

function getTransactionStatusDescription(transaction: BuyerTransaction) {
  if (transaction.status === "MENUNGGU_PEMBAYARAN" && transaction.kind === "VICKREY_WIN") {
    return "Anda memenangkan lelang dan diberi waktu maksimal 24 jam untuk menyelesaikan pembayaran.";
  }

  if (transaction.status === "MENUNGGU_PEMBAYARAN" && transaction.method === "TRANSFER_BANK") {
    return "Transaksi sudah aktif. Lakukan transfer sesuai nominal, lalu unggah bukti pembayaran sebelum batas waktu berakhir.";
  }

  if (transaction.status === "DITOLAK_BUKTI") {
    return "Bukti pembayaran perlu diperbaiki. Unggah ulang bukti transfer yang jelas dan sesuai nominal transaksi.";
  }

  return transactionStatusMeta[transaction.status].description;
}

function getBuyerPhone(buyer: BuyerSessionUser, summaryPhone?: string) {
  return buyer.phoneNumber ?? summaryPhone ?? "-";
}

function BuyerPaymentCountdown({
  transaction,
  prefix,
  className
}: {
  transaction: BuyerTransaction;
  prefix?: string;
  className?: string;
}) {
  return (
    <LiveCountdown
      className={className}
      expiredLabel={transaction.status === "LUNAS" || transaction.status === "SELESAI" ? "Selesai" : "Waktu pembayaran berakhir"}
      fallbackLabel={transaction.deadline}
      prefix={prefix}
      targetAt={transaction.deadlineAt}
    />
  );
}

function TransactionTimeline({ transaction }: { transaction: BuyerTransaction }) {
  const steps = getTimelineLabels(transaction);
  const currentStep = getCurrentStep(transaction);

  return (
    <Card className="border border-border/70 bg-white">
      <CardHeader>
        <CardTitle>Timeline transaksi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const completed = currentStep > index;
            const active = currentStep === index;

            return (
              <div className="relative rounded-[1.5rem] border border-border/70 p-4" key={step}>
                <div
                  className={cn(
                    "mb-4 inline-flex size-10 items-center justify-center rounded-full border text-sm font-bold",
                    completed && "border-primary bg-primary text-white",
                    active && "border-primary bg-primary/10 text-primary",
                    !completed && !active && "border-border bg-surface-low text-muted-foreground"
                  )}
                >
                  {index + 1}
                </div>
                <p className="text-sm font-semibold text-foreground">{step}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {index === currentStep
                    ? getTransactionStatusDescription(transaction)
                    : completed
                      ? "Tahap sudah dilewati."
                      : "Tahap berikutnya akan aktif sesuai progres transaksi."}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentProgressRail({ transaction }: { transaction: BuyerTransaction }) {
  const steps = [
    { label: "Melakukan Pembayaran", icon: Landmark },
    { label: "Verifikasi", icon: ShieldCheck },
    { label: "Selesai", icon: CheckCircle2 }
  ];
  const currentStep =
    transaction.status === "SELESAI"
      ? 2
      : transaction.status === "LUNAS" ||
          transaction.status === "BUKTI_DIUNGGAH" ||
          transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG"
        ? 1
        : 0;

  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-surface-low p-5 md:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const complete = index < currentStep;
          const active = index === currentStep;

          return (
            <div className="relative text-center" key={step.label}>
              {index > 0 ? (
                <span className="absolute left-0 top-5 hidden h-px w-1/2 bg-border md:block" />
              ) : null}
              {index < steps.length - 1 ? (
                <span className="absolute right-0 top-5 hidden h-px w-1/2 bg-border md:block" />
              ) : null}
              <div
                className={cn(
                  "relative z-10 mx-auto grid size-11 place-items-center rounded-full border text-sm transition",
                  complete && "border-primary bg-primary text-white",
                  active && "border-accent bg-accent text-accent-foreground",
                  !complete && !active && "border-border bg-white text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
              </div>
              <p
                className={cn(
                  "mt-3 text-xs font-bold uppercase tracking-[0.16em]",
                  complete || active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PaymentInfoRow({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[62%] text-right text-sm font-semibold leading-6 text-foreground">{value}</span>
    </div>
  );
}

function getReceiptTerms(transaction: BuyerTransaction) {
  return [
    "Tunjukkan nota ini beserta kartu identitas asli (KTP) saat pengambilan barang.",
    `Pengambilan barang dilakukan di unit ${transaction.unit}.`,
    transaction.method === "TRANSFER_BANK"
      ? "Pembayaran transfer telah diverifikasi admin unit."
      : "Pembayaran langsung telah dikonfirmasi admin unit.",
    "Nota ini sah dan berlaku sebagai bukti pembelian."
  ];
}

export function UserDashboardPage({
  buyer,
  data
}: {
  buyer: BuyerSessionUser;
  data: { summary: BuyerSummary; transactions: BuyerTransaction[]; bids: BuyerBid[] };
}) {
  const { summary, transactions, bids } = data;
  const needsAction = transactions.filter((transaction) =>
    ["MENUNGGU_VERIFIKASI", "MENUNGGU_PEMBAYARAN", "DITOLAK_BUKTI", "MENUNGGU_KONFIRMASI_LANGSUNG"].includes(
      transaction.status
    )
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <Card className="overflow-hidden border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(14,98,71,0.08),transparent_45%),linear-gradient(135deg,#ffffff_0%,#f6f2e8_100%)]">
        <CardContent className="grid gap-8 p-6 md:p-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="default">Akun Pembeli</Badge>
              <Badge variant={summary.blacklist.active ? "danger" : "muted"}>
                {summary.blacklist.active
                  ? `Blacklist aktif sampai ${summary.blacklist.until}`
                  : "Akun siap bertransaksi"}
              </Badge>
            </div>
            <div className="space-y-2">
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary md:text-5xl">
                Halo, {buyer.name}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Pantau pembelian fixed price, hasil lelang Vickrey, status pembayaran, dan
                nota transaksi dari satu tempat yang sama.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/katalog">
                <Button>Lihat Katalog Aktif</Button>
              </Link>
              <Link href="/transaksi">
                <Button variant="secondary">Cek Status Pembayaran</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {summary.highlights.map((item) => (
              <div
                className="rounded-[1.5rem] border border-border/70 bg-white/85 p-5"
                key={item}
              >
                <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.metrics.map((metric) => (
          <Card className="border border-border/70 bg-white p-6" key={metric.label}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-4 font-headline text-4xl font-extrabold tracking-tight text-primary">
              {metric.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Transaksi yang perlu tindakan</CardTitle>
              <p className="text-sm text-muted-foreground">
                Fokus pada transaksi yang masih menunggu pembayaran, unggah bukti, atau
                kunjungan ke unit.
              </p>
            </div>
            <Link href="/transaksi">
              <Button variant="secondary">Lihat semua transaksi</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {needsAction.map((transaction) => (
              <div
                className="rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5"
                key={transaction.id}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-foreground">{transaction.title}</p>
                      <StatusPill status={transaction.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transaction.id} | {transaction.unit}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <BuyerPaymentCountdown prefix="Sisa waktu" transaction={transaction} />
                    </p>
                  </div>
                  <Link href={`/transaksi/${transaction.id}`}>
                    <Button>Lanjutkan</Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Status akun pembeli</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] border border-border/70 bg-surface-low p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Verifikasi akun
                </p>
                <p className="mt-3 text-xl font-bold text-primary">
                  {summary.verificationStatus}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{buyer.email}</p>
              </div>
              <div
                className={cn(
                  "rounded-[1.5rem] border p-5",
                  summary.blacklist.active
                    ? "border-tertiary-container/25 bg-tertiary-container/10"
                    : "border-primary/15 bg-primary/[0.03]"
                )}
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Status blacklist
                </p>
                <p className="mt-3 text-xl font-bold text-foreground">
                  {summary.blacklist.active ? "Aktif" : "Tidak aktif"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {summary.blacklist.reason}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-primary text-white">
            <CardHeader>
              <CardTitle className="text-white">Aktivitas bid terbaru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bids.slice(0, 3).map((item) => (
                <div className="rounded-[1.5rem] bg-white/10 p-5" key={`${item.lot}-${item.closing}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{item.lot}</p>
                    <BidPill status={item.status} />
                  </div>
                  <p className="mt-2 text-sm text-white/80">{item.note}</p>
                  <p className="mt-4 text-sm font-semibold">
                    Bid {currency.format(item.bidAmount)}
                  </p>
                  <p className="text-xs text-white/70">Tutup {item.closing}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function TransactionsPage({
  buyer: _buyer,
  data
}: {
  buyer: BuyerSessionUser;
  data: { summary: BuyerSummary; transactions: BuyerTransaction[]; bids: BuyerBid[] };
}) {
  const { summary, transactions, bids } = data;
  const bidSummary = Object.entries(
    bids.reduce<Record<BuyerBidStatus, number>>(
      (accumulator, item) => {
        accumulator[item.status] += 1;
        return accumulator;
      },
      {
        BID_TERCATAT: 0,
        MENUNGGU_HASIL: 0,
        MENANG: 0,
        TIDAK_MENANG: 0
      }
    )
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        action={
          <Link href="/katalog">
            <Button variant="secondary">Cari Barang Lagi</Button>
          </Link>
        }
        description="Daftar ini menggabungkan transaksi fixed price dan transaksi pemenang lelang Vickrey yang sudah masuk workflow pembayaran."
        eyebrow="Transaksi Saya"
        title="Pantau seluruh transaksi Anda"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.metrics.map((metric) => (
          <Card className="border border-border/70 bg-white p-5" key={metric.label}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-4 text-3xl font-extrabold text-primary">{metric.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Riwayat bid Anda</CardTitle>
            <p className="text-sm text-muted-foreground">
              Semua penawaran lelang tetap tersusun di area transaksi agar lebih mudah
              dipantau dari satu tempat.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {bidSummary.map(([status, value]) => (
              <div
                className="rounded-[1.5rem] border border-border/70 bg-surface-low/50 p-5"
                key={status}
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {bidStatusMeta[status as BuyerBidStatus].label}
                </p>
                <p className="mt-4 text-3xl font-extrabold text-primary">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Bid terbaru</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ringkasan penawaran lelang terbaru, termasuk hasil dan transaksi yang terbentuk
              setelah Anda menang.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {bids.slice(0, 3).map((item) => (
              <div
                className="rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5"
                key={`${item.lot}-${item.bidAmount}-${item.closing}`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-foreground">{item.lot}</p>
                      <BidPill status={item.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{item.unit}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.note}</p>
                  </div>
                  <div className="space-y-2 text-left md:text-right">
                    <p className="font-semibold text-primary">
                      Bid {currency.format(item.bidAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Harga dasar {currency.format(item.basePrice)}
                    </p>
                    <p className="text-sm text-muted-foreground">Tutup {item.closing}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/katalog/${item.lotId}`}>
                    <Button variant="secondary">Lihat Lot</Button>
                  </Link>
                  {item.linkedTransactionId ? (
                    <Link href={`/transaksi/${item.linkedTransactionId}`}>
                      <Button>Lihat Transaksi</Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5">
        {transactions.map((transaction) => (
          <Card className="border border-border/70 bg-white" key={transaction.id}>
            <CardContent className="grid gap-5 p-6 lg:grid-cols-[1.2fr_0.8fr_0.5fr] lg:items-center">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-bold text-foreground">{transaction.title}</p>
                  <StatusPill status={transaction.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {transaction.id} | {transaction.reference}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {transaction.kind === "VICKREY_WIN"
                    ? "Transaksi hasil kemenangan lelang Vickrey"
                    : "Transaksi pembelian fixed price"}{" "}
                  | {transaction.unit}
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-headline text-3xl font-extrabold tracking-tight text-primary">
                  {currency.format(transaction.amount)}
                </p>
                <p className="text-sm text-muted-foreground">{transaction.paymentLabel}</p>
                <p className="text-sm text-muted-foreground">
                  <BuyerPaymentCountdown prefix="Sisa waktu" transaction={transaction} />
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <Link href={`/transaksi/${transaction.id}`}>
                  <Button className="w-full lg:w-auto">
                    Lihat Detail
                    <ExternalLink className="size-4" />
                  </Button>
                </Link>
                {transaction.status === "LUNAS" ? (
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                    <ReceiptText className="size-4" />
                    Nota siap
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TransactionDetailPage({
  buyer,
  transactionId: _transactionId,
  transaction: loadedTransaction
}: {
  buyer: BuyerSessionUser;
  transactionId: string;
  transaction?: BuyerTransaction | null;
}) {
  const transaction = loadedTransaction ?? null;

  if (!transaction) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">Transaksi tidak ditemukan.</p>
      </Card>
    );
  }

  const isTransfer = transaction.method === "TRANSFER_BANK";
  const isVerified = transaction.status === "LUNAS" || transaction.status === "SELESAI";
  const isCompleted = transaction.status === "SELESAI";
  const showReceipt = isVerified;
  const isFixedPrice = transaction.kind === "FIXED_PRICE";

  return (
    <div className="space-y-7 md:space-y-8">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link className="hover:text-primary" href="/dashboard">
                Dashboard
              </Link>
              <span aria-hidden="true">›</span>
              <Link className="hover:text-primary" href="/transaksi">
                Transaksi
              </Link>
              <span aria-hidden="true">›</span>
              <span className="font-bold uppercase tracking-[0.16em] text-foreground">Detail</span>
            </div>
            <h1 className="font-headline text-4xl font-black tracking-tight text-primary md:text-6xl">
              Detail Pembayaran
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
              {isFixedPrice
                ? "Selesaikan pembayaran fixed price, unggah bukti transfer, lalu tunggu admin unit memverifikasi transaksi."
                : "Selesaikan pembayaran hasil lelang, pantau verifikasi admin, dan buka nota setelah transaksi selesai."}
            </p>
          </div>
          <Link href="/transaksi">
            <Button variant="secondary">Kembali ke Transaksi</Button>
          </Link>
        </div>

        <PaymentProgressRail transaction={transaction} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_0.95fr_0.9fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ReceiptText className="size-5 text-primary" />
              <CardTitle>Rincian Transaksi</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[1.5rem] border border-border/70 bg-surface-low p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                ID Transaksi
              </p>
              <p className="mt-3 text-xl font-extrabold text-foreground">{transaction.id}</p>
            </div>

            <div className="flex gap-4">
              {transaction.imageUrl ? (
                <Image
                  alt={`Foto barang ${transaction.title}`}
                  className="size-20 shrink-0 rounded-2xl border border-border/70 object-cover shadow-ambient"
                  height={160}
                  src={transaction.imageUrl}
                  unoptimized
                  width={160}
                />
              ) : (
                <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-[radial-gradient(circle_at_30%_25%,#ffd45a,#c88619_62%,#6d4305)] text-white shadow-ambient">
                  <ShoppingBag className="size-8" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold leading-6 text-foreground">{transaction.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{transaction.applicationNumber}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill status={transaction.status} />
                  <Badge variant="muted">
                    {transaction.kind === "VICKREY_WIN" ? "Vickrey Auction" : "Fixed Price"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 p-4">
              <PaymentInfoRow label="Total Harga" value={currency.format(transaction.amount)} />
              <PaymentInfoRow label="Metode Pembayaran" value={isTransfer ? "Transfer Bank" : "Bayar Langsung"} />
              <PaymentInfoRow label="Dibuat Pada" value={transaction.createdAt} />
              <PaymentInfoRow
                label="Batas Waktu"
                value={<BuyerPaymentCountdown transaction={transaction} />}
              />
            </div>

            {transaction.winnerContext ? (
              <div className="rounded-[1.5rem] border border-accent/35 bg-accent/15 p-4 text-sm leading-7 text-muted-foreground">
                {transaction.winnerContext}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border/70 bg-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              {isTransfer ? <Landmark className="size-5 text-primary" /> : <MapPinned className="size-5 text-primary" />}
              <CardTitle>{isTransfer ? "Rekening Tujuan" : "Bayar Langsung di Unit"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {isTransfer ? (
              <>
                <div className="rounded-[1.5rem] border-l-4 border-l-primary bg-surface-low p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Bank
                  </p>
                  <p className="mt-3 text-xl font-extrabold text-foreground">
                    {transaction.bankName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{transaction.bankBranch}</p>
                </div>

                <div className="rounded-[1.5rem] border border-border/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Nomor Rekening
                  </p>
                  <p className="mt-3 font-headline text-2xl font-black tracking-[0.08em] text-primary">
                    {transaction.bankAccountNumber}
                  </p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Atas Nama
                  </p>
                  <p className="mt-2 font-semibold text-foreground">{transaction.bankAccountHolder}</p>
                </div>

                <div className="rounded-[1.35rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                  Pastikan nominal transfer tepat sebesar <strong>{currency.format(transaction.amount)}</strong>
                  {" "}agar admin unit dapat memverifikasi lebih cepat.
                </div>
              </>
            ) : (
              <>
                <div className="rounded-[1.5rem] border border-accent/35 bg-accent/15 p-5">
                  <p className="font-semibold text-foreground">Datang ke {transaction.unit}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Bawa nomor pengajuan {transaction.applicationNumber} dan selesaikan pembayaran di loket unit.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 bg-surface-low p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Alamat Unit
                  </p>
                  <p className="mt-3 font-semibold text-foreground">{transaction.unitAddress}</p>
                </div>
                <div className="rounded-[1.35rem] border border-border/70 p-4 text-sm leading-7 text-muted-foreground">
                  Admin unit akan menekan konfirmasi pembayaran langsung setelah dana diterima, lalu nota dapat dicetak.
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileCheck2 className="size-5 text-primary" />
              <CardTitle>{isTransfer ? "Unggah Bukti" : "Status Konfirmasi"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {showReceipt ? (
              <div className="rounded-[1.5rem] border border-primary/15 bg-primary/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <ReceiptText className="mt-1 size-5 text-primary" />
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">
                      {isCompleted ? "Pembelian sudah selesai" : "Nota digital tersedia"}
                    </p>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {isCompleted
                        ? `Pembelian selesai setelah pembayaran diverifikasi pada ${transaction.verifiedAt}.`
                        : `Pembayaran diverifikasi pada ${transaction.verifiedAt}. Menunggu konfirmasi selesai dari buyer.`}
                    </p>
                  </div>
                </div>
                {!isCompleted ? (
                  <div className="mt-5">
                    <CompletePurchaseButton transactionId={transaction.id} />
                  </div>
                ) : null}
                <Link className="mt-5 block" href={`/transaksi/${transaction.id}/nota`}>
                  <Button className="w-full">
                    <Printer className="size-4" />
                    Buka Nota
                  </Button>
                </Link>
              </div>
            ) : isTransfer ? (
              <>
                <div className="rounded-[1.5rem] border border-dashed border-border p-5 text-center">
                  <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileCheck2 className="size-5" />
                  </div>
                  <p className="mt-4 font-semibold text-foreground">
                    {transaction.paymentProof
                      ? "Bukti pembayaran sudah diunggah"
                      : "Belum ada bukti pembayaran"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {transaction.paymentProof
                      ? transaction.paymentProof
                      : "Unggah bukti transfer maksimal 24 jam setelah transaksi dibuat."}
                  </p>
                </div>
                <BuyerPaymentProofForm
                  currentProof={transaction.paymentProof}
                  transactionId={transaction.id}
                />
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-dashed border-border p-5 text-center">
                  <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-accent/30 text-accent-foreground">
                    <Clock3 className="size-5" />
                  </div>
                  <p className="mt-4 font-semibold text-foreground">Menunggu konfirmasi admin</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Setelah pembayaran diterima di unit, admin akan menyelesaikan transaksi di halaman verifikasi.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-border/70 p-4">
                  <PaymentInfoRow label="Nama Pembeli" value={buyer.name} />
                  <PaymentInfoRow label="Kontak" value={getBuyerPhone(buyer, "-")} />
                  <PaymentInfoRow label="Email" value={buyer.email} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showReceipt ? (
        <Card className="overflow-hidden border border-border/70 bg-white">
          <CardHeader className="border-b border-border/70 bg-surface-low/60">
            <CardTitle>Nota transaksi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-primary/15 bg-primary/[0.03] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Status saat ini
                  </p>
                  <p className="mt-3 text-2xl font-extrabold text-primary">
                    {isCompleted ? "Transaksi selesai" : "Terverifikasi admin"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isCompleted
                      ? "Buyer sudah menutup pembelian sebagai selesai."
                      : "Menunggu konfirmasi pembelian selesai dari buyer."}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Pembeli
                  </p>
                  <p className="mt-3 font-semibold text-foreground">{buyer.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{buyer.email}</p>
                  <p className="text-sm text-muted-foreground">{getBuyerPhone(buyer, "-")}</p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border/70 bg-white p-6 shadow-ambient">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Pegadaian Lelang
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold text-primary">
                      Bukti penyelesaian transaksi
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Nomor nota
                    </p>
                    <p className="mt-2 font-semibold text-foreground">{transaction.receiptNumber}</p>
                  </div>
                </div>
                <div className="grid gap-5 py-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Unit penjual
                    </p>
                    <p className="mt-2 font-semibold text-foreground">{transaction.unit}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{transaction.unitAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Metode pembayaran
                    </p>
                    <p className="mt-2 font-semibold text-foreground">
                      {isTransfer ? "Transfer Bank" : "Bayar Langsung"}
                    </p>
                  </div>
                </div>
                <div className="rounded-[1.5rem] bg-surface-low p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{transaction.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Ref {transaction.reference}
                      </p>
                    </div>
                    <p className="text-xl font-extrabold text-primary">
                      {currency.format(transaction.amount)}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <TransactionReceiptActions noteHref={`/transaksi/${transaction.id}/nota`} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function TransactionReceiptPage({
  buyer,
  outputMode,
  transactionId,
  transaction: loadedTransaction
}: {
  buyer: BuyerSessionUser;
  outputMode?: string;
  transactionId: string;
  transaction?: BuyerTransaction | null;
}) {
  const transaction = loadedTransaction ?? null;

  if (!transaction || (transaction.status !== "LUNAS" && transaction.status !== "SELESAI")) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">
          Nota belum tersedia. Nota hanya bisa dibuka setelah pembayaran terverifikasi admin.
        </p>
      </Card>
    );
  }

  const isTransfer = transaction.method === "TRANSFER_BANK";
  const isCompleted = transaction.status === "SELESAI";
  const noteHref = `/transaksi/${transaction.id}/nota`;
  const isAutoOutput = outputMode === "print" || outputMode === "download";

  return (
    <div
      className={cn(
        "space-y-8 md:space-y-10 print:space-y-4",
        isAutoOutput && "mx-auto max-w-[980px] space-y-0 py-5 md:py-6 print:max-w-none print:py-0"
      )}
    >
      <TransactionReceiptAutoPrint fileName={transaction.receiptNumber} mode={outputMode} />
      {!isAutoOutput ? (
        <div className="print:hidden">
          <SectionHeading
            action={
              <Link href={`/transaksi/${transaction.id}`}>
                <Button variant="secondary">Kembali ke Detail Transaksi</Button>
              </Link>
            }
            description="Halaman nota ini disiapkan untuk kebutuhan cetak atau simpan PDF setelah pembayaran selesai diverifikasi."
            eyebrow="Nota Transaksi"
            title="Nota pengambilan barang"
          />
        </div>
      ) : null}

      {!isAutoOutput ? (
        <div className="print:hidden">
          <TransactionReceiptActions noteHref={noteHref} />
        </div>
      ) : null}

      <TransactionReceiptDocument
        buyerEmail={buyer.email}
        buyerName={buyer.name}
        buyerPhone={getBuyerPhone(buyer, "-")}
        extraMeta={[
          {
            label: "Jenis transaksi",
            value: transaction.kind === "VICKREY_WIN" ? "Pemenang Vickrey" : "Fixed Price"
          },
          {
            label: "Nomor pengajuan",
            value: transaction.applicationNumber
          }
        ]}
        imageUrl={transaction.imageUrl}
        itemSubtitle={isTransfer ? "Transfer Bank" : "Bayar Langsung"}
        itemTitle={transaction.title}
        noteNumber={transaction.receiptNumber ?? transaction.id}
        paymentMethodLabel={isTransfer ? "Transfer Bank" : "Bayar Langsung"}
        statusLabel={isCompleted ? "Selesai oleh buyer" : "Terverifikasi admin"}
        subtotal={transaction.amount}
        terms={getReceiptTerms(transaction)}
        total={transaction.amount}
        transactionId={transaction.id}
        unitAddress={transaction.unitAddress}
        unitName={transaction.unit}
        verifiedAt={transaction.verifiedAt}
        outputLayout={isAutoOutput}
      />
    </div>
  );
}

export function BidHistoryPage({
  buyer: _buyer,
  bids
}: {
  buyer: BuyerSessionUser;
  bids: BuyerBid[];
}) {
  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        action={
          <Link href="/katalog">
            <Button variant="secondary">Cari Lelang Aktif</Button>
          </Link>
        }
        description="Riwayat ini merangkum semua bid tertutup yang pernah Anda kirim, termasuk hasil lelang dan transaksi yang terbentuk setelah menang."
        eyebrow="Riwayat Bid"
        title="Riwayat penawaran lelang Anda"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(
          bids.reduce<Record<BuyerBidStatus, number>>(
            (accumulator, item) => {
              accumulator[item.status] += 1;
              return accumulator;
            },
            {
              BID_TERCATAT: 0,
              MENUNGGU_HASIL: 0,
              MENANG: 0,
              TIDAK_MENANG: 0
            }
          )
        ).map(([status, value]) => (
          <Card className="border border-border/70 bg-white p-5" key={status}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {bidStatusMeta[status as BuyerBidStatus].label}
            </p>
            <p className="mt-4 text-3xl font-extrabold text-primary">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="border border-border/70 bg-white">
        <CardContent className="space-y-4 p-6">
          {bids.map((item) => (
            <div
              className="rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5"
              key={`${item.lot}-${item.bidAmount}-${item.closing}`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-foreground">{item.lot}</p>
                    <BidPill status={item.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{item.unit}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.note}</p>
                </div>
                <div className="space-y-2 text-left md:text-right">
                  <p className="font-semibold text-primary">
                    Bid {currency.format(item.bidAmount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Harga dasar {currency.format(item.basePrice)}
                  </p>
                  <p className="text-sm text-muted-foreground">Tutup {item.closing}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/katalog/${item.lotId}`}>
                  <Button variant="secondary">Lihat Lot</Button>
                </Link>
                {item.linkedTransactionId ? (
                  <Link href={`/transaksi/${item.linkedTransactionId}`}>
                    <Button>Lihat Transaksi</Button>
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfilePage({
  buyer,
  summary
}: {
  buyer: BuyerSessionUser;
  summary: BuyerSummary;
}) {
  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        description="Kelola identitas akun, cek status verifikasi, dan pahami pembatasan yang dapat memengaruhi akses Anda ke lelang."
        eyebrow="Profil Akun"
        title="Kelola identitas dan keamanan akun"
      />

      <BuyerProfileSettingsForm
        email={buyer.email}
        initialName={buyer.name}
        initialNationalId={summary.nationalId ?? ""}
        initialPhone={getBuyerPhone(buyer, summary.phone)}
      />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Status verifikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] border border-primary/15 bg-primary/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 size-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">{summary.verificationStatus}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Akun dapat mengikuti fixed price, melihat detail transaksi, dan menerima
                      nota digital ketika pembayaran selesai diverifikasi.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Member sejak
                </p>
                <p className="mt-3 font-semibold text-foreground">{summary.memberSince}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Status blacklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "rounded-[1.5rem] border p-5",
                  summary.blacklist.active
                    ? "border-tertiary-container/25 bg-tertiary-container/10"
                    : "border-border/70 bg-surface-low"
                )}
              >
                <div className="flex items-start gap-3">
                  {summary.blacklist.active ? (
                    <AlertTriangle className="mt-1 size-5 text-tertiary-container" />
                  ) : (
                    <CheckCircle2 className="mt-1 size-5 text-primary" />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">
                      {summary.blacklist.active ? "Blacklist aktif" : "Tidak ada blacklist aktif"}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {summary.blacklist.reason}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
