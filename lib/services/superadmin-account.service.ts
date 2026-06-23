import { randomUUID } from "node:crypto";

import { hashPassword } from "@better-auth/utils/password";
import { and, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { account, sessions, superadminAccountAuditLogs, users } from "@/lib/db/schema";
import { getIndonesianPhoneNumberVariants } from "@/lib/phone-number";
import {
  normalizeSuperAdminLevel,
  type SuperAdminLevel,
  validateSuperAdminAccountCreatePayload,
  validateSuperAdminAccountUpdatePayload,
  validateSuperAdminPasswordResetPayload
} from "@/lib/superadmin/validation";

type DbExecutor = Pick<typeof db, "delete" | "insert" | "select" | "update">;

type SuperAdminAccountRow = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  superAdminLevel: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
};

type ActorRow = {
  id: string;
  name: string;
  email: string;
  superAdminLevel: string | null;
  isActive: boolean;
};

type AuditAction =
  | "create"
  | "update_profile"
  | "change_level"
  | "activate"
  | "deactivate"
  | "reset_password"
  | "rejected";

export class SuperAdminAccountError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "SuperAdminAccountError";
    this.status = status;
  }
}

function formatDateTime(value: Date | string | null) {
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

function toLevelLabel(level: SuperAdminLevel) {
  return level === "owner" ? "Owner" : "Operator";
}

function toStatusLabel(isActive: boolean) {
  return isActive ? "Aktif" : "Nonaktif";
}

function serializeAccount(row: SuperAdminAccountRow, currentUserId?: string) {
  const level = normalizeSuperAdminLevel(row.superAdminLevel);

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phoneNumber ?? "-",
    phoneNumber: row.phoneNumber ?? "",
    level,
    levelLabel: toLevelLabel(level),
    isActive: row.isActive,
    status: toStatusLabel(row.isActive),
    lastLogin: formatDateTime(row.lastLogin),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isCurrentUser: row.id === currentUserId
  };
}

function activeOwnerWhere() {
  return and(
    eq(users.role, "super_admin"),
    eq(users.isActive, true),
    or(eq(users.superAdminLevel, "owner"), isNull(users.superAdminLevel))
  );
}

async function getSuperAdminActor(executor: DbExecutor, actorUserId: string): Promise<ActorRow | null> {
  const [actor] = await executor
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      superAdminLevel: users.superAdminLevel,
      isActive: users.isActive
    })
    .from(users)
    .where(and(eq(users.id, actorUserId), eq(users.role, "super_admin")))
    .limit(1);

  return actor ?? null;
}

async function writeAudit(
  executor: DbExecutor,
  input: {
    action: AuditAction;
    note: string;
    actorUserId?: string | null;
    targetUserId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  const [created] = await executor
    .insert(superadminAccountAuditLogs)
    .values({
      id: randomUUID(),
      actorUserId: input.actorUserId ?? null,
      targetUserId: input.targetUserId ?? null,
      action: input.action,
      note: input.note,
      metadata: input.metadata ?? null
    })
    .returning();

  if (!created) {
    throw new SuperAdminAccountError("Audit superadmin gagal dicatat.", 500);
  }

  return created;
}

async function recordRejectedOwnerAction(
  executor: DbExecutor,
  input: {
    actorUserId: string;
    targetUserId?: string | null;
    reason: string;
    metadata?: Record<string, unknown>;
  }
) {
  await writeAudit(executor, {
    action: "rejected",
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId ?? null,
    note: input.reason,
    metadata: input.metadata
  });
}

async function requireOwnerActor(
  executor: DbExecutor,
  actorUserId: string,
  context?: { targetUserId?: string | null; action?: string }
) {
  const actor = await getSuperAdminActor(executor, actorUserId);

  if (!actor || !actor.isActive) {
    throw new SuperAdminAccountError("Akses superadmin ditolak.", 403);
  }

  const actorLevel = normalizeSuperAdminLevel(actor.superAdminLevel);
  if (actorLevel !== "owner") {
    const reason = "Hanya Owner Superadmin yang dapat mengelola akun superadmin.";
    await recordRejectedOwnerAction(executor, {
      actorUserId,
      targetUserId: context?.targetUserId ?? null,
      reason,
      metadata: { action: context?.action ?? "unknown" }
    });
    throw new SuperAdminAccountError(reason, 403);
  }

  return {
    ...actor,
    level: actorLevel
  };
}

async function getTargetAccount(executor: DbExecutor, targetUserId: string) {
  const [target] = await executor
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phoneNumber: users.phoneNumber,
      superAdminLevel: users.superAdminLevel,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLogin: sql<Date | null>`null`
    })
    .from(users)
    .where(and(eq(users.id, targetUserId), eq(users.role, "super_admin")))
    .limit(1);

  if (!target) {
    throw new SuperAdminAccountError("Akun superadmin belum ditemukan.", 404);
  }

  return target;
}

