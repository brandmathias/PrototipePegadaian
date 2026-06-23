import { and, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import {
  deriveEffectiveBlacklistState,
  hasCountedBlacklistViolations,
} from "@/lib/blacklist/effective-state";
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
  units,
  users,
} from "@/lib/db/schema";
import { formatAppDateTime } from "@/lib/timezone";

function serializeBlacklist(row: {
  blacklist: typeof blacklists.$inferSelect;
  unit?: typeof units.$inferSelect | null;
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
      ? "User tidak dapat mengikuti Lelang Tertutup selama masa blokir aktif."
      : "Pembatasan Lelang Tertutup sudah tidak aktif.",
    unit: row.blacklist.unitId ?? "-",
    unitName: row.unit?.name ?? row.blacklist.unitId ?? "-",
  };
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

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
  return items.reduce<Record<string, T[]>>((acc, item) => {
    acc[item.userId] = [...(acc[item.userId] ?? []), item];
    return acc;
  }, {});
}

function buildViolationScopeContext<T extends Record<string, any>>({
  localTraces,
  storedBlockedUntil,
  storedTotalViolations,
  unitId,
  userFacts,
}: {
  localTraces: T[];
  storedBlockedUntil: Date | null;
  storedTotalViolations: number | null;
  unitId: string;
  userFacts: Awaited<ReturnType<typeof listViolationEscalationFacts>>;
}) {
  const effectiveState = deriveEffectiveBlacklistState({
    storedBlockedUntil,
    storedTotalViolations,
    traces: userFacts,
  });
  const globalMilestones = effectiveState.milestones;
  const globalTotal = effectiveState.totalViolations;
  const levelByTraceId = new Map(
    globalMilestones.map((milestone) => [milestone.trace.id, milestone.level]),
  );
  const annotatedLocalTraces = localTraces.map((trace): T & { restrictionLevel: unknown } => ({
    ...trace,
    restrictionLevel: levelByTraceId.get(String(trace.id)) ?? trace.restrictionLevel,
  }));
  const visibleLocalTraces =
    globalMilestones.length > 0
      ? annotatedLocalTraces.filter((trace) => levelByTraceId.has(String(trace.id)))
      : annotatedLocalTraces;
  const currentUnitMilestoneCount = globalMilestones.filter(
    (milestone) => milestone.trace.unitId === unitId,
  ).length;
  const externalMilestoneCount = globalMilestones.filter(
    (milestone) => milestone.trace.unitId !== unitId,
  ).length;
  const externalViolationCount = Math.max(externalMilestoneCount, 0);
  const externalUnitCount = new Set(
    globalMilestones
      .filter((milestone) => milestone.trace.unitId !== unitId)
      .map((milestone) => milestone.trace.unitId),
  ).size;

  return {
    annotatedLocalTraces: visibleLocalTraces,
    crossUnitViolationSummary: {
      currentUnitViolationCount: currentUnitMilestoneCount,
      effectiveViolationTotal: globalTotal,
      externalUnitCount,
      externalViolationCount,
      hasExternalViolations: externalViolationCount > 0,
    },
    effectiveBlockedUntil: effectiveState.blockedUntil,
    effectiveTotalViolations: globalTotal,
  };
}

async function listUnpaidAuctionTraces(unitId: string, userId?: string) {
  const rows = await db
    .select({
      violation: pelanggaranUser,
      transaction: transaksi,
      auction: pemasaran,
      item: barang,
      media: mediaBarang,
      unit: units,
    })
    .from(pelanggaranUser)
    .innerJoin(transaksi, eq(transaksi.id, pelanggaranUser.transaksiId))
    .innerJoin(pemasaran, eq(pemasaran.id, pelanggaranUser.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, pelanggaranUser.unitId))
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
    .orderBy(desc(transaksi.paymentDeadline), desc(pelanggaranUser.createdAt));

  return rows.map((row) => {
    const occurredAt = row.transaction.paymentDeadline ?? row.violation.createdAt;

    return {
      id: row.violation.id,
      userId: row.violation.userId,
      escalationEligible: row.violation.escalationEligible,
      unitName: row.unit.name,
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
      note: row.violation.note,
    };
  });
}

export async function listAdminBlacklist(unitId: string) {
  const rows = await db
    .select({ blacklist: blacklists, unit: units, user: users })
    .from(blacklists)
    .innerJoin(users, eq(users.id, blacklists.userId))
    .leftJoin(units, eq(units.id, blacklists.unitId))
    .where(eq(blacklists.unitId, unitId))
    .orderBy(desc(blacklists.updatedAt));
  const traces = await listUnpaidAuctionTraces(unitId);
  const tracesByUser = groupByUser(traces);
  const factsByUser = groupByUser(
    await listViolationEscalationFacts(rows.map((row) => row.user.id)),
  );

  return rows.flatMap((row) => {
    const userTraces = tracesByUser[row.user.id] ?? [];
    const scopeContext = buildViolationScopeContext({
      localTraces: userTraces,
      storedBlockedUntil: row.blacklist.blockedUntil,
      storedTotalViolations: row.blacklist.totalViolations,
      unitId,
      userFacts: factsByUser[row.user.id] ?? [],
    });
    if (!hasCountedBlacklistViolations(scopeContext.effectiveTotalViolations)) {
      return [];
    }

    const effectiveBlockedUntil =
      row.blacklist.isActive
        ? scopeContext.effectiveBlockedUntil
        : row.blacklist.blockedUntil;
    const serialized = serializeBlacklist(row, scopeContext.effectiveTotalViolations, effectiveBlockedUntil);
    const latestTrace = scopeContext.annotatedLocalTraces[0] ?? null;

    return [{
      ...serialized,
      crossUnitViolationSummary: scopeContext.crossUnitViolationSummary,
      reason: latestTrace?.note ?? serialized.reason,
      latestUnpaidAuction: latestTrace,
      unpaidAuctionCount: scopeContext.annotatedLocalTraces.length,
      unpaidAuctionTraces: scopeContext.annotatedLocalTraces,
    }];
  });
}

export async function getAdminBlacklistByUserId(
  unitId: string,
  userId: string,
) {
  const performers = alias(users, "blacklist_log_performer");
  const [row] = await db
    .select({ blacklist: blacklists, unit: units, user: users })
    .from(blacklists)
    .innerJoin(users, eq(users.id, blacklists.userId))
    .leftJoin(units, eq(units.id, blacklists.unitId))
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
  const scopeContext = buildViolationScopeContext({
    localTraces: traces,
    storedBlockedUntil: row.blacklist.blockedUntil,
    storedTotalViolations: row.blacklist.totalViolations,
    unitId,
    userFacts: await listViolationEscalationFacts([userId]),
  });
  if (!hasCountedBlacklistViolations(scopeContext.effectiveTotalViolations)) {
    throw new Error("Riwayat blacklist tidak ditemukan di unit Anda.");
  }

  const effectiveBlockedUntil =
    row.blacklist.isActive
      ? scopeContext.effectiveBlockedUntil
      : row.blacklist.blockedUntil;
  const serialized = serializeBlacklist(row, scopeContext.effectiveTotalViolations, effectiveBlockedUntil);
  const latestTrace = scopeContext.annotatedLocalTraces[0] ?? null;

  return {
    ...serialized,
    crossUnitViolationSummary: scopeContext.crossUnitViolationSummary,
    reason: latestTrace?.note ?? serialized.reason,
    latestUnpaidAuction: latestTrace,
    unpaidAuctionCount: scopeContext.annotatedLocalTraces.length,
    unpaidAuctionTraces: scopeContext.annotatedLocalTraces,
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
