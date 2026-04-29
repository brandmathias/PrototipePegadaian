import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { blacklistActionLogs, blacklists, units, users } from "@/lib/db/schema";
import { serializeBlacklistEntry } from "@/lib/superadmin/serializers";
import { validateBlacklistRevokePayload } from "@/lib/superadmin/validation";

export async function listBlacklists() {
  const rows = await db
    .select({
      id: blacklists.id,
      userId: blacklists.userId,
      unitName: units.name,
      name: users.name,
      email: users.email,
      isActive: blacklists.isActive,
      totalViolations: blacklists.totalViolations,
      blockedUntil: blacklists.blockedUntil,
      revokeReason: blacklists.revokeReason
    })
    .from(blacklists)
    .innerJoin(users, eq(users.id, blacklists.userId))
    .leftJoin(units, eq(units.id, blacklists.unitId))
    .orderBy(desc(blacklists.updatedAt));

  return rows.map((row) =>
    serializeBlacklistEntry({
      id: row.id,
      userId: row.userId,
      name: row.name,
      email: row.email,
      unitName: row.unitName,
      isActive: row.isActive,
      totalViolations: row.totalViolations,
      blockedUntil: row.blockedUntil,
      revokeReason: row.revokeReason
    })
  );
}

export async function revokeBlacklist(userId: string, actorUserId: string, input: { reason?: string }) {
  const payload = validateBlacklistRevokePayload(input);

  const [activeBlacklist] = await db
    .select()
    .from(blacklists)
    .where(and(eq(blacklists.userId, userId), eq(blacklists.isActive, true)))
    .limit(1);

  if (!activeBlacklist) {
    throw new Error("Blacklist aktif untuk user ini tidak ditemukan.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(blacklists)
      .set({
        isActive: false,
        revokedByUserId: actorUserId,
        revokeReason: payload.reason,
        updatedAt: new Date()
      })
      .where(eq(blacklists.id, activeBlacklist.id));

    await tx.insert(blacklistActionLogs).values({
      id: crypto.randomUUID(),
      blacklistId: activeBlacklist.id,
      targetUserId: userId,
      action: "cabut_manual",
      performedByUserId: actorUserId,
      note: payload.reason
    });
  });

  return {
    success: true
  };
}
