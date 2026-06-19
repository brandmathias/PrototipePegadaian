import { randomUUID } from "node:crypto";

import { and, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { serializeAdminTransaction } from "@/lib/admin-unit/serializers";
import {
  validateTransactionHandoverProofPayload,
  validateTransactionRejectPayload,
  validateTransactionVerificationPayload
} from "@/lib/admin-unit/validation";
import { db } from "@/lib/db/client";
import {
  barang,
  buyerProfiles,
  mediaBarang,
  pemasaran,
  riwayatStatusBarang,
  transaksi,
  unitAccounts,
  units,
  users
} from "@/lib/db/schema";
import { notifyPaymentRejected, notifyPaymentVerified } from "@/lib/services/notification-events";

const handoverUploader = alias(users, "transaction_handover_uploader");

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

async function getTransactionForUnit(unitId: string, transactionId: string) {
  const [row] = await db
    .select({
      transaction: transaksi,
      item: barang,
      imageUrl: primaryBarangPhotoUrl(),
      unit: units,
      buyer: users,
      buyerProfile: buyerProfiles,
      handoverUploader,
      account: unitAccounts
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .innerJoin(users, eq(users.id, transaksi.userId))
    .leftJoin(buyerProfiles, eq(buyerProfiles.userId, users.id))
    .leftJoin(handoverUploader, eq(handoverUploader.id, transaksi.handoverProofUploadedByUserId))
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
    buyerName: row.buyerProfile?.fullName ?? row.buyer.name,
    buyerEmail: row.buyerProfile?.email ?? row.buyer.email,
    buyerPhone: row.buyerProfile?.phoneNumber ?? row.buyer.phoneNumber,
    buyerNationalId: row.buyerProfile?.nationalId ?? row.buyer.nationalId,
    buyerAddress: null,
    lotName: row.item.name,
    lotId: row.item.id,
    imageUrl: row.imageUrl ?? null,
    unitName: row.unit.name,
    unitAddress: row.unit.address,
    bankName: row.account?.bankName ?? null,
    accountNumber: row.account?.accountNumber ?? null,
    accountName: row.account?.accountHolderName ?? null,
    handoverProofUploadedByName: row.handoverUploader?.name ?? null
  });
}

export async function listAdminTransactions(unitId: string) {
  const rows = await db
    .select({
      transaction: transaksi,
      item: barang,
      imageUrl: primaryBarangPhotoUrl(),
      unit: units,
      buyer: users,
      buyerProfile: buyerProfiles,
      handoverUploader,
      account: unitAccounts
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .innerJoin(users, eq(users.id, transaksi.userId))
    .leftJoin(buyerProfiles, eq(buyerProfiles.userId, users.id))
    .leftJoin(handoverUploader, eq(handoverUploader.id, transaksi.handoverProofUploadedByUserId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(eq(barang.unitId, unitId))
    .orderBy(desc(transaksi.createdAt));

  return rows.map((row) =>
    serializeAdminTransaction({
      ...row.transaction,
      buyerName: row.buyerProfile?.fullName ?? row.buyer.name,
      buyerEmail: row.buyerProfile?.email ?? row.buyer.email,
      buyerPhone: row.buyerProfile?.phoneNumber ?? row.buyer.phoneNumber,
      buyerNationalId: row.buyerProfile?.nationalId ?? row.buyer.nationalId,
      buyerAddress: null,
      lotName: row.item.name,
      lotId: row.item.id,
      imageUrl: row.imageUrl ?? null,
      unitName: row.unit.name,
      unitAddress: row.unit.address,
      bankName: row.account?.bankName ?? null,
      accountNumber: row.account?.accountNumber ?? null,
      accountName: row.account?.accountHolderName ?? null,
      handoverProofUploadedByName: row.handoverUploader?.name ?? null
    })
  );
}

export async function getAdminTransactionById(unitId: string, transactionId: string) {
  return serializeTransactionJoin(await getTransactionForUnit(unitId, transactionId));
}

export async function uploadAdminTransactionHandoverProof(
  unitId: string,
  adminId: string,
  transactionId: string,
  input: { fileName?: unknown }
) {
  const row = await getTransactionForUnit(unitId, transactionId);
  const payload = validateTransactionHandoverProofPayload(input);

  if (!["lunas", "selesai"].includes(row.transaction.status)) {
    throw new Error("Bukti serah-terima baru dapat diunggah setelah pembayaran diverifikasi.");
  }

  const uploadedAt = new Date();
  const updatePayload = {
    handoverProofUrl: payload.fileName,
    handoverProofUploadedAt: uploadedAt,
    handoverProofUploadedByUserId: adminId,
    updatedAt: uploadedAt
  };

  const [updated] = await db
    .update(transaksi)
    .set(updatePayload)
    .where(eq(transaksi.id, transactionId))
    .returning();

  if (!updated) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  return serializeAdminTransaction({
    ...updated,
    buyerName: row.buyerProfile?.fullName ?? row.buyer.name,
    buyerEmail: row.buyerProfile?.email ?? row.buyer.email,
    buyerPhone: row.buyerProfile?.phoneNumber ?? row.buyer.phoneNumber,
    buyerNationalId: row.buyerProfile?.nationalId ?? row.buyer.nationalId,
    buyerAddress: null,
    lotName: row.item.name,
    lotId: row.item.id,
    imageUrl: row.imageUrl ?? null,
    unitName: row.unit.name,
    unitAddress: row.unit.address,
    bankName: row.account?.bankName ?? null,
    accountNumber: row.account?.accountNumber ?? null,
    accountName: row.account?.accountHolderName ?? null,
    handoverProofUploadedByName: row.handoverUploader?.name ?? null
  });
}

async function ensureTransactionMutable(status: string) {
  if (status === "lunas" || status === "selesai") {
    throw new Error("Transaksi yang sudah terverifikasi tidak dapat diubah.");
  }
}

async function recordItemStatusHistory(input: {
  barangId: string;
  oldStatus?: string | null;
  newStatus: string;
  changedByUserId?: string | null;
  note: string;
}) {
  await db.insert(riwayatStatusBarang).values({
    id: randomUUID(),
    barangId: input.barangId,
    oldStatus: input.oldStatus ?? null,
    newStatus: input.newStatus,
    changedByUserId: input.changedByUserId ?? null,
    note: input.note
  });
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
  await recordItemStatusHistory({
    barangId: row.item.id,
    oldStatus: row.item.status,
    newStatus: "terjual",
    changedByUserId: adminId,
    note:
      row.transaction.type === "vickrey"
        ? "Pemenang Lelang Tertutup menyelesaikan pembayaran dalam batas waktu 24 jam dan diverifikasi admin unit."
        : "Pembayaran harga tetap disetujui admin unit sehingga barang tercatat terjual."
  });
  await notifyPaymentVerified({
    userId: updated.userId,
    transactionId: updated.id,
    lotName: row.item.name
  });

  return serializeAdminTransaction({
    ...updated,
    buyerName: row.buyerProfile?.fullName ?? row.buyer.name,
    buyerEmail: row.buyerProfile?.email ?? row.buyer.email,
    buyerPhone: row.buyerProfile?.phoneNumber ?? row.buyer.phoneNumber,
    buyerNationalId: row.buyerProfile?.nationalId ?? row.buyer.nationalId,
    buyerAddress: null,
    lotName: row.item.name,
    lotId: row.item.id,
    imageUrl: row.imageUrl ?? null,
    unitName: row.unit.name,
    unitAddress: row.unit.address,
    bankName: row.account?.bankName ?? null,
    accountNumber: row.account?.accountNumber ?? null,
    accountName: row.account?.accountHolderName ?? null,
    handoverProofUploadedByName: row.handoverUploader?.name ?? null
  });
}

export async function rejectAdminTransactionProof(unitId: string, transactionId: string, input: { reason?: unknown }) {
  const row = await getTransactionForUnit(unitId, transactionId);
  await ensureTransactionMutable(row.transaction.status);
  const payload = validateTransactionRejectPayload(input);

  if (row.transaction.status === "ditolak_bukti") {
    return serializeTransactionJoin(row);
  }

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

  if (row.transaction.type === "fixed_price") {
    await recordItemStatusHistory({
      barangId: row.item.id,
      oldStatus: row.item.status,
      newStatus: "gagal",
      changedByUserId: null,
      note: `Verifikasi bukti pembayaran harga tetap ditolak admin unit. Alasan: ${payload.reason}.`
    });
  }

  await notifyPaymentRejected({
    userId: updated.userId,
    transactionId: updated.id,
    lotName: row.item.name,
    reason: payload.reason
  });

  return serializeAdminTransaction({
    ...updated,
    buyerName: row.buyerProfile?.fullName ?? row.buyer.name,
    buyerEmail: row.buyerProfile?.email ?? row.buyer.email,
    buyerPhone: row.buyerProfile?.phoneNumber ?? row.buyer.phoneNumber,
    buyerNationalId: row.buyerProfile?.nationalId ?? row.buyer.nationalId,
    buyerAddress: null,
    lotName: row.item.name,
    lotId: row.item.id,
    imageUrl: row.imageUrl ?? null,
    unitName: row.unit.name,
    unitAddress: row.unit.address,
    bankName: row.account?.bankName ?? null,
    accountNumber: row.account?.accountNumber ?? null,
    accountName: row.account?.accountHolderName ?? null,
    handoverProofUploadedByName: row.handoverUploader?.name ?? null
  });
}
