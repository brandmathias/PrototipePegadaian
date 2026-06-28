import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Megaphone,
  ShoppingCart,
  Tag,
  TrendingUp,
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
  tone?: "green" | "teal" | "red";
  pill?: string;
};

type DashboardStripMetric = {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
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
  const inventoryMetrics = getAdminInventoryMetrics(data.inventory);

  return {
    totalItems: data.inventory.length,
    readyForMarketing: inventoryMetrics.readyForMarketing,
    dueSoon: inventoryMetrics.dueSoon,
    soldItems: verifiedTransactions.length,
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
  tone = "green"
}: {
  icon: LucideIcon;
  tone?: "green" | "teal" | "red" | "amber";
}) {
  return (
    <span
      className={cx(
        "admin-kpi-icon grid size-[5.15rem] shrink-0 place-items-center rounded-[1.15rem] border shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors duration-300 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        tone === "green" &&
          "border-[#dcefe2] bg-[linear-gradient(180deg,#f5fbf6,#ebf7ef)] text-[#0c6a42] dark:border-emerald-300/12 dark:bg-[linear-gradient(180deg,rgba(32,120,83,0.26),rgba(14,73,52,0.22))] dark:text-emerald-200",
        tone === "teal" &&
          "border-[#d6eef0] bg-[linear-gradient(180deg,#f3fbfc,#e9f7f8)] text-[#0b6b71] dark:border-cyan-300/12 dark:bg-[linear-gradient(180deg,rgba(22,103,112,0.26),rgba(13,67,77,0.22))] dark:text-cyan-200",
        tone === "red" &&
          "border-[#f7d8dc] bg-[linear-gradient(180deg,#fff8f8,#fff0f2)] text-[#ef2d2d] dark:border-rose-300/14 dark:bg-[linear-gradient(180deg,rgba(127,39,55,0.28),rgba(83,24,35,0.24))] dark:text-rose-200",
        tone === "amber" &&
          "border-[#f7e0bd] bg-[linear-gradient(180deg,#fffaf1,#fff3df)] text-[#c87a00] dark:border-amber-300/14 dark:bg-[linear-gradient(180deg,rgba(139,92,24,0.3),rgba(86,58,18,0.22))] dark:text-amber-200"
      )}
    >
      <Icon className="size-10" strokeWidth={1.8} />
    </span>
  );
}

