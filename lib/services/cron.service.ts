import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, gt, inArray, isNotNull, lte, or } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  barang,
  bids,
  blacklistActionLogs,
  blacklists,
  pelanggaranUser,
  pemasaran,
  riwayatStatusBarang,
  sessions,
  transaksi,
  units,
  users
} from "@/lib/db/schema";
import { isHandoverAutoCompleteDue } from "@/lib/transactions/handover-finalization";
import {
  getBlacklistBlockedUntil,
  getBlacklistDurationLabel,
  getBlacklistRestrictionPolicy,
  shouldSuspendLoginForBlacklist
} from "@/lib/blacklist/restrictions";
import {
  listActiveAdminUnitNotificationRecipientIds,
  listActiveSuperAdminNotificationRecipientIds,
  notifyAdminUnitVickreyResult,
  notifyBlacklistActivated,
  notifyPaymentDeadlineSoon,
  notifySuperAdminPolicyAlert,
  notifyVickreyLoss,
  notifyVickreyWinner
} from "@/lib/services/notification-events";
import { formatAppDateTime } from "@/lib/timezone";

type BidOutcomeInput = {
  basePrice: string | number | null;
  bids: Array<{
    id: string;
    userId: string;
    nominal: string | number | null;
    createdAt?: Date | null;
  }>;
};

type VickreyOutcome =
  | {
      status: "gagal";
      bidCount: 0;
      winnerId: null;
      topBidId: null;
      winnerBidAmount: null;
      runnerUpBidId: null;
      runnerUpUserId: null;
      finalPrice: null;
    }
  | {
      status: "menunggu_pembayaran";
      bidCount: number;
      winnerId: string;
      topBidId: string;
      winnerBidAmount: string;
      runnerUpBidId: string | null;
      runnerUpUserId: string | null;
      finalPrice: string;
    };

type ExpiredAuctionSummary = {
  processed: number;
  completed: number;
  failed: number;
  pendingReveal: number;
};

type OverduePaymentSummary = {
  processed: number;
  blacklisted: number;
};

type PaymentDeadlineSummary = {
  processed: number;
  notified: number;
};

type BlacklistExpirySummary = {
  processed: number;
  expired: number;
};

type HandoverAutoCompletionSummary = {
  processed: number;
  completed: number;
};

type BlacklistNotificationPayload = {
  userId: string;
  transactionId: string;
  totalViolations: number;
  blockedUntilLabel: string;
  occurredAt: Date;
};

const UNPAID_VICKREY_STATUSES = [
  "menunggu_pembayaran",
  "bukti_diunggah",
  "ditolak_bukti",
  "menunggu_konfirmasi_langsung"
] as const;

function toMoneyNumber(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function formatMoney(value: string | number) {
  return toMoneyNumber(value).toFixed(2);
}

function plusHours(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 3_600_000);
}

export function canSettleVickreySession(
  input: { endsAt: Date | null },
  now = new Date()
) {
  return Boolean(input.endsAt && input.endsAt.getTime() <= now.getTime());
}

export { getBlacklistDurationDays } from "@/lib/blacklist/restrictions";

export function resolveAccumulatedBlacklistViolations(input: {
  eligibleViolationCount?: number | null;
  previousTotalViolations?: number | null;
  currentIncidentCount?: number | null;
}) {
  const previousTotalViolations = Math.max(0, Math.floor(Number(input.previousTotalViolations ?? 0)));
  const currentIncidentCount = Math.max(1, Math.floor(Number(input.currentIncidentCount ?? 1)));

  return Math.min(previousTotalViolations + currentIncidentCount, 3);
}

function isBlacklistRestrictionWindowActive(
  blacklist:
    | {
        blockedUntil?: Date | null;
        isActive?: boolean | null;
        totalViolations?: number | null;
      }
    | null
    | undefined,
  now: Date
) {
  if (!blacklist?.isActive) {
    return false;
  }

  return !blacklist.blockedUntil || blacklist.blockedUntil.getTime() > now.getTime();
}