async function countActiveOwners(executor: DbExecutor) {
  const [row] = await executor
    .select({
      count: sql<number>`count(*)::int`
    })
    .from(users)
    .where(activeOwnerWhere());

  return Number(row?.count ?? 0);
}

async function assertEmailAvailable(executor: DbExecutor, email: string, ignoreUserId?: string) {
  const whereClause = ignoreUserId
    ? and(eq(users.email, email), ne(users.id, ignoreUserId))
    : eq(users.email, email);
  const [existing] = await executor.select({ id: users.id }).from(users).where(whereClause).limit(1);

  if (existing) {
    throw new SuperAdminAccountError("Email superadmin sudah dipakai.", 409);
  }
}

async function assertPhoneAvailable(executor: DbExecutor, phoneNumber: string, ignoreUserId?: string) {
  const phoneVariants = getIndonesianPhoneNumberVariants(phoneNumber);

  if (phoneVariants.length === 0) {
    return;
  }

  const whereClause = ignoreUserId
    ? and(inArray(users.phoneNumber, phoneVariants), ne(users.id, ignoreUserId))
    : inArray(users.phoneNumber, phoneVariants);
  const [existing] = await executor.select({ id: users.id }).from(users).where(whereClause).limit(1);

  if (existing) {
    throw new SuperAdminAccountError("Nomor telepon superadmin sudah dipakai.", 409);
  }
}

async function assertOwnerGuardrail(
  executor: DbExecutor,
  input: {
    actorUserId: string;
    target: { id: string; name: string; superAdminLevel: string | null; isActive: boolean };
    nextLevel: SuperAdminLevel;
    nextIsActive: boolean;
    action: string;
  }
) {
  const activeOwnerCount = await countActiveOwners(executor);
  const reason = getSuperAdminAccessChangeBlockReason({
    actorUserId: input.actorUserId,
    targetUserId: input.target.id,
    currentLevel: normalizeSuperAdminLevel(input.target.superAdminLevel),
    currentIsActive: input.target.isActive,
    nextLevel: input.nextLevel,
    nextIsActive: input.nextIsActive,
    activeOwnerCount
  });

  if (reason) {
    await recordRejectedOwnerAction(executor, {
      actorUserId: input.actorUserId,
      targetUserId: input.target.id,
      reason,
      metadata: { action: input.action }
    });
    throw new SuperAdminAccountError(reason, 409);
  }
}

export function getSuperAdminAccessChangeBlockReason(input: {
  actorUserId: string;
  targetUserId: string;
  currentLevel: SuperAdminLevel;
  currentIsActive: boolean;
  nextLevel: SuperAdminLevel;
  nextIsActive: boolean;
  activeOwnerCount: number;
}) {
  if (input.actorUserId === input.targetUserId && input.currentIsActive && !input.nextIsActive) {
    return "Owner tidak dapat menonaktifkan akunnya sendiri.";
  }

  const targetCurrentlyActiveOwner = input.currentIsActive && input.currentLevel === "owner";
  const targetWillRemainActiveOwner = input.nextIsActive && input.nextLevel === "owner";

  if (targetCurrentlyActiveOwner && !targetWillRemainActiveOwner) {
    if (input.activeOwnerCount <= 1) {
      return "Minimal harus ada satu Owner Superadmin aktif.";
    }
  }

  return null;
}

