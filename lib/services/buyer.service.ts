import { randomUUID } from "node:crypto";

import { and, desc, eq, gt, isNull, or } from "drizzle-orm";

import { serializeBuyerBid, serializeBuyerTransaction } from "@/lib/buyer/serializers";
import { verifyBidIntegrityHash } from "@/lib/bid-integrity";
import { getBlacklistRestrictionPolicy } from "@/lib/blacklist/restrictions";
import {
  validateBuyerBidEscrowPayload,
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
  pemasaran,
  sessions,
  transaksi,
  unitAccounts,
  units,
  users
} from "@/lib/db/schema";
import type { BuyerBid, BuyerBidVerification, BuyerTransaction } from "@/lib/contracts/buyer";
import { processExpiredVickreyAuctions } from "@/lib/services/cron.service";
import { getBuyerWishlistCount } from "@/lib/services/wishlist.service";
import { formatAppDate, formatAppDateTime, formatAppLongDate } from "@/lib/timezone";
import { encryptVickreyBidPayload } from "@/lib/vickrey-escrow";

const ACTIVE_TRANSACTION_STATUSES = [
  "menunggu_pembayaran",
  "bukti_diunggah",
  "ditolak_bukti",
  "menunggu_konfirmasi_langsung"
];

const BLACKLIST_TRANSACTION_SETTLEMENT_MESSAGE =
  "Akun Anda sedang dalam masa pembatasan. Transaksi yang sedang berjalan belum dapat diselesaikan sampai masa blacklist berakhir.";

