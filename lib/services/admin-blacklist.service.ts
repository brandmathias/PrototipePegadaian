import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { serializeBlacklistHistoryEntry } from "@/lib/blacklist/history";
import { validateBlacklistExtendPayload } from "@/lib/admin-unit/validation";
import { db } from "@/lib/db/client";
import { blacklistActionLogs, blacklists, users } from "@/lib/db/schema";

function serializeBlacklist(row: {
  blacklist: typeof blacklists.$inferSelect;
  user: typeof users.$inferSelect;
}) {
  return {
    userId: row.user.id,
    name: row.user.name,
    email: row.user.email,
    violations: row.blacklist.totalViolations,
    until: row.blacklist.blockedUntil?.toISOString().slice(0, 10) ?? "-",
    status: row.blacklist.isActive ? "AKTIF" : "TIDAK_AKTIF",
    reason: row.blacklist.revokeReason ?? "Pelanggaran pembayaran lelang.",
    lastIncident: row.blacklist.updatedAt.toISOString().slice(0, 10),
    activeAuctionRestriction: row.blacklist.isActive
      ? "User tidak dapat mengikuti lelang Vickrey selama masa blokir aktif."
      : "Pembatasan lelang Vickrey sudah tidak aktif.",
    unit: row.blacklist.unitId ?? "-"
  };
}

export async function listAdminBlacklist(unitId: string) {
  const rows = await db
    .select({ blacklist: blacklists, user: users })
    .from(blacklists)
    .innerJoin(users, eq(users.id, blacklists.userId))
    .where(eq(blacklists.unitId, unitId))
    .orderBy(desc(blacklists.updatedAt));

  return rows.map(serializeBlacklist);
}

export async function getAdminBlacklistByUserId(unitId: string, userId: string) {
  const performers = alias(users, "blacklist_log_performer");
  const [row] = await db
    .select({ blacklist: blacklists, user: users })
    .from(blacklists)
    .innerJoin(users, eq(users.id, blacklists.userId))
    .where(and(eq(blacklists.unitId, unitId), eq(blacklists.userId, userId)))
    .limit(1);

  if (!row) {
    throw new Error("Riwayat blacklist tidak ditemukan di unit Anda.");
  }

  const history = await db
    .select({
      action: blacklistActionLogs.action,
      createdAt: blacklistActionLogs.createdAt,
      note: blacklistActionLogs.note,
      performedByType: blacklistActionLogs.performedByType,
      performedByName: performers.name
    })
    .from(blacklistActionLogs)
    .leftJoin(performers, eq(performers.id, blacklistActionLogs.performedByUserId))
    .where(eq(blacklistActionLogs.blacklistId, row.blacklist.id))
    .orderBy(desc(blacklistActionLogs.createdAt));

  return {
    ...serializeBlacklist(row),
    history: history.map(serializeBlacklistHistoryEntry)
  };
}

export async function extendAdminBlacklist(unitId: string, adminId: string, userId: string, input: { blockedUntil?: unknown; reason?: unknown }) {
  const row = await getAdminBlacklistByUserId(unitId, userId);
  const payload = validateBlacklistExtendPayload(input);

  const [updated] = await db
    .update(blacklists)
    .set({
      isActive: true,
      blockedUntil: new Date(`${payload.blockedUntil}T00:00:00.000Z`),
      updatedAt: new Date()
    })
    .where(and(eq(blacklists.unitId, unitId), eq(blacklists.userId, userId)))
    .returning();

  await db.insert(blacklistActionLogs).values({
    id: crypto.randomUUID(),
    blacklistId: updated.id,
    targetUserId: userId,
    action: "perpanjang_manual",
    performedByType: "manual",
    performedByUserId: adminId,
    note: payload.reason
  });

  return {
    ...row,
    until: payload.blockedUntil,
    status: "AKTIF"
  };
}
