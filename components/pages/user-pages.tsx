import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  Gavel,
  KeyRound,
  Landmark,
  MapPinned,
  Printer,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  User
} from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  bidHistory,
  currency,
  getTransactionById,
  type BuyerBidStatus,
  type BuyerTransaction,
  type BuyerTransactionStatus,
  userSummary,
  userTransactions
} from "@/lib/mock-data";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

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
  MENUNGGU_KONFIRMASI_LANGSUNG: {
    label: "Menunggu Konfirmasi Langsung",
    variant: "accent",
    description: "Pembayaran akan dilakukan langsung di unit dan menunggu konfirmasi admin."
  },
  LUNAS: {
    label: "Lunas",
    variant: "default",
    description: "Pembayaran selesai diverifikasi dan nota digital tersedia."
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
        status === "LUNAS" && "bg-primary/10 text-primary",
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
  if (transaction.method === "TRANSFER_BANK") {
    return [
      transaction.kind === "VICKREY_WIN" ? "Menang Lelang" : "Pengajuan Dibuat",
      "Menunggu Pembayaran",
      "Bukti Diunggah",
      "Lunas"
    ];
  }

  return [
    transaction.kind === "VICKREY_WIN" ? "Menang Lelang" : "Pengajuan Dibuat",
    "Datang ke Unit",
    "Dikonfirmasi Admin",
    "Lunas"
  ];
}

