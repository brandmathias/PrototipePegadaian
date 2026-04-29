import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, inArray, isNotNull, lte } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  barang,
  bids,
  blacklistActionLogs,
  blacklists,
  pelanggaranUser,
  pemasaran,
  riwayatStatusBarang,
  transaksi
} from "@/lib/db/schema";

type BidOutcomeInput = {
  basePrice: string | number | null;
  bids: Array<{
    id: string;
    userId: string;
    nominal: string | number;
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
};

type OverduePaymentSummary = {
  processed: number;
  blacklisted: number;
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

function plusDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 86_400_000);
}

export function getBlacklistDurationDays(totalViolations: number) {
  if (totalViolations <= 1) {
    return 7;
  }

  if (totalViolations === 2) {
    return 30;
  }

  if (totalViolations === 3) {
    return 90;
  }

  return 365;
}

export function resolveVickreyOutcome(input: BidOutcomeInput): VickreyOutcome {
  const sortedBids = [...input.bids].sort((left, right) => {
    const amountDifference = toMoneyNumber(right.nominal) - toMoneyNumber(left.nominal);
    if (amountDifference !== 0) {
      return amountDifference;
    }

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
      item: barang
    })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
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
    failed: 0
  };

  for (const session of expiredSessions) {
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
          note: "Sesi Vickrey berakhir tanpa penawar sehingga barang masuk status gagal."
        });

        return "gagal" as const;
      }

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
            paymentMethod: "transfer",
            status: "menunggu_pembayaran",
            proofUrl: null,
            rejectionReason: null,
            referenceNumber: null,
            paymentDeadline: plusHours(now, 24),
            verifiedByUserId: null,
            verifiedAt: null,
            updatedAt: now
          })
          .where(eq(transaksi.id, existingTransaction.id));
      } else {
        await tx.insert(transaksi).values({
          id: randomUUID(),
          pemasaranId: session.marketing.id,
          userId: outcome.winnerId,
          type: "vickrey",
          amount: outcome.finalPrice,
          paymentMethod: "transfer",
          status: "menunggu_pembayaran",
          paymentDeadline: plusHours(now, 24)
        });
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
        note: "Sesi Vickrey selesai dan sistem membuat transaksi pembayaran untuk pemenang."
      });

      return "selesai" as const;
    });

    if (settledStatus === "selesai") {
      summary.completed += 1;
    } else {
      summary.failed += 1;
    }
  }

  return summary;
}

export async function processOverdueVickreyPayments(now = new Date()): Promise<OverduePaymentSummary> {
  const overdueTransactions = await db
    .select({
      transaction: transaksi,
      marketing: pemasaran,
      item: barang
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
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
    await db.transaction(async (tx) => {
      await tx
        .update(transaksi)
        .set({
          status: "gagal",
          updatedAt: now
        })
        .where(eq(transaksi.id, row.transaction.id));

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
        note: "Pemenang Vickrey tidak menyelesaikan pembayaran dalam 24 jam sehingga sesi dinyatakan gagal."
      });

      await tx.insert(pelanggaranUser).values({
        id: randomUUID(),
        userId: row.transaction.userId,
        pemasaranId: row.transaction.pemasaranId,
        transaksiId: row.transaction.id,
        unitId: row.item.unitId,
        note: "Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam."
      });

      const [existingBlacklist] = await tx
        .select()
        .from(blacklists)
        .where(eq(blacklists.userId, row.transaction.userId))
        .limit(1);

      const totalViolations = (existingBlacklist?.totalViolations ?? 0) + 1;
      const blockedUntil = plusDays(now, getBlacklistDurationDays(totalViolations));
      const blacklistId = existingBlacklist?.id ?? randomUUID();

      if (existingBlacklist) {
        await tx
          .update(blacklists)
          .set({
            unitId: row.item.unitId,
            totalViolations,
            isActive: true,
            blockedAt: now,
            blockedUntil,
            revokedByUserId: null,
            revokeReason: null,
            updatedAt: now
          })
          .where(eq(blacklists.id, existingBlacklist.id));
      } else {
        await tx.insert(blacklists).values({
          id: blacklistId,
          unitId: row.item.unitId,
          userId: row.transaction.userId,
          totalViolations,
          isActive: true,
          blockedAt: now,
          blockedUntil,
          revokedByUserId: null,
          revokeReason: null,
          updatedAt: now
        });
      }

      await tx.insert(blacklistActionLogs).values({
        id: randomUUID(),
        blacklistId,
        targetUserId: row.transaction.userId,
        action: "blokir_otomatis",
        performedByType: "system",
        performedByUserId: null,
        note: `Sistem otomatis memblokir buyer selama ${getBlacklistDurationDays(totalViolations)} hari karena tidak membayar hasil lelang Vickrey.`
      });
    });

    summary.blacklisted += 1;
  }

  return summary;
}

export async function runAuctionSettlementCron(now = new Date()) {
  const [expiredAuctions, overduePayments] = await Promise.all([
    processExpiredVickreyAuctions(now),
    processOverdueVickreyPayments(now)
  ]);

  return {
    expiredAuctions,
    overduePayments
  };
}
