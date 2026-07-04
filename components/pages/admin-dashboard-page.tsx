import Image from "next/image";
import Link from "next/link";
import {
  Megaphone,
  ShoppingCart,
  Tag,
  type LucideIcon
} from "lucide-react";

import {
  AdminDashboardChecklistCard,
  type DashboardChecklistTask
} from "@/components/pages/admin-dashboard-checklist-card";
import { AdminDashboardTrendChart } from "@/components/pages/admin-dashboard-trend-chart";
import { getAdminInventoryMetrics } from "@/lib/admin-unit/operational-metrics";
import WelcomeBrushBadge from "@/components/shared/welcome-brush-badge";

export type DashboardTrendPoint = {
  label: string;
  value: number;
  amount: number;
  fixedPriceAmount?: number;
  vickreyAmount?: number;
};

export type DashboardSalesTimeframeKey =
  | "day"
  | "week"
  | "month"
  | "last7"
  | "last30"
  | "last3Months"
  | "last12Months"
  | "yearToDate"
  | "allTime";

export type DashboardTrendEvent = {
  amount: number;
  marketingMode?: string | null;
  occurredAt: string;
  transactionType?: string | null;
};

export type DashboardTrendRange = {
  label: string;
  points: DashboardTrendPoint[];
  summary: {
    totalRevenue: number;
    verifiedTransactions: number;
    averageRevenue: number;
    peakRevenue: number;
    peakLabel: string;
  };
};

export type AdminDashboardMetrics = {
  totalItems: number;
  readyForMarketing: number;
  dueSoon: number;
  soldItems: number;
  redeemedItems: number;
  activeAuctions: number;
  activeParticipants: number;
  totalTransactions: number;
  verifiedTransactions: number;
  actionableTransactions: number;
  uploadedProofTransactions: number;
  directConfirmationTransactions: number;
  waitingPaymentTransactions: number;
  rejectedProofTransactions: number;
  activeBlacklist: number;
  totalRevenue: number;
  averageTransaction: number;
  salesTrend: {
    defaultRange: DashboardSalesTimeframeKey;
    events?: DashboardTrendEvent[];
    ranges: Partial<Record<DashboardSalesTimeframeKey, DashboardTrendRange>> &
      Record<"day" | "week" | "month", DashboardTrendRange>;
  };
};

type AdminDashboardData = {
  summary: { unitName: string; subtitle?: string; activeBank: string };
  metrics?: AdminDashboardMetrics;
  inventory: Array<any>;
  transactions: Array<any>;
  blacklist: Array<any>;
};

type DashboardMetricCard = {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  tone: "green" | "blue" | "cyan";
};

const ADMIN_DASHBOARD_HERO_ILLUSTRATION =
  "/assets/hero-admin-unit-illustration.png";

const ACTIONABLE_TRANSACTION_STATUSES = new Set([
  "BUKTI_DIUNGGAH",
  "MENUNGGU_KONFIRMASI_LANGSUNG",
  "MENUNGGU_PEMBAYARAN",
  "DITOLAK_BUKTI"
]);
const VERIFIED_TRANSACTION_STATUSES = new Set(["LUNAS", "SELESAI"]);
const numberFormatter = new Intl.NumberFormat("id-ID");

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function formatShortNumber(value: number) {
  if (value >= 1_000_000_000) {
    return `${numberFormatter.format(Number((value / 1_000_000_000).toFixed(2)))} M`;
  }
  if (value >= 1_000_000) {
    return `${numberFormatter.format(Number((value / 1_000_000).toFixed(2)))} jt`;
  }
  if (value >= 1_000) {
    return `${numberFormatter.format(Number((value / 1_000).toFixed(1)))} rb`;
  }

  return numberFormatter.format(value);
}