export function resolveVickreyOutcome(input: BidOutcomeInput): VickreyOutcome {
  const revealedBids = input.bids.filter(
    (bid): bid is BidOutcomeInput["bids"][number] & { nominal: string | number } => bid.nominal != null
  );
  const sortedBids = revealedBids.sort((left, right) => {
    const amountDifference = toMoneyNumber(right.nominal) - toMoneyNumber(left.nominal);
    if (amountDifference !== 0) {
      return amountDifference;
    }

    // Tie-breaker policy: equal bid amounts are won by the earliest submitted bid.
    // The later equal bid remains runner-up, so the Lelang Tertutup final price equals the tied amount.
    const leftTime = left.createdAt?.getTime() ?? 0;
    const rightTime = right.createdAt?.getTime() ?? 0;
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.id.localeCompare(right.id);
  });

  if (sortedBids.length === 0) {
    return {
      bidCount: 0,
      finalPrice: null,
      runnerUpBidId: null,
      runnerUpUserId: null,
      status: "gagal",
      topBidId: null,
      winnerBidAmount: null,
      winnerId: null
    };
  }

  const topBid = sortedBids[0];
  const runnerUpBid = sortedBids[1] ?? null;

  return {
    bidCount: sortedBids.length,
    finalPrice: formatMoney(runnerUpBid?.nominal ?? input.basePrice ?? 0),
    runnerUpBidId: runnerUpBid?.id ?? null,
    runnerUpUserId: runnerUpBid?.userId ?? null,
    status: "menunggu_pembayaran",
    topBidId: topBid.id,
    winnerBidAmount: formatMoney(topBid.nominal),
    winnerId: topBid.userId
  };
}

async function appendItemStatusHistory(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    barangId: string;
    oldStatus: string | null | undefined;
    newStatus: string;
    note: string;
  }
) {
  if (input.oldStatus === input.newStatus) {
    return;
  }

  await tx.insert(riwayatStatusBarang).values({
    id: randomUUID(),
    barangId: input.barangId,
    oldStatus: input.oldStatus ?? null,
    newStatus: input.newStatus,
    changedByUserId: null,
    note: input.note
  });
}

