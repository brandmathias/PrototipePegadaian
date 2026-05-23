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
import { BidRevealForm } from "@/components/buyer/bid-reveal-form";
import { CompletePurchaseButton } from "@/components/buyer/complete-purchase-button";
import { BuyerProfileSettingsForm } from "@/components/buyer/profile-settings-form";
import { LiveCountdown } from "@/components/buyer/live-countdown";
import { SectionHeading } from "@/components/shared/section-heading";
import { TransactionReceiptActions } from "@/components/shared/transaction-receipt-actions";
import { TransactionReceiptAutoPrint } from "@/components/shared/transaction-receipt-auto-print";
import { TransactionReceiptDocument } from "@/components/shared/transaction-receipt-document";
import { PaymentWorkflowRail, type PaymentWorkflowStep } from "@/components/shared/payment-workflow-rail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import type { BuyerBid, BuyerBidStatus, BuyerBidVerification, BuyerTransaction, BuyerTransactionStatus } from "@/lib/contracts/buyer";
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

type BuyerProfileStatus = {
  blacklist: {
    active: boolean;
    until: Date | null;
    totalViolations: number;
  };
};

const BUYER_SETTLEMENT_LOCKED_MESSAGE =
  "Akun Anda sedang dalam masa pembatasan. Transaksi belum dapat diselesaikan sampai masa blacklist berakhir.";

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
    description: "Bid tertutup menunggu reveal nominal atau settlement hasil."
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
  },
  GAGAL: {
    label: "Pembayaran Gagal",
    variant: "danger",
    description: "Anda menang, tetapi transaksi pembayaran Vickrey melewati batas waktu."
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

function getBidPaymentAmount(item: BuyerBid) {
  return item.paymentAmount ?? item.finalPrice;
}

function getBidAmountLabel(item: BuyerBid) {
  if (typeof item.bidAmount === "number") {
    return `Bid ${currency.format(item.bidAmount)}`;
  }

  return "Hash bid tersimpan";
}

function getBidTransactionActionLabel(item: BuyerBid) {
  if (item.status === "MENANG" && item.transactionStatus !== "LUNAS" && item.transactionStatus !== "SELESAI") {
    return "Lanjutkan Pembayaran";
  }

  if (item.status === "GAGAL") {
    return "Lihat Detail Gagal";
  }

  return "Lihat Transaksi";
}

function BidPaymentContext({ item, inverted = false }: { item: BuyerBid; inverted?: boolean }) {
  const paymentAmount = getBidPaymentAmount(item);
  const serverNow = new Date().toISOString();

  if (!paymentAmount && !item.transactionStatus && !item.paymentDeadlineAt) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid gap-3 rounded-[1.25rem] border p-4 sm:grid-cols-3",
        inverted
          ? "border-white/15 bg-white/10 text-white"
          : "border-primary/10 bg-primary/[0.03] text-foreground"
      )}
    >
      {paymentAmount ? (
        <div>
          <p className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", inverted ? "text-white/60" : "text-muted-foreground")}>
            Harga bayar Vickrey
          </p>
          <p className={cn("mt-2 font-semibold", inverted ? "text-white" : "text-primary")}>
            {currency.format(paymentAmount)}
          </p>
        </div>
      ) : null}
      {item.transactionStatus ? (
        <div>
          <p className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", inverted ? "text-white/60" : "text-muted-foreground")}>
            Status transaksi
          </p>
          <p className="mt-2 font-semibold">{transactionStatusMeta[item.transactionStatus].label}</p>
        </div>
      ) : null}
      {item.paymentDeadlineAt || item.paymentDeadline ? (
        <div>
          <p className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", inverted ? "text-white/60" : "text-muted-foreground")}>
            Batas pembayaran
          </p>
          <p className="mt-2 font-semibold">
            <LiveCountdown
              expiredLabel={item.paymentDeadline ?? "Waktu pembayaran berakhir"}
              fallbackLabel={item.paymentDeadline}
              serverNow={serverNow}
              targetAt={item.paymentDeadlineAt}
            />
          </p>
        </div>
      ) : null}
    </div>
  );
}

