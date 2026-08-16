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
const COMPLETED_TRANSACTION_STATUSES = new Set(["selesai"]);
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const SALES_TIMEFRAME_KEYS = [
  "day",
  "week",
  "month",
  "last7",
  "last30",
  "last3Months",
  "last12Months",
  "yearToDate",
  "allTime"
] as const;

type SalesTimeframeKey = (typeof SALES_TIMEFRAME_KEYS)[number];

type DashboardTrendPoint = {
  label: string;
  value: number;
  amount: number;
  fixedPriceAmount: number;
  vickreyAmount: number;
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
  itemId: string;
  userId: string;
  amount: string | null;
  status: string;
  transactionType: string | null;
  marketingMode: string | null;
  createdAt: Date;
  verifiedAt: Date | null;
  completedAt: Date | null;
};

export function summarizeAdminDashboardTransactions(rows: TransactionMetricRow[]) {
  const verifiedTransactions = rows.filter((row) => COMPLETED_TRANSACTION_STATUSES.has(row.status));

  return {
    soldItems: new Set(verifiedTransactions.map((row) => row.itemId)).size,
    totalRevenue: verifiedTransactions.reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
    verifiedTransactions
  };
}

function makeDayKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function makeDayLabel(value: Date) {
  return `${value.getDate()} ${MONTH_LABELS[value.getMonth()]}`;
}

function makeMonthKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function makeMonthLabel(value: Date) {
  return `${MONTH_LABELS[value.getMonth()]} ${value.getFullYear()}`;
}

function makeSalesEventAt(row: TransactionMetricRow) {
  return row.completedAt ?? row.verifiedAt ?? row.createdAt;
}

function makeBucketPoint(label: string): DashboardTrendPoint {
  return { label, value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 };
}

function addRowToBucket(point: DashboardTrendPoint, row: TransactionMetricRow) {
  const amount = Number(row.amount ?? 0);
  const mode = String(row.transactionType ?? row.marketingMode ?? "").toLowerCase();

  if (mode.includes("fixed")) {
    point.fixedPriceAmount += amount;
  } else {
    point.vickreyAmount += amount;
  }

  point.value += 1;
  point.amount += amount;
}

function makeTrendRange(points: DashboardTrendPoint[], label: string): DashboardTrendRange {
  const totalRevenue = points.reduce((sum, point) => sum + point.amount, 0);
  const verifiedTransactions = points.reduce((sum, point) => sum + point.value, 0);
  const peakPoint = points.reduce(
    (highest, point) => (point.amount > highest.amount ? point : highest),
    points[0] ?? makeBucketPoint("-")
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
    ...makeBucketPoint(`${String(index * 4).padStart(2, "0")}.00`)
  }));

  for (const row of rows) {
    const eventAt = makeSalesEventAt(row);
    if (eventAt < startOfDay) {
      continue;
    }

    const hour = eventAt.getHours();
    const bucketIndex = Math.min(Math.floor(hour / 4), buckets.length - 1);
    const bucket = buckets[bucketIndex];
    addRowToBucket(bucket, row);
  }

  return makeTrendRange(
    buckets.map(({ label, value, amount, fixedPriceAmount, vickreyAmount }) => ({ label, value, amount, fixedPriceAmount, vickreyAmount })),
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
      ...makeBucketPoint(makeDayLabel(date))
    };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const row of rows) {
    const bucket = bucketByKey.get(makeDayKey(makeSalesEventAt(row)));
    if (!bucket) {
      continue;
    }

    addRowToBucket(bucket, row);
  }

  return makeTrendRange(
    buckets.map(({ label, value, amount, fixedPriceAmount, vickreyAmount }) => ({ label, value, amount, fixedPriceAmount, vickreyAmount })),
    "Minggu Ini"
  );
}

function buildRollingDayTrend(rows: TransactionMetricRow[], now: Date, days: number, label: string) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));

    return {
      key: makeDayKey(date),
      ...makeBucketPoint(makeDayLabel(date))
    };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const row of rows) {
    const bucket = bucketByKey.get(makeDayKey(makeSalesEventAt(row)));
    if (!bucket) {
      continue;
    }

    addRowToBucket(bucket, row);
  }

  return makeTrendRange(
    buckets.map(({ label: bucketLabel, value, amount, fixedPriceAmount, vickreyAmount }) => ({ label: bucketLabel, value, amount, fixedPriceAmount, vickreyAmount })),
    label
  );
}

function buildMonthTrend(rows: TransactionMetricRow[], now = new Date()) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  const buckets = Array.from({ length: lastDay }, (_, index) => {
    const date = new Date(currentYear, currentMonth, index + 1);

    return {
      key: makeDayKey(date),
      ...makeBucketPoint(makeDayLabel(date))
    };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const row of rows) {
    const eventAt = makeSalesEventAt(row);
    const bucket = bucketByKey.get(makeDayKey(eventAt));
    if (!bucket) {
      continue;
    }

    addRowToBucket(bucket, row);
  }

  return makeTrendRange(
    buckets.map(({ label, value, amount, fixedPriceAmount, vickreyAmount }) => ({ label, value, amount, fixedPriceAmount, vickreyAmount })),
    "Bulan Berlangsung"
  );
}

