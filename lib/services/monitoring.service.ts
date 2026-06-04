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
import {
  barang,
  blacklistReviewCases,
  blacklists,
  pemasaran,
  transaksi,
  unitAccounts,
  units,
  users,
} from "@/lib/db/schema";
import { getCountdownState } from "@/lib/countdown";
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

function toNumber(value: unknown) {
  return Number(value ?? 0);
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
  const buckets = Array.from({ length: 12 }, (_, monthIndex) => ({
    label: MONTH_LABELS[monthIndex],
    amount: 0,
    vickreyAmount: 0,
    fixedPriceAmount: 0,
    count: 0,
    volume: 0,
  }));

  for (const row of rows) {
    const eventAt = row.verifiedAt ?? row.updatedAt ?? row.createdAt;
    if (eventAt.getFullYear() !== currentYear) {
      continue;
    }

    const current = buckets[eventAt.getMonth()];
    const amount = Number(row.amount);
    const mode = String(
      row.transactionType ?? row.marketingMode ?? "",
    ).toLowerCase();

    if (mode.includes("fixed")) {
      current.fixedPriceAmount += amount;
    } else {
      current.vickreyAmount += amount;
    }

    current.amount += amount;
    current.count += 1;
    current.volume = current.count;
  }

  return buckets;
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
      )`,
      marketedItems: sql<number>`(
        select count(distinct b.id)::int
        from barang b
        left join pemasaran p on p.barang_id = b.id
        where b.unit_id = ${outerUnitId}
          and (b.status = 'dipasarkan' or p.status = 'aktif')
      )`,
      soldItems: sql<number>`(
        select count(distinct b.id)::int
        from barang b
        left join pemasaran p on p.barang_id = b.id
        left join transaksi t on t.pemasaran_id = p.id
        where b.unit_id = ${outerUnitId}
          and (b.status = 'terjual' or t.status in ('lunas', 'selesai'))
      )`,
      followUpItems: sql<number>`(
        select count(distinct p.id)::int
        from pemasaran p
        inner join barang b on b.id = p.barang_id
        left join transaksi t on t.pemasaran_id = p.id
        where b.unit_id = ${outerUnitId}
          and (
            (
              t.status = 'ditolak_bukti'
              and coalesce(t.type, p.mode) = 'fixed_price'
            )
            or (
              p.status = 'gagal'
              and not exists (
                select 1
                from pelanggaran_user pu
                where pu.pemasaran_id = p.id
                  and pu.escalation_eligible = true
                  and pu.resolved_at is null
              )
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

  const [unitStats] = await db
    .select({
      totalUnits: sql<number>`count(*)`,
      activeUnits: sql<number>`count(*) filter (where ${units.isActive} = true)`,
    })
    .from(units);

  const [adminStats] = await db
    .select({
      totalAdmins: sql<number>`count(*) filter (where ${users.role} = 'admin_unit' and ${users.isActive} = true)`,
    })
    .from(users);

  const [accountStats] = await db
    .select({
      activeAccounts: sql<number>`count(*) filter (where ${unitAccounts.isActive} = true)`,
    })
    .from(unitAccounts);

  const [blacklistStats] = await db
    .select({
      activeBlacklists: sql<number>`count(*) filter (where ${blacklists.isActive} = true)`,
    })
    .from(blacklists);

  const [complianceStats] = await db
    .select({
      levelOne: sql<number>`count(*) filter (where ${blacklists.isActive} = true and ${blacklists.totalViolations} = 1)`,
      levelTwo: sql<number>`count(*) filter (where ${blacklists.isActive} = true and ${blacklists.totalViolations} = 2)`,
      levelThree: sql<number>`count(*) filter (where ${blacklists.isActive} = true and ${blacklists.totalViolations} >= 3)`,
    })
    .from(blacklists);

  const [reviewStats] = await db
    .select({
      pendingReviews: sql<number>`count(*) filter (where ${blacklistReviewCases.status} not in ('DISETUJUI', 'DITOLAK'))`,
    })
    .from(blacklistReviewCases);

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
      collateralItems: sql<number>`count(*) filter (where ${barang.status} in ('gadai', 'jaminan'))`,
      marketedItems: sql<number>`(
        select count(distinct b.id)::int
        from barang b
        left join pemasaran p on p.barang_id = b.id
        where b.status = 'dipasarkan' or p.status = 'aktif'
      )`,
      soldItems: sql<number>`(
        select count(distinct b.id)::int
        from barang b
        left join pemasaran p on p.barang_id = b.id
        left join transaksi t on t.pemasaran_id = p.id
        where b.status = 'terjual' or t.status in ('lunas', 'selesai')
      )`,
      followUpItems: sql<number>`(
        select count(distinct p.id)::int
        from pemasaran p
        left join transaksi t on t.pemasaran_id = p.id
        where
          (
            t.status = 'ditolak_bukti'
            and coalesce(t.type, p.mode) = 'fixed_price'
          )
          or (
            p.status = 'gagal'
            and not exists (
              select 1
              from pelanggaran_user pu
              where pu.pemasaran_id = p.id
                and pu.escalation_eligible = true
                and pu.resolved_at is null
            )
          )
      )`,
    })
    .from(barang);

  const unitRows = await buildSuperAdminUnitRowsQuery();

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

  const monitoringItems = unitsNeedAttention.map((unit) => ({
    id: `attention-${unit.id}`,
    unitId: unit.id,
    href: `/superadmin/manajemen-unit`,
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

  const timeSensitiveMonitoring = [
    ...activeTransactionMonitoring.map((item) => {
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
    ...activeAuctionMonitoring.map((item) => {
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
        activity: `Sesi Vickrey ${item.lotName} segera ditutup dan menunggu pemantauan hasil.`,
        detail: `${item.unit} | Harga dasar ${currencyFormatter.format(Number(item.basePrice ?? 0))}`,
        countdownLabel: countdown.label,
        countdownAt: item.endsAt?.toISOString(),
        expiredLabel: "Sesi lelang berakhir",
      };
    }),
    ...activeBlacklistMonitoring.map((item) => {
      const countdown = getCountdownState(item.blockedUntil, {
        expiredLabel: "Masa pembatasan selesai",
      });

      return {
        id: `blacklist-${item.id}`,
        unitId: item.unitId ?? "",
        href: "/superadmin/review-pelanggaran",
        unit: item.unit ?? "Lintas unit",
        scope: "Pembatasan",
        status: "Perlu Review",
        activity: `Masa pembatasan buyer ${item.buyerName} segera berakhir dan perlu keputusan lanjutan.`,
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
      id: "priority-review",
      value: toNumber(reviewStats?.pendingReviews),
      title: "Review buyer menunggu keputusan",
      detail: `${toNumber(reviewStats?.pendingReviews)} case review perlu diputus superadmin.`,
      href: "/superadmin/review-pelanggaran",
      action: "Tinjau pelanggaran",
    },
    {
      id: "priority-follow-up",
      value: toNumber(nationalStats?.followUpItems),
      title: "Pemasaran perlu tindak lanjut",
      detail:
        "Ada fixed price ditolak, lelang tanpa bid, atau pemasaran gagal yang perlu dibaca sebagai tindak lanjut.",
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
    action: item.scope === "Pembatasan" ? "Buka review" : "Buka monitoring",
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
        "Pusat keputusan nasional yang ringkas untuk review buyer, monitoring unit, dan tindak lanjut operasional.",
      metrics: [
        {
          label: "Total Unit",
          value: String(toNumber(unitStats?.totalUnits)),
          detail: `${toNumber(unitStats?.activeUnits)} unit aktif nasional`,
        },
        {
          label: "Unit Aktif",
          value: String(toNumber(unitStats?.activeUnits)),
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
