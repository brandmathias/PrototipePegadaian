import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { serializeBlacklistHistoryEntry } from "@/lib/blacklist/history";
import { getBlacklistRestrictionPolicy } from "@/lib/blacklist/restrictions";
import { BLACKLIST_REVIEW_APPROVAL_REASONS } from "@/lib/blacklist/review";
import { db } from "@/lib/db/client";
import {
  barang,
  blacklistActionLogs,
  blacklists,
  mediaBarang,
  pelanggaranUser,
  pemasaran,
  transaksi,
  units,
  users
} from "@/lib/db/schema";
import { applyApprovedBlacklistGovernanceEffect } from "@/lib/services/blacklist-review.service";
import { serializeBlacklistEntry } from "@/lib/superadmin/serializers";
import { validateBlacklistRevokePayload } from "@/lib/superadmin/validation";
import { formatAppDateTime } from "@/lib/timezone";

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function serializeSuperadminBlacklist(row: {
  blacklist: typeof blacklists.$inferSelect;
  unit: typeof units.$inferSelect | null;
  user: typeof users.$inferSelect;
}) {
  const policy = getBlacklistRestrictionPolicy(row.blacklist.totalViolations);
  const now = new Date();
  const activeByDate =
    !row.blacklist.blockedUntil ||
    row.blacklist.blockedUntil.getTime() > now.getTime();
  const isCurrentlyActive =
    row.blacklist.isActive && (policy.requiresManualReview || activeByDate);

  return {
    userId: row.user.id,
    name: row.user.name,
    email: row.user.email,
    phone: row.user.phoneNumber ?? "-",
    violations: row.blacklist.totalViolations,
    until: row.blacklist.blockedUntil?.toISOString().slice(0, 10) ?? "-",
    blockedUntilAt: row.blacklist.blockedUntil?.toISOString() ?? null,
    status: isCurrentlyActive ? "AKTIF" : "TIDAK_AKTIF",
    reason: row.blacklist.revokeReason ?? "Pelanggaran pembayaran lelang.",
    lastIncident: row.blacklist.updatedAt.toISOString().slice(0, 10),
    lastIncidentAt: row.blacklist.updatedAt.toISOString(),
    level: policy.level,
    levelLabel: policy.label,
    durationDays: policy.durationDays,
    blocksVickrey: policy.blocksVickrey,
    blocksFixedPrice: policy.blocksFixedPrice,
    blocksTransactionSettlement: policy.blocksTransactionSettlement,
    requiresManualReview: policy.requiresManualReview,
    activeAuctionRestriction: isCurrentlyActive
      ? "Pembatasan akun masih aktif secara nasional."
      : "Pembatasan akun sudah selesai atau dicabut.",
    unit: row.unit?.name ?? row.blacklist.unitId ?? "-"
  };
}

async function listSuperadminUnpaidAuctionTraces(userId: string) {
  const rows = await db
    .select({
      violation: pelanggaranUser,
      transaction: transaksi,
      auction: pemasaran,
      item: barang,
      media: mediaBarang,
      unit: units
    })
    .from(pelanggaranUser)
    .innerJoin(transaksi, eq(transaksi.id, pelanggaranUser.transaksiId))
    .innerJoin(pemasaran, eq(pemasaran.id, pelanggaranUser.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .leftJoin(units, eq(units.id, pelanggaranUser.unitId))
    .leftJoin(
      mediaBarang,
      and(eq(mediaBarang.barangId, barang.id), eq(mediaBarang.sortOrder, 0))
    )
    .where(eq(pelanggaranUser.userId, userId))
    .orderBy(desc(pelanggaranUser.createdAt));

  return rows.map((row) => ({
    id: row.violation.id,
    userId: row.violation.userId,
    unitName: row.unit?.name ?? "-",
    lotCode: row.auction.id,
    lotLabel: row.item.code,
    itemCode: row.item.code,
    itemId: row.item.id,
    itemName: row.item.name,
    itemCategory: row.item.category,
    itemCondition: row.item.condition,
    itemDescription: row.item.description,
    itemAppraisalValue: toNullableNumber(row.item.appraisalValue),
    imageUrl: row.media?.url ?? null,
    imageFileName: row.media?.fileName ?? null,
    auctionMode: row.auction.mode,
    basePrice: toNullableNumber(row.auction.basePrice ?? row.auction.price),
    fixedPrice: toNullableNumber(row.auction.price),
    finalPrice: toNullableNumber(row.auction.finalPrice),
    transactionId: row.transaction.id,
    transactionStatus: row.transaction.status,
    amount: Number(row.transaction.amount),
    paymentDeadline: row.transaction.paymentDeadline?.toISOString() ?? null,
    paymentDeadlineLabel: row.transaction.paymentDeadline
      ? formatAppDateTime(row.transaction.paymentDeadline)
      : "-",
    occurredAt: row.violation.createdAt.toISOString(),
    occurredAtLabel: formatAppDateTime(row.violation.createdAt),
    note: row.violation.note
  }));
}

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

export async function getSuperadminBlacklistByUserId(userId: string) {
  const performers = alias(users, "superadmin_blacklist_log_performer");
  const [row] = await db
    .select({ blacklist: blacklists, user: users, unit: units })
    .from(blacklists)
    .innerJoin(users, eq(users.id, blacklists.userId))
    .leftJoin(units, eq(units.id, blacklists.unitId))
    .where(eq(blacklists.userId, userId))
    .orderBy(desc(blacklists.updatedAt))
    .limit(1);

  if (!row) {
    throw new Error("Riwayat blacklist pengguna tidak ditemukan.");
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
    .leftJoin(
      performers,
      eq(performers.id, blacklistActionLogs.performedByUserId)
    )
    .where(eq(blacklistActionLogs.blacklistId, row.blacklist.id))
    .orderBy(desc(blacklistActionLogs.createdAt));

  const traces = await listSuperadminUnpaidAuctionTraces(userId);
  const serialized = serializeSuperadminBlacklist(row);
  const latestTrace = traces[0] ?? null;

  return {
    ...serialized,
    reason: latestTrace?.note ?? serialized.reason,
    latestUnpaidAuction: latestTrace,
    unpaidAuctionCount: traces.length,
    unpaidAuctionTraces: traces,
    history: history.map(serializeBlacklistHistoryEntry)
  };
}

export const DIRECT_REVOKE_REASON_OPTIONS = BLACKLIST_REVIEW_APPROVAL_REASONS;
