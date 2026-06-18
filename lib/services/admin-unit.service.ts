import { and, desc, eq, or, sql } from "drizzle-orm";
import { hashPassword } from "@better-auth/utils/password";

import { db } from "@/lib/db/client";
import { account, sessions, units, users } from "@/lib/db/schema";
import { isHiddenOperationalUnit } from "@/lib/superadmin/hidden-operational-units";
import { validateAdminUnitPayload } from "@/lib/superadmin/validation";

function formatLastLogin(value: Date | string | null) {
  if (!value) {
    return "Belum pernah login";
  }

  const normalized = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(normalized.getTime())) {
    return "Belum pernah login";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(normalized);
}

function toAdminStatus(isActive: boolean) {
  return isActive ? "Aktif" : "Nonaktif";
}

function getArchivedAdminEmail(adminId: string) {
  return `deleted-${adminId}@admin-unit.local`;
}

export async function releaseInactiveAdminIdentityConflicts(
  email: string,
  phoneNumber?: string,
) {
  const identityConflict = phoneNumber
    ? or(eq(users.email, email), eq(users.phoneNumber, phoneNumber))
    : eq(users.email, email);

  const staleAdmins = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.role, "admin_unit"),
        eq(users.isActive, false),
        identityConflict
      )
    );

  if (staleAdmins.length === 0) {
    return;
  }

  await db.transaction(async (tx) => {
    for (const staleAdmin of staleAdmins) {
      await tx.delete(account).where(eq(account.userId, staleAdmin.id));
      await tx.delete(sessions).where(eq(sessions.userId, staleAdmin.id));
      await tx
        .update(users)
        .set({
          email: getArchivedAdminEmail(staleAdmin.id),
          phoneNumber: null,
          unitId: null,
          updatedAt: new Date()
        })
        .where(and(eq(users.id, staleAdmin.id), eq(users.role, "admin_unit")));
    }
  });
}

export async function listAdminUnits() {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phoneNumber: users.phoneNumber,
      isActive: users.isActive,
      unitId: users.unitId,
      unitName: units.name,
      unitCode: units.code,
      lastLogin: sql<Date | null>`max(${sessions.createdAt})`
    })
    .from(users)
    .leftJoin(units, eq(units.id, users.unitId))
    .leftJoin(sessions, eq(sessions.userId, users.id))
    .where(and(eq(users.role, "admin_unit"), eq(users.isActive, true)))
    .groupBy(users.id, units.name, units.code)
    .orderBy(desc(users.createdAt));

  return rows
    .filter((row) => !isHiddenOperationalUnit({ id: row.unitId, code: row.unitCode }))
    .map((row) => ({
      id: row.id,
      name: row.name,
      unitId: row.unitId,
      unit: row.unitName ?? "Belum ditetapkan",
      email: row.email,
      phone: row.phoneNumber ?? "-",
      status: toAdminStatus(row.isActive),
      lastLogin: formatLastLogin(row.lastLogin)
    }));
}

export async function getAdminUnitById(adminId: string) {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phoneNumber: users.phoneNumber,
      isActive: users.isActive,
      unitId: users.unitId,
      unitName: units.name,
      unitCode: units.code
    })
    .from(users)
    .leftJoin(units, eq(units.id, users.unitId))
    .where(and(eq(users.id, adminId), eq(users.role, "admin_unit"), eq(users.isActive, true)))
    .limit(1);

  if (!row) {
    throw new Error("Admin unit belum ditemukan.");
  }

  if (isHiddenOperationalUnit({ id: row.unitId, code: row.unitCode })) {
    throw new Error("Admin unit belum ditemukan.");
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phoneNumber ?? "",
    unitId: row.unitId,
    unit: row.unitName ?? "Belum ditetapkan",
    status: toAdminStatus(row.isActive)
  };
}

export async function createAdminUnit(input: {
  name?: string;
  email?: string;
  unitId?: string;
  temporaryPassword?: string;
  phoneNumber?: string;
}) {
  const payload = validateAdminUnitPayload(input);

  const [unit] = await db.select().from(units).where(eq(units.id, payload.unitId)).limit(1);
  if (!unit) {
    throw new Error("Unit belum ditemukan.");
  }

  if (isHiddenOperationalUnit(unit)) {
    throw new Error("Unit belum ditemukan.");
  }

  await releaseInactiveAdminIdentityConflicts(payload.email, payload.phoneNumber);

  const [existingUser] = await db.select().from(users).where(eq(users.email, payload.email)).limit(1);
  if (existingUser) {
    throw new Error("Email admin sudah dipakai.");
  }

  if (payload.phoneNumber) {
    const [existingPhone] = await db.select().from(users).where(eq(users.phoneNumber, payload.phoneNumber)).limit(1);
    if (existingPhone) {
      throw new Error("Nomor telepon admin sudah dipakai.");
    }
  }

  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();
  const passwordHash = await hashPassword(payload.temporaryPassword);

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      name: payload.name,
      email: payload.email,
      role: "admin_unit",
      phoneNumber: payload.phoneNumber || null,
      unitId: payload.unitId,
      isActive: true
    });

    await tx.insert(account).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash
    });
  });

  return getAdminUnitById(userId);
}

export async function updateAdminUnit(
  adminId: string,
  input: {
    name?: string;
    email?: string;
    unitId?: string;
    phoneNumber?: string;
    isActive?: boolean;
  }
) {
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const unitId = String(input.unitId ?? "").trim();
  const phoneNumber = String(input.phoneNumber ?? "").trim();

  if (!name || !email || !unitId) {
    throw new Error("Data admin unit belum lengkap.");
  }

  const [unit] = await db.select().from(units).where(eq(units.id, unitId)).limit(1);
  if (!unit) {
    throw new Error("Unit belum ditemukan.");
  }

  if (isHiddenOperationalUnit(unit)) {
    throw new Error("Unit belum ditemukan.");
  }

  const [existingEmail] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), sql`${users.id} <> ${adminId}`))
    .limit(1);
  if (existingEmail) {
    throw new Error("Email admin sudah dipakai.");
  }

  const targetIsActive = typeof input.isActive === "boolean" ? input.isActive : true;

  const [updated] = await db.transaction(async (tx) => {
    const [result] = await tx
      .update(users)
      .set({
        name,
        email,
        unitId,
        phoneNumber: phoneNumber || null,
        isActive: targetIsActive,
        updatedAt: new Date()
      })
      .where(and(eq(users.id, adminId), eq(users.role, "admin_unit")))
      .returning();

    if (!result) {
      return [];
    }

    if (!targetIsActive) {
      await tx.delete(sessions).where(eq(sessions.userId, adminId));
    }

    return [result];
  });

  if (!updated) {
    throw new Error("Admin unit belum ditemukan.");
  }

  return getAdminUnitById(adminId);
}

export async function deactivateAdminUnit(adminId: string) {
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, adminId), eq(users.role, "admin_unit")))
    .limit(1);

  if (!target) {
    throw new Error("Admin unit belum ditemukan.");
  }

  await db.transaction(async (tx) => {
    await tx.delete(account).where(eq(account.userId, adminId));
    await tx.delete(sessions).where(eq(sessions.userId, adminId));
    await tx
      .update(users)
      .set({
        email: getArchivedAdminEmail(adminId),
        phoneNumber: null,
        unitId: null,
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(eq(users.id, adminId), eq(users.role, "admin_unit")));
  });

  return { deleted: true, id: adminId };
}
