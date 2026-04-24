import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { unitAccounts, units, users } from "@/lib/db/schema";
import { serializeUnitAccount, serializeUnitListItem } from "@/lib/superadmin/serializers";
import { validateUnitPayload } from "@/lib/superadmin/validation";

function getUnitStatus(unit: { isActive: boolean }, activeAccountCount: number, adminCount: number) {
  if (!unit.isActive) {
    return "Nonaktif";
  }

  if (activeAccountCount === 0 || adminCount === 0) {
    return "Perlu Review";
  }

  return "Aktif";
}

export async function listUnits() {
  const unitRows = await db.select().from(units).orderBy(units.name);

  if (unitRows.length === 0) {
    return [];
  }

  const unitIds = unitRows.map((unit) => unit.id);

  const adminCounts = await db
    .select({
      unitId: users.unitId,
      count: sql<number>`count(*)`
    })
    .from(users)
    .where(and(eq(users.role, "admin_unit"), inArray(users.unitId, unitIds), eq(users.isActive, true)))
    .groupBy(users.unitId);

  const accountCounts = await db
    .select({
      unitId: unitAccounts.unitId,
      count: sql<number>`count(*)`
    })
    .from(unitAccounts)
    .where(inArray(unitAccounts.unitId, unitIds))
    .groupBy(unitAccounts.unitId);

  const activeAccounts = await db
    .select()
    .from(unitAccounts)
    .where(and(inArray(unitAccounts.unitId, unitIds), eq(unitAccounts.isActive, true)));

  const adminCountMap = new Map(adminCounts.map((row) => [row.unitId ?? "", Number(row.count)]));
  const accountCountMap = new Map(accountCounts.map((row) => [row.unitId, Number(row.count)]));
  const activeAccountMap = new Map(
    activeAccounts.map((account) => [account.unitId, serializeUnitAccount(account)])
  );

  return unitRows.map((unit) => {
    const adminCount = adminCountMap.get(unit.id) ?? 0;
    const accountCount = accountCountMap.get(unit.id) ?? 0;
    const activeAccount = activeAccountMap.get(unit.id) ?? null;

    return {
      ...serializeUnitListItem({
        id: unit.id,
        code: unit.code,
        name: unit.name,
        address: unit.address,
        isActive: unit.isActive,
        adminCount,
        accountCount,
        activeAccount
      }),
      status: getUnitStatus(unit, activeAccount ? 1 : 0, adminCount)
    };
  });
}

export async function getUnitById(unitId: string) {
  const [unit] = await db.select().from(units).where(eq(units.id, unitId)).limit(1);

  if (!unit) {
    throw new Error("Unit belum ditemukan.");
  }

  const [adminCountRow] = await db
    .select({
      count: sql<number>`count(*)`
    })
    .from(users)
    .where(and(eq(users.role, "admin_unit"), eq(users.unitId, unitId), eq(users.isActive, true)));

  const accounts = await db
    .select()
    .from(unitAccounts)
    .where(eq(unitAccounts.unitId, unitId))
    .orderBy(desc(unitAccounts.isActive), desc(unitAccounts.createdAt));

  const admins = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phoneNumber,
      status: users.isActive
    })
    .from(users)
    .where(and(eq(users.role, "admin_unit"), eq(users.unitId, unitId)))
    .orderBy(users.name);

  const activeAccount = accounts.find((account) => account.isActive) ?? null;

  return {
    id: unit.id,
    code: unit.code,
    name: unit.name,
    address: unit.address,
    status: getUnitStatus(unit, activeAccount ? 1 : 0, Number(adminCountRow?.count ?? 0)),
    isActive: unit.isActive,
    adminCount: Number(adminCountRow?.count ?? 0),
    accountCount: accounts.length,
    activeAccount: activeAccount ? serializeUnitAccount(activeAccount) : null,
    accounts: accounts.map(serializeUnitAccount),
    admins: admins.map((admin) => ({
      ...admin,
      phone: admin.phone ?? "-",
      status: admin.status ? "Aktif" : "Nonaktif"
    }))
  };
}

export async function createUnit(input: {
  code?: string;
  name?: string;
  address?: string;
}) {
  const payload = validateUnitPayload(input);

  const [existing] = await db.select().from(units).where(eq(units.code, payload.code)).limit(1);
  if (existing) {
    throw new Error("Kode unit sudah dipakai.");
  }

  const [created] = await db
    .insert(units)
    .values({
      id: crypto.randomUUID(),
      code: payload.code,
      name: payload.name,
      address: payload.address
    })
    .returning();

  return created;
}

export async function updateUnit(
  unitId: string,
  input: {
    code?: string;
    name?: string;
    address?: string;
    isActive?: boolean;
  }
) {
  const payload = validateUnitPayload(input);

  const [existing] = await db
    .select()
    .from(units)
    .where(and(eq(units.code, payload.code), sql`${units.id} <> ${unitId}`))
    .limit(1);

  if (existing) {
    throw new Error("Kode unit sudah dipakai.");
  }

  const [updated] = await db
    .update(units)
    .set({
      code: payload.code,
      name: payload.name,
      address: payload.address,
      isActive: typeof input.isActive === "boolean" ? input.isActive : true,
      updatedAt: new Date()
    })
    .where(eq(units.id, unitId))
    .returning();

  if (!updated) {
    throw new Error("Unit belum ditemukan.");
  }

  return updated;
}

export async function deactivateUnit(unitId: string) {
  const [updated] = await db
    .update(units)
    .set({
      isActive: false,
      updatedAt: new Date()
    })
    .where(eq(units.id, unitId))
    .returning();

  if (!updated) {
    throw new Error("Unit belum ditemukan.");
  }

  return updated;
}