function getCurrentStep(transaction: BuyerTransaction) {
  switch (transaction.status) {
    case "MENUNGGU_PEMBAYARAN":
    case "MENUNGGU_VERIFIKASI":
      return 1;
    case "BUKTI_DIUNGGAH":
    case "MENUNGGU_KONFIRMASI_LANGSUNG":
      return 2;
    case "LUNAS":
      return 3;
    case "GAGAL":
      return 1;
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

  return transactionStatusMeta[transaction.status].description;
}

function getBuyerPhone(buyer: BuyerSessionUser) {
  return buyer.phoneNumber ?? userSummary.phone;
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
        <div className="grid gap-4 md:grid-cols-4">
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

export function UserDashboardPage({ buyer }: { buyer: BuyerSessionUser }) {
  const needsAction = userTransactions.filter((transaction) =>
    ["MENUNGGU_VERIFIKASI", "MENUNGGU_PEMBAYARAN", "MENUNGGU_KONFIRMASI_LANGSUNG"].includes(
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
              <Badge variant={userSummary.blacklist.active ? "danger" : "muted"}>
                {userSummary.blacklist.active
                  ? `Blacklist aktif sampai ${userSummary.blacklist.until}`
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
            {userSummary.highlights.map((item) => (
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
        {userSummary.metrics.map((metric) => (
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
                      Deadline {transaction.deadline}
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
                  {userSummary.verificationStatus}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{buyer.email}</p>
              </div>
              <div
                className={cn(
                  "rounded-[1.5rem] border p-5",
                  userSummary.blacklist.active
                    ? "border-tertiary-container/25 bg-tertiary-container/10"
                    : "border-primary/15 bg-primary/[0.03]"
                )}
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Status blacklist
                </p>
                <p className="mt-3 text-xl font-bold text-foreground">
                  {userSummary.blacklist.active ? "Aktif" : "Tidak aktif"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {userSummary.blacklist.reason}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-primary text-white">
            <CardHeader>
              <CardTitle className="text-white">Aktivitas bid terbaru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bidHistory.slice(0, 3).map((item) => (
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

export function TransactionsPage({ buyer: _buyer }: { buyer: BuyerSessionUser }) {
  const bidSummary = Object.entries(
    bidHistory.reduce<Record<BuyerBidStatus, number>>(
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
        {userSummary.metrics.map((metric) => (
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
            {bidHistory.slice(0, 3).map((item) => (
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
        {userTransactions.map((transaction) => (
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
                <p className="text-sm text-muted-foreground">Deadline {transaction.deadline}</p>
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
  transactionId
}: {
  buyer: BuyerSessionUser;
  transactionId: string;
}) {
  const transaction = getTransactionById(transactionId);

  if (!transaction) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">Transaksi tidak ditemukan.</p>
      </Card>
    );
  }

  const isTransfer = transaction.method === "TRANSFER_BANK";
  const showReceipt = transaction.status === "LUNAS";

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        action={
          <Link href="/transaksi">
            <Button variant="secondary">Kembali ke Transaksi</Button>
          </Link>
        }
        description="Halaman ini merangkum status transaksi, langkah pembayaran, area unggah bukti, dan akses ke nota digital setelah pembayaran terverifikasi."
        eyebrow={transaction.kind === "VICKREY_WIN" ? "Detail Pemenang Lelang" : "Detail Pembelian"}
        title={transaction.title}
      />

      <Card className="border border-border/70 bg-white">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={transaction.status} />
              <Badge variant="muted">{transaction.id}</Badge>
              <Badge variant="muted">{transaction.reference}</Badge>
            </div>
            <p className="font-headline text-4xl font-extrabold tracking-tight text-primary md:text-5xl">
              {currency.format(transaction.amount)}
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {getTransactionStatusDescription(transaction)}
            </p>
            {transaction.winnerContext ? (
              <div className="rounded-[1.5rem] border border-accent/35 bg-accent/15 p-4 text-sm leading-relaxed text-muted-foreground">
                {transaction.winnerContext}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border border-border/70 p-5 shadow-none">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Metode
              </p>
              <p className="mt-3 font-semibold text-foreground">
                {isTransfer ? "Transfer Bank" : "Bayar Langsung"}
              </p>
            </Card>
            <Card className="border border-border/70 p-5 shadow-none">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Deadline
              </p>
              <p className="mt-3 font-semibold text-foreground">{transaction.deadline}</p>
            </Card>
            <Card className="border border-border/70 p-5 shadow-none sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Unit Pegadaian
              </p>
              <p className="mt-3 font-semibold text-foreground">{transaction.unit}</p>
              <p className="mt-2 text-sm text-muted-foreground">{transaction.unitAddress}</p>
            </Card>
          </div>
        </CardContent>
      </Card>

      <TransactionTimeline transaction={transaction} />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Rincian transaksi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[1.5rem] bg-surface-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Nomor pengajuan
              </p>
              <p className="mt-3 text-2xl font-extrabold text-primary">
                {transaction.applicationNumber}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border border-border/70 p-4 shadow-none">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Dibuat pada
                </p>
                <p className="mt-2 font-semibold text-foreground">{transaction.createdAt}</p>
              </Card>
              <Card className="border border-border/70 p-4 shadow-none">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Tipe transaksi
                </p>
                <p className="mt-2 font-semibold text-foreground">
                  {transaction.kind === "VICKREY_WIN"
                    ? "Pemenang lelang Vickrey"
                    : "Pembelian fixed price"}
                </p>
              </Card>
            </div>
            <div className="space-y-3">
              {transaction.paymentNotes.map((note) => (
                <div className="flex items-start gap-3" key={note}>
                  <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>
              {isTransfer ? "Instruksi transfer dan unggah bukti" : "Instruksi bayar langsung"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isTransfer ? (
              <>
                <div className="rounded-[1.5rem] border border-primary/15 bg-primary/[0.03] p-5">
                  <div className="flex items-start gap-3">
                    <Landmark className="mt-1 size-5 text-primary" />
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Bank tujuan
                        </p>
                        <p className="mt-2 text-xl font-bold text-foreground">
                          {transaction.bankName}
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white p-4 shadow-ambient">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Nomor rekening
                          </p>
                          <p className="mt-2 font-semibold text-foreground">
                            {transaction.bankAccountNumber}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-ambient">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Atas nama
                          </p>
                          <p className="mt-2 font-semibold text-foreground">
                            {transaction.bankAccountHolder}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {showReceipt ? (
                  <div className="rounded-[1.5rem] border border-primary/15 bg-primary/[0.03] p-5">
                    <div className="flex items-start gap-3">
                      <ReceiptText className="mt-1 size-5 text-primary" />
                      <div className="space-y-2">
                        <p className="font-semibold text-foreground">Nota digital tersedia</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          Bukti pembayaran telah diverifikasi pada {transaction.verifiedAt}.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[0.94fr_1.06fr]">
                    <div className="rounded-[1.5rem] border border-dashed border-border p-5 text-center">
                      <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <FileCheck2 className="size-5" />
                      </div>
                      <p className="mt-4 font-semibold text-foreground">
                        {transaction.paymentProof
                          ? "Bukti pembayaran sudah diunggah"
                          : "Area unggah bukti pembayaran"}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {transaction.paymentProof
                          ? transaction.paymentProof
                          : "Format JPG, PNG, atau PDF untuk mempercepat verifikasi admin."}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Input placeholder="Nomor referensi transfer" />
                      <Button className="w-full">
                        {transaction.paymentProof ? "Perbarui Bukti Pembayaran" : "Kirim Bukti Pembayaran"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-accent/35 bg-accent/15 p-5">
                  <div className="flex items-start gap-3">
                    <MapPinned className="mt-1 size-5 text-accent-foreground" />
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">Datang ke unit Pegadaian</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Bawa nomor pengajuan dan selesaikan pembayaran di alamat unit berikut
                        sebelum batas waktu berakhir.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 bg-surface-low p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Alamat unit
                  </p>
                  <p className="mt-3 font-semibold text-foreground">{transaction.unitAddress}</p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Checklist saat datang
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Tunjukkan nomor pengajuan {transaction.applicationNumber}.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 size-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Datang sebelum batas waktu {transaction.deadline}.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShoppingBag className="mt-0.5 size-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Admin unit akan memperbarui status menjadi lunas setelah pembayaran diterima.
                      </p>
                    </div>
                  </div>
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
                  <p className="mt-3 text-2xl font-extrabold text-primary">Transaksi selesai</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Diverifikasi pada {transaction.verifiedAt}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Pembeli
                  </p>
                  <p className="mt-3 font-semibold text-foreground">{buyer.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{buyer.email}</p>
                  <p className="text-sm text-muted-foreground">{getBuyerPhone(buyer)}</p>
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
                  <Button>
                    <ReceiptText className="size-4" />
                    Unduh Nota (PDF)
                  </Button>
                  <Link href={`/transaksi/${transaction.id}/nota`}>
                    <Button variant="secondary">
                      <Printer className="size-4" />
                      Buka Versi Cetak
                    </Button>
                  </Link>
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
  transactionId
}: {
  buyer: BuyerSessionUser;
  transactionId: string;
}) {
  const transaction = getTransactionById(transactionId);

  if (!transaction || transaction.status !== "LUNAS") {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">
          Nota belum tersedia. Nota hanya bisa dibuka setelah transaksi berstatus lunas.
        </p>
      </Card>
    );
  }

  const isTransfer = transaction.method === "TRANSFER_BANK";

  return (
    <div className="space-y-8 md:space-y-10 print:space-y-4">
      <div className="print:hidden">
        <SectionHeading
          action={
            <Link href={`/transaksi/${transaction.id}`}>
              <Button variant="secondary">Kembali ke Detail Transaksi</Button>
            </Link>
          }
          description="Halaman nota ini disiapkan untuk kebutuhan cetak atau simpan PDF setelah pembayaran selesai diverifikasi."
          eyebrow="Nota Transaksi"
          title="Bukti transaksi resmi"
        />
      </div>

      <Card className="overflow-hidden border border-border/70 bg-white print:border-0 print:shadow-none">
        <CardContent className="space-y-8 p-6 md:p-8">
          <div className="border-b border-border/70 pb-6">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-secondary">
              Pegadaian Lelang
            </p>
            <div className="mt-4 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary">
                  Nota transaksi resmi
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Dokumen ini merupakan bukti transaksi sah dan dapat disimpan sebagai bukti
                  kepemilikan setelah pembayaran diverifikasi.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface-low p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Nomor transaksi
                  </p>
                  <p className="mt-2 font-semibold text-foreground">{transaction.id}</p>
                </div>
                <div className="rounded-2xl bg-surface-low p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Nomor nota
                  </p>
                  <p className="mt-2 font-semibold text-foreground">{transaction.receiptNumber}</p>
                </div>
                <div className="rounded-2xl bg-surface-low p-4 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Unit Pegadaian
                  </p>
                  <p className="mt-2 font-semibold text-foreground">{transaction.unit}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{transaction.unitAddress}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-border/70 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Detail barang
                </p>
                <p className="mt-3 text-lg font-bold text-foreground">{transaction.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">Referensi {transaction.reference}</p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Data pembeli
                </p>
                <p className="mt-3 font-semibold text-foreground">{buyer.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{getBuyerPhone(buyer)}</p>
                <p className="text-sm text-muted-foreground">{buyer.email}</p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-surface-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Informasi pembayaran
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Jenis transaksi</span>
                  <span className="font-semibold text-foreground">
                    {transaction.kind === "VICKREY_WIN" ? "Hasil lelang" : "Pembelian langsung"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Metode bayar</span>
                  <span className="font-semibold text-foreground">
                    {isTransfer ? "Transfer bank" : "Bayar langsung"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Jumlah bayar</span>
                  <span className="font-semibold text-primary">{currency.format(transaction.amount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="font-semibold text-primary">LUNAS</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Diverifikasi pada</span>
                  <span className="font-semibold text-foreground">{transaction.verifiedAt}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            <Button>
              <ReceiptText className="size-4" />
              Unduh PDF
            </Button>
            <Button variant="secondary">
              <Printer className="size-4" />
              Cetak Nota
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function BidHistoryPage({ buyer: _buyer }: { buyer: BuyerSessionUser }) {
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
          bidHistory.reduce<Record<BuyerBidStatus, number>>(
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
          {bidHistory.map((item) => (
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

export function ProfilePage({ buyer }: { buyer: BuyerSessionUser }) {
  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        description="Kelola identitas akun, cek status verifikasi, dan pahami pembatasan yang dapat memengaruhi akses Anda ke lelang."
        eyebrow="Profil Akun"
        title="Kelola identitas dan keamanan akun"
      />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Data akun pembeli</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Nama lengkap
              </label>
              <Input defaultValue={buyer.name} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Email
              </label>
              <Input defaultValue={buyer.email} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Nomor telepon
              </label>
              <Input defaultValue={getBuyerPhone(buyer)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Nomor KTP
              </label>
              <Input defaultValue={userSummary.nikMasked} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Alamat
              </label>
              <Input defaultValue={userSummary.address} />
            </div>
            <div className="md:col-span-2">
              <Button className="inline-flex">
                <User className="size-4" />
                Simpan Perubahan
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Keamanan akun</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Password saat ini
                </label>
                <Input type="password" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Password baru
                </label>
                <Input type="password" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Konfirmasi password baru
                </label>
                <Input type="password" />
              </div>
              <Button variant="secondary">
                <KeyRound className="size-4" />
                Perbarui Password
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Status verifikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] border border-primary/15 bg-primary/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 size-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">{userSummary.verificationStatus}</p>
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
                <p className="mt-3 font-semibold text-foreground">{userSummary.memberSince}</p>
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
                  userSummary.blacklist.active
                    ? "border-tertiary-container/25 bg-tertiary-container/10"
                    : "border-border/70 bg-surface-low"
                )}
              >
                <div className="flex items-start gap-3">
                  {userSummary.blacklist.active ? (
                    <AlertTriangle className="mt-1 size-5 text-tertiary-container" />
                  ) : (
                    <CheckCircle2 className="mt-1 size-5 text-primary" />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">
                      {userSummary.blacklist.active ? "Blacklist aktif" : "Tidak ada blacklist aktif"}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {userSummary.blacklist.reason}
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
