import { listAdminBarang } from "@/lib/services/admin-barang.service";
import { listAdminBlacklist } from "@/lib/services/admin-blacklist.service";
import { listAdminTransactions } from "@/lib/services/admin-transaction.service";
import { getAdminInventoryMetrics } from "@/lib/admin-unit/operational-metrics";
import { db } from "@/lib/db/client";
import { barang, pemasaran, transaksi, unitAccounts, units } from "@/lib/db/schema";
import { getPublicCatalogUnitMetrics } from "@/lib/services/public-catalog.service";
import { and, eq } from "drizzle-orm";

const ACTIONABLE_TRANSACTION_STATUSES = new Set([
  "bukti_diunggah",
  "menunggu_konfirmasi_langsung",
  "menunggu_pembayaran",
  "ditolak_bukti"
]);
const VERIFIED_TRANSACTION_STATUSES = new Set(["lunas", "selesai"]);
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const SALES_TIMEFRAME_KEYS = ["day", "week", "month"] as const;

type SalesTimeframeKey = (typeof SALES_TIMEFRAME_KEYS)[number];

type DashboardTrendPoint = {
  label: string;
  value: number;
  amount: number;
};

type DashboardTrendRange = {
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

type TransactionMetricRow = {
  id: string;
  userId: string;
  amount: string | null;
  status: string;
  createdAt: Date;
  verifiedAt: Date | null;
};

function makeDayKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function makeDayLabel(value: Date) {
  return `${value.getDate()} ${MONTH_LABELS[value.getMonth()]}`;
}

function makeSalesEventAt(row: TransactionMetricRow) {
  return row.verifiedAt ?? row.createdAt;
}

function makeTrendRange(points: DashboardTrendPoint[], label: string): DashboardTrendRange {
  const totalRevenue = points.reduce((sum, point) => sum + point.amount, 0);
  const verifiedTransactions = points.reduce((sum, point) => sum + point.value, 0);
  const peakPoint = points.reduce(
    (highest, point) => (point.amount > highest.amount ? point : highest),
    points[0] ?? { label: "-", value: 0, amount: 0 }
  );

  return {
    label,
    points,
    summary: {
      totalRevenue,
      verifiedTransactions,
      averageRevenue: points.length ? Math.round(totalRevenue / points.length) : 0,
      peakRevenue: peakPoint.amount,
      peakLabel: peakPoint.label
    }
  };
}

function buildDayTrend(rows: TransactionMetricRow[], now = new Date()) {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: 6 }, (_, index) => ({
    startHour: index * 4,
    endHour: index * 4 + 3,
    label: `${String(index * 4).padStart(2, "0")}.00`,
    value: 0,
    amount: 0
  }));

  for (const row of rows) {
    const eventAt = makeSalesEventAt(row);
    if (eventAt < startOfDay) {
      continue;
    }

    const hour = eventAt.getHours();
    const bucketIndex = Math.min(Math.floor(hour / 4), buckets.length - 1);
    const bucket = buckets[bucketIndex];
    bucket.value += 1;
    bucket.amount += Number(row.amount ?? 0);
  }

  return makeTrendRange(
    buckets.map(({ label, value, amount }) => ({ label, value, amount })),
    "Hari Ini"
  );
}

function buildWeekTrend(rows: TransactionMetricRow[], now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      key: makeDayKey(date),
      label: makeDayLabel(date),
      value: 0,
      amount: 0
    };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const row of rows) {
    const bucket = bucketByKey.get(makeDayKey(makeSalesEventAt(row)));
    if (!bucket) {
      continue;
    }

    bucket.value += 1;
    bucket.amount += Number(row.amount ?? 0);
  }

  return makeTrendRange(
    buckets.map(({ label, value, amount }) => ({ label, value, amount })),
    "Minggu Ini"
  );
}

function buildMonthTrend(rows: TransactionMetricRow[], now = new Date()) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  const ranges = [
    { startDay: 1, endDay: Math.min(7, lastDay) },
    { startDay: 8, endDay: Math.min(14, lastDay) },
    { startDay: 15, endDay: Math.min(21, lastDay) },
    { startDay: 22, endDay: Math.min(28, lastDay) },
    { startDay: 29, endDay: lastDay }
  ].filter((range) => range.startDay <= range.endDay);
  const buckets = ranges.map((range) => ({
    ...range,
    label: `${range.startDay}-${range.endDay} ${MONTH_LABELS[currentMonth]}`,
    value: 0,
    amount: 0
  }));

  for (const row of rows) {
    const eventAt = makeSalesEventAt(row);
    if (eventAt.getFullYear() !== currentYear || eventAt.getMonth() !== currentMonth) {
      continue;
    }

    const bucket = buckets.find((entry) => {
      const day = eventAt.getDate();
      return day >= entry.startDay && day <= entry.endDay;
    });
    if (!bucket) {
      continue;
    }

    bucket.value += 1;
    bucket.amount += Number(row.amount ?? 0);
  }

  return makeTrendRange(
    buckets.map(({ label, value, amount }) => ({ label, value, amount })),
    "Bulan Ini"
  );
}

