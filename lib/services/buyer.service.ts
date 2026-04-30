import { createHash, randomUUID } from "node:crypto";

import { and, desc, eq, gt, isNull, or } from "drizzle-orm";

import { serializeBuyerBid, serializeBuyerTransaction } from "@/lib/buyer/serializers";
import {
  validateBuyerBidPayload,
  validateBuyerPaymentProofPayload,
  validateBuyerProfileUpdatePayload,
  validateBuyerPurchasePayload
} from "@/lib/buyer/validation";
import { db } from "@/lib/db/client";
import {
  barang,
  bids,
  blacklists,
  buyerProfiles,
  pemasaran,
  transaksi,
  unitAccounts,
  units,
  users
} from "@/lib/db/schema";
import type { BuyerBid, BuyerTransaction } from "@/lib/contracts/buyer";

const ACTIVE_TRANSACTION_STATUSES = [
  "menunggu_pembayaran",
  "bukti_diunggah",
  "ditolak_bukti",
  "menunggu_konfirmasi_langsung"
];

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
      account: unitAccounts
    })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
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

async function getTransactionRows(userId: string) {
  return db
    .select(transactionSelection())
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
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
  const rows = await db
    .select({
      pemasaranId: pemasaran.id,
      lotName: barang.name,
      unitName: units.name,
      bidAmount: bids.nominal,
      basePrice: pemasaran.basePrice,
      endsAt: pemasaran.endsAt,
      marketingStatus: pemasaran.status,
      winnerId: pemasaran.winnerId,
      transactionId: transaksi.id,
      userId: bids.userId
    })
    .from(bids)
    .innerJoin(pemasaran, eq(pemasaran.id, bids.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(transaksi, and(eq(transaksi.pemasaranId, pemasaran.id), eq(transaksi.userId, userId)))
    .where(eq(bids.userId, userId))
    .orderBy(desc(bids.createdAt));

  return rows.map(serializeBuyerBid);
}

export async function getBuyerSummary(userId: string) {
  const [profile] = await db.select().from(buyerProfiles).where(eq(buyerProfiles.userId, userId)).limit(1);
  const blacklist = await getActiveBlacklist(userId);
  const transactions = await listBuyerTransactions(userId);
  const bidHistory = await listBuyerBids(userId);
  const needsAction = transactions.filter((transaction) =>
    ["MENUNGGU_PEMBAYARAN", "DITOLAK_BUKTI", "MENUNGGU_KONFIRMASI_LANGSUNG"].includes(transaction.status)
  ).length;

  return {
    name: profile?.fullName ?? "Pembeli Pegadaian",
    unit: "Pembeli terverifikasi",
    accountId: `USR-${userId.slice(0, 8).toUpperCase()}`,
    email: profile?.email ?? "-",
    phone: profile?.phoneNumber ?? "-",
    nationalId: profile?.nationalId ?? "",
    nikMasked: profile?.nationalId
      ? `${profile.nationalId.slice(0, 4)}********${profile.nationalId.slice(-4)}`
      : "-",
    address: "Belum dilengkapi",
    memberSince: profile?.createdAt
      ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Makassar" }).format(profile.createdAt)
      : "-",
    verificationStatus: profile?.status === "active" ? "Terverifikasi" : "Perlu verifikasi",
    blacklist: {
      active: Boolean(blacklist),
      violations: blacklist?.totalViolations ?? 0,
      until: blacklist?.blockedUntil
        ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Makassar" }).format(
            blacklist.blockedUntil
          )
        : "-",
      reason: blacklist
        ? "Akun masih dibatasi untuk mengikuti lelang Vickrey. Pembelian fixed price tetap tersedia."
        : "Tidak ada pembatasan aktif. Akun dapat mengikuti fixed price dan lelang."
    },
    metrics: [
      { label: "Transaksi aktif", value: String(transactions.filter((item) => item.status !== "LUNAS" && item.status !== "GAGAL").length), accent: "primary" },
      { label: "Perlu ditindaklanjuti", value: String(needsAction), accent: "secondary" },
      { label: "Lelang yang diikuti", value: String(bidHistory.length), accent: "neutral" },
      { label: "Nota siap diunduh", value: String(transactions.filter((item) => item.status === "LUNAS").length), accent: "primary" }
    ],
    highlights: [
      "Unggah bukti transfer maksimal 24 jam setelah transaksi dibuat.",
      "Bid Vickrey tersimpan tertutup dan hanya diproses setelah sesi berakhir.",
      "Blacklist hanya membatasi akses lelang, bukan pembelian fixed price."
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
    throw new Error("Akun Anda sedang dibatasi untuk mengikuti lelang Vickrey.");
  }

  const basePrice = Number(row.marketing.basePrice ?? 0);
  const payload = validateBuyerBidPayload(input, basePrice);

  const [existingBid] = await db
    .select()
    .from(bids)
    .where(and(eq(bids.pemasaranId, pemasaranId), eq(bids.userId, userId)))
    .limit(1);

  if (existingBid) {
    throw new Error("Anda sudah mengirim bid untuk sesi ini.");
  }

  const salt = randomUUID();
  const bidHash = createHash("sha256").update(`${pemasaranId}:${userId}:${payload.amount}:${salt}`).digest("hex");

  const [created] = await db
    .insert(bids)
    .values({
      id: randomUUID(),
      pemasaranId,
      userId,
      bidHash,
      nominal: String(payload.amount),
      salt
    })
    .returning();

  return serializeBuyerBid({
    pemasaranId,
    lotName: row.item.name,
    unitName: row.unit.name,
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
  const payload = validateBuyerPaymentProofPayload(input);
  const row = await getTransactionRowById(userId, transactionId);

  if (!row) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  if (row.status === "lunas" || row.status === "gagal") {
    throw new Error("Transaksi ini sudah tidak dapat diperbarui.");
  }

  if (row.paymentMethod !== "transfer") {
    throw new Error("Unggah bukti hanya tersedia untuk metode transfer bank.");
  }

  const [updated] = await db
    .update(transaksi)
    .set({
      status: "bukti_diunggah",
      proofUrl: payload.reference ? `${payload.fileName} (${payload.reference})` : payload.fileName,
      rejectionReason: null,
      updatedAt: new Date()
    })
    .where(and(eq(transaksi.id, transactionId), eq(transaksi.userId, userId)))
    .returning();

  return serializeBuyerTransaction({
    ...updated,
    lotName: row.lotName,
    lotId: row.lotId,
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
