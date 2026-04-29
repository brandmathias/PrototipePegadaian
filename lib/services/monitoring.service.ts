import { and, asc, eq, gt, inArray, isNotNull, or, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { barang, blacklists, pemasaran, transaksi, unitAccounts, units, users } from "@/lib/db/schema";
import { getCountdownState } from "@/lib/countdown";
import { serializeMonitoringSummary } from "@/lib/superadmin/serializers";

export async function getSuperAdminMonitoring() {
  const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  });

  const [unitStats] = await db
    .select({
      totalUnits: sql<number>`count(*)`,
      activeUnits: sql<number>`count(*) filter (where ${units.isActive} = true)`
    })
    .from(units);

  const [adminStats] = await db
    .select({
      totalAdmins: sql<number>`count(*) filter (where ${users.role} = 'admin_unit' and ${users.isActive} = true)`
    })
    .from(users);

  const [accountStats] = await db
    .select({
      activeAccounts: sql<number>`count(*) filter (where ${unitAccounts.isActive} = true)`
    })
    .from(unitAccounts);

  const [blacklistStats] = await db
    .select({
      activeBlacklists: sql<number>`count(*) filter (where ${blacklists.isActive} = true)`
    })
    .from(blacklists);

  const summary = serializeMonitoringSummary({
    totalUnits: Number(unitStats?.totalUnits ?? 0),
    activeUnits: Number(unitStats?.activeUnits ?? 0),
    totalAdmins: Number(adminStats?.totalAdmins ?? 0),
    activeAccounts: Number(accountStats?.activeAccounts ?? 0),
    activeBlacklists: Number(blacklistStats?.activeBlacklists ?? 0)
  });

  const unitsNeedAttention = await db
    .select({
      id: units.id,
      code: units.code,
      name: units.name,
      address: units.address,
      isActive: units.isActive,
      activeAccountCount: sql<number>`count(distinct ${unitAccounts.id}) filter (where ${unitAccounts.isActive} = true)`,
      activeAdminCount: sql<number>`count(distinct ${users.id}) filter (where ${users.role} = 'admin_unit' and ${users.isActive} = true)`
    })
    .from(units)
    .leftJoin(unitAccounts, eq(unitAccounts.unitId, units.id))
    .leftJoin(users, eq(users.unitId, units.id))
    .groupBy(units.id)
    .having(
      or(
        eq(units.isActive, false),
        sql`count(distinct ${unitAccounts.id}) filter (where ${unitAccounts.isActive} = true) = 0`,
        sql`count(distinct ${users.id}) filter (where ${users.role} = 'admin_unit' and ${users.isActive} = true) = 0`
      )
    );

  const monitoringItems = unitsNeedAttention.map((unit) => ({
    id: `attention-${unit.id}`,
    unitId: unit.id,
    href: `/superadmin/unit/${unit.id}`,
    unit: unit.name,
    scope: "Unit",
    status: unit.isActive ? "Perlu Tindak Lanjut" : "Perlu Review",
    activity:
      Number(unit.activeAccountCount) === 0
        ? "Unit belum memiliki rekening aktif."
        : Number(unit.activeAdminCount) === 0
          ? "Unit belum memiliki admin aktif."
          : "Unit sedang nonaktif.",
    detail: `${unit.address} | Admin aktif: ${Number(unit.activeAdminCount)} | Rekening aktif: ${Number(unit.activeAccountCount)}`
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
      paymentDeadline: transaksi.paymentDeadline
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(transaksi.pemasaranId, pemasaran.id))
    .innerJoin(barang, eq(pemasaran.barangId, barang.id))
    .innerJoin(units, eq(barang.unitId, units.id))
    .where(
      and(
        isNotNull(transaksi.paymentDeadline),
        inArray(transaksi.status, [
          "menunggu_pembayaran",
          "bukti_diunggah",
          "menunggu_konfirmasi_langsung"
        ])
      )
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
      endsAt: pemasaran.endsAt
    })
    .from(pemasaran)
    .innerJoin(barang, eq(pemasaran.barangId, barang.id))
    .innerJoin(units, eq(barang.unitId, units.id))
    .where(
      and(
        eq(pemasaran.mode, "vickrey"),
        eq(pemasaran.status, "aktif"),
        isNotNull(pemasaran.endsAt)
      )
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
      blockedUntil: blacklists.blockedUntil
    })
    .from(blacklists)
    .innerJoin(users, eq(users.id, blacklists.userId))
    .leftJoin(units, eq(units.id, blacklists.unitId))
    .where(
      and(
        eq(blacklists.isActive, true),
        isNotNull(blacklists.blockedUntil),
        gt(blacklists.blockedUntil, new Date())
      )
    )
    .orderBy(asc(blacklists.blockedUntil))
    .limit(3);

  const timeSensitiveMonitoring = [
    ...activeTransactionMonitoring.map((item) => {
      const countdown = getCountdownState(item.paymentDeadline, {
        expiredLabel: "SLA pembayaran terlewati"
      });
      const isWaitingVerification = item.status === "bukti_diunggah";
      const isDirectPayment = item.status === "menunggu_konfirmasi_langsung";

      return {
        id: `transaction-${item.id}`,
        unitId: item.unitId,
        href: `/superadmin/unit/${item.unitId}`,
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
        expiredLabel: "SLA pembayaran terlewati"
      };
    }),
    ...activeAuctionMonitoring.map((item) => {
      const countdown = getCountdownState(item.endsAt, {
        expiredLabel: "Sesi lelang berakhir"
      });

      return {
        id: `auction-${item.id}`,
        unitId: item.unitId,
        href: `/superadmin/unit/${item.unitId}`,
        unit: item.unit,
        scope: "Lelang",
        status: "Perlu Review",
        activity: `Sesi Vickrey ${item.lotName} segera ditutup dan menunggu pemantauan hasil.`,
        detail: `${item.unit} | Harga dasar ${currencyFormatter.format(Number(item.basePrice ?? 0))}`,
        countdownLabel: countdown.label,
        countdownAt: item.endsAt?.toISOString(),
        expiredLabel: "Sesi lelang berakhir"
      };
    }),
    ...activeBlacklistMonitoring.map((item) => {
      const countdown = getCountdownState(item.blockedUntil, {
        expiredLabel: "Masa blokir selesai"
      });

      return {
        id: `blacklist-${item.id}`,
        unitId: item.unitId ?? "",
        href: "/superadmin/blacklist",
        unit: item.unit ?? "Lintas unit",
        scope: "Blacklist",
        status: "Perlu Review",
        activity: `Masa blokir buyer ${item.buyerName} segera berakhir dan perlu keputusan lanjutan.`,
        detail: `${item.unit ?? "Lintas unit"} | ${item.totalViolations} pelanggaran tercatat`,
        countdownLabel: countdown.label,
        countdownAt: item.blockedUntil?.toISOString(),
        expiredLabel: "Masa blokir selesai"
      };
    })
  ].sort((left, right) => {
    const leftTime = left.countdownAt ? new Date(left.countdownAt).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.countdownAt ? new Date(right.countdownAt).getTime() : Number.MAX_SAFE_INTEGER;

    return leftTime - rightTime;
  });

  const priorityItems =
    timeSensitiveMonitoring.length > 0
      ? timeSensitiveMonitoring.slice(0, 3).map((item) => ({
          title: `${item.unit} · ${item.scope}`,
          detail: item.activity,
          href: `/superadmin/unit/${item.unitId}`,
          action: "Buka unit",
          countdownLabel: item.countdownLabel,
          countdownAt: item.countdownAt,
          expiredLabel: item.expiredLabel
        }))
      : monitoringItems.slice(0, 3).map((item) => ({
          title: item.unit,
          detail: item.activity,
          href: `/superadmin/unit/${item.unitId}`,
          action: "Buka unit"
        }));

  return {
    summary: {
      ...summary,
      spotlight: [
        { label: "Unit aktif nasional", value: `${Number(unitStats?.activeUnits ?? 0)} unit` },
        { label: "Rekening aktif tervalidasi", value: `${Number(accountStats?.activeAccounts ?? 0)} rekening` },
        { label: "Blacklist aktif", value: `${Number(blacklistStats?.activeBlacklists ?? 0)} akun` }
      ],
      priorities: priorityItems
    },
    unitsNeedAttention: monitoringItems,
    pendingMonitoring: [...timeSensitiveMonitoring, ...monitoringItems].slice(0, 6)
  };
}
