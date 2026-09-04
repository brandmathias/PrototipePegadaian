import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleX,
  ClipboardCheck,
  Clock3,
  CircleOff,
  ExternalLink,
  FileCheck2,
  Gavel,
  Hourglass,
  IdCard,
  ImageIcon,
  Landmark,
  LockKeyhole,
  Mail,
  MapPinned,
  Phone,
  Printer,
  ReceiptText,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Trophy,
  UploadCloud,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import { AccountCopyButton } from "@/components/buyer/account-copy-button";
import { AuctionLoserPageContent } from "@/components/buyer/auction-loser-page";
import { AuctionWinnerPageContent } from "@/components/buyer/auction-winner-page";
import { AuctionWinnerCountdown } from "@/components/buyer/auction-winner-countdown";
import { MidtransEmbeddedCheckout } from "@/components/buyer/midtrans-embedded-checkout";
import { BuyerPaymentProofForm } from "@/components/buyer/payment-proof-form";
import { CompletePurchaseButton } from "@/components/buyer/complete-purchase-button";
import { LoginHistoryDialog } from "@/components/buyer/login-history-dialog";
import { StatusSyncRefresh } from "@/components/shared/status-sync-refresh";
import { BuyerProfileSettingsForm } from "@/components/buyer/profile-settings-form";
import { RestrictionCountdownTiles } from "@/components/buyer/restriction-countdown-tiles";
import { TransactionsWorkspace } from "@/components/buyer/transactions-workspace";
import { LiveCountdown } from "@/components/buyer/live-countdown";
import { SectionHeading } from "@/components/shared/section-heading";
import WelcomeBrushBadge from "@/components/shared/welcome-brush-badge";
import { HandoverProofCard } from "@/components/shared/handover-proof-card";
import { BankLogoMark, getBankDisplayName } from "@/components/shared/bank-logo";
import { TransactionReceiptActions } from "@/components/shared/transaction-receipt-actions";
import { TransactionReceiptAutoPrint } from "@/components/shared/transaction-receipt-auto-print";
import { TransactionReceiptDocument } from "@/components/shared/transaction-receipt-document";
import { TransactionReceiptInlinePrint } from "@/components/shared/transaction-receipt-inline-print";
import { FIXED_PRICE_PAYMENT_FAILURE_COPY } from "@/lib/buyer/payment-copy";
import { PaymentWorkflowRail, type PaymentWorkflowStep } from "@/components/shared/payment-workflow-rail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import { getBlacklistRestrictionPolicy } from "@/lib/blacklist/restrictions";
import { isFixedPriceBuyerCatalogHiddenStatus } from "@/lib/buyer/fixed-price-visibility";
import {
  getBuyerBidMonitoringHref,
  getBuyerBidTransactionHref,
  getBuyerTransactionHref,
  getBuyerTransactionsHref,
  isBuyerWinnerAnnouncementTransaction
} from "@/lib/buyer/transaction-links";
import type {
  BuyerBankAccount,
  BuyerBid,
  BuyerBidStatus,
  BuyerTransaction,
  BuyerTransactionStatus
} from "@/lib/contracts/buyer";
import type { Lot } from "@/lib/contracts/catalog";
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
    incidentId?: string | null;
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

type BuyerDashboardViolation = {
  id: string;
  imageUrl: string | null;
  itemName: string;
  note: string;
  occurredAtLabel: string;
  unitName: string;
  violationLevel: number;
};

const BUYER_SETTLEMENT_LOCKED_MESSAGE =
  "Akun Anda sedang dalam masa pembatasan sesuai level aktif.";

const BUYER_HOME_HERO_IMAGE = "/uploads/Gambar Hero Section Beranda Pembeli.png";
const BUYER_NOTES_BACKGROUND_IMAGE = "/uploads/Gambar Background Catatan Penting.png";
const BUYER_PROFILE_BACKGROUND_IMAGE = "/uploads/Gambar Background Halaman Profil.png";
const PAYMENT_DETAIL_CARD_CLASS =
  "relative flex h-full min-h-0 flex-col rounded-xl border border-black/5 bg-white p-7 shadow-[0_18px_42px_rgba(0,74,35,0.04)]";

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
    label: "Dibatalkan",
    variant: "danger",
    description: "Bukti pembayaran ditolak admin unit. Transaksi dibatalkan dan barang kembali tersedia di katalog."
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
    description: "Bid tertutup sedang menunggu penentuan hasil otomatis."
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
    description: "Anda menang, tetapi transaksi pembayaran Lelang Tertutup melewati batas waktu."
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
        (status === "GAGAL" || status === "DITOLAK_BUKTI") && "bg-tertiary-container/10 text-tertiary-container"
      )}
      variant={tone}
    >
      {transactionStatusMeta[status].label}
    </Badge>
  );
}

function BidPill({ status }: { status: BuyerBidStatus }) {
  const Icon = status === "MENANG" ? Trophy : status === "TIDAK_MENANG" ? CircleX : null;

  return (
    <Badge className={Icon ? "gap-1.5" : undefined} variant={bidStatusMeta[status].variant}>
      {Icon ? (
        <Icon className="size-3.5" data-testid={`buyer-bid-history-status-${status}-icon`} strokeWidth={1.9} />
      ) : null}
      {bidStatusMeta[status].label}
    </Badge>
  );
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
            Harga akhir lelang
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
    transaction.method === "MIDTRANS"
      ? "Bayar melalui Transfer"
      : transaction.method === "TRANSFER_BANK"
        ? "Melakukan Pembayaran"
        : "Bayar di Unit",
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
    case "DITOLAK_BUKTI":
    case "LUNAS":
      return 1;
    case "SELESAI":
      return 2;
    case "MENUNGGU_PEMBAYARAN":
    case "MENUNGGU_VERIFIKASI":
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

  if (transaction.status === "MENUNGGU_PEMBAYARAN" && transaction.method === "MIDTRANS") {
    return "Pembayaran transfer menunggu konfirmasi. Status akan diperbarui setelah dana diterima.";
  }

  if (transaction.status === "MENUNGGU_PEMBAYARAN" && transaction.method === "TRANSFER_BANK") {
    return "Transaksi harga tetap sudah dibuat. Lakukan transfer sesuai nominal, lalu unggah bukti pembayaran dari halaman ini.";
  }

  if (transaction.status === "DITOLAK_BUKTI") {
    return "Bukti pembayaran ditolak admin unit. Transaksi dibatalkan dan barang kembali tersedia di katalog.";
  }

  if (transaction.status === "GAGAL" && transaction.kind === "FIXED_PRICE") {
    return FIXED_PRICE_PAYMENT_FAILURE_COPY.description;
  }

  return transactionStatusMeta[transaction.status].description;
}

function getBuyerPhone(buyer: BuyerSessionUser, summaryPhone?: string) {
  return buyer.phoneNumber ?? summaryPhone ?? "-";
}

function getTransactionBankAccounts(transaction: BuyerTransaction): BuyerBankAccount[] {
  const accounts = (transaction.bankAccounts ?? []).filter((account) => account.accountNumber);

  if (accounts.length > 0) {
    return accounts;
  }

  if (!transaction.bankAccountNumber) {
    return [];
  }

  return [
    {
      bankName: transaction.bankName ?? "Bank Unit",
      accountNumber: transaction.bankAccountNumber,
      accountHolder: transaction.bankAccountHolder ?? "-",
      branch: transaction.bankBranch,
      isActive: true
    }
  ];
}

