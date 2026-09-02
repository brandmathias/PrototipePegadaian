import { randomUUID } from "node:crypto";

import { and, desc, eq, gt, inArray, lte, ne, sql } from "drizzle-orm";

import { FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES } from "@/lib/buyer/fixed-price-visibility";
import { serializeBuyerBid, serializeBuyerTransaction } from "@/lib/buyer/serializers";
import { filterCountedBuyerViolationHistory } from "@/lib/buyer/violation-history";
import { deriveEffectiveBlacklistState } from "@/lib/blacklist/effective-state";
import { getBlacklistRestrictionPolicy } from "@/lib/blacklist/restrictions";
import { resolveViolationItemImageUrl } from "@/lib/blacklist/violation-item-media";
import {
  validateBuyerBidPayload,
  validateBuyerPaymentProofPayload,
  validateBuyerProfileUpdatePayload,
  validateBuyerPurchasePayload
} from "@/lib/buyer/validation";
import { db } from "@/lib/db/client";
import {
  accounts,
  barang,
  bids,
  blacklists,
  buyerProfiles,
  mediaBarang,
  pelanggaranUser,
  pemasaran,
  sessions,
  transaksi,
  unitAccounts,
  units,
  users
} from "@/lib/db/schema";
import type { BuyerBid, BuyerTransaction } from "@/lib/contracts/buyer";
import {
  listActiveAdminUnitNotificationRecipientIds,
  listActiveSuperAdminNotificationRecipientIds,
  notifyAdminUnitBidSubmitted,
  notifyAdminUnitPaymentProofUploaded
} from "@/lib/services/notification-events";
import {
  processExpiredVickreyAuctions,
  processHandoverAutoCompletions,
  processOverdueVickreyPayments
} from "@/lib/services/cron.service";
import { revalidateTransactionViews } from "@/lib/services/revalidate-transaction-views";
import { getBuyerWishlistCount } from "@/lib/services/wishlist.service";
import { formatAppDate, formatAppDateTime, formatAppLongDate } from "@/lib/timezone";
import {
  MIDTRANS_RESERVATION_MINUTES,
  createMidtransSnapTransaction,
  getMidtransGatewayConfig
} from "@/lib/payments/midtrans";

const REUSABLE_BUYER_TRANSACTION_STATUSES = [
  "menunggu_pembayaran",
  "bukti_diunggah",
  "menunggu_konfirmasi_langsung"
];
const FIXED_PRICE_CLAIM_CONFLICT_MESSAGE = "Barang sedang dalam proses pembelian oleh pembeli lain.";

const BLACKLIST_TRANSACTION_SETTLEMENT_MESSAGE =
  "Akun Anda sedang dalam masa pembatasan. Transaksi yang sedang berjalan belum dapat diselesaikan sampai masa blacklist berakhir.";
export const ACTIVE_VICKREY_BID_LOCK_MESSAGE =
  "Anda masih memiliki bid aktif pada lelang lain. Tunggu hasil lelang tersebut sebelum mengikuti lelang baru.";

const RELEASED_VICKREY_LOCK_TRANSACTION_STATUSES = new Set(["gagal", "lunas", "selesai"]);

type VickreyBidLockRow = {
  lotName?: string | null;
  marketingStatus?: string | null;
  pemasaranId?: string | null;
  transactionStatus?: string | null;
  userId?: string | null;
  winnerId?: string | null;
};

type BuyerReadOptions = {
  refreshAuctionState?: boolean;
  prefetchedBidHistory?: BuyerBid[];
  prefetchedTransactions?: BuyerTransaction[];
};

export type BuyerProfileSummary = {
  name: string;
  email: string;
  image: string | null;
  wishlistCount: number;
  phone: string;
  nationalId: string;
  memberSince: string;
  security: {
    passwordUpdatedAt: string;
    activeSessionCount: number;
    sessionHistory: string[];
  };
  blacklist: {
    active: boolean;
    incidentId?: string | null;
    until: string;
    reason: string;
    violations: number;
  };
};

export type BuyerShellSummary = {
  image: string | null;
  memberSince: string;
  wishlistCount: number;
  blacklist: {
    active: boolean;
    until: string;
    reason: string;
    violations: number;
  };
};

export type BuyerViolationHistoryEntry = {
  id: string;
  amount: number;
  auctionMode: string;
  escalationEligible: boolean;
  imageUrl: string | null;
  itemCode: string;
  itemName: string;
  note: string;
  occurredAt: string;
  occurredAtLabel: string;
  paymentDeadline: string | null;
  paymentDeadlineLabel: string;
  status: string;
  transactionId: string;
  unitName: string;
  violationLevel: number;
  wonAt: string;
  wonAtLabel: string;
};

export type BuyerViolationPageData = {
  summary: BuyerProfileSummary;
  blacklistUntilAt: string | null;
  violations: BuyerViolationHistoryEntry[];
};

function plusHours(hours: number) {
  return new Date(Date.now() + hours * 3_600_000);
}

function normalizeStatus(value: string | null | undefined) {
  return String(value ?? "").toLowerCase();
}

function toNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function isActiveVickreyBidLockRow(row: VickreyBidLockRow, userId: string) {
  const marketingStatus = normalizeStatus(row.marketingStatus);
  const transactionStatus = normalizeStatus(row.transactionStatus);

  if (marketingStatus === "aktif") {
    return true;
  }

  if (marketingStatus === "gagal") {
    return false;
  }

  if (row.winnerId !== userId) {
    return false;
  }

  return !RELEASED_VICKREY_LOCK_TRANSACTION_STATUSES.has(transactionStatus);
}