export async function processExpiredVickreyAuctions(now = new Date()): Promise<ExpiredAuctionSummary> {
  const expiredSessions = await db
    .select({
      marketing: pemasaran,
      item: barang,
      unit: units
    })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .where(
      and(
        eq(pemasaran.mode, "vickrey"),
        eq(pemasaran.status, "aktif"),
        isNotNull(pemasaran.endsAt),
        lte(pemasaran.endsAt, now)
      )
    )
    .orderBy(asc(pemasaran.endsAt));

  const summary: ExpiredAuctionSummary = {
    processed: expiredSessions.length,
    completed: 0,
    failed: 0,
    pendingReveal: 0
  };

  for (const session of expiredSessions) {
    let winnerNotification:
      | {
          userId: string;
          transactionId: string;
          lotName: string;
          finalPrice: string;
          unitName: string;
        }
      | null = null;
    let loserNotifications: Array<{
      userId: string;
      pemasaranId: string;
      lotName: string;
    }> = [];

    const settledStatus = await db.transaction(async (tx) => {
      const marketingBids = await tx
        .select({
          id: bids.id,
          userId: bids.userId,
          nominal: bids.nominal,
          createdAt: bids.createdAt
        })
        .from(bids)
        .where(eq(bids.pemasaranId, session.marketing.id))
        .orderBy(desc(bids.nominal), asc(bids.createdAt), asc(bids.id));

      if (!canSettleVickreySession({ endsAt: session.marketing.endsAt }, now)) {
        return "pending_reveal" as const;
      }

      const outcome = resolveVickreyOutcome({
        basePrice: session.marketing.basePrice,
        bids: marketingBids
      });

      if (outcome.status === "gagal") {
        await tx
          .update(pemasaran)
          .set({
            status: "gagal",
            winnerId: null,
            finalPrice: null,
            updatedAt: now
          })
          .where(eq(pemasaran.id, session.marketing.id));

        await tx
          .update(barang)
          .set({
            status: "gagal",
            updatedAt: now
          })
          .where(eq(barang.id, session.item.id));

        await appendItemStatusHistory(tx, {
          barangId: session.item.id,
          oldStatus: session.item.status,
          newStatus: "gagal",
          note: "Sesi Lelang Tertutup berakhir tanpa penawar sehingga barang masuk status gagal."
        });

        return "gagal" as const;
      }

      loserNotifications = Array.from(
        new Set(
          marketingBids
            .map((bid) => bid.userId)
            .filter((userId) => userId !== outcome.winnerId)
        )
      ).map((userId) => ({
        userId,
        pemasaranId: session.marketing.id,
        lotName: session.item.name
      }));

      const [existingTransaction] = await tx
        .select({ id: transaksi.id })
        .from(transaksi)
        .where(eq(transaksi.pemasaranId, session.marketing.id))
        .limit(1);

      await tx
        .update(pemasaran)
        .set({
          status: "selesai",
          winnerId: outcome.winnerId,
          finalPrice: outcome.finalPrice,
          updatedAt: now
        })
        .where(eq(pemasaran.id, session.marketing.id));

      if (existingTransaction) {
        await tx
          .update(transaksi)
          .set({
            userId: outcome.winnerId,
            type: "vickrey",
            amount: outcome.finalPrice,
            paymentMethod: "langsung",
            status: "menunggu_konfirmasi_langsung",
            proofUrl: null,
            rejectionReason: null,
            referenceNumber: null,
            paymentDeadline: plusHours(now, 24),
            verifiedByUserId: null,
            verifiedAt: null,
            updatedAt: now
          })
          .where(eq(transaksi.id, existingTransaction.id));
        winnerNotification = {
          userId: outcome.winnerId,
          transactionId: existingTransaction.id,
          lotName: session.item.name,
          finalPrice: outcome.finalPrice,
          unitName: session.unit.name
        };
      } else {
        const transactionId = randomUUID();
        await tx.insert(transaksi).values({
          id: transactionId,
          pemasaranId: session.marketing.id,
          userId: outcome.winnerId,
          type: "vickrey",
          amount: outcome.finalPrice,
          paymentMethod: "langsung",
          status: "menunggu_konfirmasi_langsung",
          paymentDeadline: plusHours(now, 24)
        });
        winnerNotification = {
          userId: outcome.winnerId,
          transactionId,
          lotName: session.item.name,
          finalPrice: outcome.finalPrice,
          unitName: session.unit.name
        };
      }

      await tx
        .update(barang)
        .set({
          status: "menunggu_pembayaran",
          updatedAt: now
        })
        .where(eq(barang.id, session.item.id));

      await appendItemStatusHistory(tx, {
        barangId: session.item.id,
        oldStatus: session.item.status,
        newStatus: "menunggu_pembayaran",
        note: "Sesi Lelang Tertutup selesai dan sistem membuat transaksi bayar langsung untuk pemenang."
      });

      return "selesai" as const;
    });

    if (settledStatus === "selesai") {
      summary.completed += 1;
      const [adminUserIds, superAdminUserIds] = await Promise.all([
        listActiveAdminUnitNotificationRecipientIds(session.item.unitId),
        listActiveSuperAdminNotificationRecipientIds()
      ]);
      await notifyAdminUnitVickreyResult({
        adminUserIds,
        superAdminUserIds,
        unitId: session.item.unitId,
        barangId: session.item.id,
        pemasaranId: session.marketing.id,
        lotName: session.item.name,
        result: "winner_selected"
      });
      if (winnerNotification) {
        await notifyVickreyWinner(winnerNotification);
      }
      if (loserNotifications.length) {
        await Promise.all(loserNotifications.map((notification) => notifyVickreyLoss(notification)));
      }
    } else if (settledStatus === "gagal") {
      summary.failed += 1;
      const [adminUserIds, superAdminUserIds] = await Promise.all([
        listActiveAdminUnitNotificationRecipientIds(session.item.unitId),
        listActiveSuperAdminNotificationRecipientIds()
      ]);
      await notifyAdminUnitVickreyResult({
        adminUserIds,
        superAdminUserIds,
        unitId: session.item.unitId,
        barangId: session.item.id,
        pemasaranId: session.marketing.id,
        lotName: session.item.name,
        result: "no_winner"
      });
    } else {
      summary.pendingReveal += 1;
    }
  }

  return summary;
}

