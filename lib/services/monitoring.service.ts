import { and, eq, isNull, or, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { blacklists, unitAccounts, units, users } from "@/lib/db/schema";
import { serializeMonitoringSummary } from "@/lib/superadmin/serializers";

export async function getSuperAdminMonitoring() {
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

  return {
    summary: {
      ...summary,
      spotlight: [
        { label: "Unit aktif nasional", value: `${Number(unitStats?.activeUnits ?? 0)} unit` },
        { label: "Rekening aktif tervalidasi", value: `${Number(accountStats?.activeAccounts ?? 0)} rekening` },
        { label: "Blacklist aktif", value: `${Number(blacklistStats?.activeBlacklists ?? 0)} akun` }
      ],
      priorities: monitoringItems.slice(0, 3).map((item) => ({
        title: item.unit,
        detail: item.activity,
        href: `/superadmin/unit/${item.unitId}`,
        action: "Buka unit"
      }))
    },
    unitsNeedAttention: monitoringItems,
    pendingMonitoring: monitoringItems
  };
}