function DashboardKpiCard({ card, index }: { card: DashboardMetricCard; index: number }) {
  const Icon = card.icon;
  const tone = card.tone ?? "green";
  const isCritical = tone === "red";
  const isTeal = tone === "teal";

  return (
    <article
      className={cx(
        "admin-kpi-card relative min-h-[11.1rem] overflow-hidden rounded-[1.25rem] border bg-white px-5 py-5 shadow-[0_22px_54px_-42px_rgba(15,23,42,0.22)] dark:bg-[#101a15] dark:shadow-[0_22px_58px_-36px_rgba(0,0,0,0.68)] sm:px-6",
        isCritical
          ? "border-[#ffbfc5] dark:border-rose-300/20"
          : isTeal
            ? "border-[#bfe8ee] dark:border-cyan-300/18"
            : "border-[#bfe7c4] dark:border-emerald-300/18"
      )}
      style={{ "--admin-kpi-index": index } as CSSProperties}
    >
      <div
        className={cx(
          "pointer-events-none absolute inset-0",
          isCritical
            ? "bg-[radial-gradient(circle_at_14%_20%,rgba(239,45,45,0.06),transparent_30%)] dark:bg-[radial-gradient(circle_at_14%_20%,rgba(251,113,133,0.08),transparent_32%)]"
            : isTeal
              ? "bg-[radial-gradient(circle_at_14%_20%,rgba(11,107,113,0.07),transparent_30%)] dark:bg-[radial-gradient(circle_at_14%_20%,rgba(103,232,249,0.08),transparent_32%)]"
              : "bg-[radial-gradient(circle_at_14%_20%,rgba(17,145,79,0.07),transparent_30%)] dark:bg-[radial-gradient(circle_at_14%_20%,rgba(52,211,153,0.08),transparent_32%)]"
        )}
      />
      <svg
        aria-hidden="true"
        className={cx(
          "admin-kpi-wave pointer-events-none absolute -bottom-5 left-0 right-0 h-20 w-full",
          isCritical
            ? "text-rose-300/60 dark:text-rose-300/34"
            : isTeal
              ? "text-cyan-300/68 dark:text-cyan-300/38"
              : "text-emerald-300/50 dark:text-emerald-300/28"
        )}
        preserveAspectRatio="none"
        viewBox="0 0 420 92"
      >
        {Array.from({ length: 8 }, (_, waveIndex) => (
          <path
            d="M-20 62 C 60 12, 140 105, 226 58 S 353 22, 448 54"
            fill="none"
            key={waveIndex}
            stroke="currentColor"
            strokeOpacity={0.72 - waveIndex * 0.075}
            strokeWidth="1.15"
            transform={`translate(${waveIndex * 8} ${waveIndex * 5})`}
          />
        ))}
      </svg>
      {card.pill ? (
        <span
          className={cx(
            "absolute right-5 top-5 z-[1] shrink-0 rounded-full px-2.5 py-1.5 text-[0.66rem] font-black leading-none sm:right-6 sm:top-6 sm:px-3 sm:text-[0.7rem]",
            isCritical
              ? "bg-[#fff0f2] text-[#ef2d2d] dark:bg-rose-300/10 dark:text-rose-200"
              : isTeal
                ? "bg-[#edf9fa] text-[#0c7b84] dark:bg-cyan-300/10 dark:text-cyan-200"
                : "bg-[#ecf8ee] text-[#11874b] dark:bg-emerald-300/10 dark:text-emerald-200"
          )}
        >
          {card.pill}
        </span>
      ) : null}
      <div className="relative grid h-full grid-cols-[5.15rem_minmax(0,1fr)] items-start gap-5 pr-0 sm:pr-16">
        <DashboardGlyph icon={Icon} tone={isCritical ? "red" : isTeal ? "teal" : "green"} />
        <div className={cx("min-w-0 pt-2", isCritical && card.pill && "pr-[4.85rem] sm:pr-[5.35rem]")}>
          <h2
            className={cx(
              "pr-16 text-[0.98rem] font-black leading-tight tracking-[-0.02em] text-[#111a16] dark:text-slate-100 sm:pr-0 sm:text-[1.05rem]",
              isCritical
                ? "max-w-none whitespace-nowrap pr-0 text-[1.05rem] tracking-[-0.035em] sm:text-[1.05rem]"
                : "max-w-[13rem]"
            )}
          >
            {card.title}
          </h2>

          <p className="mt-3 font-headline text-[2.45rem] font-black leading-none tracking-[-0.055em] text-[#101916] dark:text-white sm:text-[2.7rem]">
            {card.value}
          </p>
          <p
            className={cx(
              "mt-2 max-w-[17rem] text-[0.88rem] leading-5 text-[#52615d] dark:text-slate-300/72",
              isCritical && "max-w-none whitespace-nowrap text-[0.84rem] leading-none"
            )}
          >
            {card.subtext}
          </p>
        </div>
      </div>
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
      tone: "green",
      pill: `${formatCount(metrics.verifiedTransactions)} lunas`
    },
    {
      title: "Barang Ditebus",
      value: formatCount(metrics.redeemedItems),
      subtext: `${formatCount(metrics.readyForMarketing)} barang siap dipasarkan di unit`,
      icon: Tag,
      tone: "teal"
    },
    {
      title: "Barang Dipasarkan",
      value: formatCount(metrics.activeAuctions),
      subtext: "Produk dalam sesi pemasaran aktif",
      icon: Megaphone,
      tone: "green"
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

      <section className="grid gap-4 lg:grid-cols-3">
        {cards.map((card, index) => (
          <DashboardKpiCard card={card} index={index} key={card.title} />
        ))}
      </section>

      <section>
          <AdminDashboardChecklistCard nowIso={nowIso} tasks={tasks} />
      </section>

      <section>
        <AdminDashboardTrendChart metrics={metrics} />
      </section>
    </div>
  );
}
