import { randomUUID } from "node:crypto";

import { and, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import {
  deriveEffectiveBlacklistState,
  hasCountedBlacklistViolations,
} from "@/lib/blacklist/effective-state";
import { serializeBlacklistHistoryEntry } from "@/lib/blacklist/history";
import {
  getBlacklistRestrictionPolicy,
  shouldSuspendLoginForBlacklist,
} from "@/lib/blacklist/restrictions";
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
import { serializeBlacklistEntry } from "@/lib/superadmin/serializers";
import { validateBlacklistRevokePayload } from "@/lib/superadmin/validation";
import { formatAppDateTime } from "@/lib/timezone";

type DbExecutor = Pick<typeof db, "insert" | "update">;
type BlacklistRow = typeof blacklists.$inferSelect;

async function listViolationEscalationFacts(userIds: string[]) {
  if (userIds.length === 0) return [];

  const rows = await db
    .select({
      createdAt: pelanggaranUser.createdAt,
      escalationEligible: pelanggaranUser.escalationEligible,
      id: pelanggaranUser.id,
      paymentDeadline: transaksi.paymentDeadline,
      unitId: pelanggaranUser.unitId,
      userId: pelanggaranUser.userId,
    })
    .from(pelanggaranUser)
    .leftJoin(transaksi, eq(transaksi.id, pelanggaranUser.transaksiId))
    .where(inArray(pelanggaranUser.userId, userIds))
    .orderBy(desc(pelanggaranUser.createdAt));

  return rows.map((row) => ({
    createdAt: row.paymentDeadline ?? row.createdAt,
    escalationEligible: row.escalationEligible,
    id: row.id,
    occurredAt: (row.paymentDeadline ?? row.createdAt).toISOString(),
    unitId: row.unitId,
    userId: row.userId,
  }));
}

function groupByUser<T extends { userId: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((accumulator, item) => {
    accumulator[item.userId] = [...(accumulator[item.userId] ?? []), item];
    return accumulator;
  }, {});
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function serializeSuperadminBlacklist(row: {
  blacklist: typeof blacklists.$inferSelect;
  unit: typeof units.$inferSelect | null;
  user: typeof users.$inferSelect;
}, effectiveTotalViolations = row.blacklist.totalViolations, effectiveBlockedUntil = row.blacklist.blockedUntil) {
  const totalViolations = Math.max(0, Number(effectiveTotalViolations ?? row.blacklist.totalViolations ?? 0));
  const policy = getBlacklistRestrictionPolicy(totalViolations);
  const now = new Date();
  const activeByDate =
    !effectiveBlockedUntil ||
    effectiveBlockedUntil.getTime() > now.getTime();
  const isCurrentlyActive =
    row.blacklist.isActive && policy.level > 0 && (policy.requiresManualReview || activeByDate);

  return {
    userId: row.user.id,
    name: row.user.name,
    email: row.user.email,
    phone: row.user.phoneNumber ?? "-",
    violations: totalViolations,
    until: effectiveBlockedUntil?.toISOString().slice(0, 10) ?? "-",
    blockedUntilAt: effectiveBlockedUntil?.toISOString() ?? null,
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
    .orderBy(desc(transaksi.paymentDeadline), desc(pelanggaranUser.createdAt));

  return rows.map((row) => {
    const occurredAt = row.transaction.paymentDeadline ?? row.violation.createdAt;

    return {
      id: row.violation.id,
      userId: row.violation.userId,
      escalationEligible: row.violation.escalationEligible,
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
      occurredAt: occurredAt.toISOString(),
      occurredAtLabel: formatAppDateTime(occurredAt),
      wonAt: row.transaction.createdAt.toISOString(),
      wonAtLabel: formatAppDateTime(row.transaction.createdAt),
      note: row.violation.note
    };
  });
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
  const factsByUser = groupByUser(
    await listViolationEscalationFacts(rows.map((row) => row.userId)),
  );

  return rows.flatMap((row) => {
    const effectiveState = deriveEffectiveBlacklistState({
      storedBlockedUntil: row.blockedUntil,
      storedTotalViolations: row.totalViolations,
      traces: factsByUser[row.userId] ?? [],
    });
    if (!hasCountedBlacklistViolations(effectiveState.totalViolations)) {
      return [];
    }

    return [serializeBlacklistEntry({
      id: row.id,
      userId: row.userId,
      name: row.name,
      email: row.email,
      unitName: row.unitName,
      isActive: row.isActive,
      totalViolations: effectiveState.totalViolations,
      blockedUntil: row.isActive ? effectiveState.blockedUntil : row.blockedUntil,
      revokeReason: row.revokeReason
    })];
  });
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
    await applyManualBlacklistRevokeEffect(tx, {
      incidentId: latestIncident?.id ?? null,
      userId,
      actorUserId,
      reasonCode: payload.reasonCode,
      note: payload.note || payload.reason,
      activeBlacklist
    });
  });

  return {
    success: true
  };
}

async function applyManualBlacklistRevokeEffect(
  executor: DbExecutor,
  input: {
    incidentId?: string | null;
    userId: string;
    actorUserId: string;
    reasonCode: string;
    note: string;
    activeBlacklist: BlacklistRow;
  }
) {
  const now = new Date();

  if (input.incidentId) {
    await executor
      .update(pelanggaranUser)
      .set({
        escalationEligible: false,
        resolutionType: "cabut_manual",
        resolutionReasonCode: input.reasonCode,
        resolutionNote: input.note,
        resolvedByUserId: input.actorUserId,
        resolvedAt: now,
        updatedAt: now
      })
      .where(eq(pelanggaranUser.id, input.incidentId));
  }

  await executor
    .update(blacklists)
    .set({
      isActive: false,
      revokedByUserId: input.actorUserId,
      revokeReason: input.note || input.reasonCode,
      updatedAt: now
    })
    .where(eq(blacklists.id, input.activeBlacklist.id));

  if (shouldSuspendLoginForBlacklist(input.activeBlacklist.totalViolations)) {
    await executor
      .update(users)
      .set({
        isActive: true,
        updatedAt: now
      })
      .where(eq(users.id, input.userId));
  }

  await executor.insert(blacklistActionLogs).values({
    id: randomUUID(),
    blacklistId: input.activeBlacklist.id,
    targetUserId: input.userId,
    action: "cabut_manual",
    performedByType: "manual",
    performedByUserId: input.actorUserId,
    note: input.note || input.reasonCode
  });
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
  const effectiveState = deriveEffectiveBlacklistState({
    storedBlockedUntil: row.blacklist.blockedUntil,
    storedTotalViolations: row.blacklist.totalViolations,
    traces,
  });
  if (!hasCountedBlacklistViolations(effectiveState.totalViolations)) {
    throw new Error("Riwayat blacklist pengguna tidak ditemukan.");
  }

  const visibleTraceIds = new Set(
    effectiveState.milestones.map((milestone) => String(milestone.trace.id)),
  );
  const visibleTraces =
    effectiveState.milestones.length > 0
      ? traces.filter((trace) => visibleTraceIds.has(String(trace.id)))
      : traces;
  const effectiveBlockedUntil =
    row.blacklist.isActive
      ? effectiveState.blockedUntil
      : row.blacklist.blockedUntil;
  const serialized = serializeSuperadminBlacklist(row, effectiveState.totalViolations, effectiveBlockedUntil);
  const latestTrace = visibleTraces[0] ?? null;

  return {
    ...serialized,
    reason: latestTrace?.note ?? serialized.reason,
    latestUnpaidAuction: latestTrace,
    unpaidAuctionCount: visibleTraces.length,
    unpaidAuctionTraces: visibleTraces,
    history: history.map(serializeBlacklistHistoryEntry)
  };
}