function DestinationAccountRow({ account }: { account: BuyerBankAccount }) {
  const bankDisplayName = getBankDisplayName(account.bankName);

  return (
    <div
      aria-label={`Rekening tujuan ${bankDisplayName}`}
      className="relative flex h-full min-h-[8.75rem] flex-col justify-center overflow-hidden rounded-[0.92rem] border border-[#d8b24c] bg-white px-5 py-5 shadow-[0_16px_30px_-22px_rgba(73,54,8,0.38)]"
      role="listitem"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#087642_0%,#087642_64%,#e2ad19_73%,transparent_73%)]"
        data-account-accent
      />

      <div className="grid grid-cols-[4.55rem_minmax(0,1fr)_2.5rem] items-center gap-x-3 gap-y-2 sm:grid-cols-[5.3rem_minmax(4.5rem,5.75rem)_minmax(0,1fr)_2.5rem]">
        <BankLogoMark
          bankName={account.bankName}
          className="h-11 w-[4.6rem] justify-start rounded-none bg-transparent"
          imageClassName="max-h-8 max-w-[4.45rem]"
          sizes="74px"
        />

        <div className="min-w-0">
          <p className="text-[0.5rem] font-black uppercase leading-none tracking-[0.15em] text-black/42">Bank</p>
          <p className="mt-1.5 truncate font-headline text-[1.12rem] font-black leading-none text-[#151a17]">
            {bankDisplayName}
          </p>
        </div>

        <div className="col-span-2 min-w-0 sm:col-span-1">
          <p className="text-[0.5rem] font-black uppercase leading-none tracking-[0.15em] text-black/42">
            Nomor Rekening
          </p>
          <p className="mt-1.5 whitespace-nowrap font-headline text-[1.24rem] font-black leading-[1.12] tracking-[0.035em] text-primary">
            {account.accountNumber}
          </p>
        </div>

        <div className="row-start-1 flex justify-end sm:row-auto">
          <AccountCopyButton value={account.accountNumber} />
        </div>
      </div>

      <div className="mt-3 border-t border-[#eadfbe] pt-3">
        <p className="text-[0.5rem] font-black uppercase leading-none tracking-[0.15em] text-black/42">Atas Nama</p>
        <p className="mt-1.5 whitespace-normal break-words text-[0.86rem] font-black uppercase leading-5 tracking-[0.01em] text-[#202421]">
          {account.accountHolder}
        </p>
      </div>
    </div>
  );
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
  if (isBuyerWinnerAnnouncementTransaction(transaction)) return "Lihat detail";
  if (transaction.status === "LUNAS") return "Selesaikan pembelian";
  if (transaction.status === "DITOLAK_BUKTI") return "Lihat detail";
  if (transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG") return "Lihat detail";
  return "Bayar sekarang";
}

function getDashboardActionDescription(transaction: BuyerTransaction) {
  if (transaction.status === "LUNAS") {
    return "Pembayaran sudah diverifikasi. Tutup pembelian setelah barang dan nota diterima.";
  }

  if (transaction.status === "DITOLAK_BUKTI") {
    return "Admin unit menolak bukti pembayaran. Transaksi lama sudah dibatalkan.";
  }

  if (transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG") {
    return "Pembayaran dilakukan langsung di unit. Simpan nomor pengajuan saat datang ke loket.";
  }

  return transaction.kind === "VICKREY_WIN"
    ? "Selesaikan pembayaran sebelum batas waktu agar transaksi tetap aktif."
    : "Lanjutkan dari halaman detail transaksi sesuai instruksi pembayaran.";
}

function isDashboardActiveTransaction(transaction: BuyerTransaction) {
  return !["SELESAI", "GAGAL", "DITOLAK_BUKTI"].includes(transaction.status);
}

function isDashboardPaymentWaiting(transaction: BuyerTransaction) {
  return (
    transaction.kind === "VICKREY_WIN" &&
    ["MENUNGGU_PEMBAYARAN", "MENUNGGU_KONFIRMASI_LANGSUNG"].includes(transaction.status)
  );
}

function isDashboardActiveBid(bid: BuyerBid) {
  return bid.status === "BID_TERCATAT" || bid.status === "MENUNGGU_HASIL";
}

function getUrgentTransactionRank(transaction: BuyerTransaction) {
  if (isDashboardPaymentWaiting(transaction)) return 0;
  return 9;
}

function getUrgentDashboardCopy(transaction: BuyerTransaction) {
  if (transaction.kind === "VICKREY_WIN" && isDashboardPaymentWaiting(transaction)) {
    return {
      eyebrow: "Pemenang Lelang Tertutup",
      title: `Anda memenangkan lelang ${transaction.title}.`,
      detail: `Bayar ${currency.format(transaction.amount)} sebelum batas waktu berakhir.`,
      tone: "danger" as const
    };
  }

  if (transaction.status === "DITOLAK_BUKTI") {
    return {
      eyebrow: "Transaksi dibatalkan",
      title: `Bukti pembayaran untuk ${transaction.title} ditolak.`,
      detail: "Transaksi lama sudah dibatalkan dan barang dapat dibeli kembali dari katalog jika masih tersedia.",
      tone: "danger" as const
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
          loading="eager"
          sizes="64px"
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

function PaymentProgressRail({ buyer, transaction }: { buyer: BuyerSessionUser; transaction: BuyerTransaction }) {
  const isTransfer = transaction.method === "TRANSFER_BANK";
  const isMidtrans = transaction.method === "MIDTRANS";
  const isVickreyWin = transaction.kind === "VICKREY_WIN";
  const isFixedPrice = transaction.kind === "FIXED_PRICE";
  const isFailedVickreyPayment = isVickreyWin && transaction.status === "GAGAL";
  const isFailedFixedPricePayment = isFixedPrice && transaction.status === "GAGAL";
  const hasFailedWorkflow =
    transaction.status === "DITOLAK_BUKTI" || isFailedVickreyPayment || isFailedFixedPricePayment;
  const completed = transaction.status === "SELESAI";
  const paymentVerified = transaction.status === "LUNAS";
  const handoverProofUploaded = Boolean(transaction.handoverProof);
  const awaitingHandoverProof = paymentVerified && !handoverProofUploaded;
  const awaitingBuyerConfirmation = paymentVerified && handoverProofUploaded;
  const currentStep = paymentVerified || completed ? 2 : transaction.status === "BUKTI_DIUNGGAH" || hasFailedWorkflow ? 1 : 0;
  const rejectionReason =
    transaction.rejectionReason ?? "Bukti pembayaran tidak disetujui admin unit.";
  const paymentDetail = isFailedVickreyPayment
    ? "Batas pembayaran 24 jam sudah terlewati tanpa pembayaran langsung di unit, sehingga transaksi pemenang ditutup sebagai gagal."
    : isFailedFixedPricePayment
      ? FIXED_PRICE_PAYMENT_FAILURE_COPY.paymentDetail
    : isMidtrans
      ? paymentVerified
        ? "Pembayaran telah diterima dan tercatat pada transaksi ini."
        : "Selesaikan pembayaran melalui transfer. Status akan diperbarui setelah dana diterima."
      : isTransfer
      ? transaction.status === "DITOLAK_BUKTI"
        ? "Pembayaran sudah dicoba, tetapi bukti transfer ditolak admin unit sehingga transaksi ini dibatalkan."
        : isVickreyWin
          ? "Transfer sesuai nominal, lalu unggah bukti pembayaran sebelum batas waktu habis."
          : "Transfer sesuai nominal, lalu unggah bukti pembayaran dari halaman ini."
      : isVickreyWin
        ? `Datang ke ${transaction.unit} untuk melakukan pembayaran secara langsung.`
        : `Datang ke ${transaction.unit}, bawa nomor ${transaction.applicationNumber}, lalu selesaikan pembayaran di loket.`;
  const verificationDetail = isFailedVickreyPayment
    ? "Pembayaran gagal karena pemenang lelang tidak menyelesaikan pembayaran dalam waktu 24 jam. Riwayat bid tetap tersimpan dan transaksi tidak lagi berada dalam antrean pembayaran aktif."
    : isFailedFixedPricePayment
      ? FIXED_PRICE_PAYMENT_FAILURE_COPY.verificationDetail
    : isMidtrans
      ? paymentVerified
        ? "Pembayaran telah dikonfirmasi sistem sebelum transaksi dinyatakan lunas."
        : "Pembayaran akan diperiksa setelah dana diterima sebelum transaksi dinyatakan lunas."
      : isTransfer
      ? transaction.status === "DITOLAK_BUKTI"
        ? `Bukti pembayaran ditolak. Alasan: ${rejectionReason}. Transaksi dibatalkan dan barang dapat dibeli kembali dari katalog jika masih tersedia.`
        : "Admin unit memeriksa nominal, rekening tujuan, referensi, dan kejelasan bukti transfer."
      : isVickreyWin
        ? "Admin unit mengonfirmasi pembayaran setelah dana diterima di unit terkait."
        : "Admin unit mengonfirmasi pembayaran langsung setelah dana diterima di loket.";
  const completionDetail =
    completed
      ? "Pembelian sudah ditutup buyer. Nota tersimpan sebagai bukti transaksi."
      : awaitingHandoverProof
        ? "Pembayaran sudah diverifikasi. Admin unit perlu mengunggah bukti serah-terima barang."
      : awaitingBuyerConfirmation
        ? "Bukti serah-terima barang sudah tersedia. Konfirmasikan pembelian setelah barang diterima."
      : isMidtrans
        ? "Tahap ini aktif setelah pembayaran berhasil dikonfirmasi."
        : "Tahap ini aktif setelah admin memverifikasi pembayaran.";
  const steps: PaymentWorkflowStep[] = [
    {
      id: "payment",
      label: "Melakukan Pembayaran",
      headline: isFailedFixedPricePayment
        ? "Pembayaran Harga Tetap"
        : isMidtrans
          ? "Bayar melalui Transfer"
          : isTransfer
            ? "Transfer Sesuai Nominal"
            : isVickreyWin
              ? "Bayar Lelang Tertutup di Unit"
              : "Bayar di Loket Unit",
      detail: paymentDetail,
      meta: isFailedFixedPricePayment
        ? "Batas waktu berakhir"
        : isMidtrans
          ? "Transfer"
          : isTransfer
            ? "Transfer + upload bukti"
            : isVickreyWin
              ? "Lelang Tertutup bayar di unit terkait"
              : "Bayar di loket",
      actor: `Buyer: ${buyer.name}`,
      occurredAt: transaction.createdAt,
      icon: Landmark
    },
    {
      id: "verification",
      label: hasFailedWorkflow
        ? isFailedVickreyPayment
          ? "Pembayaran Gagal"
          : isFailedFixedPricePayment
            ? "Pembayaran Gagal"
          : "Verifikasi Gagal"
        : "Verifikasi",
      headline: hasFailedWorkflow
        ? isFailedVickreyPayment
          ? "Alur Pembayaran Gagal"
          : isFailedFixedPricePayment
            ? "Pembayaran Harga Tetap Gagal"
          : "Alur Verifikasi Gagal"
        : isMidtrans
          ? paymentVerified
            ? "Pembayaran Terkonfirmasi"
            : "Menunggu Konfirmasi Pembayaran"
          : "Menunggu Verifikasi Admin",
      detail: verificationDetail,
      meta: hasFailedWorkflow
        ? isFailedVickreyPayment
          ? "Melewati 24 jam"
          : isFailedFixedPricePayment
            ? "Batas waktu berakhir"
          : "Bukti ditolak admin unit"
        : isMidtrans
          ? paymentVerified
            ? "Sudah dikonfirmasi sistem"
            : "Status diperbarui setelah dana diterima"
          : "Aksi admin unit",
      actor: isFailedVickreyPayment || isFailedFixedPricePayment || (isMidtrans && paymentVerified)
        ? "Sistem"
        : transaction.verifiedBy
          ? `Admin: ${transaction.verifiedBy}`
          : undefined,
      occurredAt: transaction.verifiedAt || (hasFailedWorkflow ? transaction.deadline : undefined),
      icon: ShieldCheck,
      tone: hasFailedWorkflow ? "danger" : "default"
    },
    {
      id: "completion",
      label: "Serah-Terima & Konfirmasi Buyer",
      headline: completed
        ? "Pembelian Selesai"
        : awaitingHandoverProof
          ? "Menunggu Bukti Serah-Terima dari Admin Unit"
          : awaitingBuyerConfirmation
            ? "Menunggu Konfirmasi Buyer"
            : "Serah-Terima & Konfirmasi Buyer",
      detail: completionDetail,
      meta: awaitingHandoverProof ? "Aksi admin unit" : "Aksi akhir buyer",
      actor: transaction.handoverProof
        ? completed
          ? transaction.completionSource === "AUTO_HANDOVER_GRACE"
            ? "Sistem"
            : `Buyer: ${buyer.name}`
          : `Admin: ${transaction.handoverProof.uploadedBy}`
        : awaitingHandoverProof
          ? "Admin Unit"
          : undefined,
      occurredAt: completed ? transaction.completedAt : transaction.handoverProof?.uploadedAt,
      icon: CheckCircle2
    }
  ];

  return (
    <PaymentWorkflowRail
      completed={completed}
      currentStep={currentStep}
      steps={steps}
      title="Alur Pembayaran"
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
  if (transaction.kind === "VICKREY_WIN") {
    return [
      "Tunjukkan nota ini beserta kartu identitas asli (KTP) saat pengambilan barang.",
      `Pengambilan barang dilakukan di unit ${transaction.unit}.`,
      "Pembayaran hasil lelang sudah diverifikasi admin unit dan nota ini sah sebagai bukti pembelian.",
      "Simpan nota ini untuk keperluan administrasi atau pengambilan barang."
    ];
  }

  return [
    "Tunjukkan nota ini beserta kartu identitas asli (KTP) saat pengambilan barang.",
    `Pengambilan barang dilakukan di unit ${transaction.unit}.`,
    transaction.method === "MIDTRANS"
      ? "Pembayaran telah dikonfirmasi sistem."
      : transaction.method === "TRANSFER_BANK"
        ? "Pembayaran transfer telah diverifikasi admin unit."
        : "Pembayaran langsung telah dikonfirmasi admin unit.",
    "Nota ini sah dan berlaku sebagai bukti pembelian."
  ];
}

function getReceiptPaymentMethodLabel(transaction: BuyerTransaction) {
  if (transaction.method === "MIDTRANS" || transaction.method === "TRANSFER_BANK") {
    return "Transfer";
  }

  return transaction.kind === "VICKREY_WIN" ? "Langsung di unit" : "Bayar Langsung";
}

function getReceiptMarketingTypeLabel(transaction: BuyerTransaction) {
  return transaction.kind === "VICKREY_WIN" ? "Lelang" : "Harga Tetap";
}

function getReceiptFooterText(transaction: BuyerTransaction) {
  if (transaction.kind === "VICKREY_WIN") {
    return "Dokumen ini diterbitkan oleh admin unit Ruang Agunan.";
  }

  return undefined;
}

function getReceiptPrintDocumentClassName(transaction: BuyerTransaction) {
  if (transaction.kind === "VICKREY_WIN") {
    return "vickrey-receipt-print-document hidden bg-white text-[#10251c] print:block";
  }

  return undefined;
}

function getReceiptPrintDocumentTestId(transaction: BuyerTransaction) {
  if (transaction.kind === "VICKREY_WIN") {
    return "vickrey-receipt-print-document";
  }

  return undefined;
}

function getBuyerTransactionReceiptPrintRootId(transaction: BuyerTransaction, suffix: string) {
  return `buyer-receipt-print-root-${transaction.id.replace(/[^a-zA-Z0-9_-]/g, "-")}-${suffix}`;
}

function getReceiptHandoverLockMessage(transaction: BuyerTransaction) {
  return transaction.handoverProof
    ? null
    : "Nota belum tersedia. Admin unit perlu mengunggah bukti serah-terima barang fisik terlebih dahulu.";
}

function BuyerTransactionInlineReceiptPrint({
  buyer,
  buttonClassName,
  disabledReason,
  label,
  rootSuffix,
  showDisabledReason,
  transaction
}: {
  buyer: BuyerSessionUser;
  buttonClassName: string;
  disabledReason?: string | null;
  label?: string;
  rootSuffix: string;
  showDisabledReason?: boolean;
  transaction: BuyerTransaction;
}) {
  const isCompleted = transaction.status === "SELESAI";
  const paymentMethodLabel = getReceiptPaymentMethodLabel(transaction);
  const receiptDisabledReason = disabledReason ?? getReceiptHandoverLockMessage(transaction);

  return (
    <TransactionReceiptInlinePrint
      buttonClassName={buttonClassName}
      disabledReason={receiptDisabledReason}
      documentClassName={getReceiptPrintDocumentClassName(transaction)}
      documentTestId={getReceiptPrintDocumentTestId(transaction)}
      label={label}
      rootId={getBuyerTransactionReceiptPrintRootId(transaction, rootSuffix)}
      showDisabledReason={showDisabledReason}
    >
      <TransactionReceiptDocument
        buyerEmail={buyer.email}
        buyerName={buyer.name}
        buyerPhone={getBuyerPhone(buyer, "-")}
        extraMeta={[
          {
            label: "Jenis transaksi",
            value: getReceiptMarketingTypeLabel(transaction)
          }
        ]}
        footerText={getReceiptFooterText(transaction)}
        handoverByName={transaction.handoverProof?.uploadedBy}
        imageUrl={transaction.imageUrl}
        itemSubtitle={paymentMethodLabel}
        itemTitle={transaction.title}
        noteNumber={transaction.receiptNumber ?? transaction.id}
        paymentMethodLabel={paymentMethodLabel}
        statusLabel={isCompleted ? getBuyerTransactionCompletionLabel(transaction) : "Terverifikasi admin"}
        subtotal={transaction.amount}
        terms={getReceiptTerms(transaction)}
        total={transaction.amount}
        transactionId={transaction.id}
        unitAddress={transaction.unitAddress}
        unitName={transaction.unit}
        receiverName={buyer.name}
        verifiedByName={transaction.verifiedBy}
        verifiedAt={transaction.verifiedAt}
        outputLayout
      />
    </TransactionReceiptInlinePrint>
  );
}

function getBuyerTransactionCompletionLabel(transaction: BuyerTransaction) {
  return transaction.completionSource === "AUTO_HANDOVER_GRACE" ? "Selesai otomatis" : "Selesai oleh buyer";
}

function isTransactionCompletionFinalized(transaction: BuyerTransaction) {
  return transaction.status === "SELESAI" && Boolean(transaction.completedAt);
}

function HandoverAutoCompleteNotice({ transaction }: { transaction: BuyerTransaction }) {
  if (transaction.status !== "LUNAS" || !transaction.handoverProof) {
    return null;
  }

  return transaction.handoverAutoCompleteAt ? (
    <p className="rounded-[1rem] border border-primary/15 bg-primary/[0.04] px-4 py-3 text-sm font-semibold leading-6 text-primary">
      Jika buyer tidak menekan Pembelian Selesai, sistem akan menyelesaikan otomatis pada {transaction.handoverAutoCompleteAt}.
    </p>
  ) : null;
}

export function UserDashboardPage({
  buyer,
  data,
  serverNow
}: {
  buyer: BuyerSessionUser;
  data: {
    summary: BuyerSummary;
    transactions: BuyerTransaction[];
    bids: BuyerBid[];
    blacklistUntilAt?: string | null;
    violations?: BuyerDashboardViolation[];
  };
  serverNow?: string;
}) {
  const { summary, transactions, bids, blacklistUntilAt = null, violations = [] } = data;
  const activeTransactions = transactions.filter(isDashboardActiveTransaction);
  const paymentWaitingTransactions = transactions.filter(isDashboardPaymentWaiting);
  const activeBidCount = bids.filter(isDashboardActiveBid).length;
  const urgentTransaction =
    [...paymentWaitingTransactions].sort(
      (first, second) => getUrgentTransactionRank(first) - getUrgentTransactionRank(second)
    )[0] ?? null;
  const urgentCopy = urgentTransaction ? getUrgentDashboardCopy(urgentTransaction) : null;
  const restrictionViolationCount = summary.blacklist.violations ?? 0;
  const violationCount = Math.max(violations.length, restrictionViolationCount);
  const restrictionLevel = summary.blacklist.active
    ? Math.min(Math.max(restrictionViolationCount, 1), 3)
    : 0;
  const latestViolation = violations[0] ?? null;
  const latestViolationLevel = latestViolation?.violationLevel
    ? Math.min(Math.max(latestViolation.violationLevel, 1), 3)
    : restrictionLevel;
  const [latestViolationDate, latestViolationTime = ""] = latestViolation?.occurredAtLabel
    .split(",")
    .map((value) => value.trim()) ?? ["", ""];
  const restrictionTone =
    restrictionLevel >= 3
      ? {
          border: "border-red-200",
          icon: "bg-red-50 text-[#b91c1c]",
          soft: "bg-red-50/55",
          text: "text-[#991b1b]"
        }
      : restrictionLevel === 2
        ? {
            border: "border-orange-200",
            icon: "bg-orange-50 text-[#dc4c18]",
            soft: "bg-orange-50/55",
            text: "text-[#b9380b]"
          }
        : restrictionLevel === 1
          ? {
              border: "border-amber-200",
              icon: "bg-amber-50 text-[#a86200]",
              soft: "bg-amber-50/55",
              text: "text-[#8a5200]"
            }
          : {
              border: "border-emerald-200",
              icon: "bg-emerald-50 text-[#007a4d]",
              soft: "bg-emerald-50/55",
              text: "text-[#00633e]"
            };
  const historyTone =
    latestViolationLevel >= 3
      ? {
          accent: "bg-[#b91c1c]",
          badge: "bg-[#b91c1c] text-white",
          border: "border-red-200",
          icon: "bg-red-50 text-[#b91c1c]",
          ring: "border-[#b91c1c] text-[#b91c1c]"
        }
      : latestViolationLevel === 2
        ? {
            accent: "bg-[#dc4c18]",
            badge: "bg-[#dc4c18] text-white",
            border: "border-orange-200",
            icon: "bg-orange-50 text-[#dc4c18]",
            ring: "border-[#dc4c18] text-[#dc4c18]"
          }
        : latestViolationLevel === 1
          ? {
              accent: "bg-[#c97900]",
              badge: "bg-[#c97900] text-white",
              border: "border-amber-200",
              icon: "bg-amber-50 text-[#a86200]",
              ring: "border-[#c97900] text-[#a86200]"
            }
          : {
              accent: "bg-[#007a4d]",
              badge: "bg-emerald-50 text-[#00633e]",
              border: "border-emerald-200",
              icon: "bg-emerald-50 text-[#007a4d]",
              ring: "border-[#007a4d] text-[#00633e]"
            };
  const importantNotes = [
    {
      icon: Clock3,
      title: "Selesaikan pembayaran tepat waktu",
      detail: "Ikuti instruksi pembayaran sebelum batas waktu agar transaksi tetap aman dan tidak masuk arsip gagal."
    },
    {
      icon: Gavel,
      title: "Pantau jadwal lelang",
      detail: "Bid Lelang Tertutup tetap tertutup sampai deadline. Hasil dan instruksi pembayaran tampil otomatis setelah sesi selesai."
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
          fetchPriority="high"
          sizes="(max-width: 768px) 100vw, 1280px"
          src={BUYER_HOME_HERO_IMAGE}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,249,0.98)_0%,rgba(255,255,249,0.86)_42%,rgba(255,255,249,0.18)_78%)]" />
        <div className="relative flex min-h-[340px] max-w-3xl flex-col justify-center px-6 py-8 md:min-h-[380px] md:px-10">
          <WelcomeBrushBadge className="mb-4" />
          <h1 className="mt-2 font-sans text-4xl font-black tracking-tight text-primary md:text-5xl">
            Halo, {buyer.name}
          </h1>
          <p className="mt-4 max-w-xl font-sans text-sm leading-7 text-muted-foreground md:text-base">
            Kami siap membantu Anda menemukan aset terbaik, memantau pembayaran, dan membuka nota
            transaksi dari satu ruang pembeli yang lebih ringkas.
          </p>
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
              <Link
                className="w-full md:w-auto"
                href={getBuyerTransactionHref(urgentTransaction)}
              >
                <Button className="w-full md:min-w-44">
                  {getDashboardActionLabel(urgentTransaction)}
                  <ExternalLink className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        <article className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-[0_8px_12px_-10px_rgba(8,69,50,0.28)]">
          <div className="flex h-full flex-col p-5 md:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="grid size-20 shrink-0 place-items-center rounded-full bg-emerald-50 text-[#007a4d] ring-1 ring-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]">
                <ShieldCheck className="size-10" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <h2 className="font-headline text-xl font-black text-[#00633e] md:text-2xl">
                  Indeks Kesehatan Akun
                </h2>
                <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-[#00633e]">
                  <CheckCircle2 className="size-4" />
                  Akun {summary.verificationStatus}
                </span>
              </div>
            </div>

            <div className="my-6 h-px bg-black/[0.07]" />

            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-[#007a4d] ring-1 ring-emerald-100">
                <Mail className="size-5" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="break-all text-base font-black text-[#101923] md:text-lg">
                  {buyer.email}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#506079]">
                  <CalendarDays className="size-4 shrink-0 text-[#007a4d]" />
                  Member sejak {summary.memberSince}
                </p>
              </div>
            </div>

            <div
              data-restriction-panel="true"
              className={cn(
                "mt-7 overflow-hidden rounded-xl border p-4 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] md:p-5",
                restrictionTone.border,
                restrictionTone.soft
              )}
            >
              <div
                className={cn(
                  "grid gap-4",
                  summary.blacklist.active
                    ? "sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center lg:grid-cols-[auto_minmax(0,1fr)_minmax(13.5rem,15rem)]"
                    : "sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center"
                )}
              >
                <span
                  className={cn(
                    "grid size-14 shrink-0 place-items-center rounded-full bg-white ring-1 ring-black/[0.06]",
                    restrictionTone.icon
                  )}
                >
                  {summary.blacklist.active ? (
                    <ShieldAlert className="size-7" strokeWidth={1.8} />
                  ) : (
                    <ShieldCheck className="size-7" strokeWidth={1.8} />
                  )}
                </span>
                <div className="min-w-0">
                  <h3 className={cn("font-headline text-base font-black", restrictionTone.text)}>
                    {summary.blacklist.active ? (
                      <>Hak Akses: Terbatas Sementara (Level {restrictionLevel})</>
                    ) : (
                      "Hak Akses: Aktif"
                    )}
                  </h3>
                  <p className="mt-2 max-w-[62ch] text-sm leading-6 text-[#4f5f73]">
                    {summary.blacklist.active
                      ? `Akun Anda sedang dibatasi pada fitur tertentu sesuai kebijakan yang berlaku. Akses dipulihkan otomatis pada ${summary.blacklist.until}.`
                      : summary.blacklist.reason}
                  </p>
                </div>
                {summary.blacklist.active ? (
                  <RestrictionCountdownTiles
                    className="sm:col-span-2 lg:col-span-1"
                    level={restrictionLevel}
                    serverNow={serverNow}
                    targetAt={blacklistUntilAt}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-[0_8px_12px_-10px_rgba(8,69,50,0.28)]">
          <div className="flex h-full flex-col p-5 md:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className={cn("grid size-14 shrink-0 place-items-center rounded-xl", historyTone.icon)}>
                  <ClipboardCheck className="size-7" strokeWidth={1.8} />
                </span>
                <h2 className="font-headline text-xl font-black text-[#00633e] md:text-2xl">
                  Riwayat Pelanggaran
                </h2>
              </div>
              <Link
                className="group inline-flex items-center gap-2 self-start text-sm font-bold text-[#00633e] transition duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-[#004a23] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 sm:self-auto"
                href="/pelanggaran"
              >
                Lihat detail riwayat
                <ExternalLink className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <div className="my-6 h-px bg-black/[0.07]" />

            <div className="flex flex-col gap-5 rounded-xl bg-[#fafbfa] p-5 ring-1 ring-black/[0.06] sm:flex-row sm:items-center md:p-6">
              <span
                className={cn(
                  "grid size-24 shrink-0 place-items-center rounded-full border-[3px] bg-white font-headline text-4xl font-black",
                  historyTone.ring
                )}
              >
                {violationCount}
              </span>
              <div>
                <p className="font-headline text-base font-black text-[#101923]">
                  Total Kasus Terhitung
                </p>
                <p className="mt-2 max-w-[48ch] text-sm leading-6 text-[#506079]">
                  Pelanggaran pembayaran yang memenuhi aturan akumulasi level dan tercatat pada akun Anda.
                </p>
              </div>
            </div>

            {latestViolation ? (
              <div
                className={cn(
                  "relative mt-5 overflow-hidden rounded-xl border bg-white p-4 pl-6",
                  historyTone.border
                )}
              >
                <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1.5", historyTone.accent)} />
                <div className="grid gap-4 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-center lg:grid-cols-[5.5rem_minmax(0,1fr)_auto]">
                  <div className="relative h-20 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-black/[0.06]">
                    {latestViolation.imageUrl ? (
                      <Image
                        alt={`Foto ${latestViolation.itemName}`}
                        className="object-cover"
                        fill
                        loading="eager"
                        sizes="88px"
                        src={latestViolation.imageUrl}
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-[#8b968e]">
                        <ImageIcon className="size-8" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-headline text-base font-black text-[#101923] md:text-lg">
                      {latestViolation.itemName}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#506079]">
                      {latestViolation.note}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[#506079]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-4 text-[#435476]" />
                        {latestViolationDate}
                      </span>
                      {latestViolationTime ? (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock className="size-4 text-[#435476]" />
                          {latestViolationTime}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5">
                        <Landmark className="size-4 text-[#435476]" />
                        {latestViolation.unitName}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-black sm:col-start-2 sm:justify-self-start lg:col-start-auto lg:justify-self-end",
                      historyTone.badge
                    )}
                  >
                    Level {latestViolationLevel}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex flex-1 items-center gap-4 rounded-xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#007a4d] ring-1 ring-emerald-100">
                  <CheckCircle2 className="size-5" />
                </span>
                <div>
                  <p className="font-headline text-base font-black text-[#101923]">Tidak ada pelanggaran tercatat</p>
                  <p className="mt-1 text-sm leading-6 text-[#506079]">
                    Akun berada dalam kondisi baik dan seluruh fitur tersedia sesuai ketentuan.
                  </p>
                </div>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="relative overflow-hidden rounded-[1.9rem] border border-primary/10 bg-[#faf9ef] p-5 shadow-[0_24px_70px_-48px_rgba(8,69,50,0.42)] md:p-6">
        <Image
          alt=""
          aria-hidden="true"
          className="object-cover object-right opacity-80"
          fill
          loading="eager"
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
              Ringkasan hal yang perlu Anda ingat saat mengikuti harga tetap, Lelang Tertutup, dan pembayaran di Ruang Agunan.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.12fr_0.94fr_0.94fr]">
            {importantNotes.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="rounded-[1.45rem] border border-primary/10 bg-white/90 p-5 shadow-[0_18px_48px_-38px_rgba(8,69,50,0.38)] ring-1 ring-white/60"
                  key={item.title}
                >
                  <span className="grid size-11 place-items-center rounded-[1rem] bg-primary/10 text-primary">
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
  const hasPendingMidtransPayment = transactions.some(
    (transaction) => transaction.method === "MIDTRANS" && transaction.status === "MENUNGGU_PEMBAYARAN"
  );

  return (
    <>
      <StatusSyncRefresh enabled={hasPendingMidtransPayment} />
      <TransactionsWorkspace
        bids={bids}
        highlightedBidLotId={highlightedBidLotId}
        initialTab={initialTab}
        transactions={transactions}
      />
    </>
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

export function AuctionLoserPage({
  bid: loadedBid,
  recommendations,
}: {
  bid?: BuyerBid | null;
  recommendations: Lot[];
}) {
  const bid = loadedBid ?? null;

  if (!bid) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">Riwayat bid tidak ditemukan.</p>
      </Card>
    );
  }

  return <AuctionLoserPageContent bid={bid} recommendations={recommendations} />;
}

function getFailedPaymentViolationAudit(totalViolations: number | null | undefined) {
  const policy = getBlacklistRestrictionPolicy(Math.max(1, Number(totalViolations ?? 1)));
  const duration = `${policy.durationDays} hari`;

  if (policy.level === 1) {
    return {
      title: "Level 1 — Pelanggaran Pembayaran",
      description: `Pembayaran tidak diselesaikan dalam 24 jam. Selama ${duration}, Anda tidak dapat mengikuti Lelang Tertutup. Anda tetap dapat membeli barang Harga Tetap seperti biasa.`
    };
  }

  if (policy.level === 2) {
    return {
      title: "Level 2 — Pelanggaran Pembayaran",
      description: `Akun dibatasi ${duration} untuk mengikuti Lelang Tertutup dan membeli barang Harga Tetap.`
    };
  }

  return {
    title: "Level 3 — Pelanggaran Pembayaran",
    description: `Akumulasi pelanggaran pembayaran mencapai Level 3. Akun dibatasi ${duration} dan akses masuk ditangguhkan.`
  };
}

function VickreyPaymentFailedDetail({
  buyer,
  buyerStatus,
  transaction
}: {
  buyer: BuyerSessionUser;
  buyerStatus?: BuyerProfileStatus;
  transaction: BuyerTransaction;
}) {
  const sessionDate = transaction.createdAt.split(",")[0]?.trim() || transaction.createdAt;
  const failureReference = `TRX-FAIL-${transaction.applicationNumber || transaction.id}`;
  const paymentMethodLabel = getReceiptPaymentMethodLabel(transaction);
  const violationAudit = getFailedPaymentViolationAudit(
    transaction.violationLevel ?? buyerStatus?.blacklist.totalViolations
  );

  return (
    <div className="flex flex-col gap-4 bg-white md:gap-5">
      <div className="order-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              aria-label="Kembali ke Transaksi"
              className="interactive-tap grid size-10 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-primary/5 hover:text-primary"
              href="/transaksi"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <h1 className="font-headline text-2xl font-black tracking-tight text-foreground md:text-[1.7rem]">
              Detail Transaksi Lelang Gagal
            </h1>
          </div>
        </div>
      </div>

      <div className="order-2">
        <PaymentProgressRail buyer={buyer} transaction={transaction} />
      </div>

      <Card className="order-3 overflow-hidden rounded-[1rem] border border-border/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <CardContent className="grid p-0 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex min-h-[150px] flex-col items-center justify-center bg-[#d6060d] p-6 text-center text-white md:min-h-[166px]">
            <span className="grid size-16 place-items-center rounded-full border-[3px] border-white">
              <X className="size-10" strokeWidth={2.4} />
            </span>
            <p className="mt-5 font-headline text-2xl font-black uppercase tracking-wide">Gagal</p>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.92fr)] lg:items-center lg:p-8">
            <div className="min-w-0">
              <h2 className="font-headline text-2xl font-black tracking-tight text-foreground">
                Batas Waktu Pelunasan Habis
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Transaksi ini dinyatakan gagal secara otomatis oleh sistem karena pemenang tidak menyelesaikan
                pelunasan dalam batas waktu 24 jam.
              </p>
            </div>

            <div className="grid rounded-xl border border-border/70 bg-white sm:grid-cols-3 sm:divide-x sm:divide-border/70 lg:border-0">
              <AuctionPaymentMetric label="Nominal Lelang" value={currency.format(transaction.amount)} />
              <AuctionPaymentMetric label="Unit Pelaksana" value={transaction.unit} />
              <AuctionPaymentMetric label="Tanggal Sesi" value={sessionDate} />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="order-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.98fr)]">
        <Card className="rounded-[1rem] border border-border/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <CardContent className="p-6 md:p-7">
            <CardTitle className="text-xl">Informasi Barang & Pemenang</CardTitle>
            <div className="mt-4 grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
              {transaction.imageUrl ? (
                <Image
                  alt={`Foto barang ${transaction.title}`}
                  className="h-48 w-full rounded-lg bg-[#eef0ed] object-cover md:h-52"
                  height={260}
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, 220px"
                  src={transaction.imageUrl}
                  width={320}
                />
              ) : (
                <div className="grid h-48 w-full place-items-center rounded-lg bg-[#eef0ed] text-primary md:h-52">
                  <ShoppingBag className="size-10" />
                </div>
              )}

              <div className="min-w-0">
                <h2 className="font-headline text-2xl font-black tracking-tight text-foreground">
                  {transaction.title}
                </h2>
                <div className="mt-4 space-y-4">
                  <AuctionPaymentInfoRow label="Nama Pembeli" value={buyer.name} />
                  <AuctionPaymentInfoRow label="Email" value={buyer.email} />
                  <AuctionPaymentInfoRow label="Metode Bayar" value={paymentMethodLabel} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1rem] border border-border/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <CardContent className="p-6 md:p-7">
            <div className="flex items-center gap-3">
              <ReceiptText className="size-5 text-foreground" />
              <CardTitle className="text-xl">Log Audit Sistem</CardTitle>
            </div>
            <div className="my-5 h-px bg-border" />

            <div className="space-y-4">
              <AuctionPaymentAuditRow label="Dibuat Pada" value={transaction.createdAt} />
              <AuctionPaymentAuditRow label="Dibuat Oleh" value="System (Auto)" />
              <AuctionPaymentAuditRow
                label="Referensi Transaksi"
                value={
                  <span className="block rounded-md border border-border bg-surface-low/40 px-3 py-2 font-medium text-foreground">
                    {failureReference}
                  </span>
                }
              />
              <AuctionPaymentAuditRow
                label="Status Pelanggaran"
                value={
                  <span className="block rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-[#9f1d24]">
                    <span className="block font-bold">{violationAudit.title}</span>
                    <span className="mt-1 block text-sm font-medium leading-5">{violationAudit.description}</span>
                  </span>
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AuctionPaymentMetric({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-sm leading-6 text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-base font-black text-foreground md:text-lg">{value}</p>
    </div>
  );
}

function AuctionPaymentInfoRow({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words font-medium text-foreground">{value}</span>
    </div>
  );
}

function AuctionPaymentAuditRow({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid gap-2 text-sm sm:grid-cols-[190px_minmax(0,1fr)] sm:items-start sm:gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-foreground">{value}</span>
    </div>
  );
}

function VickreyPendingPaymentDetail({
  buyer,
  transaction
}: {
  buyer: BuyerSessionUser;
  transaction: BuyerTransaction;
}) {
  return (
    <div className="space-y-7 bg-white md:space-y-8">
      <StatusSyncRefresh enabled />

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
              Selesaikan pembayaran hasil lelang, pantau verifikasi admin, dan buka nota setelah transaksi selesai.
            </p>
          </div>
          <Link className="font-bold text-primary hover:text-primary/80" href={`/katalog/${transaction.lotId}?source=payment`}>
            Kembali ke Detail Barang
          </Link>
        </div>

        <PaymentProgressRail buyer={buyer} transaction={transaction} />
      </section>

      <section
        aria-label="Status segera bayar"
        className="grid overflow-hidden rounded-[1rem] border border-[#edb316] bg-white shadow-[0_20px_52px_-38px_rgba(132,89,0,0.46)] lg:grid-cols-[200px_minmax(0,1fr)]"
      >
        <div className="relative flex min-h-[132px] flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f4a900_0%,#ffc20b_60%,#f0a400_100%)] px-4 py-4 text-center text-white">
          <span aria-hidden="true" className="absolute -bottom-10 -right-8 size-36 rotate-12 rounded-[2.2rem] border border-white/15" />
          <span className="relative grid size-[4.5rem] place-items-center rounded-full border-4 border-white bg-white/20 shadow-[0_0_0_4px_rgba(255,255,255,0.46)]">
            <span className="grid size-[3.35rem] place-items-center rounded-full bg-white text-[#b77a00] shadow-[0_12px_28px_-18px_rgba(93,57,0,0.65)]">
              <Hourglass className="size-7" strokeWidth={2.25} />
            </span>
          </span>
          <p className="relative mt-3 font-headline text-sm font-black uppercase tracking-[0.035em]">Segera Bayar</p>
        </div>

        <div className="flex min-w-0 flex-col justify-center px-5 py-4 sm:px-6">
          <h2 className="font-headline text-lg font-black tracking-tight text-slate-950 md:text-xl">
            Segera lakukan pembayaran dalam batas waktu 24 jam
          </h2>
          <p className="mt-1 text-[0.82rem] font-medium leading-5 text-[#667085]">
            Anda adalah pemenang lelang tertutup. Lakukan pembayaran secara langsung di unit terkait sesuai nominal yang tertera.
          </p>
          <dl className="mt-3 grid gap-4 border-t border-[#edf0eb] pt-3 sm:grid-cols-3 sm:gap-0">
            <div className="min-w-0 sm:pr-5">
              <dt className="text-xs font-semibold text-[#667085]">Nominal Lelang</dt>
              <dd className="mt-1 break-words font-headline text-lg font-black tracking-tight text-slate-950 md:text-xl">
                {currency.format(transaction.amount)}
              </dd>
            </div>
            <div className="min-w-0 sm:border-l sm:border-[#e4e9e4] sm:px-5">
              <dt className="text-xs font-semibold text-[#667085]">Unit Pelaksana</dt>
              <dd className="mt-1 break-words font-headline text-lg font-black tracking-tight text-slate-950 md:text-xl">
                {transaction.unit}
              </dd>
            </div>
            <div className="min-w-0 sm:border-l sm:border-[#e4e9e4] sm:pl-5">
              <dt className="text-xs font-semibold text-[#667085]">Sisa Waktu</dt>
              <dd className="mt-1 flex items-center gap-2">
                <Clock3 className="size-4 shrink-0 text-[#dc2626]" />
                <AuctionWinnerCountdown targetAt={transaction.deadlineAt} variant="inline" />
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <section className="h-full rounded-[1rem] border border-[#dfe6e1] bg-white p-5 shadow-[0_18px_44px_-38px_rgba(8,69,50,0.32)] sm:p-6">
          <h2 className="flex items-center gap-2.5 font-headline text-xl font-black tracking-tight text-slate-950">
            <ClipboardCheck className="size-5 text-primary" />
            Informasi Barang &amp; Pemenang
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
            {transaction.imageUrl ? (
              <Image
                alt={`Foto barang ${transaction.title}`}
                className="h-[220px] w-full rounded-xl bg-[#f2f4f2] object-cover sm:h-full sm:min-h-[220px]"
                height={440}
                loading="eager"
                sizes="(max-width: 640px) 100vw, 180px"
                src={transaction.imageUrl}
                width={360}
              />
            ) : (
              <div className="grid min-h-[220px] place-items-center rounded-xl bg-[#f2f4f2] text-primary">
                <ShoppingBag className="size-9" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-headline text-xl font-black leading-snug tracking-tight text-slate-950">
                {transaction.title}
              </h3>
              <dl className="mt-5 space-y-3">
                <AuctionPaymentInfoRow label="Nama Pembeli" value={buyer.name} />
                <AuctionPaymentInfoRow label="Email" value={buyer.email} />
                <AuctionPaymentInfoRow label="Metode Bayar" value="Bayar Langsung di Unit Terkait" />
              </dl>
            </div>
          </div>
        </section>

        <section className="flex h-full flex-col rounded-[1rem] border border-[#dfe6e1] bg-white p-5 shadow-[0_18px_44px_-38px_rgba(8,69,50,0.32)] sm:p-6">
          <h2 className="flex items-center gap-2.5 font-headline text-xl font-black tracking-tight text-slate-950">
            <FileCheck2 className="size-5 text-primary" />
            Log Audit Sistem
          </h2>
          <dl className="mt-5 space-y-3">
            <AuctionPaymentAuditRow label="Dibuat Pada" value={transaction.createdAt} />
            <AuctionPaymentAuditRow label="Dibuat Oleh" value="System (Auto)" />
            <AuctionPaymentAuditRow label="Referensi Transaksi" value={transaction.id} />
          </dl>
          <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-2">
            <Button
              className="min-h-11 rounded-xl border border-[#c8d7cf] bg-[#dce8e1] text-[#71867b] shadow-none disabled:bg-[#dce8e1] disabled:text-[#71867b] disabled:opacity-100 disabled:shadow-none disabled:saturate-[0.72]"
              disabled
              type="button"
            >
              <CheckCircle2 className="size-4" />
              Pembelian Selesai
            </Button>
            <Button
              className="min-h-11 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 shadow-none disabled:opacity-100"
              disabled
              type="button"
            >
              <Printer className="size-4" />
              Cetak Nota
            </Button>
          </div>
          <p className="mt-2 text-xs font-medium leading-5 text-[#7a8492]">
            Nota tersedia setelah admin unit mengonfirmasi pembayaran Anda.
          </p>
        </section>
      </div>

      <HandoverProofCard
        audience="buyer"
        itemTitle={transaction.title}
        proof={transaction.handoverProof ?? { location: transaction.unit }}
      />
    </div>
  );
}

function VickreyPaymentSuccessDetail({
  buyer,
  settlementLockMessage,
  transaction
}: {
  buyer: BuyerSessionUser;
  settlementLockMessage: string | null;
  transaction: BuyerTransaction;
}) {
  const isCompleted = transaction.status === "SELESAI";
  const verificationTimestamp = transaction.verifiedAt ?? transaction.createdAt;
  const settlementDate =
    (transaction.verifiedAt ?? transaction.createdAt).split(",")[0]?.trim() ||
    transaction.verifiedAt ||
    transaction.createdAt;
  const successReference = `TRX-SUK-${
    transaction.applicationNumber || transaction.receiptNumber || transaction.reference || transaction.id
  }`;
  const paymentMethodLabel = getReceiptPaymentMethodLabel(transaction);
  const handoverLockMessage = transaction.handoverProof
    ? null
    : getReceiptHandoverLockMessage(transaction);
  return (
    <div className="flex flex-col gap-4 bg-white md:gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            aria-label="Kembali ke Transaksi"
            className="interactive-tap grid size-10 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-primary/5 hover:text-primary"
            href="/transaksi"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-headline text-2xl font-black tracking-tight text-foreground md:text-[1.7rem]">
            Detail Transaksi Lelang Berhasil
          </h1>
        </div>
      </div>

      <PaymentProgressRail buyer={buyer} transaction={transaction} />

      {isCompleted ? (
        <Card
          aria-label="Status transaksi selesai"
          className="overflow-hidden rounded-[1rem] border border-border/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]"
          role="region"
        >
          <CardContent className="grid p-0 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="flex min-h-[150px] flex-col items-center justify-center bg-primary p-6 text-center text-white md:min-h-[166px]">
              <span className="grid size-16 place-items-center rounded-full border-[3px] border-white">
                <CheckCircle2 className="size-10" strokeWidth={2.4} />
              </span>
              <p className="mt-5 font-headline text-2xl font-black uppercase tracking-wide">Berhasil</p>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.92fr)] lg:items-center lg:p-8">
              <div className="min-w-0">
                <h2 className="font-headline text-2xl font-black tracking-tight text-foreground">
                  Pelunasan Berhasil dalam Batas Waktu 24 Jam
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Transaksi ini berhasil diproses karena pemenang menyelesaikan pelunasan sebelum batas waktu 24 jam berakhir.
                </p>
              </div>

              <div className="grid rounded-xl border border-border/70 bg-white sm:grid-cols-3 sm:divide-x sm:divide-border/70 lg:border-0">
                <AuctionPaymentMetric label="Nominal Lelang" value={currency.format(transaction.amount)} />
                <AuctionPaymentMetric label="Unit Pelaksana" value={transaction.unit} />
                <AuctionPaymentMetric label="Tanggal Pelunasan" value={settlementDate} />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section
          aria-label="Status pembayaran terverifikasi"
          className="grid overflow-hidden rounded-[1rem] border border-[#2dbb70] bg-white shadow-[0_20px_52px_-38px_rgba(8,69,50,0.42)] lg:grid-cols-[200px_minmax(0,1fr)]"
        >
          <div className="relative flex min-h-[132px] flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#46cc7e_0%,#24b96a_60%,#0c9556_100%)] px-4 py-4 text-center text-white">
            <span aria-hidden="true" className="absolute -bottom-10 -right-8 size-36 rotate-12 rounded-[2.2rem] border border-white/15" />
            <span className="relative grid size-[4.5rem] place-items-center rounded-full border-4 border-white bg-white/20 shadow-[0_0_0_4px_rgba(255,255,255,0.38)]">
              <span className="grid size-[3.35rem] place-items-center rounded-full bg-white text-primary shadow-[0_12px_28px_-18px_rgba(3,66,38,0.62)]">
                <ShieldCheck className="size-7" strokeWidth={2.25} />
              </span>
            </span>
            <p className="relative mt-3 font-headline text-sm font-black uppercase tracking-[0.035em]">Terverifikasi</p>
          </div>

          <div className="flex min-w-0 flex-col justify-center px-5 py-4 sm:px-6">
            <h2 className="font-headline text-lg font-black tracking-tight text-slate-950 md:text-xl">
              Pembayaran telah Diverifikasi Admin Unit
            </h2>
            <p className="mt-1 text-[0.82rem] font-medium leading-5 text-[#667085]">
              Pembayaran Anda telah diverifikasi oleh admin unit. Silakan selesaikan tahap akhir untuk membuka nota lelang.
            </p>
            <dl className="mt-3 grid gap-4 border-t border-[#edf0eb] pt-3 sm:grid-cols-3 sm:gap-0">
              <div className="min-w-0 sm:pr-5">
                <dt className="text-xs font-semibold text-[#667085]">Nominal Lelang</dt>
                <dd className="mt-1 break-words font-headline text-lg font-black tracking-tight text-slate-950 md:text-xl">
                  {currency.format(transaction.amount)}
                </dd>
              </div>
              <div className="min-w-0 sm:border-l sm:border-[#e4e9e4] sm:px-5">
                <dt className="text-xs font-semibold text-[#667085]">Unit Pelaksana</dt>
                <dd className="mt-1 break-words font-headline text-lg font-black tracking-tight text-slate-950 md:text-xl">
                  {transaction.unit}
                </dd>
              </div>
              <div className="min-w-0 sm:border-l sm:border-[#e4e9e4] sm:pl-5">
                <dt className="text-xs font-semibold text-[#667085]">Tanggal Verifikasi</dt>
                <dd className="mt-1 break-words font-headline text-base font-black tracking-tight text-slate-950 md:text-lg">
                  {verificationTimestamp}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.98fr)]">
        <section className="h-full rounded-[1rem] border border-[#dfe6e1] bg-white p-5 shadow-[0_18px_44px_-38px_rgba(8,69,50,0.32)] sm:p-6">
          <h2 className="flex items-center gap-2.5 font-headline text-xl font-black tracking-tight text-slate-950">
            <ClipboardCheck className="size-5 text-primary" />
            Informasi Barang &amp; Pemenang
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
            {transaction.imageUrl ? (
              <Image
                alt={`Foto barang ${transaction.title}`}
                className="h-[220px] w-full rounded-xl bg-[#f2f4f2] object-cover sm:h-full sm:min-h-[220px]"
                height={440}
                loading="eager"
                sizes="(max-width: 640px) 100vw, 180px"
                src={transaction.imageUrl}
                width={360}
              />
            ) : (
              <div className="grid min-h-[220px] place-items-center rounded-xl bg-[#f2f4f2] text-primary">
                <ShoppingBag className="size-9" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-headline text-xl font-black leading-snug tracking-tight text-slate-950">
                {transaction.title}
              </h3>
              <dl className="mt-5 space-y-3">
                <AuctionPaymentInfoRow label="Nama Pembeli" value={buyer.name} />
                <AuctionPaymentInfoRow label="Email" value={buyer.email} />
                <AuctionPaymentInfoRow label="Metode Bayar" value={paymentMethodLabel} />
              </dl>
            </div>
          </div>
        </section>

        <section className="flex h-full flex-col rounded-[1rem] border border-[#dfe6e1] bg-white p-5 shadow-[0_18px_44px_-38px_rgba(8,69,50,0.32)] sm:p-6">
          <h2 className="flex items-center gap-2.5 font-headline text-xl font-black tracking-tight text-slate-950">
            <FileCheck2 className="size-5 text-primary" />
            Log Audit Sistem
          </h2>
          <dl className="mt-5 space-y-3">
            <AuctionPaymentAuditRow label="Dibuat Pada" value={transaction.createdAt} />
            <AuctionPaymentAuditRow label="Dibuat Oleh" value="System (Auto)" />
            <AuctionPaymentAuditRow label="Referensi Transaksi" value={successReference} />
          </dl>

          <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-2">
            {!isCompleted ? (
              <CompletePurchaseButton disabledReason={handoverLockMessage} transactionId={transaction.id} />
            ) : (
              <Button
                className="min-h-14 w-full rounded-[1rem] px-5 text-[0.98rem] font-bold tracking-[0.01em] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] disabled:border disabled:border-primary/10 disabled:bg-primary/45 disabled:text-white/95 disabled:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] disabled:saturate-[0.88]"
                disabled
                type="button"
              >
                <CheckCircle2 className="size-[1.05rem]" />
                Pembelian Selesai
              </Button>
            )}
            <BuyerTransactionInlineReceiptPrint
              buyer={buyer}
              buttonClassName="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[1rem] border border-primary bg-white px-5 text-center text-[0.98rem] font-bold tracking-[0.01em] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_14px_28px_-22px_rgba(8,69,50,0.26)] transition-[transform,background-color,border-color,color,opacity,box-shadow,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-primary/5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_18px_32px_-24px_rgba(8,69,50,0.32)] active:scale-[0.99]"
              label="Cetak Nota"
              rootSuffix="status"
              transaction={transaction}
            />
          </div>
          <div className="mt-3 space-y-3">
            {settlementLockMessage ? <BuyerSettlementLockNotice message={settlementLockMessage} /> : null}
            <HandoverAutoCompleteNotice transaction={transaction} />
          </div>
        </section>
      </div>

      <HandoverProofCard
        audience="buyer"
        itemTitle={transaction.title}
        proof={transaction.handoverProof ?? { location: transaction.unit }}
      />
    </div>
  );
}

function TransactionProtectionCard() {
  const protectionItems = [
    {
      Icon: WalletCards,
      title: "Bayar melalui transfer",
      description: "Gunakan kanal pembayaran resmi di halaman ini."
    },
    {
      Icon: RefreshCw,
      title: "Verifikasi otomatis",
      description: "Status pembayaran diperbarui setelah dana diterima."
    },
    {
      Icon: CircleOff,
      title: "Hindari transfer di luar platform",
      description: "Jangan kirim dana ke rekening pribadi atau kanal lain."
    }
  ];

  return (
    <div
      className={cn(PAYMENT_DETAIL_CARD_CLASS, "buyer-payment-detail-grid-panel overflow-hidden")}
      data-testid="transaction-protection-card"
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(180deg,rgba(0,74,35,0.025)_0%,transparent_65%)]" />
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/15 bg-primary/5 text-primary">
            <BadgeCheck className="size-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h2 className="font-headline text-[1.45rem] font-black leading-tight tracking-tight text-primary">
              Perlindungan Transaksi
            </h2>
            <p className="mt-1 text-[0.72rem] leading-5 text-[#62655f]">Kami menjaga transaksi Anda tetap aman.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-1 flex-col divide-y divide-primary/10 overflow-hidden rounded-[1.15rem] border border-primary/10 bg-[#fbfdfb]" data-testid="transaction-protection-list">
          {protectionItems.map(({ Icon, title, description }) => (
            <div className="flex min-h-[6.75rem] flex-1 items-center gap-4 px-4 py-4" data-testid="transaction-protection-item" key={title}>
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-primary/15 bg-white text-primary">
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="text-pretty text-[0.98rem] font-bold leading-5 text-[#1d513c]">{title}</p>
                <p className="mt-1 text-pretty text-[0.82rem] leading-5 text-[#62655f]">{description}</p>
              </div>
            </div>
          ))}
        </div>
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
  const isMidtrans = transaction.method === "MIDTRANS";
  const transferAccounts = isTransfer ? getTransactionBankAccounts(transaction) : [];
  const isVerified = transaction.status === "LUNAS" || transaction.status === "SELESAI";
  const isCompleted = isTransactionCompletionFinalized(transaction);
  const showReceipt = isVerified;
  const isVickreyWin = transaction.kind === "VICKREY_WIN";
  const isFixedPrice = transaction.kind === "FIXED_PRICE";
  const isProofInReview = transaction.status === "BUKTI_DIUNGGAH";
  const isProofRejected = transaction.status === "DITOLAK_BUKTI";
  const isFailedMidtransPayment = isMidtrans && transaction.status === "GAGAL";
  const isFailedVickreyPayment = isVickreyWin && transaction.status === "GAGAL";
  const isFailedFixedPricePayment = isFixedPrice && transaction.status === "GAGAL";
  const isSuccessfulVickreyPayment = isVickreyWin && isVerified;
  const isPendingVickreyPayment =
    isVickreyWin &&
    (transaction.status === "MENUNGGU_PEMBAYARAN" ||
      transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG");
  const isFixedPriceCatalogHidden =
    isFixedPrice &&
    isFixedPriceBuyerCatalogHiddenStatus(transaction.status);
  const hasSubmittedTransferProof = isTransfer && Boolean(transaction.paymentProof);
  const proofPanelTitle = isFailedFixedPricePayment
    ? "Status Pembayaran"
    : isTransfer
    ? isProofInReview
      ? "Review Bukti"
      : isProofRejected
        ? "Review Bukti"
        : isVerified && hasSubmittedTransferProof
          ? "Bukti Pembayaran"
          : "Unggah Bukti"
    : "Status Konfirmasi";
  const blacklistPolicy = buyerStatus?.blacklist.active
    ? getBlacklistRestrictionPolicy(buyerStatus.blacklist.totalViolations)
    : null;
  const settlementLockMessage = blacklistPolicy?.blocksTransactionSettlement
    ? BUYER_SETTLEMENT_LOCKED_MESSAGE
    : null;
  const handoverLockMessage = transaction.handoverProof
    ? null
    : getReceiptHandoverLockMessage(transaction);
  const fixedPriceActionLockMessage = handoverLockMessage;
  const fixedPriceReceiptLockMessage =
    handoverLockMessage ?? (!isCompleted ? "Nota dapat dicetak setelah buyer menekan Pembelian Selesai." : null);
  const shouldAutoRefresh =
    transaction.status === "BUKTI_DIUNGGAH" ||
    transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG" ||
    (transaction.status === "MENUNGGU_PEMBAYARAN" && isMidtrans) ||
    (transaction.status === "LUNAS" && (!transaction.handoverProof || !isCompleted));
  const transactionSpecificationRows = [
    ...(transaction.category ? [{ label: "Kategori", value: transaction.category }] : []),
    ...(transaction.specs ?? [])
  ];
  const fixedPriceHandoverActions =
    showReceipt && isFixedPrice ? (
      <div className="space-y-3">
        <div className="grid gap-4 rounded-[1rem] border border-[#dfe8e3] bg-white px-4 py-4 shadow-[0_18px_40px_-34px_rgba(8,69,50,0.24)] md:grid-cols-[minmax(0,1fr)_1px_240px_240px] md:items-center md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#ead28b] bg-[#fffaf0] text-[#d4a51c] shadow-[0_12px_24px_-20px_rgba(212,165,28,0.55)]">
              <CheckCircle2 className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#8aa39a]">Aksi Penyelesaian</p>
              <p className="mt-1 text-[0.9rem] font-black leading-5 text-slate-950">
                {isCompleted ? "Pembelian selesai tercatat" : "Selesaikan pengambilan dan nota"}
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#64748b]">
                {handoverLockMessage ?? "Nota dapat dicetak setelah dokumentasi serah-terima tersimpan."}
              </p>
            </div>
          </div>
          <span aria-hidden="true" className="hidden h-16 w-px bg-[#edf1ed] md:block" />

          {!isCompleted ? (
            <CompletePurchaseButton
              className="h-12 min-h-12 rounded-[0.78rem] bg-[#006747] px-5 text-sm font-black text-white shadow-[0_18px_32px_-22px_rgba(0,103,71,0.74)] transition-[transform,background-color,box-shadow,opacity,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.98] disabled:border disabled:border-[#c8d7cf] disabled:bg-[#dce8e1] disabled:text-[#71867b] disabled:shadow-none disabled:opacity-100 disabled:saturate-[0.72]"
              disabledReason={fixedPriceActionLockMessage}
              transactionId={transaction.id}
            />
          ) : (
            <Button
              className="h-12 min-h-12 w-full rounded-[0.78rem] border border-[#c8d7cf] bg-[#dce8e1] px-5 text-sm font-black text-[#71867b] shadow-none disabled:bg-[#dce8e1] disabled:text-[#71867b] disabled:opacity-100 disabled:shadow-none disabled:saturate-[0.72]"
              disabled
              type="button"
            >
              <CheckCircle2 className="size-4" />
              Pembelian Selesai
            </Button>
          )}
          <BuyerTransactionInlineReceiptPrint
            buyer={buyer}
            buttonClassName="inline-flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-[0.78rem] border border-[#b9d1c5] bg-white px-5 text-center text-sm font-black text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] transition-[transform,background-color,border-color,color,opacity,box-shadow,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/[0.04] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_14px_24px_-22px_rgba(8,69,50,0.28)] active:scale-[0.98]"
            disabledReason={fixedPriceReceiptLockMessage}
            label="Cetak Nota"
            rootSuffix="status"
            showDisabledReason={false}
            transaction={transaction}
          />
        </div>

        {settlementLockMessage ? <BuyerSettlementLockNotice message={settlementLockMessage} /> : null}
        <HandoverAutoCompleteNotice transaction={transaction} />
      </div>
    ) : null;

  if (isFailedVickreyPayment) {
    return <VickreyPaymentFailedDetail buyer={buyer} buyerStatus={buyerStatus} transaction={transaction} />;
  }

  if (isSuccessfulVickreyPayment) {
    return (
      <VickreyPaymentSuccessDetail
        buyer={buyer}
        settlementLockMessage={settlementLockMessage}
        transaction={transaction}
      />
    );
  }

  if (isPendingVickreyPayment) {
    return <VickreyPendingPaymentDetail buyer={buyer} transaction={transaction} />;
  }

  return (
    <div className="space-y-7 bg-white md:space-y-8">
      <StatusSyncRefresh enabled={shouldAutoRefresh} />
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
              {isProofRejected
                ? "Bukti pembayaran ditolak admin unit. Transaksi dibatalkan dan barang kembali tersedia di katalog."
                : isFailedFixedPricePayment
                ? FIXED_PRICE_PAYMENT_FAILURE_COPY.description
                : isFixedPrice
                ? isMidtrans
                  ? isFailedMidtransPayment
                    ? "Pembayaran gagal atau kedaluwarsa. Barang dapat dibeli kembali dari katalog jika masih tersedia."
                    : "Selesaikan pembayaran melalui transfer. Status akan diperbarui setelah dana diterima."
                  : "Selesaikan pembayaran harga tetap, unggah bukti transfer, lalu tunggu admin unit memverifikasi transaksi."
                : "Selesaikan pembayaran hasil lelang, pantau verifikasi admin, dan buka nota setelah transaksi selesai."}
            </p>
          </div>
          {!isFixedPriceCatalogHidden ? (
            <div className="flex flex-wrap gap-3">
              <Link href={`/katalog/${transaction.lotId}?source=payment`}>
                <Button variant="ghost">Kembali ke Detail Barang</Button>
              </Link>
            </div>
          ) : null}
        </div>

        <PaymentProgressRail buyer={buyer} transaction={transaction} />
        {isVickreyWin ? (
          <Card className="overflow-hidden border border-accent/35 bg-[radial-gradient(circle_at_top_left,rgba(255,205,76,0.22),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8f3e6_100%)]">
            <CardContent className="grid gap-5 p-5 md:grid-cols-[0.72fr_1.28fr] md:p-6">
              <div className="rounded-[1.5rem] bg-primary p-5 text-white">
                <div className="flex items-center gap-3">
                  <Gavel className="size-5" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                    Pemenang Lelang Tertutup
                  </p>
                </div>
                <p className="mt-4 font-headline text-3xl font-black tracking-tight">
                  {currency.format(transaction.amount)}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/75">Harga yang perlu dibayar</p>
              </div>
              <div className="space-y-3">
                <CardTitle>Harga akhir Lelang Tertutup</CardTitle>
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

      <div
        className={cn(
          "buyer-payment-detail-grid grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.28fr)_minmax(0,0.92fr)]",
          isMidtrans && "lg:grid-rows-[minmax(0,auto)]"
        )}
        data-testid="transaction-payment-grid"
      >
        <div className={cn(PAYMENT_DETAIL_CARD_CLASS, isMidtrans && "h-fit min-h-0")}>
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(180deg,rgba(0,74,35,0.02)_0%,transparent_42%)]" />
          <div className="relative z-10 flex h-full flex-col">
            <h2 className="mb-6 flex items-center gap-2.5 font-headline text-[1.95rem] font-black tracking-tight text-primary">
              <ReceiptText className="size-5" />
              Rincian Transaksi
            </h2>
            <div className="space-y-5">
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
                    loading="eager"
                    sizes="80px"
                    src={transaction.imageUrl}
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

              {transactionSpecificationRows.length > 0 ? (
                <section className="border-y border-primary/10 py-4" aria-labelledby="transaction-specifications">
                  <p
                    className="mb-3 font-body text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#6e716c]"
                    id="transaction-specifications"
                  >
                    Spesifikasi Barang
                  </p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {transactionSpecificationRows.map((specification) => (
                      <div className="min-w-0" key={`${specification.label}-${specification.value}`}>
                        <dt className="text-[0.62rem] font-medium text-[#777b75]">{specification.label}</dt>
                        <dd className="mt-1 flex items-start gap-1.5 text-[0.72rem] font-bold leading-5 text-primary">
                          <span aria-hidden="true" className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-[#d7ad2f]" />
                          <span className="break-words">{specification.value}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}

              <div>
                <p className="mb-1 font-body text-[0.74rem] font-medium uppercase tracking-[0.08em] text-[#6e716c]">
                  Metode Pembayaran
                </p>
                <p className="flex items-center gap-2 font-body text-[1rem] text-[#1a1c1c]">
                  <Landmark className="size-4" />
                  {isMidtrans || isTransfer ? "Transfer" : "Bayar Langsung"}
                </p>
              </div>

              {transaction.winnerContext ? (
                <div className="rounded-lg bg-[#faf4e7] px-4 py-3 text-sm leading-7 text-[#5e5a4c]">
                  {transaction.winnerContext}
                </div>
              ) : null}
              {!isMidtrans ? (
                <div className="mt-auto pt-5">
                  <div className="flex items-start gap-2.5 rounded-[0.8rem] border border-primary/10 bg-[#f7f9f6] px-3.5 py-3 text-[0.72rem] leading-5 text-[#62655f]">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p>Nota diterbitkan setelah pembayaran diverifikasi admin unit.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className={cn(PAYMENT_DETAIL_CARD_CLASS, "buyer-payment-detail-grid-panel overflow-hidden")}
          data-testid="transaction-payment-card"
        >
          <div className="relative z-10 flex h-full flex-col">
            <h2 className={cn("flex items-center gap-2.5 font-headline font-black tracking-tight text-primary", isMidtrans ? "mb-4 text-[1.75rem]" : "mb-6 text-[1.95rem]")}>
              {isFailedFixedPricePayment && !isMidtrans ? <CircleX className="size-5" /> : isTransfer || isMidtrans ? <Landmark className="size-5" /> : <MapPinned className="size-5" />}
              {isFailedFixedPricePayment && !isMidtrans ? "Pembayaran Harga Tetap Gagal" : isTransfer ? "Rekening Tujuan" : isMidtrans ? "Pembayaran Transfer" : "Bayar Langsung di Unit"}
            </h2>

            {isFailedFixedPricePayment && !isMidtrans ? (
              <div className="flex flex-1 flex-col justify-center">
                <div className="rounded-[1.15rem] border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-700">
                      <CircleX className="size-5" />
                    </span>
                    <div>
                      <p className="text-lg font-black text-[#13211c]">Batas waktu pembayaran berakhir</p>
                      <p className="mt-1 text-sm leading-6 text-[#62655f]">
                        Transaksi ini sudah ditutup. Barang dapat dibeli kembali dari katalog jika masih tersedia.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : isTransfer ? (
              <>
                <p className="-mt-2 mb-5 font-body text-sm leading-7 text-[#62655f]">
                  Pilih salah satu rekening di bawah untuk melakukan transfer.
                </p>

                {transferAccounts.length > 0 ? (
                  <div
                    aria-label="Daftar rekening tujuan"
                    className="grid min-h-[27.75rem] flex-1 gap-3 overflow-y-auto overscroll-contain pr-1 [grid-auto-rows:calc((100%_-_1.5rem)/3)] [scrollbar-gutter:stable] [scrollbar-width:thin]"
                    role="list"
                  >
                    {transferAccounts.map((account) => (
                      <DestinationAccountRow
                        account={account}
                        key={account.id ?? `${account.bankName}-${account.accountNumber}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[0.95rem] border border-dashed border-[#dfe8e3] bg-[#fbfdfb] p-5 text-sm font-semibold leading-7 text-[#62655f]">
                    Rekening tujuan unit belum tersedia. Hubungi admin unit sebelum melakukan transfer.
                  </div>
                )}

                <div className="mt-5 flex items-start gap-3 rounded-lg bg-[#f8eced] p-4">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#8f3a47]" />
                  <p className="font-body text-[0.82rem] leading-6 text-[#4f4b48]">
                    {isProofRejected ? (
                      "Transaksi ini sudah dibatalkan setelah bukti pembayaran ditolak admin unit."
                    ) : (
                      <>
                        Pastikan Anda mentransfer tepat sesuai dengan <strong>Total Harga</strong>{" "}
                        untuk mempercepat proses verifikasi otomatis.
                      </>
                    )}
                  </p>
                </div>
              </>
            ) : isMidtrans ? (
              <div className="flex h-0 min-h-0 flex-1 flex-col" data-testid="midtrans-payment-content">
                <MidtransEmbeddedCheckout
                  compact
                  terminalState={isFailedMidtransPayment ? "expired" : isVerified ? "success" : "pending"}
                  transactionId={transaction.id}
                />
              </div>
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

        {isMidtrans ? (
          <TransactionProtectionCard />
        ) : (
          <div className={PAYMENT_DETAIL_CARD_CLASS}>
          <h2 className="mb-2 flex items-center gap-2.5 font-headline text-[1.95rem] font-black tracking-tight text-primary">
            <UploadCloud className="size-5" />
            {proofPanelTitle}
          </h2>

          {showReceipt ? (
            <div className="space-y-5">
              <p className="font-body text-sm leading-7 text-[#62655f]">
                {isCompleted
                  ? `Pembelian selesai setelah pembayaran diverifikasi pada ${transaction.verifiedAt}.`
                  : `Pembayaran diverifikasi pada ${transaction.verifiedAt}. Menunggu konfirmasi selesai dari buyer.`}
              </p>
              {hasSubmittedTransferProof ? (
              <BuyerPaymentProofForm
                  currentProof={transaction.paymentProof}
                  locked
                  readOnlyPreview
                  transactionId={transaction.id}
                />
              ) : null}
            </div>
          ) : isFailedFixedPricePayment ? (
            <div className="space-y-4">
              <p className="font-body text-sm leading-7 text-[#62655f]">
                {FIXED_PRICE_PAYMENT_FAILURE_COPY.description}
              </p>
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
                <CircleX className="mx-auto size-7" />
                <p className="mt-4 text-sm font-semibold leading-7">
                  Transaksi ditutup. Kembali ke katalog untuk mencoba pembelian baru jika barang masih tersedia.
                </p>
              </div>
            </div>
          ) : isTransfer ? (
            <>
              <p className="mb-6 font-body text-sm leading-7 text-[#62655f]">
                {isProofInReview
                  ? "Bukti transfer sudah terkirim. Tunggu admin unit menyelesaikan verifikasi."
                  : isProofRejected
                    ? "Bukti sebelumnya ditolak. Bukti yang sudah dikirim tetap ditampilkan sebagai arsip verifikasi. Transaksi ini sudah dibatalkan; lakukan pembelian ulang dari katalog jika barang masih tersedia."
                    : "Unggah bukti transfer maksimal 24 jam setelah pengajuan."}
              </p>
              {settlementLockMessage ? (
                <BuyerSettlementLockNotice message={settlementLockMessage} />
              ) : (
                <div className="flex flex-1 flex-col">
                  <BuyerPaymentProofForm
                    className="flex-1"
                    currentProof={transaction.paymentProof}
                    locked={isProofInReview || isProofRejected}
                    lockedDescription="File bukti di bawah ini sudah masuk antrean review admin unit dan tidak bisa diganti sementara."
                    lockedTitle="Bukti sudah terkirim"
                    readOnlyPreview={isProofInReview || isProofRejected}
                    submitLabel="Kirim Bukti Pembayaran"
                    transactionId={transaction.id}
                  />
                </div>
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
        )}
      </div>

      {showReceipt ? (
        <div className="space-y-4">
          <HandoverProofCard
            audience="buyer"
            itemTitle={transaction.title}
            proof={transaction.handoverProof ?? { location: transaction.unit }}
          />
          {fixedPriceHandoverActions}
        </div>
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

  const handoverLockMessage = getReceiptHandoverLockMessage(transaction);

  if (handoverLockMessage) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">{handoverLockMessage}</p>
      </Card>
    );
  }

  const isTransfer = transaction.method === "TRANSFER_BANK";
  const isCompleted = transaction.status === "SELESAI";
  const noteHref = `/transaksi/${transaction.id}/nota`;
  const isAutoOutput = outputMode === "print" || outputMode === "download";
  const isAuctionReceipt = transaction.kind === "VICKREY_WIN";
  const paymentMethodLabel = getReceiptPaymentMethodLabel(transaction);

  return (
    <div
      className={cn(
        "space-y-8 md:space-y-10 print:space-y-4",
        isAutoOutput && "receipt-auto-output-stage mx-auto max-w-[980px] space-y-0 py-5 md:py-6 print:max-w-none print:py-0"
      )}
      data-auto-output-mode={isAutoOutput ? outputMode : undefined}
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
            value: getReceiptMarketingTypeLabel(transaction)
          }
        ]}
        footerText={getReceiptFooterText(transaction)}
        handoverByName={transaction.handoverProof?.uploadedBy}
        imageUrl={transaction.imageUrl}
        itemSubtitle={paymentMethodLabel}
        itemTitle={transaction.title}
        noteNumber={transaction.receiptNumber ?? transaction.id}
        paymentMethodLabel={paymentMethodLabel}
        statusLabel={isCompleted ? getBuyerTransactionCompletionLabel(transaction) : "Terverifikasi admin"}
        subtotal={transaction.amount}
        terms={getReceiptTerms(transaction)}
        total={transaction.amount}
        transactionId={transaction.id}
        unitAddress={transaction.unitAddress}
        unitName={transaction.unit}
        receiverName={buyer.name}
        verifiedByName={transaction.verifiedBy}
        verifiedAt={transaction.verifiedAt}
        outputLayout={isAutoOutput || isAuctionReceipt}
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
              key={`${item.lotId}-${item.createdAtRaw ?? item.closing}`}
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
              {item.status === "BID_TERCATAT" ? (
                <div className="mt-5 rounded-[1.25rem] border border-primary/15 bg-primary/[0.03] p-4 text-sm leading-6 text-primary">
                  <p className="font-semibold">Bid privat tersimpan</p>
                  <p className="mt-1">
                    Nominal bid Anda tersimpan untuk akun ini. Hasil dan identitas penawar lain akan diumumkan otomatis setelah deadline.
                  </p>
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
              </div>
            </div>
          ))}
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/[0.08] text-primary">
                      <LockKeyhole className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Password</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground pl-[3.25rem] sm:pl-0 sm:text-right">
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