function buildRecentMonthsTrend(rows: TransactionMetricRow[], now: Date, monthCount: number, label: string) {
  const startMonth = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);
  const buckets = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + index, 1);

    return {
      key: makeMonthKey(date),
      ...makeBucketPoint(makeMonthLabel(date))
    };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const row of rows) {
    const eventAt = makeSalesEventAt(row);
    const bucket = bucketByKey.get(makeMonthKey(eventAt));
    if (!bucket) {
      continue;
    }

    addRowToBucket(bucket, row);
  }

  return makeTrendRange(
    buckets.map(({ label: bucketLabel, value, amount, fixedPriceAmount, vickreyAmount }) => ({ label: bucketLabel, value, amount, fixedPriceAmount, vickreyAmount })),
    label
  );
}

function buildYearToDateTrend(rows: TransactionMetricRow[], now = new Date()) {
  const monthCount = now.getMonth() + 1;
  const buckets = Array.from({ length: monthCount }, (_, monthIndex) => ({
    key: `${now.getFullYear()}-${String(monthIndex + 1).padStart(2, "0")}`,
    ...makeBucketPoint(MONTH_LABELS[monthIndex])
  }));
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const row of rows) {
    const eventAt = makeSalesEventAt(row);
    if (eventAt.getFullYear() !== now.getFullYear()) {
      continue;
    }

    const bucket = bucketByKey.get(makeMonthKey(eventAt));
    if (!bucket) {
      continue;
    }

    addRowToBucket(bucket, row);
  }

  return makeTrendRange(
    buckets.map(({ label, value, amount, fixedPriceAmount, vickreyAmount }) => ({ label, value, amount, fixedPriceAmount, vickreyAmount })),
    "Tahun Berjalan"
  );
}

function buildAllTimeTrend(rows: TransactionMetricRow[], now = new Date()) {
  if (rows.length === 0) {
    return buildRecentMonthsTrend(rows, now, 12, "Semua Waktu");
  }

  const eventTimes = rows.map((row) => makeSalesEventAt(row).getTime());
  const first = new Date(Math.min(...eventTimes));
  const last = new Date(Math.max(...eventTimes, now.getTime()));
  const totalMonths =
    (last.getFullYear() - first.getFullYear()) * 12 + last.getMonth() - first.getMonth() + 1;
  const buckets = Array.from({ length: totalMonths }, (_, index) => {
    const date = new Date(first.getFullYear(), first.getMonth() + index, 1);

    return {
      key: makeMonthKey(date),
      ...makeBucketPoint(makeMonthLabel(date))
    };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const row of rows) {
    const bucket = bucketByKey.get(makeMonthKey(makeSalesEventAt(row)));
    if (!bucket) {
      continue;
    }

    addRowToBucket(bucket, row);
  }

  return makeTrendRange(
    buckets.map(({ label, value, amount, fixedPriceAmount, vickreyAmount }) => ({ label, value, amount, fixedPriceAmount, vickreyAmount })),
    "Semua Waktu"
  );
}

function buildSalesTrendRanges(rows: TransactionMetricRow[], now = new Date()) {
  const verifiedRows = rows.filter((row) => COMPLETED_TRANSACTION_STATUSES.has(row.status));

  return {
    defaultRange: "month" as const,
    events: verifiedRows.map((row) => ({
      amount: Number(row.amount ?? 0),
      marketingMode: row.marketingMode,
      occurredAt: makeSalesEventAt(row).toISOString(),
      transactionType: row.transactionType
    })),
    ranges: {
      day: buildDayTrend(verifiedRows, now),
      week: buildWeekTrend(verifiedRows, now),
      month: buildMonthTrend(verifiedRows, now),
      last7: buildRollingDayTrend(verifiedRows, now, 7, "7 Hari Terakhir"),
      last30: buildRollingDayTrend(verifiedRows, now, 30, "30 Hari Terakhir"),
      last3Months: buildRecentMonthsTrend(verifiedRows, now, 3, "3 Bulan Terakhir"),
      last12Months: buildRecentMonthsTrend(verifiedRows, now, 12, "12 Bulan Terakhir"),
      yearToDate: buildYearToDateTrend(verifiedRows, now),
      allTime: buildAllTimeTrend(verifiedRows, now)
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
        itemId: barang.id,
        userId: transaksi.userId,
        amount: transaksi.amount,
        transactionType: transaksi.type,
        marketingMode: pemasaran.mode,
        status: transaksi.status,
        createdAt: transaksi.createdAt,
        verifiedAt: transaksi.verifiedAt,
        completedAt: transaksi.completedAt
      })
      .from(transaksi)
      .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
      .innerJoin(barang, eq(barang.id, pemasaran.barangId))
      .where(eq(barang.unitId, unitId))
  ]);
  const {
    soldItems,
    totalRevenue,
    verifiedTransactions
  } = summarizeAdminDashboardTransactions(transactionMetrics);
  const actionableTransactions = transactionMetrics.filter((row) => ACTIONABLE_TRANSACTION_STATUSES.has(row.status));
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
      soldItems,
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