function buildSalesTrendRanges(rows: TransactionMetricRow[], now = new Date()) {
  const verifiedRows = rows.filter((row) => VERIFIED_TRANSACTION_STATUSES.has(row.status));

  return {
    defaultRange: "week" as const,
    ranges: {
      day: buildDayTrend(verifiedRows, now),
      week: buildWeekTrend(verifiedRows, now),
      month: buildMonthTrend(verifiedRows, now)
    }
  };
}

export async function getAdminDashboardData(unitId: string) {
  const [
    inventory,
    transactions,
    blacklist,
    [unit],
    [activeAccount],
    unitItems,
    catalogMetrics,
    transactionMetrics
  ] = await Promise.all([
    listAdminBarang(unitId),
    listAdminTransactions(unitId),
    listAdminBlacklist(unitId),
    db.select().from(units).where(eq(units.id, unitId)).limit(1),
    db
      .select()
      .from(unitAccounts)
      .where(and(eq(unitAccounts.unitId, unitId), eq(unitAccounts.isActive, true)))
      .limit(1),
    db
      .select({
        id: barang.id,
        status: barang.status,
        dueDate: barang.dueDate
      })
      .from(barang)
      .where(eq(barang.unitId, unitId)),
    getPublicCatalogUnitMetrics(unitId),
    db
      .select({
        id: transaksi.id,
        userId: transaksi.userId,
        amount: transaksi.amount,
        status: transaksi.status,
        createdAt: transaksi.createdAt,
        verifiedAt: transaksi.verifiedAt
      })
      .from(transaksi)
      .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
      .innerJoin(barang, eq(barang.id, pemasaran.barangId))
      .where(eq(barang.unitId, unitId))
  ]);
  const verifiedTransactions = transactionMetrics.filter((row) => VERIFIED_TRANSACTION_STATUSES.has(row.status));
  const actionableTransactions = transactionMetrics.filter((row) => ACTIONABLE_TRANSACTION_STATUSES.has(row.status));
  const totalRevenue = verifiedTransactions.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const uniqueBuyerCount = new Set(transactionMetrics.map((row) => row.userId)).size;
  const now = new Date();
  const inventoryMetrics = getAdminInventoryMetrics(unitItems, now);

  return {
    summary: {
      unitName: unit?.name ?? "Admin Unit",
      subtitle: "Ringkasan operasional unit",
      activeBank: activeAccount
        ? `${activeAccount.bankName} ${activeAccount.accountNumber}`
        : "Rekening aktif belum tersedia"
    },
    metrics: {
      totalItems: unitItems.length,
      readyForMarketing: inventoryMetrics.readyForMarketing,
      dueSoon: inventoryMetrics.dueSoon,
      soldItems: unitItems.filter((item) => item.status === "terjual").length || verifiedTransactions.length,
      redeemedItems: unitItems.filter((item) => item.status === "ditebus").length,
      activeAuctions: catalogMetrics.total,
      activeParticipants: uniqueBuyerCount,
      totalTransactions: transactionMetrics.length,
      verifiedTransactions: verifiedTransactions.length,
      actionableTransactions: actionableTransactions.length,
      uploadedProofTransactions: transactionMetrics.filter((row) => row.status === "bukti_diunggah").length,
      directConfirmationTransactions: transactionMetrics.filter((row) => row.status === "menunggu_konfirmasi_langsung").length,
      waitingPaymentTransactions: transactionMetrics.filter((row) => row.status === "menunggu_pembayaran").length,
      rejectedProofTransactions: transactionMetrics.filter((row) => row.status === "ditolak_bukti").length,
      activeBlacklist: blacklist.filter((entry) => String(entry.status).toUpperCase() === "AKTIF").length,
      totalRevenue,
      averageTransaction: verifiedTransactions.length ? Math.round(totalRevenue / verifiedTransactions.length) : 0,
      salesTrend: buildSalesTrendRanges(transactionMetrics, now)
    },
    inventory,
    transactions,
    blacklist
  };
}