function plusHours(hours: number) {
  return new Date(Date.now() + hours * 3_600_000);
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
    verifiedAt: transaksi.verifiedAt,
    createdAt: transaksi.createdAt,
    lotName: barang.name,
    lotId: barang.id,
    imageUrl: mediaBarang.url,
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
      media: mediaBarang
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

async function getActiveBlacklist(userId: string) {
  const [row] = await db
    .select()
    .from(blacklists)
    .where(
      and(
        eq(blacklists.userId, userId),
        eq(blacklists.isActive, true),
        or(isNull(blacklists.blockedUntil), gt(blacklists.blockedUntil, new Date()))
      )
    )
    .limit(1);

  return row ?? null;
}

async function ensureCanSettleBuyerTransaction(userId: string) {
  const blacklist = await getActiveBlacklist(userId);
  const restriction = getBlacklistRestrictionPolicy(blacklist?.totalViolations ?? 0);

  if (blacklist && restriction.blocksTransactionSettlement) {
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

export async function listBuyerTransactions(userId: string) {
  const rows = await getTransactionRows(userId);
  return rows.map(serializeBuyerTransaction);
}

export async function getBuyerTransactionById(userId: string, transactionId: string) {
  const row = await getTransactionRowById(userId, transactionId);

  if (!row) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  return serializeBuyerTransaction(row);
}

export async function listBuyerBids(userId: string) {
  await processExpiredVickreyAuctions();

  const rows = await db
    .select({
      pemasaranId: pemasaran.id,
      lotName: barang.name,
      imageUrl: mediaBarang.url,
      unitName: units.name,
      bidAmount: bids.nominal,
      bidHash: bids.bidHash,
      encryptedBidPayload: bids.encryptedBidPayload,
      revealedAt: bids.revealedAt,
      basePrice: pemasaran.basePrice,
      finalPrice: pemasaran.finalPrice,
      paymentAmount: transaksi.amount,
      paymentDeadline: transaksi.paymentDeadline,
      transactionStatus: transaksi.status,
      endsAt: pemasaran.endsAt,
      revealEndsAt: pemasaran.revealEndsAt,
      marketingStatus: pemasaran.status,
      winnerId: pemasaran.winnerId,
      transactionId: transaksi.id,
      userId: bids.userId
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

export async function getBuyerBidVerification(userId: string, pemasaranId: string): Promise<BuyerBidVerification> {
  const [row] = await db
    .select({
      pemasaranId: pemasaran.id,
      lotName: barang.name,
      unitName: units.name,
      bidAmount: bids.nominal,
      bidHash: bids.bidHash,
      encryptedBidPayload: bids.encryptedBidPayload,
      salt: bids.salt,
      revealedAt: bids.revealedAt,
      endsAt: pemasaran.endsAt,
      revealEndsAt: pemasaran.revealEndsAt,
      userId: bids.userId
    })
    .from(bids)
    .innerJoin(pemasaran, eq(pemasaran.id, bids.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .where(and(eq(bids.pemasaranId, pemasaranId), eq(bids.userId, userId)))
    .limit(1);

  if (!row) {
    throw new Error("Bid tidak ditemukan.");
  }

  const isRevealed = row.bidAmount != null && Boolean(row.salt);
  const canVerify = row.endsAt ? row.endsAt.getTime() <= Date.now() : true;
  const revealEnded = row.revealEndsAt ? row.revealEndsAt.getTime() <= Date.now() : false;
  const hasEscrowPayload = Boolean(row.encryptedBidPayload);
  const canReveal = canVerify && !isRevealed && !revealEnded && !hasEscrowPayload;
  const verification = isRevealed
    ? verifyBidIntegrityHash({
        pemasaranId: row.pemasaranId,
        userId: row.userId,
        amount: row.bidAmount ?? 0,
        salt: row.salt ?? "",
        bidHash: row.bidHash
      })
    : null;

  return {
    lotId: row.pemasaranId,
    lot: row.lotName,
    unit: row.unitName,
    closing: row.endsAt ? row.endsAt.toISOString() : "-",
    ...(isRevealed ? { bidAmount: Number(row.bidAmount) } : {}),
    bidHash: row.bidHash,
    ...(verification ? { computedHash: verification.computedHash } : {}),
    ...(row.salt ? { salt: row.salt } : {}),
    algorithm: "SHA-256",
    formula: "sha256(pemasaranId:userId:nominal:salt)",
    isMatch: verification?.isMatch ?? false,
    canVerify,
    canReveal,
    isRevealed
  };
}

export async function getBuyerSummary(userId: string) {
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
  const blacklist = await getActiveBlacklist(userId);
  const blacklistPolicy = getBlacklistRestrictionPolicy(blacklist?.totalViolations ?? 0);
  const wishlistCount = await getBuyerWishlistCount(userId);
  const transactions = await listBuyerTransactions(userId);
  const bidHistory = await listBuyerBids(userId);
  const needsAction = transactions.filter((transaction) =>
    ["MENUNGGU_PEMBAYARAN", "DITOLAK_BUKTI", "MENUNGGU_KONFIRMASI_LANGSUNG", "LUNAS"].includes(transaction.status)
  ).length;
  const nationalId = profile?.nationalId ?? buyerUser?.nationalId ?? "";
  const sessionHistory = recentSessions.map((sessionRow) =>
    formatAppDateTime(sessionRow.updatedAt ?? sessionRow.createdAt)
  );

  return {
    name: profile?.fullName ?? buyerUser?.name ?? "Pembeli Pegadaian",
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
    security: {
      passwordUpdatedAt: formatAppLongDate(latestCredentialAccount?.updatedAt),
      activeSessionCount: activeSessions.length,
      sessionHistory
    },
    blacklist: {
      active: Boolean(blacklist),
      violations: blacklist?.totalViolations ?? 0,
      until: formatAppDate(blacklist?.blockedUntil),
      reason: blacklist
        ? blacklistPolicy.blocksFixedPrice
          ? "Akun sedang dibatasi untuk membuat transaksi baru dan menyelesaikan transaksi berjalan sampai masa pembatasan berakhir."
          : "Akun masih dibatasi untuk mengikuti lelang Vickrey dan menyelesaikan transaksi berjalan sampai masa pembatasan berakhir."
        : "Tidak ada pembatasan aktif. Akun dapat mengikuti fixed price dan lelang."
    },
    metrics: [
      {
        label: "Transaksi aktif",
        value: String(transactions.filter((item) => !["LUNAS", "SELESAI", "GAGAL"].includes(item.status)).length),
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
      "Bid Vickrey tersimpan tertutup dan hanya diproses setelah sesi berakhir.",
      "Pembatasan akun berlaku bertingkat sesuai jumlah pelanggaran pembayaran."
    ]
  };
}

export async function getBuyerDashboardData(userId: string): Promise<{
  summary: Awaited<ReturnType<typeof getBuyerSummary>>;
  transactions: BuyerTransaction[];
  bids: BuyerBid[];
}> {
  const [summary, transactions, buyerBids] = await Promise.all([
    getBuyerSummary(userId),
    listBuyerTransactions(userId),
    listBuyerBids(userId)
  ]);

  return {
    summary,
    transactions,
    bids: buyerBids
  };
}

export async function createFixedPricePurchase(userId: string, pemasaranId: string, input: unknown) {
  const payload = validateBuyerPurchasePayload(input);
  const row = await getMarketingForBuyer(pemasaranId);
  ensureActiveMarketing(row);

  if (row.marketing.mode !== "fixed_price") {
    throw new Error("Barang ini bukan transaksi fixed price.");
  }

  const activeTransactions = await db.select().from(transaksi).where(eq(transaksi.pemasaranId, pemasaranId));
  const existingActive = activeTransactions.find((item) => ACTIVE_TRANSACTION_STATUSES.includes(item.status));

  if (existingActive) {
    if (existingActive.userId === userId) {
      return serializeBuyerTransaction(
        await getTransactionRowById(userId, existingActive.id).then((transactionRow) => {
          if (!transactionRow) throw new Error("Transaksi aktif tidak ditemukan.");
          return transactionRow;
        })
      );
    }

    throw new Error("Barang sedang dalam proses pembelian oleh pembeli lain.");
  }

  const blacklist = await getActiveBlacklist(userId);
  const blacklistPolicy = getBlacklistRestrictionPolicy(blacklist?.totalViolations ?? 0);

  if (blacklist && blacklistPolicy.blocksFixedPrice) {
    throw new Error("Akun Anda sedang dibatasi untuk membuat transaksi fixed price baru.");
  }

  const amount = Number(row.marketing.price ?? 0);
  if (amount <= 0) {
    throw new Error("Harga fixed price belum valid.");
  }

  const [created] = await db
    .insert(transaksi)
    .values({
      id: randomUUID(),
      pemasaranId,
      userId,
      type: "fixed_price",
      amount: String(amount),
      paymentMethod: payload.paymentMethod,
      status:
        payload.paymentMethod === "langsung"
          ? "menunggu_konfirmasi_langsung"
          : "menunggu_pembayaran",
      paymentDeadline: plusHours(24)
    })
    .returning();

  return serializeBuyerTransaction({
    ...created,
    lotName: row.item.name,
    lotId: row.item.id,
    imageUrl: row.media?.url ?? null,
    unitName: row.unit.name,
    unitAddress: row.unit.address,
    account: row.account
  });
}

export async function submitVickreyBid(userId: string, pemasaranId: string, input: unknown) {
  const row = await getMarketingForBuyer(pemasaranId);
  ensureActiveMarketing(row);

  if (row.marketing.mode !== "vickrey") {
    throw new Error("Barang ini bukan sesi lelang Vickrey.");
  }

  if (row.marketing.endsAt && row.marketing.endsAt.getTime() <= Date.now()) {
    throw new Error("Sesi lelang sudah berakhir.");
  }

  const blacklist = await getActiveBlacklist(userId);
  if (blacklist) {
    const restriction = getBlacklistRestrictionPolicy(blacklist.totalViolations);
    throw new Error(
      restriction.requiresManualReview
        ? "Akun Anda sedang dalam pembatasan level 3 dan perlu review admin sebelum ikut lelang Vickrey."
        : "Akun Anda sedang dibatasi untuk mengikuti lelang Vickrey."
    );
  }

  const basePrice = Number(row.marketing.basePrice ?? 0);
  const payload = validateBuyerBidEscrowPayload(input, basePrice);
  const verification = verifyBidIntegrityHash({
    pemasaranId,
    userId,
    amount: payload.amount,
    salt: payload.salt,
    bidHash: payload.bidHash
  });

  if (!verification.isMatch) {
    throw new Error("Hash bid tidak cocok dengan nominal dan salt.");
  }

  const [existingBid] = await db
    .select()
    .from(bids)
    .where(and(eq(bids.pemasaranId, pemasaranId), eq(bids.userId, userId)))
    .limit(1);

  if (existingBid) {
    throw new Error("Anda sudah mengirim bid untuk sesi ini.");
  }

  const [created] = await db
    .insert(bids)
    .values({
      id: randomUUID(),
      pemasaranId,
      userId,
      bidHash: payload.bidHash,
      encryptedBidPayload: encryptVickreyBidPayload(
        { amount: payload.amount, salt: payload.salt },
        { pemasaranId, userId, bidHash: payload.bidHash }
      ),
      nominal: null,
      salt: null,
      revealedAt: null
    })
    .returning();

  return serializeBuyerBid({
    pemasaranId,
    lotName: row.item.name,
    unitName: row.unit.name,
    imageUrl: row.media?.url ?? null,
    bidAmount: created.nominal,
    bidHash: created.bidHash,
    encryptedBidPayload: created.encryptedBidPayload,
    revealedAt: created.revealedAt,
    basePrice: row.marketing.basePrice,
    endsAt: row.marketing.endsAt,
    revealEndsAt: row.marketing.revealEndsAt,
    marketingStatus: row.marketing.status,
    winnerId: row.marketing.winnerId,
    transactionId: null,
    userId
  });
}

export async function revealBuyerBid(userId: string, pemasaranId: string, input: unknown): Promise<BuyerBidVerification> {
  const [row] = await db
    .select({
      bid: bids,
      marketing: pemasaran,
      item: barang,
      unit: units
    })
    .from(bids)
    .innerJoin(pemasaran, eq(pemasaran.id, bids.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .where(and(eq(bids.pemasaranId, pemasaranId), eq(bids.userId, userId)))
    .limit(1);

  if (!row) {
    throw new Error("Bid tidak ditemukan.");
  }

  if (!row.marketing.endsAt || row.marketing.endsAt.getTime() > Date.now()) {
    throw new Error("Reveal bid baru dibuka setelah deadline lelang.");
  }

  if (row.bid.nominal != null && row.bid.salt) {
    return getBuyerBidVerification(userId, pemasaranId);
  }

  if (row.bid.encryptedBidPayload) {
    await processExpiredVickreyAuctions();
    return getBuyerBidVerification(userId, pemasaranId);
  }

  if (row.marketing.revealEndsAt && row.marketing.revealEndsAt.getTime() <= Date.now()) {
    throw new Error("Periode reveal bid sudah berakhir.");
  }

  const basePrice = Number(row.marketing.basePrice ?? 0);
  const payload = validateBuyerBidPayload(input, basePrice);
  const inputRecord = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const salt = typeof inputRecord.salt === "string" ? inputRecord.salt.trim() : "";

  if (!salt) {
    throw new Error("Salt reveal wajib dikirim.");
  }

  const verification = verifyBidIntegrityHash({
    pemasaranId,
    userId,
    amount: payload.amount,
    salt,
    bidHash: row.bid.bidHash
  });

  if (!verification.isMatch) {
    throw new Error("Nominal atau salt tidak cocok dengan hash bid tersimpan.");
  }

  await db
    .update(bids)
    .set({
      nominal: String(payload.amount),
      salt,
      revealedAt: new Date()
    })
    .where(and(eq(bids.pemasaranId, pemasaranId), eq(bids.userId, userId)));

  await processExpiredVickreyAuctions();

  return getBuyerBidVerification(userId, pemasaranId);
}

export async function uploadBuyerPaymentProof(userId: string, transactionId: string, input: unknown) {
  const payload = validateBuyerPaymentProofPayload(input);
  await ensureCanSettleBuyerTransaction(userId);
  const row = await getTransactionRowById(userId, transactionId);

  if (!row) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  if (row.status === "lunas" || row.status === "selesai" || row.status === "gagal") {
    throw new Error("Transaksi ini sudah tidak dapat diperbarui.");
  }

  if (row.paymentMethod !== "transfer") {
    throw new Error("Unggah bukti hanya tersedia untuk metode transfer bank.");
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
    .returning();

  return serializeBuyerTransaction({
    ...updated,
    lotName: row.lotName,
    lotId: row.lotId,
    imageUrl: row.imageUrl,
    unitName: row.unitName,
    unitAddress: row.unitAddress,
    account: row.account
  });
}

export async function completeBuyerTransaction(userId: string, transactionId: string) {
  await ensureCanSettleBuyerTransaction(userId);
  const row = await getTransactionRowById(userId, transactionId);

  if (!row) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  if (row.status === "selesai") {
    return serializeBuyerTransaction(row);
  }

  if (row.status !== "lunas") {
    throw new Error("Transaksi baru bisa diselesaikan setelah admin memverifikasi pembayaran.");
  }

  const updated = await db.transaction(async (tx) => {
    const [updatedTransaction] = await tx
      .update(transaksi)
      .set({
        status: "selesai",
        updatedAt: new Date()
      })
      .where(and(eq(transaksi.id, transactionId), eq(transaksi.userId, userId)))
      .returning();

    if (!updatedTransaction) {
      throw new Error("Transaksi tidak ditemukan.");
    }

    await tx.update(pemasaran).set({ status: "selesai", updatedAt: new Date() }).where(eq(pemasaran.id, row.pemasaranId));
    await tx.update(barang).set({ status: "terjual", updatedAt: new Date() }).where(eq(barang.id, row.lotId));

    return updatedTransaction;
  });

  return serializeBuyerTransaction({
    ...updated,
    lotName: row.lotName,
    lotId: row.lotId,
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
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const blacklist = await getActiveBlacklist(userId);

  return {
    isLoggedIn: Boolean(user),
    blacklist: blacklist
      ? {
          active: true,
          until: blacklist.blockedUntil,
          totalViolations: blacklist.totalViolations
        }
      : { active: false, until: null, totalViolations: 0 }
  };
}

export async function updateBuyerProfile(userId: string, input: unknown) {
  const payload = validateBuyerProfileUpdatePayload(input);
  const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!currentUser) {
    throw new Error("Akun pembeli tidak ditemukan.");
  }

  await db
    .update(users)
    .set({
      name: payload.name,
      phoneNumber: payload.phoneNumber,
      nationalId: payload.nationalId,
      ...(payload.image !== undefined ? { image: payload.image } : {}),
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));

  const [existingProfile] = await db
    .select()
    .from(buyerProfiles)
    .where(eq(buyerProfiles.userId, userId))
    .limit(1);

  if (existingProfile) {
    await db
      .update(buyerProfiles)
      .set({
        fullName: payload.name,
        phoneNumber: payload.phoneNumber,
        nationalId: payload.nationalId,
        updatedAt: new Date()
      })
      .where(eq(buyerProfiles.userId, userId));
  } else {
    await db.insert(buyerProfiles).values({
      id: randomUUID(),
      userId,
      fullName: payload.name,
      email: currentUser.email,
      phoneNumber: payload.phoneNumber,
      nationalId: payload.nationalId,
      status: "active"
    });
  }

  return getBuyerSummary(userId);
}
