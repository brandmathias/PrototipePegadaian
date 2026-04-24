import { and, desc, eq } from "drizzle-orm";

import { serializeAdminTransaction } from "@/lib/admin-unit/serializers";
import { validateTransactionRejectPayload, validateTransactionVerificationPayload } from "@/lib/admin-unit/validation";
import { db } from "@/lib/db/client";
import { barang, pemasaran, transaksi, unitAccounts, users } from "@/lib/db/schema";

async function getTransactionForUnit(unitId: string, transactionId: string) {
  const [row] = await db
    .select({
      transaction: transaksi,
      item: barang,
      buyer: users,
      account: unitAccounts
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(users, eq(users.id, transaksi.userId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(and(eq(transaksi.id, transactionId), eq(barang.unitId, unitId)))
    .limit(1);

  if (!row) {
    throw new Error("Transaksi tidak ditemukan di unit Anda.");
  }

  return row;
}

function serializeTransactionJoin(row: Awaited<ReturnType<typeof getTransactionForUnit>>) {
  return serializeAdminTransaction({
    ...row.transaction,
    buyerName: row.buyer.name,
    lotName: row.item.name,
    lotId: row.item.id,
    bankName: row.account?.bankName ?? null,
    accountNumber: row.account?.accountNumber ?? null,
    accountName: row.account?.accountHolderName ?? null
  });
}

export async function listAdminTransactions(unitId: string) {
  const rows = await db
    .select({
      transaction: transaksi,
      item: barang,
      buyer: users,
      account: unitAccounts
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(users, eq(users.id, transaksi.userId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(eq(barang.unitId, unitId))
    .orderBy(desc(transaksi.createdAt));

  return rows.map((row) =>
    serializeAdminTransaction({
      ...row.transaction,
      buyerName: row.buyer.name,
      lotName: row.item.name,
      lotId: row.item.id,
      bankName: row.account?.bankName ?? null,
      accountNumber: row.account?.accountNumber ?? null,
      accountName: row.account?.accountHolderName ?? null
    })
  );
}

export async function getAdminTransactionById(unitId: string, transactionId: string) {
  return serializeTransactionJoin(await getTransactionForUnit(unitId, transactionId));
}

async function ensureTransactionMutable(status: string) {
  if (status === "lunas") {
    throw new Error("Transaksi yang sudah lunas tidak dapat diubah.");
  }
}

export async function verifyAdminTransaction(unitId: string, adminId: string, transactionId: string, input: { reference?: unknown }) {
  const row = await getTransactionForUnit(unitId, transactionId);
  await ensureTransactionMutable(row.transaction.status);
  const payload = validateTransactionVerificationPayload(input);

  if (!["bukti_diunggah", "menunggu_konfirmasi_langsung", "menunggu_pembayaran"].includes(row.transaction.status)) {
    throw new Error("Status transaksi belum siap diverifikasi.");
  }

  const [updated] = await db
    .update(transaksi)
    .set({
      status: "lunas",
      referenceNumber: payload.reference,
      verifiedByUserId: adminId,
      verifiedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(transaksi.id, transactionId))
    .returning();

  await db.update(barang).set({ status: "terjual", updatedAt: new Date() }).where(eq(barang.id, row.item.id));
  await db.update(pemasaran).set({ status: "selesai", updatedAt: new Date() }).where(eq(pemasaran.id, row.transaction.pemasaranId));

  return serializeAdminTransaction({
    ...updated,
    buyerName: row.buyer.name,
    lotName: row.item.name,
    lotId: row.item.id,
    bankName: row.account?.bankName ?? null,
    accountNumber: row.account?.accountNumber ?? null,
    accountName: row.account?.accountHolderName ?? null
  });
}

export async function rejectAdminTransactionProof(unitId: string, transactionId: string, input: { reason?: unknown }) {
  const row = await getTransactionForUnit(unitId, transactionId);
  await ensureTransactionMutable(row.transaction.status);
  const payload = validateTransactionRejectPayload(input);

  if (row.transaction.status !== "bukti_diunggah") {
    throw new Error("Hanya bukti transfer yang sudah diunggah yang dapat ditolak.");
  }

  const [updated] = await db
    .update(transaksi)
    .set({
      status: "ditolak_bukti",
      rejectionReason: payload.reason,
      updatedAt: new Date()
    })
    .where(eq(transaksi.id, transactionId))
    .returning();

  return serializeAdminTransaction({
    ...updated,
    buyerName: row.buyer.name,
    lotName: row.item.name,
    lotId: row.item.id,
    bankName: row.account?.bankName ?? null,
    accountNumber: row.account?.accountNumber ?? null,
    accountName: row.account?.accountHolderName ?? null
  });
}