export async function listSuperAdminAccounts(currentUserId: string) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phoneNumber: users.phoneNumber,
      superAdminLevel: users.superAdminLevel,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLogin: sql<Date | null>`max(${sessions.createdAt})`
    })
    .from(users)
    .leftJoin(sessions, eq(sessions.userId, users.id))
    .where(eq(users.role, "super_admin"))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));

  const accounts = rows.map((row) => serializeAccount(row, currentUserId));
  const currentAccount = accounts.find((item) => item.id === currentUserId);
  const auditRows = await db
    .select()
    .from(superadminAccountAuditLogs)
    .orderBy(desc(superadminAccountAuditLogs.createdAt))
    .limit(12);
  const personIds = Array.from(
    new Set(
      auditRows
        .flatMap((row) => [row.actorUserId, row.targetUserId])
        .filter((value): value is string => Boolean(value))
    )
  );
  const peopleRows = personIds.length
    ? await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, personIds))
    : [];
  const people = new Map(peopleRows.map((person) => [person.id, person]));
  const audit = auditRows.map((row) => ({
    id: row.id,
    action: row.action,
    note: row.note,
    actorUserId: row.actorUserId,
    actorName: row.actorUserId ? people.get(row.actorUserId)?.name ?? "Sistem" : "Sistem",
    targetUserId: row.targetUserId,
    targetName: row.targetUserId ? people.get(row.targetUserId)?.name ?? "Akun tidak ditemukan" : "-",
    createdAt: row.createdAt.toISOString(),
    createdAtLabel: formatDateTime(row.createdAt),
    metadata: row.metadata
  }));

  const stats = {
    total: accounts.length,
    activeOwners: accounts.filter((accountItem) => accountItem.isActive && accountItem.level === "owner").length,
    activeOperators: accounts.filter((accountItem) => accountItem.isActive && accountItem.level === "operator").length,
    inactive: accounts.filter((accountItem) => !accountItem.isActive).length,
    recentAudit: audit.length
  };

  return {
    accounts,
    audit,
    stats,
    currentUser: {
      id: currentUserId,
      level: currentAccount?.level ?? "operator",
      canManage: currentAccount?.level === "owner" && currentAccount.isActive
    }
  };
}

export async function createSuperAdminAccount(actorUserId: string, input: {
  name?: string;
  email?: string;
  temporaryPassword?: string;
  phoneNumber?: string;
  level?: string;
}) {
  const payload = validateSuperAdminAccountCreatePayload(input);
  const userId = randomUUID();
  const accountId = randomUUID();
  const passwordHash = await hashPassword(payload.temporaryPassword);

  await db.transaction(async (tx) => {
    const actor = await requireOwnerActor(tx, actorUserId, { action: "create" });
    await assertEmailAvailable(tx, payload.email);
    await assertPhoneAvailable(tx, payload.phoneNumber);

    await tx.insert(users).values({
      id: userId,
      name: payload.name,
      email: payload.email,
      role: "super_admin",
      phoneNumber: payload.phoneNumber || null,
      unitId: null,
      superAdminLevel: payload.level,
      isActive: true
    });

    await tx.insert(account).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash
    });

    await writeAudit(tx, {
      action: "create",
      actorUserId,
      targetUserId: userId,
      note: `${actor.name} membuat akun ${payload.name} sebagai ${toLevelLabel(payload.level)}.`,
      metadata: {
        level: payload.level,
        email: payload.email
      }
    });
  });

  const target = await getTargetAccount(db, userId);
  return serializeAccount(target, actorUserId);
}

