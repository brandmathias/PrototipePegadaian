import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { serializeBlacklistHistoryEntry } from "@/lib/blacklist/history";
import { getBlacklistRestrictionPolicy } from "@/lib/blacklist/restrictions";
import { validateBlacklistExtendPayload } from "@/lib/admin-unit/validation";
import { db } from "@/lib/db/client";
import {
  barang,
  blacklistActionLogs,
  blacklists,
  mediaBarang,
  pelanggaranUser,
  pemasaran,
  transaksi,
  users,
} from "@/lib/db/schema";
import { formatAppDateTime } from "@/lib/timezone";

function serializeBlacklist(row: {
  blacklist: typeof blacklists.$inferSelect;
  user: typeof users.$inferSelect;
}, effectiveTotalViolations = row.blacklist.totalViolations) {
  const totalViolations = Math.max(Number(row.blacklist.totalViolations ?? 0), Number(effectiveTotalViolations ?? 0));
  const policy = getBlacklistRestrictionPolicy(totalViolations);
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
    violations: totalViolations,
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
      ? "User tidak dapat mengikuti Lelang Tertutup selama masa blokir aktif."
      : "Pembatasan Lelang Tertutup sudah tidak aktif.",
    unit: row.blacklist.unitId ?? "-",
  };
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

async function listUnpaidAuctionTraces(unitId: string, userId?: string) {
  const rows = await db
    .select({
      violation: pelanggaranUser,
      transaction: transaksi,
      auction: pemasaran,
      item: barang,
      media: mediaBarang,
    })
    .from(pelanggaranUser)
    .innerJoin(transaksi, eq(transaksi.id, pelanggaranUser.transaksiId))
    .innerJoin(pemasaran, eq(pemasaran.id, pelanggaranUser.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .leftJoin(
      mediaBarang,
      and(eq(mediaBarang.barangId, barang.id), eq(mediaBarang.sortOrder, 0)),
    )
    .where(
      userId
        ? and(
            eq(pelanggaranUser.unitId, unitId),
            eq(pelanggaranUser.userId, userId),
          )
        : eq(pelanggaranUser.unitId, unitId),
    )
    .orderBy(desc(pelanggaranUser.createdAt));

  return rows.map((row) => ({
    id: row.violation.id,
    userId: row.violation.userId,
    escalationEligible: row.violation.escalationEligible,
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
    note: row.violation.note,
  }));
}

export async function listAdminBlacklist(unitId: string) {
  const rows = await db
    .select({ blacklist: blacklists, user: users })
    .from(blacklists)
    .innerJoin(users, eq(users.id, blacklists.userId))
    .where(eq(blacklists.unitId, unitId))
    .orderBy(desc(blacklists.updatedAt));
  const traces = await listUnpaidAuctionTraces(unitId);
  const tracesByUser = traces.reduce<Record<string, typeof traces>>(
    (acc, trace) => {
      acc[trace.userId] = [...(acc[trace.userId] ?? []), trace];
      return acc;
    },
    {},
  );

  return rows.map((row) => {
    const userTraces = tracesByUser[row.user.id] ?? [];
    const effectiveTotalViolations = userTraces.filter((trace) => trace.escalationEligible !== false).length;
    const serialized = serializeBlacklist(row, effectiveTotalViolations);
    const latestTrace = userTraces[0] ?? null;

    return {
      ...serialized,
      reason: latestTrace?.note ?? serialized.reason,
      latestUnpaidAuction: latestTrace,
      unpaidAuctionCount: userTraces.length,
      unpaidAuctionTraces: userTraces,
    };
  });
}

export async function getAdminBlacklistByUserId(
  unitId: string,
  userId: string,
) {
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
      performedByName: performers.name,
    })
    .from(blacklistActionLogs)
    .leftJoin(
      performers,
      eq(performers.id, blacklistActionLogs.performedByUserId),
    )
    .where(eq(blacklistActionLogs.blacklistId, row.blacklist.id))
    .orderBy(desc(blacklistActionLogs.createdAt));

  const traces = await listUnpaidAuctionTraces(unitId, userId);
  const effectiveTotalViolations = traces.filter((trace) => trace.escalationEligible !== false).length;
  const serialized = serializeBlacklist(row, effectiveTotalViolations);
  const latestTrace = traces[0] ?? null;

  return {
    ...serialized,
    reason: latestTrace?.note ?? serialized.reason,
    latestUnpaidAuction: latestTrace,
    unpaidAuctionCount: traces.length,
    unpaidAuctionTraces: traces,
    history: history.map(serializeBlacklistHistoryEntry),
  };
}

export async function extendAdminBlacklist(
  unitId: string,
  adminId: string,
  userId: string,
  input: { blockedUntil?: unknown; reason?: unknown },
) {
  const row = await getAdminBlacklistByUserId(unitId, userId);
  const payload = validateBlacklistExtendPayload(input);

  const [updated] = await db
    .update(blacklists)
    .set({
      isActive: true,
      blockedUntil: new Date(`${payload.blockedUntil}T00:00:00.000Z`),
      updatedAt: new Date(),
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
    note: payload.reason,
  });

  return {
    ...row,
    until: payload.blockedUntil,
    status: "AKTIF",
  };
}