export async function processPaymentDeadlineNotifications(now = new Date()): Promise<PaymentDeadlineSummary> {
  const warningDeadline = plusHours(now, 3);
  const dueSoonTransactions = await db
    .select({
      transaction: transaksi,
      item: barang
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .where(
      and(
        inArray(transaksi.status, [...UNPAID_VICKREY_STATUSES]),
        isNotNull(transaksi.paymentDeadline),
        gt(transaksi.paymentDeadline, now),
        lte(transaksi.paymentDeadline, warningDeadline)
      )
    )
    .orderBy(asc(transaksi.paymentDeadline));

  const summary: PaymentDeadlineSummary = {
    processed: dueSoonTransactions.length,
    notified: 0
  };

  for (const row of dueSoonTransactions) {
    await notifyPaymentDeadlineSoon({
      userId: row.transaction.userId,
      transactionId: row.transaction.id,
      lotName: row.item.name
    });
    summary.notified += 1;
  }

  return summary;
}

export async function processOverdueVickreyPayments(now = new Date()): Promise<OverduePaymentSummary> {
  const overdueTransactions = await db
    .select({
      transaction: transaksi,
      marketing: pemasaran,
      item: barang,
      buyerNationalId: users.nationalId
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(users, eq(users.id, transaksi.userId))
    .where(
      and(
        eq(transaksi.type, "vickrey"),
        inArray(transaksi.status, [...UNPAID_VICKREY_STATUSES]),
        isNotNull(transaksi.paymentDeadline),
        lte(transaksi.paymentDeadline, now)
      )
    )
    .orderBy(asc(transaksi.paymentDeadline));

  const summary: OverduePaymentSummary = {
    processed: overdueTransactions.length,
    blacklisted: 0
  };

  for (const row of overdueTransactions) {
    let applied = false;
    let blacklistApplied = false;
    let blacklistNotification: BlacklistNotificationPayload | null = null;
    const violationOccurredAt = row.transaction.paymentDeadline ?? now;

    await db.transaction(async (tx) => {
      const [updatedTransaction] = await tx
        .update(transaksi)
        .set({
          status: "gagal",
          updatedAt: now
        })
        .where(
          and(
            eq(transaksi.id, row.transaction.id),
            inArray(transaksi.status, [...UNPAID_VICKREY_STATUSES]),
            isNotNull(transaksi.paymentDeadline),
            lte(transaksi.paymentDeadline, now)
          )
        )
        .returning({ id: transaksi.id });

      if (!updatedTransaction) {
        return;
      }

      applied = true;

      await tx
        .update(pemasaran)
        .set({
          status: "gagal",
          updatedAt: now
        })
        .where(eq(pemasaran.id, row.marketing.id));

      await tx
        .update(barang)
        .set({
          status: "gagal",
          updatedAt: now
        })
        .where(eq(barang.id, row.item.id));

      await appendItemStatusHistory(tx, {
        barangId: row.item.id,
        oldStatus: row.item.status,
        newStatus: "gagal",
        note: "Pemenang Lelang Tertutup tidak menyelesaikan pembayaran dalam 24 jam sehingga sesi dinyatakan gagal."
      });

      const matchingBlacklists = await tx
        .select()
        .from(blacklists)
        .where(
          row.buyerNationalId
            ? or(eq(blacklists.userId, row.transaction.userId), eq(blacklists.nationalId, row.buyerNationalId))
            : eq(blacklists.userId, row.transaction.userId)
        )
        .orderBy(desc(blacklists.isActive), desc(blacklists.totalViolations), desc(blacklists.updatedAt))
        .limit(20);
      const existingBlacklist = matchingBlacklists[0];
      const previousTotalViolations = matchingBlacklists.reduce(
        (highest, blacklist) => Math.max(highest, Number(blacklist.totalViolations ?? 0)),
        0
      );
      const escalationEligible = !isBlacklistRestrictionWindowActive(existingBlacklist, violationOccurredAt);

      const violationId = randomUUID();
      await tx.insert(pelanggaranUser).values({
        id: violationId,
        userId: row.transaction.userId,
        pemasaranId: row.transaction.pemasaranId,
        transaksiId: row.transaction.id,
        unitId: row.item.unitId,
        note: escalationEligible
          ? "Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam."
          : "Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam saat pembatasan sebelumnya masih aktif.",
        escalationEligible,
        createdAt: violationOccurredAt,
        updatedAt: now
      });

      if (!escalationEligible) {
        return;
      }

      const totalViolations = resolveAccumulatedBlacklistViolations({
        previousTotalViolations
      });
      const blockedUntil = getBlacklistBlockedUntil(violationOccurredAt, totalViolations);
      const restriction = getBlacklistRestrictionPolicy(totalViolations);
      const shouldSuspendLogin = shouldSuspendLoginForBlacklist(totalViolations);
      const blacklistId = existingBlacklist?.id ?? randomUUID();

      if (existingBlacklist) {
        await tx
          .update(blacklists)
          .set({
            unitId: row.item.unitId,
            userId: row.transaction.userId,
            nationalId: row.buyerNationalId ?? existingBlacklist.nationalId,
            totalViolations,
            isActive: true,
            blockedAt: violationOccurredAt,
            blockedUntil,
            updatedAt: now
          })
          .where(eq(blacklists.id, existingBlacklist.id));
      } else {
        await tx.insert(blacklists).values({
          id: blacklistId,
          unitId: row.item.unitId,
          userId: row.transaction.userId,
          nationalId: row.buyerNationalId,
          totalViolations,
          isActive: true,
          blockedAt: violationOccurredAt,
          blockedUntil,
          updatedAt: now
        });
      }
      blacklistApplied = true;
      blacklistNotification = {
        userId: row.transaction.userId,
        transactionId: row.transaction.id,
        totalViolations,
        blockedUntilLabel: formatAppDateTime(blockedUntil),
        occurredAt: violationOccurredAt
      };

      if (shouldSuspendLogin) {
        await tx
          .update(users)
          .set({
            isActive: false,
            updatedAt: now
          })
          .where(eq(users.id, row.transaction.userId));

        await tx.delete(sessions).where(eq(sessions.userId, row.transaction.userId));
      }

      await tx.insert(blacklistActionLogs).values({
        id: randomUUID(),
        blacklistId,
        targetUserId: row.transaction.userId,
        action: "blokir_otomatis",
        note: shouldSuspendLogin
          ? `Sistem otomatis menonaktifkan akun buyer selama ${getBlacklistDurationLabel(totalViolations)} karena mencapai Level 3.`
          : `Sistem otomatis memblokir buyer selama ${getBlacklistDurationLabel(totalViolations)} karena tidak membayar hasil Lelang Tertutup.`
      });
    });

    if (!applied) {
      continue;
    }

    if (blacklistApplied) {
      summary.blacklisted += 1;
    }
    const notificationPayload = blacklistNotification as BlacklistNotificationPayload | null;
    if (notificationPayload) {
      await notifyBlacklistActivated(notificationPayload);
      const [adminUserIds, superAdminUserIds] = await Promise.all([
        listActiveAdminUnitNotificationRecipientIds(row.item.unitId),
        listActiveSuperAdminNotificationRecipientIds()
      ]);
      await Promise.all([
        notifyAdminUnitVickreyResult({
          adminUserIds,
          superAdminUserIds,
          unitId: row.item.unitId,
          barangId: row.item.id,
          pemasaranId: row.marketing.id,
          lotName: row.item.name,
          result: "payment_overdue",
          occurredAt: notificationPayload.occurredAt
        }),
        notifySuperAdminPolicyAlert({
          superAdminUserIds,
          buyerId: row.transaction.userId,
          transactionId: row.transaction.id,
          lotName: row.item.name,
          totalViolations: notificationPayload.totalViolations,
          blockedUntilLabel: notificationPayload.blockedUntilLabel,
          occurredAt: notificationPayload.occurredAt
        })
      ]);
    }
  }

  return summary;
}

export async function processExpiredBlacklistRestrictions(now = new Date()): Promise<BlacklistExpirySummary> {
  const expiredRows = await db
    .select({
      id: blacklists.id,
      userId: blacklists.userId,
      totalViolations: blacklists.totalViolations
    })
    .from(blacklists)
    .where(
      and(
        eq(blacklists.isActive, true),
        isNotNull(blacklists.blockedUntil),
        lte(blacklists.blockedUntil, now)
      )
    );
  for (const row of expiredRows) {
    await db.transaction(async (tx) => {
      await tx
        .update(blacklists)
        .set({
          isActive: false,
          updatedAt: now
        })
        .where(eq(blacklists.id, row.id));

      if (shouldSuspendLoginForBlacklist(row.totalViolations)) {
        await tx
          .update(users)
          .set({
            isActive: true,
            updatedAt: now
          })
          .where(eq(users.id, row.userId));
      }

      await tx.insert(blacklistActionLogs).values({
        id: randomUUID(),
        blacklistId: row.id,
        targetUserId: row.userId,
        action: "selesai_otomatis",
        note: "Masa pembatasan berakhir otomatis. Riwayat blacklist tetap tersimpan."
      });
    });
  }

  return {
    processed: expiredRows.length,
    expired: expiredRows.length
  };
}

export async function processHandoverAutoCompletions(now = new Date()): Promise<HandoverAutoCompletionSummary> {
  const rows = await db
    .select({
      transaction: transaksi,
      item: barang,
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .where(
      and(
        eq(transaksi.status, "lunas"),
        isNotNull(transaksi.handoverProofUrl),
        isNotNull(transaksi.handoverProofUploadedAt),
      ),
    );
  const dueRows = rows.filter((row) => isHandoverAutoCompleteDue(row.transaction, now));

  let completed = 0;

  for (const row of dueRows) {
    await db.transaction(async (tx) => {
      const [updatedTransaction] = await tx
        .update(transaksi)
        .set({
          status: "selesai",
          completedAt: now,
          completionSource: "auto_handover_grace",
          updatedAt: now,
        })
        .where(
          and(
            eq(transaksi.id, row.transaction.id),
            eq(transaksi.status, "lunas"),
            isNotNull(transaksi.handoverProofUrl),
            isNotNull(transaksi.handoverProofUploadedAt),
          ),
        )
        .returning({ id: transaksi.id });

      if (!updatedTransaction) {
        return;
      }

      await tx.update(pemasaran).set({ status: "selesai", updatedAt: now }).where(eq(pemasaran.id, row.transaction.pemasaranId));
      await tx.update(barang).set({ status: "terjual", updatedAt: now }).where(eq(barang.id, row.item.id));

      await tx.insert(riwayatStatusBarang).values({
        id: randomUUID(),
        barangId: row.item.id,
        oldStatus: row.item.status,
        newStatus: "terjual",
        changedByUserId: null,
        note: "Transaksi selesai otomatis karena buyer tidak menekan Pembelian Selesai dalam 3 hari setelah bukti serah-terima diunggah.",
      });

      completed += 1;
    });
  }

  return {
    processed: rows.length,
    completed,
  };
}

export async function runAuctionSettlementCron(now = new Date()) {
  const [expiredAuctions, paymentDeadlineWarnings, overduePayments, expiredBlacklists, handoverAutoCompletions] = await Promise.all([
    processExpiredVickreyAuctions(now),
    processPaymentDeadlineNotifications(now),
    processOverdueVickreyPayments(now),
    processExpiredBlacklistRestrictions(now),
    processHandoverAutoCompletions(now)
  ]);

  return {
    expiredAuctions,
    paymentDeadlineWarnings,
    overduePayments,
    expiredBlacklists,
    handoverAutoCompletions
  };
}
