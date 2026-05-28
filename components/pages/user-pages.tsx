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
  IdCard,
  Landmark,
  LockKeyhole,
  Mail,
  MapPinned,
  Phone,
  Printer,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  UploadCloud,
  UserRound,
} from "lucide-react";

import { AccountCopyButton } from "@/components/buyer/account-copy-button";
import { AuctionWinnerPageContent } from "@/components/buyer/auction-winner-page";
import { BuyerPaymentProofForm } from "@/components/buyer/payment-proof-form";
import { BidRevealForm } from "@/components/buyer/bid-reveal-form";
import { CompletePurchaseButton } from "@/components/buyer/complete-purchase-button";
import { LoginHistoryDialog } from "@/components/buyer/login-history-dialog";
import { BuyerProfileSettingsForm } from "@/components/buyer/profile-settings-form";
import { TransactionsWorkspace } from "@/components/buyer/transactions-workspace";
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
import { getBuyerBidMonitoringHref, getBuyerBidTransactionHref, getBuyerTransactionsHref } from "@/lib/buyer/transaction-links";
import type { BuyerBid, BuyerBidStatus, BuyerBidVerification, BuyerTransaction, BuyerTransactionStatus } from "@/lib/contracts/buyer";
import { currency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

type BuyerSummary = {
  name?: string;
  unit?: string;
  accountId?: string;
  email?: string;
  image?: string | null;
  phone: string;
  nationalId?: string;
  nikMasked?: string;
  address?: string;
  memberSince: string;
  verificationStatus: string;
  security: {
    passwordUpdatedAt: string;
    activeSessionCount: number;
    sessionHistory: string[];
  };
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

const BUYER_HOME_HERO_IMAGE = "/uploads/Gambar Hero Section Beranda Pembeli.png";
const BUYER_NOTES_BACKGROUND_IMAGE = "/uploads/Gambar Background Catatan Penting.png";
const BUYER_PROFILE_BACKGROUND_IMAGE = "/uploads/Gambar Background Halaman Profil.png";

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
  const paymentWaitingTransactions = transactions.filter(isDashboardPaymentWaiting);
  const activeBidCount = bids.filter(isDashboardActiveBid).length;
  const urgentTransaction =
    [...paymentWaitingTransactions].sort(
      (first, second) => getUrgentTransactionRank(first) - getUrgentTransactionRank(second)
    )[0] ?? null;
  const urgentCopy = urgentTransaction ? getUrgentDashboardCopy(urgentTransaction) : null;
  const violationCount = summary.blacklist.violations ?? 0;
  const restrictionLevel = summary.blacklist.active ? Math.min(Math.max(violationCount, 1), 3) : 0;
  const restrictionLabel =
    restrictionLevel === 1
      ? "Level 1 - Peringatan"
      : restrictionLevel === 2
        ? "Level 2 - Pembatasan"
        : restrictionLevel >= 3
          ? "Level 3 - Review admin"
          : "Normal";
  const restrictionRules = summary.blacklist.active
    ? [
        "Akses lelang Vickrey dibatasi selama masa pembatasan.",
        ...(restrictionLevel >= 2 ? ["Pembelian Fixed Price baru ikut dibatasi sementara."] : []),
        ...(restrictionLevel >= 3 ? ["Akun perlu peninjauan admin sebelum dipulihkan."] : [])
      ]
    : ["Akun dapat mengikuti fixed price, Vickrey, transaksi, dan nota sesuai aturan layanan."];
  const importantNotes = [
    {
      icon: Clock3,
      title: "Selesaikan pembayaran tepat waktu",
      detail: "Ikuti instruksi pembayaran sebelum batas waktu agar transaksi tetap aman dan tidak masuk arsip gagal."
    },
    {
      icon: Gavel,
      title: "Pantau jadwal lelang",
      detail: "Bid Vickrey tetap tertutup sampai deadline. Hasil dan instruksi pembayaran tampil otomatis setelah sesi selesai."
    },
    {
      icon: ShieldCheck,
      title: "Jaga status akun",
      detail: "Selesaikan kewajiban pembayaran agar akun tetap bebas pembatasan dan bisa mengikuti transaksi berikutnya."
    }
  ];
  const urgentToneClass = urgentCopy
    ? {
        danger: "border-red-200 bg-[linear-gradient(135deg,#fff4f4_0%,#fffafa_56%,#fff6e9_100%)] text-red-950",
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
  return (
    <div className="space-y-6 md:space-y-7">
      <section className="relative min-h-[340px] overflow-hidden rounded-[2rem] border border-primary/10 bg-[linear-gradient(90deg,#fffdf8_0%,#f8f3ff_58%,#efe9ff_100%)] shadow-[0_24px_70px_-48px_rgba(8,69,50,0.46)] md:min-h-[380px]">
        <Image
          alt="Ilustrasi beranda pembeli"
          className="object-contain object-right"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1280px"
          src={BUYER_HOME_HERO_IMAGE}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,249,0.98)_0%,rgba(255,255,249,0.86)_42%,rgba(255,255,249,0.18)_78%)]" />
        <div className="relative flex min-h-[340px] max-w-3xl flex-col justify-center px-6 py-8 md:min-h-[380px] md:px-10">
          <p className="text-sm font-bold text-foreground">Selamat datang kembali,</p>
          <h1 className="mt-2 font-headline text-4xl font-black tracking-tight text-primary md:text-5xl">
            Halo, {buyer.name}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
            Kami siap membantu Anda menemukan aset terbaik, memantau pembayaran, dan membuka nota
            transaksi dari satu ruang pembeli yang lebih ringkas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Badge className="gap-2 rounded-2xl border border-primary/20 bg-white/85 px-4 py-2 text-primary shadow-sm" variant="default">
              <ShieldCheck className="size-4" />
              Akun Terverifikasi
            </Badge>
            {summary.blacklist.active ? (
              <Badge className="gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-amber-800" variant="accent">
                <AlertTriangle className="size-4" />
                Akun Dibatasi
              </Badge>
            ) : null}
          </div>
        </div>
      </section>

      {urgentTransaction && urgentCopy ? (
        <section
          className={cn(
            "overflow-hidden rounded-[1.75rem] border shadow-[0_22px_60px_-42px_rgba(8,69,50,0.42)]",
            urgentToneClass
          )}
        >
          <div className="grid gap-5 p-5 md:grid-cols-[1.2fr_0.8fr_0.7fr] md:items-center md:p-6">
            <div className="flex gap-4">
              <span className={cn("grid size-14 shrink-0 place-items-center rounded-full", urgentIconClass)}>
                {urgentCopy.tone === "info" ? <MapPinned className="size-6" /> : <AlertTriangle className="size-6" />}
              </span>
              <div>
                <h2 className="font-headline text-xl font-black tracking-tight text-foreground md:text-2xl">
                  {urgentCopy.eyebrow} - {urgentCopy.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{urgentCopy.detail}</p>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-current/10 bg-white/60 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Batas waktu pembayaran
              </p>
              <p className="mt-2 text-lg font-black text-foreground">
                {urgentTransaction.deadlineAt ? (
                  <BuyerPaymentCountdown prefix="Sisa" transaction={urgentTransaction} />
                ) : (
                  urgentTransaction.deadline
                )}
              </p>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <p className="text-sm text-muted-foreground">Harus dibayar</p>
              <p className="font-headline text-2xl font-black text-foreground">
                {currency.format(urgentTransaction.amount)}
              </p>
              <Link className="w-full md:w-auto" href={`/transaksi/${urgentTransaction.id}`}>
                <Button className="w-full md:min-w-44">
                  {getDashboardActionLabel(urgentTransaction)}
                  <ExternalLink className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.03fr_0.97fr]">
        <Card className="overflow-hidden border border-border/70 bg-white shadow-[0_22px_55px_-44px_rgba(8,69,50,0.45)]">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <CardTitle>Status Akun</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 rounded-[1.5rem] border border-primary/15 bg-[linear-gradient(135deg,#ffffff_0%,#f6fbf7_100%)] p-5 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-5">
                <div className="flex gap-4">
                  <span className="grid size-14 shrink-0 place-items-center rounded-[1.1rem] bg-primary/10 text-primary">
                    <ShieldCheck className="size-7" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Verifikasi Akun
                    </p>
                    <p className="mt-2 text-xl font-black text-primary">{summary.verificationStatus}</p>
                    <p className="mt-1 break-all text-sm text-muted-foreground">{buyer.email}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Member sejak {summary.memberSince}</p>
                  </div>
                </div>

                <div className="flex gap-4 border-t border-border/70 pt-5">
                  <span
                    className={cn(
                      "grid size-14 shrink-0 place-items-center rounded-[1.1rem]",
                      summary.blacklist.active ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"
                    )}
                  >
                    {summary.blacklist.active ? <AlertTriangle className="size-7" /> : <CheckCircle2 className="size-7" />}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Status Restriksi
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-lg font-black",
                        summary.blacklist.active ? "text-amber-800" : "text-primary"
                      )}
                    >
                      {summary.blacklist.active ? restrictionLabel : "Tidak ada pembatasan"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {summary.blacklist.active
                        ? `${summary.blacklist.reason} Berlaku sampai ${summary.blacklist.until}.`
                        : summary.blacklist.reason}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.25rem] bg-white/80 p-5 ring-1 ring-border/70">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Pembatasan Aktif
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  {restrictionRules.map((rule) => (
                    <li className="flex gap-3" key={rule}>
                      <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
                {summary.blacklist.active ? (
                  <div className="mt-5 rounded-[1.1rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    Hindari pelanggaran berikutnya agar level pembatasan tidak meningkat.
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border/70 bg-white shadow-[0_22px_55px_-44px_rgba(8,69,50,0.45)]">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                <FileCheck2 className="size-5" />
              </span>
              <CardTitle>Riwayat Pelanggaran</CardTitle>
            </div>
            <Link className="text-sm font-semibold text-primary hover:underline" href="/profil">
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent>
            <div className="rounded-[1.5rem] border border-border/70 bg-white p-5">
              <p className="text-sm text-muted-foreground">Total Pelanggaran</p>
              <p
                className={cn(
                  "mt-2 font-headline text-3xl font-black",
                  violationCount > 0 ? "text-red-700" : "text-primary"
                )}
              >
                {violationCount} kali
              </p>

              <div className="mt-5 divide-y divide-border/70">
                {summary.blacklist.active ? (
                  <div className="flex items-start justify-between gap-4 py-4">
                    <div className="flex gap-3">
                      <span className="mt-1 size-2.5 rounded-full bg-red-600" />
                      <div>
                        <p className="font-semibold text-foreground">{summary.blacklist.reason}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{restrictionLabel}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-right text-sm text-muted-foreground">{summary.blacklist.until}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 py-4">
                    <span className="mt-1 size-2.5 rounded-full bg-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Tidak ada pelanggaran aktif</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Akun berada dalam status baik dan tidak sedang dibatasi.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {violationCount > 0 ? (
                <div className="mt-5 rounded-[1.1rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Jika melakukan pelanggaran lagi, akun dapat masuk ke level pembatasan berikutnya.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="relative overflow-hidden rounded-[1.9rem] border border-primary/10 bg-[#faf9ef] p-5 shadow-[0_24px_70px_-48px_rgba(8,69,50,0.42)] md:p-6">
        <Image
          alt=""
          aria-hidden="true"
          className="object-cover object-right opacity-80"
          fill
          sizes="(max-width: 768px) 100vw, 1280px"
          src={BUYER_NOTES_BACKGROUND_IMAGE}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,249,0.98)_0%,rgba(255,255,249,0.93)_50%,rgba(255,255,249,0.66)_100%)]" />
        <div className="absolute -left-10 top-8 size-40 rounded-full bg-primary/[0.06] blur-2xl" />
        <div className="relative">
          <div className="mb-5 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-[1.05rem] border border-primary/15 bg-white/85 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <ReceiptText className="size-5" />
              </span>
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-primary/70">
                  Informasi Pembeli
                </p>
                <h2 className="font-headline text-xl font-black text-primary">Catatan Penting</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Ringkasan hal yang perlu Anda ingat saat mengikuti fixed price, Vickrey, dan pembayaran di Pegadaian Lelang.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.12fr_0.94fr_0.94fr]">
            {importantNotes.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="group rounded-[1.45rem] border border-primary/10 bg-white/90 p-5 shadow-[0_18px_48px_-38px_rgba(8,69,50,0.38)] ring-1 ring-white/60 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white/95"
                  key={item.title}
                >
                  <span className="grid size-11 place-items-center rounded-[1rem] bg-primary/10 text-primary transition duration-500 group-hover:scale-105 group-hover:bg-primary group-hover:text-white">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {activeTransactions.length === 0 && activeBidCount === 0 && !urgentTransaction ? (
        <section className="rounded-[1.5rem] border border-dashed border-primary/20 bg-primary/[0.03] p-6">
          <p className="font-semibold text-foreground">Belum ada aktivitas yang perlu ditindaklanjuti.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Beranda akan menampilkan peringatan hanya ketika ada pembayaran, bid, atau pembatasan yang membutuhkan perhatian.
          </p>
        </section>
      ) : null}
    </div>
  );
}

export function TransactionsPage({
  buyer: _buyer,
  data,
  initialTab = "transactions",
  highlightedBidLotId
}: {
  buyer: BuyerSessionUser;
  data: { summary: BuyerSummary; transactions: BuyerTransaction[]; bids: BuyerBid[] };
  initialTab?: "transactions" | "bids";
  highlightedBidLotId?: string | null;
}) {
  const { bids, transactions } = data;

  return (
    <TransactionsWorkspace
      bids={bids}
      highlightedBidLotId={highlightedBidLotId}
      initialTab={initialTab}
      transactions={transactions}
    />
  );
}

export function AuctionWinnerPage({
  transactionId: _transactionId,
  transaction: loadedTransaction,
}: {
  transactionId: string;
  transaction?: BuyerTransaction | null;
}) {
  const transaction = loadedTransaction ?? null;

  if (!transaction) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">Transaksi pemenang tidak ditemukan.</p>
      </Card>
    );
  }

  return <AuctionWinnerPageContent transaction={transaction} />;
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
    <div className="space-y-7 bg-white md:space-y-8">
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
          <div className="flex flex-wrap gap-3">
            <Link href={`/katalog/${transaction.lotId}`}>
              <Button variant="ghost">Kembali ke Detail Barang</Button>
            </Link>
          </div>
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

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr_0.9fr]">
        <div className="relative h-fit rounded-xl bg-white p-7 shadow-[0_18px_42px_rgba(0,74,35,0.04)]">
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(180deg,rgba(0,74,35,0.02)_0%,transparent_42%)]" />
          <div className="relative z-10">
            <h2 className="mb-6 flex items-center gap-2.5 font-headline text-[1.95rem] font-black tracking-tight text-primary">
              <ReceiptText className="size-5" />
              Rincian Transaksi
            </h2>
            <div className="space-y-6">
              <div>
                <p className="mb-1 font-body text-[0.74rem] font-medium uppercase tracking-[0.08em] text-[#6e716c]">
                  ID Transaksi
                </p>
                <p className="break-words font-body text-[1.08rem] font-semibold text-[#1a1c1c]">
                  {transaction.id}
                </p>
              </div>

              <div className="flex gap-4">
                {transaction.imageUrl ? (
                  <Image
                    alt={`Foto barang ${transaction.title}`}
                    className="size-20 shrink-0 rounded-md bg-[#efefec] object-cover"
                    height={160}
                    src={transaction.imageUrl}
                    unoptimized
                    width={160}
                  />
                ) : (
                  <div className="grid size-20 shrink-0 place-items-center rounded-md bg-[#efefec] text-primary">
                    <ShoppingBag className="size-7" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="mb-1 font-body text-[0.74rem] font-medium uppercase tracking-[0.08em] text-[#6e716c]">
                    Nama Barang
                  </p>
                  <p className="font-body text-[1.02rem] font-semibold leading-7 text-[#1a1c1c]">
                    {transaction.title}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-1 font-body text-[0.74rem] font-medium uppercase tracking-[0.08em] text-[#6e716c]">
                  Total Harga
                </p>
                <p className="font-headline text-[2.35rem] font-black tracking-tight text-primary">
                  {currency.format(transaction.amount)}
                </p>
              </div>

              <div>
                <p className="mb-1 font-body text-[0.74rem] font-medium uppercase tracking-[0.08em] text-[#6e716c]">
                  Metode Pembayaran
                </p>
                <p className="flex items-center gap-2 font-body text-[1rem] text-[#1a1c1c]">
                  <Landmark className="size-4" />
                  {isTransfer ? "Transfer Bank" : "Bayar Langsung"}
                </p>
              </div>

              {transaction.winnerContext ? (
                <div className="rounded-lg bg-[#faf4e7] px-4 py-3 text-sm leading-7 text-[#5e5a4c]">
                  {transaction.winnerContext}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="relative h-fit overflow-hidden rounded-xl border border-black/5 bg-white p-7 shadow-[0_18px_42px_rgba(0,74,35,0.04)]">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-[2.9rem] bg-[#f9f1d8]" />
          <div className="relative z-10">
            <h2 className="mb-6 flex items-center gap-2.5 font-headline text-[1.95rem] font-black tracking-tight text-primary">
              {isTransfer ? <Landmark className="size-5" /> : <MapPinned className="size-5" />}
              {isTransfer ? "Rekening Tujuan" : "Bayar Langsung di Unit"}
            </h2>

            {isTransfer ? (
              <>
                <div className="rounded-lg border-l-4 border-[#735c00] bg-[#f3f3f1] p-5">
                  <p className="mb-1 font-body text-[0.74rem] font-medium uppercase tracking-[0.08em] text-[#6e716c]">
                    Bank
                  </p>
                  <p className="mb-4 font-body text-[1.85rem] font-semibold leading-tight text-[#1a1c1c]">
                    {transaction.bankName}
                  </p>

                  <p className="mb-1 font-body text-[0.74rem] font-medium uppercase tracking-[0.08em] text-[#6e716c]">
                    Nomor Rekening
                  </p>
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-black/10 bg-white px-4 py-3">
                    <div className="min-w-0 flex-1 overflow-x-auto">
                      <p className="whitespace-nowrap font-headline text-[1.55rem] font-black tracking-[0.06em] text-primary sm:text-[1.8rem]">
                        {transaction.bankAccountNumber ?? "-"}
                      </p>
                    </div>
                    <AccountCopyButton value={transaction.bankAccountNumber ?? "-"} />
                  </div>

                  <p className="mb-1 font-body text-[0.74rem] font-medium uppercase tracking-[0.08em] text-[#6e716c]">
                    Atas Nama
                  </p>
                  <p className="font-body text-[1rem] font-semibold uppercase tracking-[0.04em] text-[#1a1c1c]">
                    {transaction.bankAccountHolder}
                  </p>
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-lg bg-[#f8eced] p-4">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#8f3a47]" />
                  <p className="font-body text-[0.82rem] leading-6 text-[#4f4b48]">
                    Pastikan Anda mentransfer tepat sesuai dengan <strong>Total Harga</strong>{" "}
                    untuk mempercepat proses verifikasi otomatis.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-[#f7f7f4] p-5">
                  <p className="font-body text-[1rem] font-semibold text-[#1a1c1c]">
                    Datang ke {transaction.unit}
                  </p>
                  <p className="mt-2 font-body text-sm leading-7 text-[#62655f]">
                    Bawa nomor pengajuan {transaction.applicationNumber} dan selesaikan pembayaran di loket unit.
                  </p>
                </div>
                <div className="mt-5 rounded-lg bg-[#f3f3f1] p-5">
                  <p className="mb-1 font-body text-[0.74rem] font-medium uppercase tracking-[0.08em] text-[#6e716c]">
                    Alamat Unit
                  </p>
                  <p className="font-body text-[1rem] font-semibold text-[#1a1c1c]">{transaction.unitAddress}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="h-fit rounded-xl bg-white p-7 shadow-[0_18px_42px_rgba(0,74,35,0.04)]">
          <h2 className="mb-2 flex items-center gap-2.5 font-headline text-[1.95rem] font-black tracking-tight text-primary">
            <UploadCloud className="size-5" />
            {isTransfer ? "Unggah Bukti" : "Status Konfirmasi"}
          </h2>

          {showReceipt ? (
            <div className="space-y-5">
              <p className="font-body text-sm leading-7 text-[#62655f]">
                {isCompleted
                  ? `Pembelian selesai setelah pembayaran diverifikasi pada ${transaction.verifiedAt}.`
                  : `Pembayaran diverifikasi pada ${transaction.verifiedAt}. Menunggu konfirmasi selesai dari buyer.`}
              </p>
              <div className="rounded-lg bg-[#f6f7f2] p-5">
                <p className="font-body text-base font-semibold text-[#1a1c1c]">
                  {isCompleted ? "Pembelian sudah selesai" : "Nota digital tersedia"}
                </p>
              </div>
              {!isCompleted ? (
                <div>
                  {settlementLockMessage ? (
                    <BuyerSettlementLockNotice message={settlementLockMessage} />
                  ) : (
                    <CompletePurchaseButton transactionId={transaction.id} />
                  )}
                </div>
              ) : null}
              <Link className="block" href={`/transaksi/${transaction.id}/nota`}>
                <Button className="h-14 w-full rounded-md font-body text-base font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                  <Printer className="size-4" />
                  Buka Nota
                </Button>
              </Link>
            </div>
          ) : isTransfer ? (
            <>
              <p className="mb-6 font-body text-sm leading-7 text-[#62655f]">
                Unggah bukti transfer maksimal 24 jam setelah pengajuan.
              </p>
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
              <p className="font-body text-sm leading-7 text-[#62655f]">
                Pembayaran dilakukan langsung di unit. Setelah dana diterima, admin akan menyelesaikan verifikasi.
              </p>
              <div className="rounded-lg border-2 border-dashed border-black/10 bg-[#f8f8f6] p-6 text-center">
                <div className="mx-auto inline-flex size-14 items-center justify-center rounded-[1rem] bg-[#ececea] text-primary">
                  <Clock3 className="size-5" />
                </div>
                <p className="mt-4 font-body text-base font-semibold text-[#1a1c1c]">Menunggu konfirmasi admin</p>
              </div>
            </div>
          )}
        </div>
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
                {getBuyerBidTransactionHref(item) ? (
                  <Link href={getBuyerBidTransactionHref(item) ?? "#"}>
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
          <Link href={getBuyerTransactionsHref({ tab: "bids", lotId: verification.lotId })}>
            <Button variant="secondary">Kembali ke Transaksi</Button>
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

function ProfileDetailCard({
  icon,
  title,
  children,
  className
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-white/70 bg-white/80 p-2 shadow-[0_28px_90px_-64px_rgba(8,69,50,0.58)] ring-1 ring-primary/5",
        className
      )}
    >
      <div className="h-full rounded-[calc(2rem-0.5rem)] border border-primary/10 bg-white/90 p-5 md:p-6">
        <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
          <span className="grid size-11 place-items-center rounded-[1.1rem] bg-primary/[0.08] text-primary">
            {icon}
          </span>
          <h3 className="font-headline text-lg font-black tracking-[-0.02em] text-foreground">
            {title}
          </h3>
        </div>
        <div className="mt-5 space-y-5">{children}</div>
      </div>
    </div>
  );
}

function ProfileDetailRow({
  label,
  value,
  accent
}: {
  label: string;
  value: ReactNode;
  accent?: "success" | "warning";
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(8rem,0.75fr)_minmax(0,1fr)] sm:items-center">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div
        className={cn(
          "min-w-0 break-words text-sm font-semibold leading-6 text-foreground",
          accent === "success" ? "text-primary" : null,
          accent === "warning" ? "text-amber-800" : null
        )}
      >
        {value}
      </div>
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
  const displayName = summary.name ?? buyer.name;
  const displayEmail = summary.email ?? buyer.email;
  const phone = summary.phone && summary.phone !== "-" ? summary.phone : getBuyerPhone(buyer, summary.phone);
  const nationalId = summary.nationalId ?? "-";
  const hasRestriction = summary.blacklist.active;
  const restrictionLabel = hasRestriction ? "Pembatasan aktif" : "Tidak ada pembatasan";

  return (
    <div className="relative left-1/2 -my-8 min-h-[calc(100dvh-4rem)] w-screen -translate-x-1/2 overflow-hidden bg-[#f8f4ea] py-8 md:-my-10 md:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Image
          alt=""
          className="h-full w-full object-fill"
          fill
          priority
          sizes="100vw"
          src={BUYER_PROFILE_BACKGROUND_IMAGE}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.30)_0%,rgba(255,255,255,0.22)_24%,rgba(248,244,234,0.55)_62%,rgba(248,244,234,0.82)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_6%,rgba(8,91,62,0.08),transparent_30%),radial-gradient(circle_at_90%_8%,rgba(216,173,56,0.11),transparent_26%)]" />
      </div>

      <div className="container relative space-y-6 md:space-y-7">
        <section className="space-y-3">
          <p className="inline-flex rounded-full border border-primary/10 bg-white/80 px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.24em] text-primary shadow-[0_14px_38px_-30px_rgba(8,69,50,0.55)]">
            Profil Pembeli
          </p>
          <div className="max-w-3xl">
            <h1 className="font-headline text-4xl font-black tracking-[-0.045em] text-[#13211c] md:text-5xl">
              Profil Saya
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              Kelola informasi akun, keamanan, foto profil, dan status pembatasan dari satu halaman yang ringkas.
            </p>
          </div>
        </section>

        <section>
          <BuyerProfileSettingsForm
            email={displayEmail}
            hasRestriction={hasRestriction}
            initialImage={summary.image}
            initialName={displayName}
            initialNationalId={summary.nationalId ?? ""}
            initialPhone={phone}
            memberSince={summary.memberSince}
            restrictionLabel={restrictionLabel}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <ProfileDetailCard icon={<UserRound className="size-5" />} title="Informasi Pribadi">
            <ProfileDetailRow label="Nama Lengkap" value={displayName} />
            <ProfileDetailRow label="Email" value={displayEmail} />
            <ProfileDetailRow label="Nomor Telepon" value={phone} />
            <ProfileDetailRow label="Nomor KTP" value={nationalId} />
          </ProfileDetailCard>

          <ProfileDetailCard icon={<ShieldCheck className="size-5" />} title="Keamanan & Akses">
            <div className="space-y-3">
              <div className="rounded-[1.35rem] border border-primary/10 bg-[linear-gradient(180deg,#ffffff,#f8fbf8)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/[0.08] text-primary">
                      <LockKeyhole className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Password</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {summary.security.passwordUpdatedAt === "-"
                      ? "Belum ada riwayat perubahan"
                      : `Terakhir diubah ${summary.security.passwordUpdatedAt}`}
                  </p>
                </div>
              </div>

              <LoginHistoryDialog
                activeSessionCount={summary.security.activeSessionCount}
                entries={summary.security.sessionHistory}
              />
            </div>
          </ProfileDetailCard>

          <ProfileDetailCard icon={<IdCard className="size-5" />} title="Pembatasan & Riwayat">
            <ProfileDetailRow
              accent={hasRestriction ? "warning" : "success"}
              label="Status Pembatasan"
              value={
                <span className="inline-flex items-center gap-2">
                  {hasRestriction ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
                  {restrictionLabel}
                </span>
              }
            />
            <ProfileDetailRow label="Sisa Waktu Pembatasan" value={hasRestriction ? summary.blacklist.until : "-"} />
            <ProfileDetailRow
              label="Riwayat Pelanggaran"
              value={summary.blacklist.violations > 0 ? `${summary.blacklist.violations} kali` : "Tidak ada pelanggaran"}
            />
          </ProfileDetailCard>
        </section>

        <section className="rounded-[2rem] border border-white/60 bg-white/70 p-2 shadow-[0_22px_70px_-58px_rgba(8,69,50,0.5)] backdrop-blur-sm">
          <div className="flex flex-col gap-4 rounded-[calc(2rem-0.5rem)] border border-primary/10 bg-white/75 p-5 md:flex-row md:items-center">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <ReceiptText className="size-5" />
            </span>
            <div className="min-w-0 md:border-l md:border-primary/10 md:pl-5">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary/50">
                Catatan Penting
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Pastikan data identitas selalu akurat. Informasi ini dipakai untuk pembayaran,
                pengambilan barang, nota transaksi, dan verifikasi jika terjadi pembatasan akun.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
