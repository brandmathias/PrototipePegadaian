import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db/client";
import { deriveEffectiveBlacklistState } from "@/lib/blacklist/effective-state";
import {
  barang,
  blacklists,
  pelanggaranUser,
  pemasaran,
  transaksi,
  unitAccounts,
  units,
  users,
} from "@/lib/db/schema";
import { getCountdownState } from "@/lib/countdown";
import { isHiddenOperationalUnit } from "@/lib/superadmin/hidden-operational-units";
import {
  buildGovernanceSnapshot,
  formatCompactRupiah,
} from "@/lib/superadmin/governance";

const HELD_TRANSACTION_STATUSES = [
  "menunggu_pembayaran",
  "bukti_diunggah",
  "menunggu_konfirmasi_langsung",
];

const VALIDATED_TRANSACTION_STATUSES = ["lunas", "selesai"];

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const WEEK_DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTH_WEEK_LABELS = [
  "Pekan 1",
  "Pekan 2",
  "Pekan 3",
  "Pekan 4",
  "Pekan 5",
];

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

async function getEffectiveBlacklistLevels(
  rows: Array<{
    blockedUntil: Date | null;
    totalViolations: number | null;
    userId: string;
  }>,
) {
  const userIds = Array.from(new Set(rows.map((row) => row.userId).filter(Boolean)));
  if (userIds.length === 0) {
    return new Map<string, number>();
  }

  const traces = await db
    .select({
      createdAt: pelanggaranUser.createdAt,
      escalationEligible: pelanggaranUser.escalationEligible,
      id: pelanggaranUser.id,
      userId: pelanggaranUser.userId,
    })
    .from(pelanggaranUser)
    .where(inArray(pelanggaranUser.userId, userIds))
    .orderBy(desc(pelanggaranUser.createdAt));

  const tracesByUser = new Map<string, typeof traces>();
  for (const trace of traces) {
    const current = tracesByUser.get(trace.userId) ?? [];
    current.push(trace);
    tracesByUser.set(trace.userId, current);
  }

  return new Map(
    rows.map((row) => [
      row.userId,
      deriveEffectiveBlacklistState({
        storedBlockedUntil: row.blockedUntil,
        storedTotalViolations: row.totalViolations,
        traces: (tracesByUser.get(row.userId) ?? []).map((trace) => ({
          createdAt: trace.createdAt,
          escalationEligible: trace.escalationEligible,
          id: trace.id,
          occurredAt: trace.createdAt.toISOString(),
        })),
      }).totalViolations,
    ]),
  );
}

export function getSuperAdminUnitDetailHref(unitId: string) {
  return `/superadmin/unit/${unitId}`;
}

type ValidatedTransactionTrendRow = {
  amount: string | number;
  transactionType: string | null;
  marketingMode: string | null;
  verifiedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
};

type ValidatedTrendPoint = {
  label: string;
  amount: number;
  vickreyAmount: number;
  fixedPriceAmount: number;
  count: number;
  volume: number;
};

