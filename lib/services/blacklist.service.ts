import { and, desc, eq } from "drizzle-orm";

import { BLACKLIST_REVIEW_APPROVAL_REASONS } from "@/lib/blacklist/review";
import { db } from "@/lib/db/client";
import { blacklists, pelanggaranUser, units, users } from "@/lib/db/schema";
import { applyApprovedBlacklistGovernanceEffect } from "@/lib/services/blacklist-review.service";
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

export async function revokeBlacklist(
  userId: string,
  actorUserId: string,
  input: { reason?: string; reasonCode?: string; note?: string }
) {
  const payload = validateBlacklistRevokePayload(input);

  const [activeBlacklist] = await db
    .select()
    .from(blacklists)
    .where(and(eq(blacklists.userId, userId), eq(blacklists.isActive, true)))
    .limit(1);

  if (!activeBlacklist) {
    throw new Error("Blacklist aktif untuk user ini tidak ditemukan.");
  }

  const [latestIncident] = await db
    .select({ id: pelanggaranUser.id })
    .from(pelanggaranUser)
    .where(and(eq(pelanggaranUser.userId, userId), eq(pelanggaranUser.escalationEligible, true)))
    .orderBy(desc(pelanggaranUser.createdAt))
    .limit(1);

  await db.transaction(async (tx) => {
    await applyApprovedBlacklistGovernanceEffect(tx, {
      incidentId: latestIncident?.id ?? null,
      userId,
      actorUserId,
      reasonCode: payload.reasonCode,
      note: payload.note || payload.reason,
      action: "cabut_manual",
      activeBlacklist
    });
  });

  return {
    success: true
  };
}

export const DIRECT_REVOKE_REASON_OPTIONS = BLACKLIST_REVIEW_APPROVAL_REASONS;