export async function updateSuperAdminAccount(actorUserId: string, targetUserId: string, input: {
  name?: string;
  email?: string;
  phoneNumber?: string;
  level?: string;
  isActive?: boolean;
}) {
  const payload = validateSuperAdminAccountUpdatePayload(input);

  await db.transaction(async (tx) => {
    const actor = await requireOwnerActor(tx, actorUserId, { targetUserId, action: "update" });
    const target = await getTargetAccount(tx, targetUserId);
    const currentLevel = normalizeSuperAdminLevel(target.superAdminLevel);
    const nextLevel = payload.level ?? currentLevel;
    const nextIsActive = typeof payload.isActive === "boolean" ? payload.isActive : target.isActive;

    await assertOwnerGuardrail(tx, {
      actorUserId,
      target,
      nextLevel,
      nextIsActive,
      action: "update"
    });

    if (payload.email) {
      await assertEmailAvailable(tx, payload.email, targetUserId);
    }

    if ("phoneNumber" in payload) {
      await assertPhoneAvailable(tx, payload.phoneNumber ?? "", targetUserId);
    }

    const [updated] = await tx
      .update(users)
      .set({
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.email ? { email: payload.email } : {}),
        ...("phoneNumber" in payload ? { phoneNumber: payload.phoneNumber || null } : {}),
        ...("level" in payload ? { superAdminLevel: payload.level } : {}),
        ...("isActive" in payload ? { isActive: payload.isActive } : {}),
        updatedAt: new Date()
      })
      .where(and(eq(users.id, targetUserId), eq(users.role, "super_admin")))
      .returning();

    if (!updated) {
      throw new SuperAdminAccountError("Akun superadmin belum ditemukan.", 404);
    }

    if (!nextIsActive) {
      await tx.delete(sessions).where(eq(sessions.userId, targetUserId));
    }

    const action: AuditAction =
      target.isActive !== nextIsActive
        ? nextIsActive
          ? "activate"
          : "deactivate"
        : currentLevel !== nextLevel
          ? "change_level"
          : "update_profile";
    const note =
      action === "activate"
        ? `${actor.name} mengaktifkan akun ${updated.name}.`
        : action === "deactivate"
          ? `${actor.name} menonaktifkan akun ${updated.name}.`
          : action === "change_level"
            ? `${actor.name} mengubah level ${updated.name} menjadi ${toLevelLabel(nextLevel)}.`
            : `${actor.name} memperbarui profil ${updated.name}.`;
    await writeAudit(tx, {
      action,
      actorUserId,
      targetUserId,
      note,
      metadata: {
        previousLevel: currentLevel,
        nextLevel,
        previousStatus: target.isActive,
        nextStatus: nextIsActive
      }
    });
  });

  const target = await getTargetAccount(db, targetUserId);
  return serializeAccount(target, actorUserId);
}

export async function resetSuperAdminPassword(actorUserId: string, targetUserId: string, input: {
  temporaryPassword?: string;
}) {
  const payload = validateSuperAdminPasswordResetPayload(input);
  const passwordHash = await hashPassword(payload.temporaryPassword);

  await db.transaction(async (tx) => {
    const actor = await requireOwnerActor(tx, actorUserId, { targetUserId, action: "reset_password" });
    const target = await getTargetAccount(tx, targetUserId);

    const [updatedAccount] = await tx
      .update(account)
      .set({
        password: passwordHash,
        updatedAt: new Date()
      })
      .where(and(eq(account.userId, targetUserId), eq(account.providerId, "credential")))
      .returning();

    if (!updatedAccount) {
      await tx.insert(account).values({
        id: randomUUID(),
        accountId: targetUserId,
        providerId: "credential",
        userId: targetUserId,
        password: passwordHash
      });
    }

    await tx.delete(sessions).where(eq(sessions.userId, targetUserId));

    await writeAudit(tx, {
      action: "reset_password",
      actorUserId,
      targetUserId,
      note: `${actor.name} mereset password sementara untuk ${target.name}.`,
      metadata: {
        targetEmail: target.email
      }
    });
  });

  return {
    id: targetUserId,
    status: "Password sementara berhasil diperbarui."
  };
}