function primaryBarangPhotoUrl() {
  return sql<string | null>`(
    select ${mediaBarang.url}
    from ${mediaBarang}
    where ${mediaBarang.barangId} = ${barang.id}
      and ${mediaBarang.type} = 'foto'
    order by ${mediaBarang.sortOrder} asc, ${mediaBarang.createdAt} asc
    limit 1
  )`;
}

async function refreshBuyerAuctionSettlementState(options?: BuyerReadOptions) {
  if (options?.refreshAuctionState === false) {
    return;
  }

  await processExpiredVickreyAuctions();
  await processOverdueVickreyPayments();
  await processHandoverAutoCompletions();
}

function transactionSelection() {
  return {
    id: transaksi.id,
    pemasaranId: transaksi.pemasaranId,
    type: transaksi.type,
    amount: transaksi.amount,
    paymentMethod: transaksi.paymentMethod,
    status: transaksi.status,
    proofUrl: transaksi.proofUrl,
    rejectionReason: transaksi.rejectionReason,
    referenceNumber: transaksi.referenceNumber,
    paymentDeadline: transaksi.paymentDeadline,
    verifiedBy: sql<string | null>`coalesce(
      (
        select u.name
        from "user" u
        where u.id = ${transaksi.verifiedByUserId}
        limit 1
      ),
      (
        select actor.name
        from riwayat_status_barang history
        inner join pemasaran history_marketing on history_marketing.barang_id = history.barang_id
        inner join "user" actor on actor.id = history.changed_by_user_id
        where history_marketing.id = ${transaksi.pemasaranId}
          and ${transaksi.status} = 'ditolak_bukti'
          and history.new_status = 'gagal'
          and history.note ilike 'Verifikasi bukti pembayaran harga tetap ditolak admin unit.%'
          and history.created_at >= ${transaksi.createdAt}
        order by history.created_at desc
        limit 1
      )
    )`,
    verifiedAt: transaksi.verifiedAt,
    handoverProofUrl: transaksi.handoverProofUrl,
    handoverProofUploadedAt: transaksi.handoverProofUploadedAt,
    handoverProofUploadedBy: sql<string | null>`(
      select u.name
      from "user" u
      where u.id = ${transaksi.handoverProofUploadedByUserId}
      limit 1
    )`,
    completedAt: transaksi.completedAt,
    completionSource: transaksi.completionSource,
    createdAt: transaksi.createdAt,
    updatedAt: transaksi.updatedAt,
    lotName: barang.name,
    lotId: barang.id,
    lotCategory: barang.category,
    lotCondition: barang.condition,
    lotSpecifications: barang.specifications,
    unitId: barang.unitId,
    imageUrl: primaryBarangPhotoUrl(),
    unitName: units.name,
    unitAddress: units.address,
    account: unitAccounts
  };
}

async function getMarketingForBuyer(pemasaranId: string) {
  const [row] = await db
    .select({
      marketing: pemasaran,
      item: barang,
      unit: units,
      account: unitAccounts,
      media: mediaBarang,
      imageUrl: primaryBarangPhotoUrl()
    })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(mediaBarang, and(eq(mediaBarang.barangId, barang.id), eq(mediaBarang.sortOrder, 0)))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(and(eq(pemasaran.id, pemasaranId), eq(units.isActive, true)))
    .limit(1);

  if (!row) {
    throw new Error("Barang tidak ditemukan.");
  }

  return row;
}

function ensureActiveMarketing(row: Awaited<ReturnType<typeof getMarketingForBuyer>>) {
  if (row.marketing.status !== "aktif" || row.item.status !== "dipasarkan") {
    throw new Error("Barang belum tersedia untuk transaksi baru.");
  }
}

function isFixedPriceClaimConflict(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const databaseError = error as { code?: unknown; constraint?: unknown };
  return databaseError.code === "23505" && databaseError.constraint === "transaksi_fixed_price_claim_unique";
}

function throwFixedPriceClaimConflict(error: unknown): never {
  if (isFixedPriceClaimConflict(error)) {
    throw new Error(FIXED_PRICE_CLAIM_CONFLICT_MESSAGE);
  }

  throw error;
}

async function getActiveBlacklist(userId: string) {
  const [row] = await db
    .select()
    .from(blacklists)
    .where(and(eq(blacklists.userId, userId), eq(blacklists.isActive, true)))
    .limit(1);

  return row ?? null;
}

async function listBuyerViolationEscalationFacts(userId: string) {
  const rows = await db
    .select({
      createdAt: pelanggaranUser.createdAt,
      escalationEligible: pelanggaranUser.escalationEligible,
      id: pelanggaranUser.id,
      paymentDeadline: transaksi.paymentDeadline,
      transactionId: pelanggaranUser.transaksiId,
    })
    .from(pelanggaranUser)
    .leftJoin(transaksi, eq(transaksi.id, pelanggaranUser.transaksiId))
    .where(eq(pelanggaranUser.userId, userId))
    .orderBy(desc(pelanggaranUser.createdAt));

  return rows.map((row) => ({
    createdAt: row.paymentDeadline ?? row.createdAt,
    escalationEligible: row.escalationEligible,
    id: row.id,
    transactionId: row.transactionId,
    occurredAt: (row.paymentDeadline ?? row.createdAt).toISOString(),
  }));
}

async function getEffectiveBuyerBlacklistState(userId: string) {
  const blacklist = await getActiveBlacklist(userId);
  const traces = blacklist ? await listBuyerViolationEscalationFacts(userId) : [];
  const effectiveState = deriveEffectiveBlacklistState({
    storedBlockedUntil: blacklist?.blockedUntil ?? null,
    storedTotalViolations: blacklist?.totalViolations ?? 0,
    traces,
  });
  const policy = getBlacklistRestrictionPolicy(effectiveState.totalViolations);
  const activeByDate =
    !effectiveState.blockedUntil ||
    effectiveState.blockedUntil.getTime() > new Date().getTime();
  const active = Boolean(blacklist) && policy.level > 0 && activeByDate;

  return {
    active,
    blacklist,
    blockedUntil: effectiveState.blockedUntil,
    policy,
    totalViolations: blacklist ? effectiveState.totalViolations : 0,
  };
}