function createTrendPoint(label: string): ValidatedTrendPoint {
  return {
    label,
    amount: 0,
    vickreyAmount: 0,
    fixedPriceAmount: 0,
    count: 0,
    volume: 0,
  };
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(value: Date) {
  const date = startOfDay(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  return addDays(date, diff);
}

function addRowToTrendPoint(
  point: ValidatedTrendPoint,
  row: ValidatedTransactionTrendRow,
) {
  const amount = Number(row.amount);
  const mode = String(
    row.transactionType ?? row.marketingMode ?? "",
  ).toLowerCase();

  if (mode.includes("fixed")) {
    point.fixedPriceAmount += amount;
  } else {
    point.vickreyAmount += amount;
  }

  point.amount += amount;
  point.count += 1;
  point.volume = point.count;
}

function summarizeTrendPoints(points: ValidatedTrendPoint[]) {
  const totalAmount = points.reduce((sum, point) => sum + point.amount, 0);
  const transactionCount = points.reduce((sum, point) => sum + point.count, 0);
  const vickreyAmount = points.reduce(
    (sum, point) => sum + point.vickreyAmount,
    0,
  );
  const fixedPriceAmount = points.reduce(
    (sum, point) => sum + point.fixedPriceAmount,
    0,
  );
  const dominantMode =
    vickreyAmount >= fixedPriceAmount ? "Lelang Tertutup" : "Harga Tetap";
  const dominantAmount = Math.max(vickreyAmount, fixedPriceAmount);
  const modeTotal = vickreyAmount + fixedPriceAmount;

  return {
    averageAmount: transactionCount > 0 ? totalAmount / transactionCount : 0,
    dominantMode,
    dominantPercent:
      modeTotal > 0 ? Math.round((dominantAmount / modeTotal) * 100) : 0,
    fixedPriceAmount,
    totalAmount,
    transactionCount,
    vickreyAmount,
  };
}

function buildValidatedTrend(
  rows: Array<{
    amount: string | number;
    transactionType: string | null;
    marketingMode: string | null;
    verifiedAt: Date | null;
    updatedAt: Date;
    createdAt: Date;
  }>,
  now = new Date(),
) {
  const currentYear = now.getFullYear();
  const buckets = Array.from({ length: 12 }, (_, monthIndex) =>
    createTrendPoint(MONTH_LABELS[monthIndex]),
  );

  for (const row of rows) {
    const eventAt = row.verifiedAt ?? row.updatedAt ?? row.createdAt;
    if (eventAt.getFullYear() !== currentYear) {
      continue;
    }

    const current = buckets[eventAt.getMonth()];
    addRowToTrendPoint(current, row);
  }

  return buckets;
}

function buildValidatedTrendRanges(
  rows: ValidatedTransactionTrendRow[],
  now = new Date(),
) {
  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const ranges = {
    week: {
      label: "Minggu Ini",
      points: WEEK_DAY_LABELS.map(createTrendPoint),
    },
    month: {
      label: "Bulan Ini",
      points: MONTH_WEEK_LABELS.map(createTrendPoint),
    },
    year: {
      label: "Tahun Ini",
      points: MONTH_LABELS.map(createTrendPoint),
    },
  };

  for (const row of rows) {
    const eventAt = row.verifiedAt ?? row.updatedAt ?? row.createdAt;

    if (eventAt >= weekStart && eventAt < weekEnd) {
      const dayIndex = Math.floor(
        (startOfDay(eventAt).getTime() - weekStart.getTime()) /
          (24 * 60 * 60 * 1000),
      );
      const point = ranges.week.points[dayIndex];

      if (point) {
        addRowToTrendPoint(point, row);
      }
    }

    if (
      eventAt.getFullYear() === currentYear &&
      eventAt.getMonth() === currentMonth
    ) {
      const weekIndex = Math.min(Math.floor((eventAt.getDate() - 1) / 7), 4);
      addRowToTrendPoint(ranges.month.points[weekIndex], row);
    }

    if (eventAt.getFullYear() === currentYear) {
      addRowToTrendPoint(ranges.year.points[eventAt.getMonth()], row);
    }
  }

  return {
    week: {
      ...ranges.week,
      summary: summarizeTrendPoints(ranges.week.points),
    },
    month: {
      ...ranges.month,
      summary: summarizeTrendPoints(ranges.month.points),
    },
    year: {
      ...ranges.year,
      summary: summarizeTrendPoints(ranges.year.points),
    },
  };
}

export function buildSuperAdminUnitRowsQuery() {
  const monitoringUnits = alias(units, "monitoring_units");
  const outerUnitId = sql.raw('"monitoring_units"."id"');
  const outerUnitIsActive = sql.raw('"monitoring_units"."is_active"');

  return db
    .select({
      id: monitoringUnits.id,
      unitName: monitoringUnits.name,
      unitCode: monitoringUnits.code,
      collateralItems: sql<number>`(
        select count(*)::int
        from barang b
        where b.unit_id = ${outerUnitId}
          and b.status in ('gadai', 'jaminan')
          and b.due_date > now()
      )`,
      marketedItems: sql<number>`(
        select count(distinct b.id)::int
        from barang b
        inner join pemasaran p on p.barang_id = b.id
        where b.unit_id = ${outerUnitId}
          and b.status = 'dipasarkan'
          and p.status = 'aktif'
          and (
            p.mode <> 'fixed_price'
            or not exists (
              select 1
              from transaksi locked_t
              where locked_t.pemasaran_id = p.id
                and locked_t.status in ('bukti_diunggah', 'menunggu_konfirmasi_langsung', 'lunas', 'selesai')
            )
          )
      )`,
      soldItems: sql<number>`(
        select count(distinct b.id)::int
        from barang b
        left join pemasaran p on p.barang_id = b.id
        left join transaksi t on t.pemasaran_id = p.id
        where b.unit_id = ${outerUnitId}
          and (b.status = 'terjual' or t.status in ('lunas', 'selesai'))
      )`,
      validatedTransactionValue: sql<number>`(
        select coalesce(sum(t.amount), 0)
        from transaksi t
        inner join pemasaran p on p.id = t.pemasaran_id
        inner join barang b on b.id = p.barang_id
        where b.unit_id = ${outerUnitId}
          and t.status in (${sql.join(
            VALIDATED_TRANSACTION_STATUSES.map((status) => sql`${status}`),
            sql`, `,
          )})
      )`,
      followUpItems: sql<number>`(
        select count(distinct b.id)::int
        from barang b
        left join pemasaran p on p.barang_id = b.id
        left join transaksi t on t.pemasaran_id = p.id
        where b.unit_id = ${outerUnitId}
          and b.status not in ('terjual', 'ditebus')
          and not exists (
            select 1
            from pemasaran active_p
            where active_p.barang_id = b.id
              and b.status = 'dipasarkan'
              and active_p.status = 'aktif'
              and (
                active_p.mode <> 'fixed_price'
                or not exists (
                  select 1
                  from transaksi locked_t
                  where locked_t.pemasaran_id = active_p.id
                    and locked_t.status in ('bukti_diunggah', 'menunggu_konfirmasi_langsung', 'lunas', 'selesai')
                )
              )
          )
          and (
            b.status = 'gagal'
            or p.status = 'gagal'
            or
            (
              t.status = 'ditolak_bukti'
              and coalesce(t.type, p.mode) = 'fixed_price'
              and p.status <> 'aktif'
            )
          )
      )`,
      heldTransactions: sql<number>`(
        select count(distinct t.id)::int
        from transaksi t
        inner join pemasaran p on p.id = t.pemasaran_id
        inner join barang b on b.id = p.barang_id
        where b.unit_id = ${outerUnitId}
          and t.status in ('menunggu_pembayaran', 'bukti_diunggah', 'menunggu_konfirmasi_langsung')
      )`,
      activeViolations: sql<number>`(
        select count(distinct pu.id)::int
        from pelanggaran_user pu
        where pu.unit_id = ${outerUnitId}
          and pu.escalation_eligible = true
          and pu.resolved_at is null
      )`,
      status: sql<string>`case
        when ${outerUnitIsActive} = false then 'Nonaktif'
        when (
          select count(*)::int
          from rekening_unit ra
          where ra.unit_id = ${outerUnitId}
            and ra.is_active = true
        ) = 0 then 'Perlu Tindak Lanjut'
        when (
          select count(*)::int
          from "user" au
          where au.unit_id = ${outerUnitId}
            and au.role = 'admin_unit'
            and au.is_active = true
        ) = 0 then 'Perlu Tindak Lanjut'
        else 'Aktif'
      end`,
    })
    .from(monitoringUnits)
    .orderBy(monitoringUnits.name);
}

export async function getSuperAdminMonitoring() {
  const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
  const now = new Date();

  const unitRows = (await buildSuperAdminUnitRowsQuery()).filter(
    (unit) => !isHiddenOperationalUnit({ id: unit.id, code: unit.unitCode }),
  );
  const visibleUnitIds = unitRows.map((unit) => unit.id);
  const totalUnitCount = unitRows.length;
  const activeUnitCount = unitRows.filter((unit) => unit.status !== "Nonaktif").length;

  const adminStats =
    visibleUnitIds.length > 0
      ? (
          await db
            .select({
              totalAdmins: sql<number>`count(*) filter (where ${users.role} = 'admin_unit' and ${users.isActive} = true)`,
            })
            .from(users)
            .where(inArray(users.unitId, visibleUnitIds))
        )[0]
      : { totalAdmins: 0 };

  const accountStats =
    visibleUnitIds.length > 0
      ? (
          await db
            .select({
              activeAccounts: sql<number>`count(*) filter (where ${unitAccounts.isActive} = true)`,
            })
            .from(unitAccounts)
            .where(inArray(unitAccounts.unitId, visibleUnitIds))
        )[0]
      : { activeAccounts: 0 };

  const [blacklistStats] = await db
    .select({
      activeBlacklists: sql<number>`count(*) filter (where ${blacklists.isActive} = true)`,
    })
    .from(blacklists);

  const activeBlacklistLevelRows = await db
    .select({
      blockedUntil: blacklists.blockedUntil,
      totalViolations: blacklists.totalViolations,
      userId: blacklists.userId,
    })
    .from(blacklists)
    .where(eq(blacklists.isActive, true));
  const effectiveBlacklistLevels = await getEffectiveBlacklistLevels(activeBlacklistLevelRows);
  const complianceStats = Array.from(effectiveBlacklistLevels.values()).reduce(
    (accumulator, level) => {
      if (level <= 0) {
        return accumulator;
      }
      if (level === 1) {
        accumulator.levelOne += 1;
      } else if (level === 2) {
        accumulator.levelTwo += 1;
      } else {
        accumulator.levelThree += 1;
      }

      return accumulator;
    },
    { levelOne: 0, levelThree: 0, levelTwo: 0 },
  );

  const [transactionStats] = await db
    .select({
      heldTransactions: sql<number>`count(*) filter (where ${transaksi.status} in (${sql.join(
        HELD_TRANSACTION_STATUSES.map((status) => sql`${status}`),
        sql`, `,
      )}))`,
      overdueTransactions: sql<number>`count(*) filter (where ${transaksi.status} in (${sql.join(
        HELD_TRANSACTION_STATUSES.map((status) => sql`${status}`),
        sql`, `,
      )}) and ${transaksi.paymentDeadline} is not null and ${transaksi.paymentDeadline} <= ${now})`,
      validatedTransactionValue: sql<number>`coalesce(sum(${transaksi.amount}) filter (where ${transaksi.status} in (${sql.join(
        VALIDATED_TRANSACTION_STATUSES.map((status) => sql`${status}`),
        sql`, `,
      )})), 0)`,
    })
    .from(transaksi);

  const [nationalStats] = await db
    .select({
      collateralItems: sql<number>`count(*) filter (where ${barang.status} in ('gadai', 'jaminan') and ${barang.dueDate} > now())`,
      marketedItems: sql<number>`(
        select count(distinct b.id)::int
        from barang b
        inner join pemasaran p on p.barang_id = b.id
        where b.status = 'dipasarkan'
          and p.status = 'aktif'
          and (
            p.mode <> 'fixed_price'
            or not exists (
              select 1
              from transaksi locked_t
              where locked_t.pemasaran_id = p.id
                and locked_t.status in ('bukti_diunggah', 'menunggu_konfirmasi_langsung', 'lunas', 'selesai')
            )
          )
      )`,
      soldItems: sql<number>`(
        select count(distinct b.id)::int
        from barang b
        left join pemasaran p on p.barang_id = b.id
        left join transaksi t on t.pemasaran_id = p.id
        where b.status = 'terjual' or t.status in ('lunas', 'selesai')
      )`,
      followUpItems: sql<number>`(
        select count(distinct b.id)::int
        from barang b
        left join pemasaran p on p.barang_id = b.id
        left join transaksi t on t.pemasaran_id = p.id
        where
          b.status not in ('terjual', 'ditebus')
          and
          not exists (
            select 1
            from pemasaran active_p
            where active_p.barang_id = b.id
              and b.status = 'dipasarkan'
              and active_p.status = 'aktif'
              and (
                active_p.mode <> 'fixed_price'
                or not exists (
                  select 1
                  from transaksi locked_t
                  where locked_t.pemasaran_id = active_p.id
                    and locked_t.status in ('bukti_diunggah', 'menunggu_konfirmasi_langsung', 'lunas', 'selesai')
                )
              )
          )
          and
          (
            b.status = 'gagal'
            or p.status = 'gagal'
            or
            (
              t.status = 'ditolak_bukti'
              and coalesce(t.type, p.mode) = 'fixed_price'
              and p.status <> 'aktif'
            )
          )
      )`,
    })
    .from(barang);

  const validatedTransactionRows = await db
    .select({
      amount: transaksi.amount,
      transactionType: transaksi.type,
      marketingMode: pemasaran.mode,
      verifiedAt: transaksi.verifiedAt,
      updatedAt: transaksi.updatedAt,
      createdAt: transaksi.createdAt,
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(transaksi.pemasaranId, pemasaran.id))
    .where(inArray(transaksi.status, VALIDATED_TRANSACTION_STATUSES))
    .orderBy(asc(transaksi.verifiedAt), asc(transaksi.updatedAt));

  const unitsNeedAttention = await db
    .select({
      id: units.id,
      code: units.code,
      name: units.name,
      address: units.address,
      isActive: units.isActive,
      activeAccountCount: sql<number>`count(distinct ${unitAccounts.id}) filter (where ${unitAccounts.isActive} = true)`,
      activeAdminCount: sql<number>`count(distinct ${users.id}) filter (where ${users.role} = 'admin_unit' and ${users.isActive} = true)`,
    })
    .from(units)
    .leftJoin(unitAccounts, eq(unitAccounts.unitId, units.id))
    .leftJoin(users, eq(users.unitId, units.id))
    .groupBy(units.id)
    .having(
      or(
        eq(units.isActive, false),
        sql`count(distinct ${unitAccounts.id}) filter (where ${unitAccounts.isActive} = true) = 0`,
        sql`count(distinct ${users.id}) filter (where ${users.role} = 'admin_unit' and ${users.isActive} = true) = 0`,
      ),
    );

  const visibleUnitsNeedAttention = unitsNeedAttention.filter(
    (unit) => !isHiddenOperationalUnit(unit),
  );

  const monitoringItems = visibleUnitsNeedAttention.map((unit) => ({
    id: `attention-${unit.id}`,
    unitId: unit.id,
    href: getSuperAdminUnitDetailHref(unit.id),
    unit: unit.name,
    scope: "Unit",
    status: unit.isActive ? "Perlu Tindak Lanjut" : "Perlu Review",
    activity:
      Number(unit.activeAccountCount) === 0
        ? "Unit belum memiliki rekening aktif utama."
        : Number(unit.activeAdminCount) === 0
          ? "Unit belum memiliki admin aktif."
          : "Unit sedang nonaktif.",
    detail: `${unit.address} | Admin aktif: ${Number(unit.activeAdminCount)} | Rekening aktif: ${Number(unit.activeAccountCount)}`,
  }));

  const activeTransactionMonitoring = await db
    .select({
      id: transaksi.id,
      unitId: units.id,
      unit: units.name,
      lotName: barang.name,
      amount: transaksi.amount,
      paymentMethod: transaksi.paymentMethod,
      status: transaksi.status,
      paymentDeadline: transaksi.paymentDeadline,
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(transaksi.pemasaranId, pemasaran.id))
    .innerJoin(barang, eq(pemasaran.barangId, barang.id))
    .innerJoin(units, eq(barang.unitId, units.id))
    .where(
      and(
        isNotNull(transaksi.paymentDeadline),
        inArray(transaksi.status, HELD_TRANSACTION_STATUSES),
      ),
    )
    .orderBy(asc(transaksi.paymentDeadline))
    .limit(4);

  const activeAuctionMonitoring = await db
    .select({
      id: pemasaran.id,
      unitId: units.id,
      unit: units.name,
      lotName: barang.name,
      basePrice: pemasaran.basePrice,
      endsAt: pemasaran.endsAt,
    })
    .from(pemasaran)
    .innerJoin(barang, eq(pemasaran.barangId, barang.id))
    .innerJoin(units, eq(barang.unitId, units.id))
    .where(
      and(
        eq(pemasaran.mode, "vickrey"),
        eq(pemasaran.status, "aktif"),
        isNotNull(pemasaran.endsAt),
      ),
    )
    .orderBy(asc(pemasaran.endsAt))
    .limit(4);

  const activeBlacklistMonitoring = await db
    .select({
      id: blacklists.id,
      userId: blacklists.userId,
      unitId: units.id,
      unit: units.name,
      buyerName: users.name,
      totalViolations: blacklists.totalViolations,
      blockedUntil: blacklists.blockedUntil,
    })
    .from(blacklists)
    .innerJoin(users, eq(users.id, blacklists.userId))
    .leftJoin(units, eq(units.id, blacklists.unitId))
    .where(
      and(
        eq(blacklists.isActive, true),
        isNotNull(blacklists.blockedUntil),
        gt(blacklists.blockedUntil, now),
      ),
    )
    .orderBy(asc(blacklists.blockedUntil))
    .limit(3);

  const visibleActiveTransactionMonitoring = activeTransactionMonitoring.filter(
    (item) => !isHiddenOperationalUnit({ id: item.unitId }),
  );
  const visibleActiveAuctionMonitoring = activeAuctionMonitoring.filter(
    (item) => !isHiddenOperationalUnit({ id: item.unitId }),
  );
  const visibleActiveBlacklistMonitoring = activeBlacklistMonitoring
    .filter((item) => !isHiddenOperationalUnit({ id: item.unitId }))
    .map((item) => ({
      ...item,
      totalViolations: effectiveBlacklistLevels.get(item.userId) ?? item.totalViolations,
    }));

  const timeSensitiveMonitoring = [
    ...visibleActiveTransactionMonitoring.map((item) => {
      const countdown = getCountdownState(item.paymentDeadline, {
        expiredLabel: "SLA pembayaran terlewati",
      });
      const isWaitingVerification = item.status === "bukti_diunggah";
      const isDirectPayment = item.status === "menunggu_konfirmasi_langsung";

      return {
        id: `transaction-${item.id}`,
        unitId: item.unitId,
        href: `/superadmin/monitoring-unit`,
        unit: item.unit,
        scope: "Transaksi",
        status: isWaitingVerification ? "Perlu Review" : "Perlu Tindak Lanjut",
        activity: isWaitingVerification
          ? `Bukti pembayaran ${item.lotName} sedang menunggu verifikasi unit.`
          : isDirectPayment
            ? `Pengajuan bayar langsung ${item.lotName} menunggu konfirmasi petugas.`
            : `Pembayaran ${item.lotName} masih dalam masa unggah bukti transfer.`,
        detail: `${item.unit} | ${item.paymentMethod === "langsung" ? "Bayar langsung di unit" : "Transfer bank"} | ${currencyFormatter.format(Number(item.amount))}`,
        countdownLabel: countdown.label,
        countdownAt: item.paymentDeadline?.toISOString(),
        expiredLabel: "SLA pembayaran terlewati",
      };
    }),
    ...visibleActiveAuctionMonitoring.map((item) => {
      const countdown = getCountdownState(item.endsAt, {
        expiredLabel: "Sesi lelang berakhir",
      });

      return {
        id: `auction-${item.id}`,
        unitId: item.unitId,
        href: `/superadmin/monitoring-unit`,
        unit: item.unit,
        scope: "Lelang",
        status: "Perlu Review",
        activity: `Sesi Lelang Tertutup ${item.lotName} segera ditutup dan menunggu pemantauan hasil.`,
        detail: `${item.unit} | Harga dasar ${currencyFormatter.format(Number(item.basePrice ?? 0))}`,
        countdownLabel: countdown.label,
        countdownAt: item.endsAt?.toISOString(),
        expiredLabel: "Sesi lelang berakhir",
      };
    }),
    ...visibleActiveBlacklistMonitoring.map((item) => {
      const countdown = getCountdownState(item.blockedUntil, {
        expiredLabel: "Masa pembatasan selesai",
      });

      return {
        id: `blacklist-${item.id}`,
        unitId: item.unitId ?? "",
        href: "/superadmin/blacklist",
        unit: item.unit ?? "Lintas unit",
        scope: "Pembatasan",
        status: "Perlu Evaluasi",
        activity: `Masa pembatasan buyer ${item.buyerName} segera berakhir dan perlu evaluasi lanjutan.`,
        detail: `${item.unit ?? "Lintas unit"} | ${item.totalViolations} pelanggaran tercatat`,
        countdownLabel: countdown.label,
        countdownAt: item.blockedUntil?.toISOString(),
        expiredLabel: "Masa pembatasan selesai",
      };
    }),
  ].sort((left, right) => {
    const leftTime = left.countdownAt
      ? new Date(left.countdownAt).getTime()
      : Number.MAX_SAFE_INTEGER;
    const rightTime = right.countdownAt
      ? new Date(right.countdownAt).getTime()
      : Number.MAX_SAFE_INTEGER;

    return leftTime - rightTime;
  });

  const actionPriorities = [
    {
      id: "priority-follow-up",
      value: toNumber(nationalStats?.followUpItems),
      title: "Pemasaran perlu tindak lanjut",
      detail:
        "Ada harga tetap ditolak, lelang tanpa bid, atau pemasaran gagal yang perlu dibaca sebagai tindak lanjut.",
      href: "/superadmin/monitoring-unit",
      action: "Buka monitoring",
    },
    {
      id: "priority-sla",
      value: toNumber(transactionStats?.overdueTransactions),
      title: "SLA transaksi terlewati",
      detail: `${toNumber(transactionStats?.overdueTransactions)} transaksi tertahan sudah melewati tenggat.`,
      href: "/superadmin/monitoring-unit",
      action: "Cek SLA",
    },
    {
      id: "priority-unit-admin",
      value: monitoringItems.length,
      title: "Unit perlu kelengkapan operasional",
      detail: `${monitoringItems.length} unit perlu admin aktif atau rekening utama aktif.`,
      href: "/superadmin/manajemen-unit",
      action: "Kelola unit",
    },
  ].filter((item) => item.value > 0);

  const timedPriorities = timeSensitiveMonitoring.slice(0, 3).map((item) => ({
    id: item.id,
    title: `${item.unit} - ${item.scope}`,
    detail: item.activity,
    href: item.href ?? `/superadmin/unit/${item.unitId}`,
    action: item.scope === "Pembatasan" ? "Buka blacklist" : "Buka monitoring",
    countdownLabel: item.countdownLabel,
    countdownAt: item.countdownAt,
    expiredLabel: item.expiredLabel,
  }));

  const fallbackPriorities = monitoringItems.slice(0, 3).map((item) => ({
    id: item.id,
    title: item.unit,
    detail: item.activity,
    href: item.href ?? `/superadmin/unit/${item.unitId}`,
    action: "Kelola unit",
  }));

  const priorityItems = [
    ...actionPriorities,
    ...timedPriorities,
    ...fallbackPriorities,
  ].slice(0, 5);
  const validatedTransactionValue = toNumber(
    transactionStats?.validatedTransactionValue,
  );
  const lifecycle = [
    {
      label: "Barang Jaminan",
      value: toNumber(nationalStats?.collateralItems),
    },
    {
      label: "Sedang Dipasarkan",
      value: toNumber(nationalStats?.marketedItems),
    },
    { label: "Terjual", value: toNumber(nationalStats?.soldItems) },
    {
      label: "Perlu Tindak Lanjut",
      value: toNumber(nationalStats?.followUpItems),
    },
  ];

  return {
    summary: {
      headline:
        "Pusat keputusan nasional yang ringkas untuk monitoring unit, pembatasan akun, dan tindak lanjut operasional.",
      metrics: [
        {
          label: "Total Unit",
          value: String(totalUnitCount),
          detail: `${activeUnitCount} unit aktif nasional`,
        },
        {
          label: "Unit Aktif",
          value: String(activeUnitCount),
          detail: "Unit yang dapat dipakai operasional",
        },
        {
          label: "Perlu Penugasan Admin",
          value: String(monitoringItems.length),
          detail: "Unit tanpa admin aktif atau rekening utama aktif",
        },
        {
          label: "Transaksi Tertahan",
          value: String(toNumber(transactionStats?.heldTransactions)),
          detail: "Pembayaran atau konfirmasi masih berjalan",
        },
        {
          label: "SLA Terlewati",
          value: String(toNumber(transactionStats?.overdueTransactions)),
          detail: "Transaksi tertahan yang melewati batas waktu",
        },
      ],
      spotlight: [
        {
          label: "Admin aktif",
          value: `${toNumber(adminStats?.totalAdmins)} akun`,
        },
        {
          label: "Rekening aktif utama",
          value: `${toNumber(accountStats?.activeAccounts)} rekening`,
        },
        {
          label: "Pembatasan aktif",
          value: `${toNumber(blacklistStats?.activeBlacklists)} buyer`,
        },
      ],
      priorities: priorityItems,
    },
    governance: {
      snapshot: buildGovernanceSnapshot({
        collateralItems: toNumber(nationalStats?.collateralItems),
        marketedItems: toNumber(nationalStats?.marketedItems),
        soldItems: toNumber(nationalStats?.soldItems),
        followUpItems: toNumber(nationalStats?.followUpItems),
        validatedTransactionValue,
      }),
      lifecycle,
      validatedTrend: buildValidatedTrend(validatedTransactionRows, now),
      validatedTrendRanges: buildValidatedTrendRanges(
        validatedTransactionRows,
        now,
      ),
      complianceLevels: [
        {
          label: "Level 1 (Ringan)",
          description: "Buyer dengan 1 catatan pelanggaran aktif",
          count: toNumber(complianceStats?.levelOne),
          tone: "amber" as const,
        },
        {
          label: "Level 2 (Sedang)",
          description: "Buyer dengan 2 catatan pelanggaran aktif",
          count: toNumber(complianceStats?.levelTwo),
          tone: "orange" as const,
        },
        {
          label: "Level 3 (Tinggi)",
          description: "Buyer dengan 3+ catatan pelanggaran aktif",
          count: toNumber(complianceStats?.levelThree),
          tone: "red" as const,
        },
      ],
      validatedTransactionValueLabel: formatCompactRupiah(
        validatedTransactionValue,
      ),
    },
    unitRows: unitRows.map((row) => ({
      id: row.id,
      unitName: row.unitName,
      unitCode: row.unitCode,
      collateralItems: toNumber(row.collateralItems),
      marketedItems: toNumber(row.marketedItems),
      soldItems: toNumber(row.soldItems),
      validatedTransactionValue: toNumber(row.validatedTransactionValue),
      followUpItems: toNumber(row.followUpItems),
      heldTransactions: toNumber(row.heldTransactions),
      activeViolations: toNumber(row.activeViolations),
      status: row.status,
    })),
    unitsNeedAttention: monitoringItems,
    pendingMonitoring: [...timeSensitiveMonitoring, ...monitoringItems].slice(
      0,
      6,
    ),
  };
}