function getTimelineLabels(transaction: BuyerTransaction) {
  return [
    transaction.method === "TRANSFER_BANK" ? "Melakukan Pembayaran" : "Bayar di Unit",
    "Verifikasi",
    "Selesai"
  ];
}

function BuyerSettlementLockNotice({ message }: { message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-amber-200 bg-[linear-gradient(135deg,#fff7dd_0%,#fffdf4_100%)] p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800">
          <AlertTriangle className="size-5" />
        </span>
        <div className="space-y-2">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-900">
            Aksi transaksi dikunci
          </p>
          <p className="text-sm leading-7 text-amber-950/80">{message}</p>
        </div>
      </div>
    </div>
  );
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
  const serverNow = new Date().toISOString();

  return (
    <LiveCountdown
      className={className}
      expiredLabel={transaction.status === "LUNAS" || transaction.status === "SELESAI" ? "Selesai" : "Waktu pembayaran berakhir"}
      fallbackLabel={transaction.deadline}
      prefix={prefix}
      serverNow={serverNow}
      targetAt={transaction.deadlineAt}
    />
  );
}

function getDashboardActionLabel(transaction: BuyerTransaction) {
  if (transaction.status === "LUNAS") return "Selesaikan pembelian";
  if (transaction.status === "DITOLAK_BUKTI") return "Upload ulang";
  if (transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG") return "Lihat detail";
  return "Bayar sekarang";
}

function getDashboardActionDescription(transaction: BuyerTransaction) {
  if (transaction.status === "LUNAS") {
    return "Pembayaran sudah diverifikasi. Tutup pembelian setelah barang dan nota diterima.";
  }

  if (transaction.status === "DITOLAK_BUKTI") {
    return "Admin meminta bukti pembayaran diperbaiki. Buka detail transaksi untuk unggah ulang.";
  }

  if (transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG") {
    return "Pembayaran dilakukan langsung di unit. Simpan nomor pengajuan saat datang ke loket.";
  }

  return "Selesaikan pembayaran sebelum batas waktu agar transaksi tetap aktif.";
}

function isDashboardActiveTransaction(transaction: BuyerTransaction) {
  return !["SELESAI", "GAGAL"].includes(transaction.status);
}

function isDashboardPaymentWaiting(transaction: BuyerTransaction) {
  return ["MENUNGGU_PEMBAYARAN", "BUKTI_DIUNGGAH", "DITOLAK_BUKTI", "MENUNGGU_KONFIRMASI_LANGSUNG"].includes(
    transaction.status
  );
}

function isDashboardActiveBid(bid: BuyerBid) {
  return bid.status === "BID_TERCATAT" || bid.status === "MENUNGGU_HASIL";
}

function getUrgentTransactionRank(transaction: BuyerTransaction) {
  if (transaction.kind === "VICKREY_WIN" && isDashboardPaymentWaiting(transaction)) return 0;
  if (transaction.status === "DITOLAK_BUKTI") return 1;
  if (transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG") return 2;
  if (transaction.status === "MENUNGGU_PEMBAYARAN") return 3;
  return 9;
}

function getUrgentDashboardCopy(transaction: BuyerTransaction) {
  if (transaction.kind === "VICKREY_WIN" && isDashboardPaymentWaiting(transaction)) {
    return {
      eyebrow: "Pemenang Vickrey",
      title: `Anda memenangkan lelang ${transaction.title}.`,
      detail: `Bayar ${currency.format(transaction.amount)} sebelum batas waktu berakhir.`,
      tone: "danger" as const
    };
  }

  if (transaction.status === "DITOLAK_BUKTI") {
    return {
      eyebrow: "Bukti transfer ditolak",
      title: `Bukti pembayaran untuk ${transaction.title} ditolak.`,
      detail: "Silakan unggah ulang bukti yang lebih jelas dari halaman detail transaksi.",
      tone: "warning" as const
    };
  }

  if (transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG") {
    return {
      eyebrow: "Bayar langsung di unit",
      title: `Kunjungi ${transaction.unit} untuk menyelesaikan pembayaran ${transaction.title}.`,
      detail: "Bawa nomor pengajuan dan pastikan Anda datang sebelum batas pembayaran.",
      tone: "info" as const
    };
  }

  return {
    eyebrow: "Pembayaran menunggu",
    title: `Transaksi ${transaction.title} menunggu pembayaran.`,
    detail: "Transfer sesuai nominal lalu unggah bukti dari halaman detail transaksi.",
    tone: "default" as const
  };
}

function DashboardThumb({
  alt,
  icon,
  src
}: {
  alt: string;
  icon: ReactNode;
  src?: string;
}) {
  return (
    <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-[1.1rem] border border-primary/10 bg-primary/[0.04] text-primary">
      {src ? (
        <Image
          alt={alt}
          className="object-cover"
          height={64}
          src={src}
          width={64}
        />
      ) : (
        icon
      )}
    </div>
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
  const isTransfer = transaction.method === "TRANSFER_BANK";
  const isVickreyWin = transaction.kind === "VICKREY_WIN";
  const completed = transaction.status === "SELESAI";
  const currentStep =
    transaction.status === "SELESAI" || transaction.status === "LUNAS"
      ? 2
      : transaction.status === "BUKTI_DIUNGGAH"
        ? 1
        : 0;
  const paymentDetail = isTransfer
    ? transaction.status === "DITOLAK_BUKTI"
      ? "Bukti sebelumnya ditolak. Unggah ulang bukti transfer yang jelas dan sesuai nominal."
      : "Transfer sesuai nominal, lalu unggah bukti pembayaran sebelum batas waktu habis."
    : `Datang ke ${transaction.unit}, bawa nomor ${transaction.applicationNumber}, lalu selesaikan pembayaran di loket.`;
  const verificationDetail = isTransfer
    ? "Admin unit memeriksa nominal, rekening tujuan, referensi, dan kejelasan bukti transfer."
    : "Admin unit mengonfirmasi pembayaran langsung setelah dana diterima di loket.";
  const finishDetail =
    transaction.status === "LUNAS"
      ? "Pembayaran sudah diverifikasi. Tekan Pembelian Selesai setelah nota dan pengambilan barang siap."
      : completed
        ? "Pembelian sudah ditutup buyer. Nota tersimpan sebagai bukti transaksi."
        : "Tahap ini aktif setelah admin memverifikasi pembayaran.";
  const steps: PaymentWorkflowStep[] = [
    {
      id: "payment",
      label: "Melakukan Pembayaran",
      headline: isTransfer ? "Transfer Sesuai Nominal" : isVickreyWin ? "Bayar Vickrey di Unit" : "Bayar di Loket Unit",
      detail: paymentDetail,
      meta: isTransfer ? "Transfer + upload bukti" : isVickreyWin ? "Vickrey bayar di loket" : "Bayar di loket",
      icon: Landmark
    },
    {
      id: "verification",
      label: "Verifikasi",
      headline: "Menunggu Verifikasi Admin",
      detail: verificationDetail,
      meta: "Aksi admin unit",
      icon: ShieldCheck
    },
    {
      id: "finished",
      label: "Selesai & Nota",
      headline: completed ? "Pembelian Selesai" : "Konfirmasi Selesai & Nota",
      detail: finishDetail,
      meta: "Aksi akhir buyer",
      icon: CheckCircle2
    }
  ];

  return (
    <PaymentWorkflowRail
      completed={completed}
      currentStep={currentStep}
      description={
        isVickreyWin
          ? "Vickrey hanya memakai jalur loket unit. Tidak ada unggah bukti pembayaran online."
          : isTransfer
            ? "Fixed price transfer membutuhkan bukti pembayaran sebelum admin memverifikasi."
            : "Fixed price bayar langsung diverifikasi admin setelah pembayaran diterima di unit."
      }
      steps={steps}
      title="Workflow Pembayaran"
      tone="buyer"
    />
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
  const activeTransactions = transactions.filter(isDashboardActiveTransaction);
  const paymentWaitingCount = transactions.filter(isDashboardPaymentWaiting).length;
  const activeBids = bids.filter(isDashboardActiveBid);
  const receiptCount = transactions.filter((transaction) => transaction.status === "LUNAS" || transaction.status === "SELESAI").length;
  const urgentTransaction =
    [...activeTransactions]
      .filter(isDashboardPaymentWaiting)
      .sort((first, second) => getUrgentTransactionRank(first) - getUrgentTransactionRank(second))[0] ?? null;
  const urgentCopy = urgentTransaction ? getUrgentDashboardCopy(urgentTransaction) : null;
  const firstName = buyer.name.split(" ")[0] || buyer.name;
  const serverNow = new Date().toISOString();
  const urgentToneClass = urgentCopy
    ? {
        danger: "border-red-200 bg-[linear-gradient(135deg,#fff5f5_0%,#fff_100%)] text-red-950",
        default: "border-primary/15 bg-[linear-gradient(135deg,#f2fbf5_0%,#fff_100%)] text-primary",
        info: "border-sky-200 bg-[linear-gradient(135deg,#eff8ff_0%,#fff_100%)] text-sky-950",
        warning: "border-[#ead8b5] bg-[linear-gradient(135deg,#fff9e8_0%,#fff_100%)] text-[#5d4300]"
      }[urgentCopy.tone]
    : "";
  const urgentIconClass = urgentCopy
    ? {
        danger: "bg-red-100 text-red-700",
        default: "bg-primary/10 text-primary",
        info: "bg-sky-100 text-sky-700",
        warning: "bg-[#fff1bf] text-[#9a6a00]"
      }[urgentCopy.tone]
    : "";
  const metricCards = [
    {
      icon: Clock3,
      label: "Menunggu Bayar",
      value: String(paymentWaitingCount),
      detail: "Pembayaran atau verifikasi aktif"
    },
    {
      icon: Gavel,
      label: "Bid Aktif",
      value: String(activeBids.length),
      detail: "Lelang berjalan yang Anda ikuti"
    },
    {
      icon: FileCheck2,
      label: "Nota Tersedia",
      value: String(receiptCount),
      detail: "Bisa dicetak setelah lunas"
    }
  ];
  const quickActions = [
    {
      href: "/katalog",
      label: "Jelajahi Katalog",
      icon: ShoppingBag
    },
    {
      href: "/transaksi",
      label: "Pantau Transaksi",
      icon: ReceiptText
    },
    {
      href: "/riwayat-bid",
      label: "Riwayat Bid",
      icon: Gavel
    }
  ];

  return (
    <div className="space-y-7 md:space-y-8">
      <section className="rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbf4_58%,#fff7df_100%)] p-6 shadow-[0_24px_60px_-42px_rgba(8,69,50,0.5)] md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">Akun Terverifikasi</Badge>
              {summary.blacklist.active ? (
                <Badge variant="danger">Pembatasan level {summary.blacklist.violations}</Badge>
              ) : null}
            </div>
            <h2 className="mt-4 font-headline text-3xl font-extrabold tracking-tight text-primary md:text-5xl">
              Selamat datang, {firstName}.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
              {buyer.email} | Member sejak {summary.memberSince}
            </p>
          </div>
          <Link href="/profil">
            <Button variant="secondary">Kelola profil</Button>
          </Link>
        </div>
      </section>

      {urgentTransaction && urgentCopy ? (
        <section className={cn("rounded-[1.75rem] border p-5 shadow-[0_22px_50px_-38px_rgba(8,69,50,0.38)]", urgentToneClass)}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-[1.1rem]", urgentIconClass)}>
                {urgentCopy.tone === "info" ? <MapPinned className="size-5" /> : <AlertTriangle className="size-5" />}
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-70">
                  {urgentCopy.eyebrow}
                </p>
                <h3 className="mt-2 font-headline text-xl font-extrabold tracking-tight text-foreground">
                  {urgentCopy.title}
                </h3>
                <p className="mt-2 text-sm leading-6 opacity-80">{urgentCopy.detail}</p>
                {urgentTransaction.deadlineAt ? (
                  <p className="mt-3 text-sm font-semibold">
                    <BuyerPaymentCountdown prefix="Sisa waktu" transaction={urgentTransaction} />
                  </p>
                ) : null}
              </div>
            </div>
            <Link href={`/transaksi/${urgentTransaction.id}`}>
              <Button className="w-full md:w-auto">
                {getDashboardActionLabel(urgentTransaction)}
                <ExternalLink className="size-4" />
              </Button>
            </Link>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        {metricCards.map((metric) => {
          const Icon = metric.icon;

          return (
            <div className="rounded-[1.5rem] border border-border/70 bg-white p-5 shadow-[0_18px_45px_-38px_rgba(8,69,50,0.4)]" key={metric.label}>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                  {metric.label}
                </p>
                <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-3 font-headline text-3xl font-extrabold tracking-tight text-primary">
                {metric.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{metric.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="border border-border/70 bg-white shadow-[0_22px_55px_-44px_rgba(8,69,50,0.45)]">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Transaksi aktif</CardTitle>
              <p className="text-sm text-muted-foreground">Maksimal tiga transaksi terbaru yang belum selesai.</p>
            </div>
            <Link href="/transaksi">
              <Button variant="secondary">Lihat semua</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeTransactions.slice(0, 3).map((transaction) => (
              <div className="rounded-[1.4rem] border border-border/70 bg-surface-low/35 p-4" key={transaction.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <DashboardThumb
                      alt={`Foto barang ${transaction.title}`}
                      icon={<ReceiptText className="size-6" />}
                      src={transaction.imageUrl}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{transaction.title}</p>
                        <StatusPill status={transaction.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{currency.format(transaction.amount)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{transaction.unit}</p>
                    </div>
                  </div>
                  <Link href={`/transaksi/${transaction.id}`}>
                    <Button variant="secondary">Lihat Detail</Button>
                  </Link>
                </div>
              </div>
            ))}

            {activeTransactions.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-primary/20 bg-primary/[0.03] p-6">
                <p className="font-semibold text-foreground">Belum ada transaksi aktif.</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Barang yang dibeli atau dimenangkan nanti akan muncul di sini.
                </p>
                <Link className="mt-4 inline-flex" href="/katalog">
                  <Button>Jelajahi Katalog</Button>
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-white shadow-[0_22px_55px_-44px_rgba(8,69,50,0.45)]">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Lelang Vickrey yang diikuti</CardTitle>
              <p className="text-sm text-muted-foreground">Maksimal tiga sesi berjalan yang sudah Anda ikuti.</p>
            </div>
            <Link href="/riwayat-bid">
              <Button variant="secondary">Riwayat bid</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeBids.slice(0, 3).map((bid) => (
              <div className="rounded-[1.4rem] border border-border/70 bg-primary/[0.03] p-4" key={`${bid.lotId}-${bid.bidHash ?? bid.closing}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <DashboardThumb
                      alt={`Foto barang ${bid.lot}`}
                      icon={<Gavel className="size-6" />}
                      src={bid.imageUrl}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{bid.lot}</p>
                        <BidPill status={bid.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{bid.unit}</p>
                      <p className="mt-1 text-xs font-semibold text-primary">
                        <LiveCountdown
                          expiredLabel="Menunggu hasil"
                          fallbackLabel={bid.closing}
                          prefix="Tutup"
                          serverNow={serverNow}
                          targetAt={bid.closingAt}
                        />
                      </p>
                    </div>
                  </div>
                  <Link href="/riwayat-bid">
                    <Button variant="secondary">Pantau</Button>
                  </Link>
                </div>
              </div>
            ))}

            {activeBids.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-primary/20 bg-primary/[0.03] p-6">
                <p className="font-semibold text-foreground">Belum ada lelang yang diikuti.</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Bid Vickrey aktif akan tampil setelah Anda mengirim penawaran tertutup.
                </p>
                <Link className="mt-4 inline-flex" href="/katalog">
                  <Button>Cari Lelang</Button>
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-[1.75rem] border border-border/70 bg-white p-4 shadow-[0_18px_45px_-40px_rgba(8,69,50,0.38)]">
        <div className="grid gap-3 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                className="group flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-surface-low/45 px-4 py-3 font-semibold text-primary transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/[0.04] active:translate-y-0"
                href={action.href}
                key={action.href}
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-white ring-1 ring-primary/10">
                    <Icon className="size-4" />
                  </span>
                  {action.label}
                </span>
                <ExternalLink className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      </section>
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
        TIDAK_MENANG: 0,
        GAGAL: 0
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
                key={`${item.lot}-${item.bidHash ?? item.bidAmount ?? item.closing}`}
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
                      {getBidAmountLabel(item)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Harga dasar {currency.format(item.basePrice)}
                    </p>
                    <p className="text-sm text-muted-foreground">Tutup {item.closing}</p>
                  </div>
                </div>
                <div className="mt-5">
                  <BidPaymentContext item={item} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/katalog/${item.lotId}`}>
                    <Button variant="secondary">Lihat Lot</Button>
                  </Link>
                  {item.linkedTransactionId ? (
                    <Link href={`/transaksi/${item.linkedTransactionId}`}>
                      <Button>{getBidTransactionActionLabel(item)}</Button>
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
  buyerStatus,
  transactionId: _transactionId,
  transaction: loadedTransaction
}: {
  buyer: BuyerSessionUser;
  buyerStatus?: BuyerProfileStatus;
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
  const isVickreyWin = transaction.kind === "VICKREY_WIN";
  const isFixedPrice = transaction.kind === "FIXED_PRICE";
  const settlementLockMessage = buyerStatus?.blacklist.active
    ? BUYER_SETTLEMENT_LOCKED_MESSAGE
    : null;

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
        {isVickreyWin ? (
          <Card className="overflow-hidden border border-accent/35 bg-[radial-gradient(circle_at_top_left,rgba(255,205,76,0.22),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8f3e6_100%)]">
            <CardContent className="grid gap-5 p-5 md:grid-cols-[0.72fr_1.28fr] md:p-6">
              <div className="rounded-[1.5rem] bg-primary p-5 text-white">
                <div className="flex items-center gap-3">
                  <Gavel className="size-5" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                    Pemenang Vickrey
                  </p>
                </div>
                <p className="mt-4 font-headline text-3xl font-black tracking-tight">
                  {currency.format(transaction.amount)}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/75">Harga yang perlu dibayar</p>
              </div>
              <div className="space-y-3">
                <CardTitle>Harga final Vickrey</CardTitle>
                <p className="text-sm leading-7 text-muted-foreground">
                  Jumlah pembayaran ini bukan nominal bid tertinggi Anda. Sistem memakai penawaran
                  tertinggi kedua, atau harga dasar jika hanya ada satu penawar.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="accent">Batas pembayaran 24 jam</Badge>
                  <Badge variant="muted">Transaksi dibuat otomatis setelah hasil dibuka</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
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
                    {settlementLockMessage ? (
                      <BuyerSettlementLockNotice message={settlementLockMessage} />
                    ) : (
                      <CompletePurchaseButton transactionId={transaction.id} />
                    )}
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
                {settlementLockMessage ? (
                  <BuyerSettlementLockNotice message={settlementLockMessage} />
                ) : (
                  <BuyerPaymentProofForm
                    currentProof={transaction.paymentProof}
                    transactionId={transaction.id}
                  />
                )}
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
              TIDAK_MENANG: 0,
              GAGAL: 0
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
              key={`${item.lot}-${item.bidHash ?? item.bidAmount ?? item.closing}`}
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
                    {getBidAmountLabel(item)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Harga dasar {currency.format(item.basePrice)}
                  </p>
                  <p className="text-sm text-muted-foreground">Tutup {item.closing}</p>
                </div>
              </div>
              <div className="mt-5">
                <BidPaymentContext item={item} />
              </div>
              {item.escrowed && item.status === "MENUNGGU_HASIL" && !item.isRevealed ? (
                <div className="mt-5 rounded-[1.25rem] border border-primary/15 bg-primary/[0.03] p-4 text-sm leading-6 text-primary">
                  <p className="font-semibold">Escrow otomatis aktif</p>
                  <p className="mt-1">
                    Bid Anda sudah tersimpan terenkripsi. Sistem akan membuka nominal otomatis setelah deadline dan membuat transaksi bayar langsung jika Anda menang.
                  </p>
                </div>
              ) : item.canReveal || (item.revealDeadlineAt && item.status === "MENUNGGU_HASIL" && !item.isRevealed) ? (
                <div className="mt-5 rounded-[1.25rem] border border-[#ead8b5] bg-[#fffaf0] p-4 text-sm leading-6 text-[#5d4300]">
                  <p className="font-semibold text-[#7a5600]">
                    {item.canReveal ? "Reveal nominal dibutuhkan" : "Periode reveal sudah dipantau sistem"}
                  </p>
                  <p className="mt-1">
                    {item.canReveal
                      ? "Buka halaman verifikasi, kirim nominal dan salt agar bid ikut penentuan pemenang."
                      : "Jika belum reveal sampai batas waktu, bid tidak ikut settlement."}
                  </p>
                  {item.revealDeadlineAt ? (
                    <p className="mt-2 font-semibold">
                      <LiveCountdown
                        expiredLabel={item.revealDeadline ?? "Batas reveal selesai"}
                        fallbackLabel={item.revealDeadline}
                        prefix="Batas reveal"
                        serverNow={new Date().toISOString()}
                        targetAt={item.revealDeadlineAt}
                      />
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/katalog/${item.lotId}`}>
                  <Button variant="secondary">Lihat Lot</Button>
                </Link>
                {item.linkedTransactionId ? (
                  <Link href={`/transaksi/${item.linkedTransactionId}`}>
                    <Button>{getBidTransactionActionLabel(item)}</Button>
                  </Link>
                ) : null}
                <Link href={`/riwayat-bid/${item.lotId}/verifikasi`}>
                  <Button variant={item.canReveal ? "default" : "secondary"}>
                    {item.canReveal ? "Reveal Nominal" : "Verifikasi Bid"}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function IntegrityValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[1.2rem] border border-border/70 bg-surface-low/60 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function BidVerificationPage({
  buyer,
  verification
}: {
  buyer: BuyerSessionUser;
  verification: BuyerBidVerification;
}) {
  const verificationBadgeLabel = verification.isRevealed
    ? verification.isMatch
      ? "Bid Anda tercatat dengan benar"
      : "Hash tidak cocok"
    : verification.canReveal
      ? "Siap reveal nominal"
      : "Escrow terenkripsi tersimpan";

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        action={
          <Link href="/riwayat-bid">
            <Button variant="secondary">Kembali ke Riwayat</Button>
          </Link>
        }
        description="Cocokkan nominal, salt, dan hash setelah escrow dibuka agar Anda dapat melihat bid tertutup tidak berubah."
        eyebrow="Verifikasi Bid"
        title="Bukti integritas penawaran"
      />

      <Card className="border border-border/70 bg-white">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{verification.unit}</p>
              <h2 className="mt-2 font-headline text-3xl font-extrabold text-foreground">{verification.lot}</h2>
              <p className="mt-2 text-sm text-muted-foreground">Tutup {verification.closing}</p>
            </div>
            <Badge
              variant={
                verification.isRevealed
                  ? verification.isMatch
                    ? "default"
                    : "danger"
                  : verification.canReveal
                    ? "accent"
                    : "muted"
              }
            >
              {verificationBadgeLabel}
            </Badge>
          </div>

          {!verification.canVerify ? (
            <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Nominal masih dalam escrow terenkripsi sampai deadline. Admin tidak menerima nominal terbuka
              sebelum sistem membuka hasil.
            </div>
          ) : null}

          {verification.canReveal ? (
            <BidRevealForm buyerId={buyer.id} lotId={verification.lotId} />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <IntegrityValue label="Hash tersimpan" value={verification.bidHash} />
            <IntegrityValue label="Algoritma" value={verification.algorithm} />
            <IntegrityValue label="Formula" value={verification.formula} />
            <IntegrityValue
              label="Status reveal"
              value={verification.isRevealed ? "Nominal sudah dibuka setelah deadline" : "Nominal masih terenkripsi"}
            />
            {verification.isRevealed && typeof verification.bidAmount === "number" ? (
              <IntegrityValue label="Nominal bid Anda" value={currency.format(verification.bidAmount)} />
            ) : null}
            {verification.salt ? <IntegrityValue label="Salt" value={verification.salt} /> : null}
            {verification.computedHash ? (
              <IntegrityValue label="Hash hasil hitung ulang" value={verification.computedHash} />
            ) : null}
          </div>
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