async function getBuyerBlacklistInfo(userId: string) {
  const blacklistState = await getEffectiveBuyerBlacklistState(userId);
  const { blacklist } = blacklistState;
  const [latestBlacklistIncident] = blacklist
    ? await db
        .select({ id: pelanggaranUser.id })
        .from(pelanggaranUser)
        .where(and(eq(pelanggaranUser.userId, userId), eq(pelanggaranUser.escalationEligible, true)))
        .orderBy(desc(pelanggaranUser.createdAt))
        .limit(1)
    : [null];
  const blacklistPolicy = blacklistState.policy;

  return {
    blacklist,
    blacklistPolicy,
    blacklistUntilAt: blacklistState.active ? blacklistState.blockedUntil?.toISOString() ?? null : null,
    summary: {
      active: blacklistState.active,
      incidentId: latestBlacklistIncident?.id ?? null,
      violations: blacklistState.totalViolations,
      until: formatAppDate(blacklistState.blockedUntil),
      reason: blacklistState.active
        ? blacklistPolicy.blocksFixedPrice
          ? "Akun sedang dibatasi untuk membuat transaksi baru dan menyelesaikan transaksi berjalan sampai masa pembatasan berakhir."
          : "Akun masih dibatasi untuk mengikuti Lelang Tertutup dan menyelesaikan transaksi berjalan sampai masa pembatasan berakhir."
        : "Tidak ada pembatasan aktif. Akun dapat mengikuti harga tetap dan lelang."
    }
  };
}

