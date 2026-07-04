import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  Gavel,
  ImageIcon,
  Landmark,
  Mail,
  MapPinned,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { RestrictionCountdownTiles } from "@/components/buyer/restriction-countdown-tiles";
import { LiveCountdown } from "@/components/buyer/live-countdown";
import WelcomeBrushBadge from "@/components/shared/welcome-brush-badge";
import { Button } from "@/components/ui/button";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import {
  getBuyerTransactionHref,
  isBuyerWinnerAnnouncementTransaction
} from "@/lib/buyer/transaction-links";
import type { BuyerBid, BuyerTransaction } from "@/lib/contracts/buyer";
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

type BuyerDashboardViolation = {
  id: string;
  imageUrl: string | null;
  itemName: string;
  note: string;
  occurredAtLabel: string;
  unitName: string;
  violationLevel: number;
};

const BUYER_HOME_HERO_IMAGE = "/uploads/Gambar Hero Section Beranda Pembeli.png";
const BUYER_NOTES_BACKGROUND_IMAGE = "/uploads/Gambar Background Catatan Penting.png";

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