function formatCurrencyCompact(value: number) {
  return `Rp ${formatShortNumber(value)}`;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getStatus(value: unknown) {
  return String(value ?? "").toUpperCase();
}

function resolveDashboardOperatorLabel(summary: AdminDashboardData["summary"]) {
  const subtitle = summary.subtitle?.trim();

  if (subtitle && !/^(demo|ringkasan operasional unit)$/i.test(subtitle)) {
    return subtitle;
  }

  return "Admin Unit";
}

function makeFallbackRange(label: string, labels: string[]): DashboardTrendRange {
  return {
    label,
    points: labels.map((pointLabel) => ({
      label: pointLabel,
      value: 0,
      amount: 0
    })),
    summary: {
      totalRevenue: 0,
      verifiedTransactions: 0,
      averageRevenue: 0,
      peakRevenue: 0,
      peakLabel: labels[0] ?? "-"
    }
  };
}

function makeFallbackTrend() {
  return {
    defaultRange: "month" as const,
    ranges: {
      day: makeFallbackRange("Hari Ini", ["00.00", "04.00", "08.00", "12.00", "16.00", "20.00"]),
      week: makeFallbackRange("Minggu Ini", ["Hari 1", "Hari 2", "Hari 3", "Hari 4", "Hari 5", "Hari 6", "Hari 7"]),
      month: makeFallbackRange("Bulan Berlangsung", ["Tanggal 1", "Tanggal 8", "Tanggal 15", "Tanggal 22", "Tanggal 29"])
    }
  };
}

function getDashboardMetrics(data: AdminDashboardData): AdminDashboardMetrics {
  if (data.metrics) {
    return data.metrics;
  }

  const verifiedTransactions = data.transactions.filter((transaction) =>
    VERIFIED_TRANSACTION_STATUSES.has(getStatus(transaction.status))
  );
  const actionableTransactions = data.transactions.filter((transaction) =>
    ACTIONABLE_TRANSACTION_STATUSES.has(getStatus(transaction.status))
  );
  const totalRevenue = verifiedTransactions.reduce((sum, transaction) => sum + Number(transaction.total ?? 0), 0);
  const soldItems = new Set(
    verifiedTransactions.map((transaction) =>
      String(transaction.itemId ?? transaction.barangId ?? transaction.item?.id ?? transaction.id)
    )
  ).size;
  const inventoryMetrics = getAdminInventoryMetrics(data.inventory);

  return {
    totalItems: data.inventory.length,
    readyForMarketing: inventoryMetrics.readyForMarketing,
    dueSoon: inventoryMetrics.dueSoon,
    soldItems,
    redeemedItems: data.inventory.filter((item) => getStatus(item.status) === "DITEBUS").length,
    activeAuctions: data.inventory.filter((item) => Boolean(item.marketingMode)).length,
    activeParticipants: new Set(data.transactions.map((transaction) => transaction.buyer).filter(Boolean)).size,
    totalTransactions: data.transactions.length,
    verifiedTransactions: verifiedTransactions.length,
    actionableTransactions: actionableTransactions.length,
    uploadedProofTransactions: data.transactions.filter((transaction) => getStatus(transaction.status) === "BUKTI_DIUNGGAH").length,
    directConfirmationTransactions: data.transactions.filter((transaction) => getStatus(transaction.status) === "MENUNGGU_KONFIRMASI_LANGSUNG").length,
    waitingPaymentTransactions: data.transactions.filter((transaction) => getStatus(transaction.status) === "MENUNGGU_PEMBAYARAN").length,
    rejectedProofTransactions: data.transactions.filter((transaction) => getStatus(transaction.status) === "DITOLAK_BUKTI").length,
    activeBlacklist: data.blacklist.filter((entry) => getStatus(entry.status) === "AKTIF").length,
    totalRevenue,
    averageTransaction: verifiedTransactions.length ? Math.round(totalRevenue / verifiedTransactions.length) : 0,
    salesTrend: makeFallbackTrend()
  };
}

function DashboardGlyph({
  icon: Icon,
  tone
}: {
  icon: LucideIcon;
  tone: DashboardMetricCard["tone"];
}) {
  return (
    <span
      className={cx(
        "admin-kpi-icon grid size-[3.4rem] shrink-0 place-items-center shadow-[0_14px_28px_-20px_rgba(15,23,42,0.5),inset_0_1px_0_rgba(255,255,255,0.16)]",
        tone === "green" &&
          "rounded-full bg-[linear-gradient(145deg,#00623e,#003c25)] text-[#f1ce68]",
        tone === "blue" &&
          "rounded-full bg-[linear-gradient(145deg,#1264e5,#0640ad)] text-white",
        tone === "cyan" &&
          "rounded-[0.9rem] bg-[linear-gradient(145deg,#e7f9fb,#d9f4f7)] text-[#12abc0] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]"
      )}
    >
      <Icon className="size-7" strokeWidth={1.9} />
    </span>
  );
}

function DashboardKpiCard({ card, index }: { card: DashboardMetricCard; index: number }) {
  const Icon = card.icon;
  const sparkPaths = [
    "M3 44 C16 43 18 35 29 37 C40 39 46 25 58 27 C70 29 76 18 88 19 C101 20 102 10 114 13 C127 16 133 5 147 6",
    "M3 46 C16 46 19 41 30 42 C42 43 48 34 60 36 C72 38 78 22 91 23 C104 24 107 14 119 17 C132 20 136 10 147 8",
    "M3 45 C16 44 20 36 31 39 C43 42 48 30 60 32 C72 34 78 21 91 25 C103 29 109 15 121 18 C134 21 139 11 147 7"
  ];
  const sparkPath = sparkPaths[index] ?? sparkPaths[0];

  return (
    <article
      className={cx(
        "admin-kpi-card relative min-h-[9rem] overflow-hidden rounded-[0.95rem] border border-[#e0e7e3] bg-white px-4 py-4 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-[#101a15] dark:shadow-[0_22px_58px_-36px_rgba(0,0,0,0.68)] sm:px-5",
        card.tone === "green" && "text-[#078244]",
        card.tone === "blue" && "text-[#125de0]",
        card.tone === "cyan" && "text-[#11afbd]"
      )}
    >
      <span
        className={cx(
          "absolute inset-y-0 left-0 w-1.5",
          card.tone === "green" && "bg-[#087a43]",
          card.tone === "blue" && "bg-[#1761e8]",
          card.tone === "cyan" && "bg-[#18bec9]"
        )}
      />
      <span
        className={cx(
          "absolute bottom-0 left-1/2 h-1 w-16 -translate-x-1/2 rounded-t-full",
          card.tone === "green" && "bg-[#10924f]",
          card.tone === "blue" && "bg-[#1761e8]",
          card.tone === "cyan" && "bg-[#13b3bd]"
        )}
      />
      <svg
        aria-hidden="true"
        className={cx(
          "pointer-events-none absolute bottom-4 right-4 hidden h-[3.15rem] w-[8.75rem] sm:block",
          card.tone === "green" && "text-[#83df64]",
          card.tone === "blue" && "text-[#4285f4]",
          card.tone === "cyan" && "text-[#24cad4]"
        )}
        viewBox="0 0 150 52"
      >
        <defs>
          <linearGradient id={`admin-kpi-spark-${index}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${sparkPath} L147 52 L3 52 Z`} fill={`url(#admin-kpi-spark-${index})`} />
        <path d={sparkPath} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <circle cx="147" cy={index === 0 ? "6" : index === 1 ? "8" : "7"} fill="currentColor" r="3.4" />
      </svg>
      <div className="relative flex items-start gap-3.5">
        <DashboardGlyph icon={Icon} tone={card.tone} />
        <div className="min-w-0 pt-0.5">
          <h2 className="text-[0.82rem] font-extrabold leading-4 text-[#151d19] dark:text-slate-100">
            {card.title}
          </h2>
          <p className="mt-1 text-[2.05rem] font-extrabold leading-none [font-variant-numeric:tabular-nums] dark:text-white">
            {card.value}
          </p>
        </div>
      </div>
      <p className="relative z-[1] mt-2 pl-[4.25rem] text-[0.72rem] font-medium leading-4 text-[#59677a] dark:text-slate-300/72 sm:pr-[8.25rem]">
        {card.subtext}
      </p>
    </article>
  );
}

function AdminDashboardHero({
  summary,
  adminName
}: {
  summary: AdminDashboardData["summary"];
  adminName?: string;
}) {
  const operatorLabel = adminName ?? resolveDashboardOperatorLabel(summary);

  return (
    <section className="admin-hero" aria-label="Hero dashboard admin unit">
      <div className="admin-hero__content">
        <div className="admin-hero__eyebrow">
          <div className="admin-hero__display-title">Dashboard</div>
          <div className="admin-hero__display-sub">Admin Unit</div>
        </div>

        <div className="mb-4">
          <WelcomeBrushBadge />
        </div>

        <h1 className="admin-hero__title">Halo, {operatorLabel}</h1>
        <p className="admin-hero__description">
          Kami siap membantu Anda memantau barang unit, pemasaran, pembayaran, dan prioritas operasional unit dari satu ruang admin yang lebih ringkas.
        </p>
      </div>

      <div className="admin-hero__visual" aria-hidden="true">
        <Image
          src={ADMIN_DASHBOARD_HERO_ILLUSTRATION}
          alt="Ilustrasi operasional dashboard admin unit"
          width={520}
          height={400}
          quality={75}
          priority
          fetchPriority="high"
          sizes="(max-width: 1100px) 80vw, 400px"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
    </section>
  );
}

function buildDashboardCards(metrics: AdminDashboardMetrics): DashboardMetricCard[] {
  return [
    {
      title: "Barang Terjual",
      value: formatCount(metrics.soldItems),
      subtext: `${formatCurrencyCompact(metrics.totalRevenue)} dari transaksi terverifikasi`,
      icon: ShoppingCart,
      tone: "green"
    },
    {
      title: "Barang Ditebus",
      value: formatCount(metrics.redeemedItems),
      subtext: `${formatCount(metrics.readyForMarketing)} barang siap dipasarkan di unit`,
      icon: Tag,
      tone: "blue"
    },
    {
      title: "Barang Dipasarkan",
      value: formatCount(metrics.activeAuctions),
      subtext: "Produk dalam sesi pemasaran aktif",
      icon: Megaphone,
      tone: "cyan"
    }
  ];
}

function buildDashboardTasks(metrics: AdminDashboardMetrics): DashboardChecklistTask[] {
  const paymentQueue =
    metrics.uploadedProofTransactions +
    metrics.directConfirmationTransactions +
    metrics.waitingPaymentTransactions +
    metrics.rejectedProofTransactions;

  return [
    {
      title: "Pastikan barang baru sudah tercatat lengkap, termasuk foto utama dan hasil appraisal.",
      checked: metrics.totalItems > 0
    },
    {
      title:
        "Dahulukan barang yang mendekati jatuh tempo agar keputusan perpanjangan, tebus, atau pindah ke aset unit tidak tertunda.",
      checked: metrics.dueSoon === 0
    },
    {
      title: "Tinjau barang yang siap tayang, lalu pilih skema penjualan yang paling tepat.",
      checked: metrics.readyForMarketing > 0
    },
    {
      title: "Selesaikan antrian transaksi yang masih menunggu pengecekan agar nota bisa segera diterbitkan.",
      checked: paymentQueue === 0
    },
    {
      title: "Pantau pemenang yang belum menyelesaikan pembayaran dan catat pelanggaran tepat waktu bila diperlukan.",
      checked: metrics.waitingPaymentTransactions === 0
    }
  ];
}

export function AdminDashboardPage({ data, adminName }: { data: AdminDashboardData; adminName?: string }) {
  const metrics = getDashboardMetrics(data);
  const cards = buildDashboardCards(metrics);
  const tasks = buildDashboardTasks(metrics);
  const nowIso = new Date().toISOString();
  const operationalSummary = `${data.summary.unitName} memiliki ${formatCount(metrics.totalItems)} barang, ${formatCount(metrics.totalTransactions)} transaksi, dan ${formatCount(metrics.activeBlacklist)} blacklist aktif di unit.`;

  return (
    <div className="space-y-4 lg:space-y-5">
      <p className="sr-only">{operationalSummary}</p>

      <AdminDashboardHero summary={data.summary} adminName={adminName} />

      <section
        className="grid gap-3.5 [font-family:var(--font-inter)] lg:grid-cols-3"
        data-testid="admin-dashboard-metrics"
      >
        {cards.map((card, index) => (
          <DashboardKpiCard card={card} index={index} key={card.title} />
        ))}
      </section>

      <section className="[content-visibility:auto] [contain-intrinsic-size:380px]">
          <AdminDashboardChecklistCard nowIso={nowIso} tasks={tasks} />
      </section>

      <section className="[content-visibility:auto] [contain-intrinsic-size:620px]">
        <AdminDashboardTrendChart metrics={metrics} />
      </section>
    </div>
  );
}