async function listBuyerViolationHistory(userId: string): Promise<BuyerViolationHistoryEntry[]> {
  const rows = await db
    .select({
      violation: pelanggaranUser,
      transaction: transaksi,
      auction: pemasaran,
      item: barang,
      imageUrl: primaryBarangPhotoUrl(),
      unit: units
    })
    .from(pelanggaranUser)
    .innerJoin(transaksi, eq(transaksi.id, pelanggaranUser.transaksiId))
    .innerJoin(pemasaran, eq(pemasaran.id, pelanggaranUser.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .leftJoin(units, eq(units.id, pelanggaranUser.unitId))
    .where(eq(pelanggaranUser.userId, userId))
    .orderBy(desc(transaksi.paymentDeadline), desc(pelanggaranUser.createdAt));

  const history = rows.map((row) => {
    const occurredAt = row.transaction.paymentDeadline ?? row.violation.createdAt;

    return {
      id: row.violation.id,
      amount: toNumber(row.transaction.amount),
      auctionMode: row.auction.mode,
      escalationEligible: row.violation.escalationEligible,
      imageUrl: resolveViolationItemImageUrl({
        databaseUrl: row.imageUrl,
        itemName: row.item.name,
      }),
      itemCode: row.item.code,
      itemName: row.item.name,
      note: row.violation.note,
      occurredAt: occurredAt.toISOString(),
      occurredAtLabel: formatAppDateTime(occurredAt),
      paymentDeadline: row.transaction.paymentDeadline?.toISOString() ?? null,
      paymentDeadlineLabel: row.transaction.paymentDeadline
        ? formatAppDateTime(row.transaction.paymentDeadline)
        : "-",
      status: row.transaction.status,
      transactionId: row.transaction.id,
      unitName: row.unit?.name ?? "-",
      violationLevel: 0,
      wonAt: row.transaction.createdAt.toISOString(),
      wonAtLabel: formatAppDateTime(row.transaction.createdAt)
    };
  });

  return filterCountedBuyerViolationHistory(history);
}

async function getBuyerViolationLevelForTransaction(userId: string, transactionId: string) {
  const traces = await listBuyerViolationEscalationFacts(userId);
  const countedViolations = filterCountedBuyerViolationHistory(
    traces.map((trace) => ({ ...trace, violationLevel: 0 }))
  );

  return countedViolations.find((row) => row.transactionId === transactionId)?.violationLevel;
}

async function getActiveVickreyBidLock(userId: string, currentPemasaranId?: string | null) {
  const rows = await db
    .select({
      lotName: barang.name,
      marketingStatus: pemasaran.status,
      pemasaranId: pemasaran.id,
      transactionStatus: transaksi.status,
      userId: bids.userId,
      winnerId: pemasaran.winnerId
    })
    .from(bids)
    .innerJoin(pemasaran, eq(pemasaran.id, bids.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .leftJoin(transaksi, and(eq(transaksi.pemasaranId, pemasaran.id), eq(transaksi.userId, userId), eq(transaksi.type, "vickrey")))
    .where(
      currentPemasaranId
        ? and(eq(bids.userId, userId), eq(pemasaran.mode, "vickrey"), ne(pemasaran.id, currentPemasaranId))
        : and(eq(bids.userId, userId), eq(pemasaran.mode, "vickrey"))
    )
    .orderBy(desc(bids.createdAt));
  const activeLock = rows.find((row) => isActiveVickreyBidLockRow(row, userId));

  return activeLock
    ? {
        active: true,
        lotId: activeLock.pemasaranId,
        lotName: activeLock.lotName
      }
    : {
        active: false,
        lotId: null,
        lotName: null
      };
}

async function ensureCanSettleBuyerTransaction(userId: string) {
  const blacklistState = await getEffectiveBuyerBlacklistState(userId);
  const restriction = blacklistState.policy;

  if (blacklistState.active && restriction.blocksTransactionSettlement) {
    throw new Error(BLACKLIST_TRANSACTION_SETTLEMENT_MESSAGE);
  }
}

async function getTransactionRows(userId: string) {
  return db
    .select(transactionSelection())
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(mediaBarang, and(eq(mediaBarang.barangId, barang.id), eq(mediaBarang.sortOrder, 0)))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(eq(transaksi.userId, userId))
    .orderBy(desc(transaksi.createdAt));
}

async function getTransactionRowById(userId: string, transactionId: string) {
  const [row] = await db
    .select(transactionSelection())
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(mediaBarang, and(eq(mediaBarang.barangId, barang.id), eq(mediaBarang.sortOrder, 0)))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(and(eq(transaksi.userId, userId), eq(transaksi.id, transactionId)))
    .limit(1);

  return row ?? null;
}

async function listUnitTransferAccounts(unitId?: string | null) {
  if (!unitId) {
    return [];
  }

  return db
    .select()
    .from(unitAccounts)
    .where(eq(unitAccounts.unitId, unitId))
    .orderBy(desc(unitAccounts.isActive), desc(unitAccounts.createdAt));
}

export async function listBuyerTransactions(userId: string, options?: BuyerReadOptions) {
  await refreshBuyerAuctionSettlementState(options);

  const rows = await getTransactionRows(userId);
  return rows.map(serializeBuyerTransaction);
}

export async function getBuyerTransactionById(userId: string, transactionId: string, options?: BuyerReadOptions) {
  await refreshBuyerAuctionSettlementState(options);

  const row = await getTransactionRowById(userId, transactionId);

  if (!row) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  const [accounts, violationLevel] = await Promise.all([
    listUnitTransferAccounts(row.unitId),
    row.type === "vickrey" && row.status === "gagal"
      ? getBuyerViolationLevelForTransaction(userId, row.id)
      : Promise.resolve(undefined)
  ]);

  return serializeBuyerTransaction({ ...row, accounts, violationLevel });
}

export async function listBuyerBids(userId: string, options?: BuyerReadOptions) {
  await refreshBuyerAuctionSettlementState(options);

  const rows = await db
    .select({
      pemasaranId: pemasaran.id,
      lotName: barang.name,
      imageUrl: primaryBarangPhotoUrl(),
      unitName: units.name,
      bidAmount: bids.nominal,
      basePrice: pemasaran.basePrice,
      finalPrice: pemasaran.finalPrice,
      paymentAmount: transaksi.amount,
      paymentDeadline: transaksi.paymentDeadline,
      transactionStatus: transaksi.status,
      endsAt: pemasaran.endsAt,
      marketingStatus: pemasaran.status,
      winnerId: pemasaran.winnerId,
      transactionId: transaksi.id,
      userId: bids.userId,
      createdAt: bids.createdAt
    })
    .from(bids)
    .innerJoin(pemasaran, eq(pemasaran.id, bids.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(mediaBarang, and(eq(mediaBarang.barangId, barang.id), eq(mediaBarang.sortOrder, 0)))
    .leftJoin(transaksi, and(eq(transaksi.pemasaranId, pemasaran.id), eq(transaksi.userId, userId)))
    .where(eq(bids.userId, userId))
    .orderBy(desc(bids.createdAt));

  return rows.map(serializeBuyerBid);
}

export async function getBuyerShellSummary(userId: string, options?: BuyerReadOptions): Promise<BuyerShellSummary> {
  await refreshBuyerAuctionSettlementState(options);

  const [[profile], [buyerUser], wishlistCount] = await Promise.all([
    db
      .select({
        createdAt: buyerProfiles.createdAt
      })
      .from(buyerProfiles)
      .where(eq(buyerProfiles.userId, userId))
      .limit(1),
    db
      .select({
        image: users.image,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    getBuyerWishlistCount(userId)
  ]);
  const { summary: blacklistSummary } = await getBuyerBlacklistInfo(userId);

  return {
    image: buyerUser?.image ?? null,
    memberSince: formatAppLongDate(profile?.createdAt ?? buyerUser?.createdAt),
    wishlistCount,
    blacklist: blacklistSummary
  };
}

export async function getBuyerProfileSummary(userId: string, options?: BuyerReadOptions): Promise<BuyerProfileSummary> {
  await refreshBuyerAuctionSettlementState(options);

  const now = new Date();
  const [[profile], [buyerUser], [latestCredentialAccount], recentSessions, activeSessions, wishlistCount] = await Promise.all([
    db
      .select({
        fullName: buyerProfiles.fullName,
        email: buyerProfiles.email,
        phoneNumber: buyerProfiles.phoneNumber,
        nationalId: buyerProfiles.nationalId,
        status: buyerProfiles.status,
        createdAt: buyerProfiles.createdAt
      })
      .from(buyerProfiles)
      .where(eq(buyerProfiles.userId, userId))
      .limit(1),
    db
      .select({
        image: users.image,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        nationalId: users.nationalId,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({
        updatedAt: accounts.updatedAt
      })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(desc(accounts.updatedAt))
      .limit(1),
    db
      .select({
        id: sessions.id,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        expiresAt: sessions.expiresAt
      })
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.updatedAt), desc(sessions.createdAt))
      .limit(5),
    db
      .select({
        id: sessions.id
      })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, now))),
    getBuyerWishlistCount(userId)
  ]);
  const { summary: blacklistSummary } = await getBuyerBlacklistInfo(userId);
  const nationalId = profile?.nationalId ?? buyerUser?.nationalId ?? "";
  const sessionHistory = recentSessions.map((sessionRow) =>
    formatAppDateTime(sessionRow.updatedAt ?? sessionRow.createdAt)
  );

  return {
    name: profile?.fullName ?? buyerUser?.name ?? "Pembeli Ruang Agunan",
    email: profile?.email ?? buyerUser?.email ?? "-",
    image: buyerUser?.image ?? null,
    wishlistCount,
    phone: profile?.phoneNumber ?? buyerUser?.phoneNumber ?? "-",
    nationalId,
    memberSince: formatAppLongDate(profile?.createdAt ?? buyerUser?.createdAt),
    security: {
      passwordUpdatedAt: formatAppLongDate(latestCredentialAccount?.updatedAt),
      activeSessionCount: activeSessions.length,
      sessionHistory
    },
    blacklist: blacklistSummary
  };
}

export async function getBuyerViolationPageData(userId: string): Promise<BuyerViolationPageData> {
  await refreshBuyerAuctionSettlementState();

  const [summary, violations, blacklistState] = await Promise.all([
    getBuyerProfileSummary(userId, { refreshAuctionState: false }),
    listBuyerViolationHistory(userId),
    getEffectiveBuyerBlacklistState(userId)
  ]);

  return {
    summary,
    blacklistUntilAt: blacklistState.active ? blacklistState.blockedUntil?.toISOString() ?? null : null,
    violations
  };
}

export async function getBuyerSummary(userId: string, options?: BuyerReadOptions) {
  await refreshBuyerAuctionSettlementState(options);

  const now = new Date();
  const [[profile], [buyerUser], [latestCredentialAccount], recentSessions, activeSessions] = await Promise.all([
    db.select().from(buyerProfiles).where(eq(buyerProfiles.userId, userId)).limit(1),
    db
      .select({
        image: users.image,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        nationalId: users.nationalId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({
        updatedAt: accounts.updatedAt
      })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(desc(accounts.updatedAt))
      .limit(1),
    db
      .select({
        id: sessions.id,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        expiresAt: sessions.expiresAt
      })
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.updatedAt), desc(sessions.createdAt))
      .limit(5),
    db
      .select({
        id: sessions.id
      })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, now)))
  ]);
  const { blacklistUntilAt, summary: blacklistSummary } = await getBuyerBlacklistInfo(userId);
  const [wishlistCount, transactions, bidHistory] = await Promise.all([
    getBuyerWishlistCount(userId),
    options?.prefetchedTransactions
      ? Promise.resolve(options.prefetchedTransactions)
      : listBuyerTransactions(userId, { refreshAuctionState: false }),
    options?.prefetchedBidHistory
      ? Promise.resolve(options.prefetchedBidHistory)
      : listBuyerBids(userId, { refreshAuctionState: false })
  ]);
  const needsAction = transactions.filter((transaction) =>
    ["MENUNGGU_PEMBAYARAN", "MENUNGGU_KONFIRMASI_LANGSUNG", "LUNAS"].includes(transaction.status)
  ).length;
  const nationalId = profile?.nationalId ?? buyerUser?.nationalId ?? "";
  const sessionHistory = recentSessions.map((sessionRow) =>
    formatAppDateTime(sessionRow.updatedAt ?? sessionRow.createdAt)
  );

  return {
    name: profile?.fullName ?? buyerUser?.name ?? "Pembeli Ruang Agunan",
    unit: "Pembeli terverifikasi",
    accountId: `USR-${userId.slice(0, 8).toUpperCase()}`,
    email: profile?.email ?? buyerUser?.email ?? "-",
    image: buyerUser?.image ?? null,
    wishlistCount,
    phone: profile?.phoneNumber ?? buyerUser?.phoneNumber ?? "-",
    nationalId,
    nikMasked: nationalId ? `${nationalId.slice(0, 4)}********${nationalId.slice(-4)}` : "-",
    address: "Belum dilengkapi",
    memberSince: formatAppLongDate(profile?.createdAt ?? buyerUser?.createdAt),
    verificationStatus: profile?.status === "active" ? "Terverifikasi" : "Perlu verifikasi",
    blacklistUntilAt,
    security: {
      passwordUpdatedAt: formatAppLongDate(latestCredentialAccount?.updatedAt),
      activeSessionCount: activeSessions.length,
      sessionHistory
    },
    blacklist: blacklistSummary,
    metrics: [
      {
        label: "Transaksi aktif",
        value: String(
          transactions.filter((item) => !["LUNAS", "SELESAI", "GAGAL", "DITOLAK_BUKTI"].includes(item.status)).length
        ),
        accent: "primary"
      },
      { label: "Perlu ditindaklanjuti", value: String(needsAction), accent: "secondary" },
      { label: "Lelang yang diikuti", value: String(bidHistory.length), accent: "neutral" },
      {
        label: "Nota siap diunduh",
        value: String(transactions.filter((item) => item.status === "LUNAS" || item.status === "SELESAI").length),
        accent: "primary"
      }
    ],
    highlights: [
      "Unggah bukti transfer maksimal 24 jam setelah transaksi dibuat.",
      "Bid Lelang Tertutup tersimpan tertutup dan hanya diproses setelah sesi berakhir.",
      "Pembatasan akun berlaku bertingkat sesuai jumlah pelanggaran pembayaran."
    ]
  };
}

export async function getBuyerDashboardData(userId: string): Promise<{
  summary: Omit<Awaited<ReturnType<typeof getBuyerSummary>>, "blacklistUntilAt">;
  transactions: BuyerTransaction[];
  bids: BuyerBid[];
  blacklistUntilAt: string | null;
  violations: BuyerViolationHistoryEntry[];
}> {
  await refreshBuyerAuctionSettlementState();

  const [transactions, buyerBids, violations] = await Promise.all([
    listBuyerTransactions(userId, { refreshAuctionState: false }),
    listBuyerBids(userId, { refreshAuctionState: false }),
    listBuyerViolationHistory(userId)
  ]);
  const summaryWithDeadline = await getBuyerSummary(userId, {
    refreshAuctionState: false,
    prefetchedBidHistory: buyerBids,
    prefetchedTransactions: transactions
  });
  const { blacklistUntilAt, ...summary } = summaryWithDeadline;

  return {
    summary,
    transactions,
    bids: buyerBids,
    blacklistUntilAt,
    violations
  };
}

export async function createFixedPricePurchase(userId: string, pemasaranId: string, input: unknown) {
  const payload = validateBuyerPurchasePayload(input);
  const row = await getMarketingForBuyer(pemasaranId);
  ensureActiveMarketing(row);

  if (row.marketing.mode !== "fixed_price") {
    throw new Error("Barang ini bukan transaksi harga tetap.");
  }

  const activeTransactions = await db.select().from(transaksi).where(eq(transaksi.pemasaranId, pemasaranId));
  const existingBuyerTransaction = activeTransactions
    .filter(
      (item) => item.userId === userId && REUSABLE_BUYER_TRANSACTION_STATUSES.includes(item.status)
    )
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

  const lockedByOtherBuyer = activeTransactions.find(
    (item) =>
      item.userId !== userId &&
      isFixedPriceLockedByOtherBuyerStatus(item.status)
  );

  if (lockedByOtherBuyer) {
    throw new Error(FIXED_PRICE_CLAIM_CONFLICT_MESSAGE);
  }

  if (existingBuyerTransaction) {
    return serializeBuyerTransaction(
      await getTransactionRowById(userId, existingBuyerTransaction.id).then((transactionRow) => {
        if (!transactionRow) throw new Error("Transaksi aktif tidak ditemukan.");
        return transactionRow;
      })
    );
  }

  const blacklistState = await getEffectiveBuyerBlacklistState(userId);
  const blacklistPolicy = blacklistState.policy;

  if (blacklistState.active && blacklistPolicy.blocksFixedPrice) {
    throw new Error("Akun Anda sedang dibatasi untuk membuat transaksi harga tetap baru.");
  }

  const amount = Number(row.marketing.price ?? 0);
  if (amount <= 0) {
    throw new Error("Harga harga tetap belum valid.");
  }

  if (!row.account?.accountNumber) {
    throw new Error("Rekening tujuan unit belum tersedia untuk pembayaran transfer.");
  }

  const hasProof = Boolean(payload.fileName);
  const [created] = await db
    .insert(transaksi)
    .values({
      id: randomUUID(),
      pemasaranId,
      userId,
      type: "fixed_price",
      amount: String(amount),
      paymentMethod: payload.paymentMethod,
      status: hasProof ? "bukti_diunggah" : "menunggu_pembayaran",
      proofUrl: payload.fileName ?? null,
      referenceNumber: payload.reference ?? null,
      paymentDeadline: null
    })
    .returning()
    .catch(throwFixedPriceClaimConflict);

  if (hasProof) {
    const [adminUserIds, superAdminUserIds] = await Promise.all([
      listActiveAdminUnitNotificationRecipientIds(row.item.unitId),
      listActiveSuperAdminNotificationRecipientIds()
    ]);
    await notifyAdminUnitPaymentProofUploaded({
      adminUserIds,
      superAdminUserIds,
      unitId: row.item.unitId,
      barangId: row.item.id,
      pemasaranId,
      transactionId: created.id,
      lotName: row.item.name
    });
  }

  revalidateTransactionViews();

  return serializeBuyerTransaction({
    ...created,
    lotName: row.item.name,
    lotId: row.item.id,
    lotCategory: row.item.category,
    lotCondition: row.item.condition,
    lotSpecifications: row.item.specifications,
    imageUrl: row.imageUrl ?? null,
    unitName: row.unit.name,
    unitAddress: row.unit.address,
    account: row.account
  });
}

export async function submitVickreyBid(userId: string, pemasaranId: string, input: unknown) {
  await refreshBuyerAuctionSettlementState();

  const row = await getMarketingForBuyer(pemasaranId);
  ensureActiveMarketing(row);

  if (row.marketing.mode !== "vickrey") {
    throw new Error("Barang ini bukan sesi Lelang Tertutup.");
  }

  if (row.marketing.endsAt && row.marketing.endsAt.getTime() <= Date.now()) {
    throw new Error("Sesi lelang sudah berakhir.");
  }

  const blacklistState = await getEffectiveBuyerBlacklistState(userId);
  if (blacklistState.active) {
    const restriction = blacklistState.policy;
    throw new Error(
      restriction.suspendsLogin
        ? "Akun Anda sedang ditangguhkan selama masa pembatasan Level 3."
        : "Akun Anda sedang dibatasi untuk mengikuti Lelang Tertutup."
    );
  }

  const [existingBid] = await db
    .select()
    .from(bids)
    .where(and(eq(bids.pemasaranId, pemasaranId), eq(bids.userId, userId)))
    .limit(1);

  if (existingBid) {
    throw new Error("Anda sudah mengirim bid untuk sesi ini.");
  }

  const activeBidLock = await getActiveVickreyBidLock(userId, pemasaranId);
  if (activeBidLock.active) {
    throw new Error(ACTIVE_VICKREY_BID_LOCK_MESSAGE);
  }

  const basePrice = Number(row.marketing.basePrice ?? 0);
  const payload = validateBuyerBidPayload(input, basePrice);

  const [created] = await db
    .insert(bids)
    .values({
      id: randomUUID(),
      pemasaranId,
      userId,
      nominal: String(payload.amount)
    })
    .returning();

  const adminUserIds = await listActiveAdminUnitNotificationRecipientIds(row.unit.id);
  await notifyAdminUnitBidSubmitted({
    adminUserIds,
    pemasaranId,
    lotName: row.item.name
  });

  return serializeBuyerBid({
    pemasaranId,
    lotName: row.item.name,
    unitName: row.unit.name,
    imageUrl: row.imageUrl ?? null,
    bidAmount: created.nominal,
    basePrice: row.marketing.basePrice,
    endsAt: row.marketing.endsAt,
    marketingStatus: row.marketing.status,
    winnerId: row.marketing.winnerId,
    transactionId: null,
    userId
  });
}

export async function uploadBuyerPaymentProof(userId: string, transactionId: string, input: unknown) {
  await refreshBuyerAuctionSettlementState();

  const payload = validateBuyerPaymentProofPayload(input);
  await ensureCanSettleBuyerTransaction(userId);
  const row = await getTransactionRowById(userId, transactionId);

  if (!row) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  if (row.status === "bukti_diunggah") {
    throw new Error("Bukti pembayaran sudah terkirim dan sedang diverifikasi admin unit.");
  }

  if (row.status === "ditolak_bukti") {
    throw new Error("Transaksi ini sudah dibatalkan dan tidak dapat diperbarui.");
  }

  if (row.status === "lunas" || row.status === "selesai" || row.status === "gagal") {
    throw new Error("Transaksi ini sudah tidak dapat diperbarui.");
  }

  if (row.paymentMethod !== "transfer") {
    throw new Error("Unggah bukti hanya tersedia untuk metode transfer bank.");
  }

  const [lockedByOtherBuyer] = await db
    .select({ id: transaksi.id })
    .from(transaksi)
    .where(
      and(
        eq(transaksi.pemasaranId, row.pemasaranId),
        ne(transaksi.id, transactionId),
        ne(transaksi.userId, userId),
        inArray(transaksi.status, FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES)
      )
    )
    .limit(1);

  if (lockedByOtherBuyer) {
    throw new Error(FIXED_PRICE_CLAIM_CONFLICT_MESSAGE);
  }

  const [updated] = await db
    .update(transaksi)
    .set({
      status: "bukti_diunggah",
      proofUrl: payload.fileName,
      referenceNumber: payload.reference ?? row.referenceNumber,
      rejectionReason: null,
      updatedAt: new Date()
    })
    .where(and(eq(transaksi.id, transactionId), eq(transaksi.userId, userId)))
    .returning()
    .catch(throwFixedPriceClaimConflict);

  const [adminUserIds, superAdminUserIds] = await Promise.all([
    listActiveAdminUnitNotificationRecipientIds(row.unitId),
    listActiveSuperAdminNotificationRecipientIds()
  ]);
  await notifyAdminUnitPaymentProofUploaded({
    adminUserIds,
    superAdminUserIds,
    unitId: row.unitId,
    barangId: row.lotId,
    pemasaranId: row.pemasaranId,
    transactionId: updated.id,
    lotName: row.lotName
  });
  revalidateTransactionViews();

  return serializeBuyerTransaction({
    ...updated,
    verifiedBy: row.verifiedBy,
    handoverProofUploadedBy: row.handoverProofUploadedBy,
    lotName: row.lotName,
    lotId: row.lotId,
    lotCategory: row.lotCategory,
    lotCondition: row.lotCondition,
    lotSpecifications: row.lotSpecifications,
    imageUrl: row.imageUrl,
    unitName: row.unitName,
    unitAddress: row.unitAddress,
    account: row.account
  });
}

export async function completeBuyerTransaction(userId: string, transactionId: string) {
  await refreshBuyerAuctionSettlementState();

  const row = await getTransactionRowById(userId, transactionId);

  if (!row) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  if (row.status === "selesai" && row.completedAt && row.completionSource) {
    return serializeBuyerTransaction(row);
  }

  if (row.status !== "lunas" && row.status !== "selesai") {
    throw new Error("Transaksi baru bisa diselesaikan setelah admin memverifikasi pembayaran.");
  }

  if (!row.handoverProofUrl) {
    throw new Error("Pembelian baru bisa diselesaikan setelah admin unit mengunggah bukti serah-terima barang.");
  }

  const completedAt = new Date();
  const updated = await db.transaction(async (tx) => {
    const [updatedTransaction] = await tx
      .update(transaksi)
      .set({
        status: "selesai",
        completedAt,
        completionSource: "buyer",
        updatedAt: completedAt
      })
      .where(and(eq(transaksi.id, transactionId), eq(transaksi.userId, userId)))
      .returning();

    if (!updatedTransaction) {
      throw new Error("Transaksi tidak ditemukan.");
    }

    await tx.update(pemasaran).set({ status: "selesai", updatedAt: completedAt }).where(eq(pemasaran.id, row.pemasaranId));
    await tx.update(barang).set({ status: "terjual", updatedAt: completedAt }).where(eq(barang.id, row.lotId));

    return updatedTransaction;
  });

  revalidateTransactionViews();

  return serializeBuyerTransaction({
    ...updated,
    verifiedBy: row.verifiedBy,
    handoverProofUploadedBy: row.handoverProofUploadedBy,
    lotName: row.lotName,
    lotId: row.lotId,
    lotCategory: row.lotCategory,
    lotCondition: row.lotCondition,
    lotSpecifications: row.lotSpecifications,
    imageUrl: row.imageUrl,
    unitName: row.unitName,
    unitAddress: row.unitAddress,
    account: row.account
  });
}


export async function getBuyerBidState(userId: string, pemasaranId: string) {
  const buyerBids = await listBuyerBids(userId);
  return buyerBids.find((item) => item.lotId === pemasaranId) ?? null;
}

export async function getBuyerProfileStatus(userId: string) {
  await refreshBuyerAuctionSettlementState();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const blacklistState = await getEffectiveBuyerBlacklistState(userId);
  const vickreyBidLock = await getActiveVickreyBidLock(userId);

  return {
    isLoggedIn: Boolean(user),
    blacklist: blacklistState.active
      ? {
          active: true,
          until: blacklistState.blockedUntil,
          totalViolations: blacklistState.totalViolations
        }
      : { active: false, until: null, totalViolations: 0 },
    vickreyBidLock
  };
}

export async function updateBuyerProfile(userId: string, input: unknown) {
  const payload = validateBuyerProfileUpdatePayload(input);
  await db.transaction(async (tx) => {
    const [currentUser] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!currentUser) {
      throw new Error("Akun pembeli tidak ditemukan.");
    }

    await tx
      .update(users)
      .set({
        name: payload.name,
        ...(payload.image !== undefined ? { image: payload.image } : {}),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    const [existingProfile] = await tx
      .select()
      .from(buyerProfiles)
      .where(eq(buyerProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      await tx
        .update(buyerProfiles)
        .set({
          fullName: payload.name,
          updatedAt: new Date()
        })
        .where(eq(buyerProfiles.userId, userId));
    } else {
      if (!currentUser.phoneNumber || !currentUser.nationalId) {
        throw new Error("Identitas pembeli belum lengkap dan tidak dapat dibuat dari profil.");
      }

      await tx.insert(buyerProfiles).values({
        id: randomUUID(),
        userId,
        fullName: payload.name,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber,
        nationalId: currentUser.nationalId,
        status: "active"
      });
    }
  });

  return getBuyerProfileSummary(userId, { refreshAuctionState: false });
}

function isFixedPriceLockedByOtherBuyerStatus(status: string) {
  return FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES.includes(
    status as (typeof FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES)[number]
  );
}

function isActiveMidtransReservation(transaction: {
  paymentDeadline?: Date | null;
  paymentMethod?: string | null;
  status: string;
}) {
  return (
    transaction.paymentMethod === "midtrans" &&
    transaction.status === "menunggu_pembayaran" &&
    Boolean(transaction.paymentDeadline && transaction.paymentDeadline.getTime() > Date.now())
  );
}

export async function createFixedPriceMidtransCheckout(userId: string, pemasaranId: string) {
  const config = getMidtransGatewayConfig();
  const row = await getMarketingForBuyer(pemasaranId);
  ensureActiveMarketing(row);

  if (row.marketing.mode !== "fixed_price") {
    throw new Error("Barang ini bukan transaksi harga tetap.");
  }

  const now = new Date();
  await db
    .update(transaksi)
    .set({ gatewayStatus: "expire", status: "gagal", updatedAt: now })
    .where(
      and(
        eq(transaksi.pemasaranId, pemasaranId),
        eq(transaksi.paymentMethod, "midtrans"),
        eq(transaksi.status, "menunggu_pembayaran"),
        lte(transaksi.paymentDeadline, now)
      )
    );

  const activeTransactions = await db.select().from(transaksi).where(eq(transaksi.pemasaranId, pemasaranId));
  const ownReservation = activeTransactions.find(
    (transaction) => transaction.userId === userId && isActiveMidtransReservation(transaction)
  );

  if (ownReservation?.paymentToken) {
    return {
      transactionId: ownReservation.id,
      snapToken: ownReservation.paymentToken,
      snapRedirectUrl: ownReservation.paymentRedirectUrl ?? null
    };
  }

  const lockedByOtherBuyer = activeTransactions.find(
    (transaction) => transaction.userId !== userId && isActiveMidtransReservation(transaction)
  );
  if (lockedByOtherBuyer) {
    throw new Error(FIXED_PRICE_CLAIM_CONFLICT_MESSAGE);
  }

  const blacklistState = await getEffectiveBuyerBlacklistState(userId);
  if (blacklistState.active && blacklistState.policy.blocksFixedPrice) {
    throw new Error("Akun Anda sedang dibatasi untuk membuat transaksi harga tetap baru.");
  }

  const amount = Number(row.marketing.price ?? 0);
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    throw new Error("Harga harga tetap belum valid.");
  }

  const transactionId = randomUUID();
  const paymentOrderId = `FP-${transactionId}`;
  const paymentDeadline = new Date(now.getTime() + MIDTRANS_RESERVATION_MINUTES * 60_000);
  const [created] = await db
    .insert(transaksi)
    .values({
      id: transactionId,
      pemasaranId,
      userId,
      type: "fixed_price",
      amount: String(amount),
      paymentMethod: "midtrans",
      paymentProvider: "midtrans",
      paymentOrderId,
      gatewayStatus: "pending",
      status: "menunggu_pembayaran",
      paymentDeadline
    })
    .returning()
    .catch(throwFixedPriceClaimConflict);

  try {
    const checkout = await createMidtransSnapTransaction({
      amount,
      config,
      itemName: row.item.name,
      orderId: paymentOrderId
    });
    await db
      .update(transaksi)
      .set({
        paymentToken: checkout.token,
        paymentRedirectUrl: checkout.redirectUrl,
        updatedAt: new Date()
      })
      .where(eq(transaksi.id, created.id));
    revalidateTransactionViews();

    return {
      transactionId: created.id,
      snapToken: checkout.token,
      snapRedirectUrl: checkout.redirectUrl
    };
  } catch (error) {
    await db
      .update(transaksi)
      .set({ gatewayStatus: "failed_to_create", status: "gagal", updatedAt: new Date() })
      .where(eq(transaksi.id, created.id));
    throw error;
  }
}
