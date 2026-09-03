import { randomUUID } from "node:crypto";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
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
  buyerWishlist,
  buyerProfiles,
  mediaBarang,
  pemasaran,
  pemasaranViews,
  riwayatStatusBarang,
  transaksi,
  unitAccounts,
  units,
  users
} from "@/lib/db/schema";
import {
  listActiveSuperAdminNotificationRecipientIds,
  notifyHandoverProofUploaded,
  notifyPaymentRejected,
  notifyPaymentVerified,
  notifySuperAdminHandoverProofUploaded,
  notifySuperAdminPaymentRejected,
  notifySuperAdminPaymentVerified
} from "@/lib/services/notification-events";
import { revalidateTransactionViews } from "@/lib/services/revalidate-transaction-views";

const handoverUploader = alias(users, "transaction_handover_uploader");
const paymentVerifier = alias(users, "transaction_payment_verifier");

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

async function getTransactionJoin(transactionId: string, unitId?: string) {
  const [row] = await db
    .select({
      transaction: transaksi,
      marketing: pemasaran,
      item: barang,
      imageUrl: primaryBarangPhotoUrl(),
      unit: units,
      buyer: users,
      buyerProfile: buyerProfiles,
      paymentVerifier,
      handoverUploader,
      account: unitAccounts
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .innerJoin(users, eq(users.id, transaksi.userId))
    .leftJoin(buyerProfiles, eq(buyerProfiles.userId, users.id))
    .leftJoin(paymentVerifier, eq(paymentVerifier.id, transaksi.verifiedByUserId))
    .leftJoin(handoverUploader, eq(handoverUploader.id, transaksi.handoverProofUploadedByUserId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(unitId ? and(eq(transaksi.id, transactionId), eq(barang.unitId, unitId)) : eq(transaksi.id, transactionId))
    .limit(1);

  return row ?? null;
}

async function getTransactionForUnit(unitId: string, transactionId: string) {
  const row = await getTransactionJoin(transactionId, unitId);

  if (!row) {
    throw new Error("Transaksi tidak ditemukan di unit Anda.");
  }

  return row;
}

async function getTransactionForSuperAdmin(transactionId: string) {
  const row = await getTransactionJoin(transactionId);

  if (!row) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  return row;
}

function serializeTransactionJoin(row: Awaited<ReturnType<typeof getTransactionForUnit>>) {
  return serializeAdminTransaction({
    ...row.transaction,
    buyerName: row.buyer.name,
    buyerEmail: row.buyer.email,
    buyerPhone: row.buyer.phoneNumber,
    buyerNationalId: row.buyer.nationalId,
    buyerAddress: null,
    lotName: row.item.name,
    lotId: row.item.id,
    imageUrl: row.imageUrl ?? null,
    unitName: row.unit.name,
    unitAddress: row.unit.address,
    bankName: row.account?.bankName ?? null,
    accountNumber: row.account?.accountNumber ?? null,
    accountName: row.account?.accountHolderName ?? null,
    verifiedByName: row.paymentVerifier?.name ?? null,
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
      paymentVerifier,
      handoverUploader,
      account: unitAccounts
    })
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .innerJoin(users, eq(users.id, transaksi.userId))
    .leftJoin(buyerProfiles, eq(buyerProfiles.userId, users.id))
    .leftJoin(paymentVerifier, eq(paymentVerifier.id, transaksi.verifiedByUserId))
    .leftJoin(handoverUploader, eq(handoverUploader.id, transaksi.handoverProofUploadedByUserId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(eq(barang.unitId, unitId))
    .orderBy(desc(transaksi.createdAt));

  return rows.map((row) =>
    serializeAdminTransaction({
      ...row.transaction,
      buyerName: row.buyer.name,
      buyerEmail: row.buyer.email,
      buyerPhone: row.buyer.phoneNumber,
      buyerNationalId: row.buyer.nationalId,
      buyerAddress: null,
      lotName: row.item.name,
      lotId: row.item.id,
      imageUrl: row.imageUrl ?? null,
      unitName: row.unit.name,
      unitAddress: row.unit.address,
      bankName: row.account?.bankName ?? null,
      accountNumber: row.account?.accountNumber ?? null,
      accountName: row.account?.accountHolderName ?? null,
      verifiedByName: row.paymentVerifier?.name ?? null,
      handoverProofUploadedByName: row.handoverUploader?.name ?? null
    })
  );
}

export async function getAdminTransactionById(unitId: string, transactionId: string) {
  return serializeTransactionJoin(await getTransactionForUnit(unitId, transactionId));
}

export async function getSuperAdminTransactionById(transactionId: string) {
  return serializeTransactionJoin(await getTransactionForSuperAdmin(transactionId));
}

export async function uploadAdminTransactionHandoverProof(
  unitId: string,
  adminId: string,
  transactionId: string,
  input: { fileName?: unknown }
) {
  const row = await getTransactionForUnit(unitId, transactionId);
  const payload = validateTransactionHandoverProofPayload(input);

  if (row.transaction.status === "selesai") {
    throw new Error("Bukti serah-terima tidak dapat diubah setelah transaksi selesai.");
  }

  if (row.transaction.status !== "lunas") {
    throw new Error("Bukti serah-terima baru dapat diunggah setelah pembayaran diverifikasi.");
  }

  const uploadedAt = new Date();
  const updatePayload = {
    handoverProofUrl: payload.fileName,
    handoverProofUploadedAt: uploadedAt,
    handoverProofUploadedByUserId: adminId,
    updatedAt: uploadedAt
  };

  const updated = await db.transaction(async (tx) => {
    const [lockedItem] = await tx
      .select()
      .from(barang)
      .where(and(eq(barang.id, row.item.id), eq(barang.unitId, unitId)))
      .limit(1)
      .for("update");

    if (!lockedItem) {
      throw new Error("Barang tidak ditemukan di unit Anda.");
    }

    const [currentTransaction] = await tx
      .select()
      .from(transaksi)
      .where(eq(transaksi.id, transactionId))
      .limit(1);

    if (!currentTransaction || currentTransaction.status === "selesai") {
      throw new Error("Bukti serah-terima tidak dapat diubah setelah transaksi selesai.");
    }

    if (currentTransaction.status !== "lunas") {
      throw new Error("Bukti serah-terima baru dapat diunggah setelah pembayaran diverifikasi.");
    }

    const [updatedTransaction] = await tx
      .update(transaksi)
      .set(updatePayload)
      .where(and(eq(transaksi.id, transactionId), eq(transaksi.status, "lunas")))
      .returning();

    if (!updatedTransaction) {
      throw new Error("Bukti serah-terima sudah diproses oleh pengguna lain.");
    }

    return updatedTransaction;
  });

  const superAdminUserIds = await listActiveSuperAdminNotificationRecipientIds();
  await notifyHandoverProofUploaded({
    userId: updated.userId,
    transactionId: updated.id,
    lotName: row.item.name
  });
  await notifySuperAdminHandoverProofUploaded({
    superAdminUserIds,
    unitId,
    barangId: row.item.id,
    pemasaranId: row.transaction.pemasaranId,
    transactionId: updated.id,
    lotName: row.item.name
  });
  revalidateTransactionViews();

  return serializeTransactionJoin(await getTransactionForUnit(unitId, updated.id));
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

type TransactionDb = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function relistRejectedFixedPriceMarketing(
  tx: TransactionDb,
  input: {
    adminId: string;
    barangId: string;
    itemStatus: string;
    marketingId: string;
    now: Date;
    originalPublishedAt: Date;
    price: string;
    reason: string;
    sourceIteration?: number | null;
  }
) {
  const [archived] = await tx
    .update(pemasaran)
    .set({ status: "gagal", updatedAt: input.now })
    .where(and(eq(pemasaran.id, input.marketingId), eq(pemasaran.status, "aktif"), eq(pemasaran.mode, "fixed_price")))
    .returning({ id: pemasaran.id });

  if (!archived) {
    return;
  }

  const relistedAt = new Date(input.now.getTime() + 1);
  const relistedMarketingId = randomUUID();

  await tx.insert(pemasaran).values({
    id: relistedMarketingId,
    barangId: input.barangId,
    mode: "fixed_price",
    price: input.price,
    basePrice: null,
    durationDays: null,
    durationSeconds: null,
    startsAt: input.originalPublishedAt,
    endsAt: null,
    iteration: Number(input.sourceIteration ?? 0) + 1,
    status: "aktif",
    createdByUserId: input.adminId,
    createdAt: input.originalPublishedAt,
    updatedAt: relistedAt
  });

  await tx.update(barang).set({ status: "dipasarkan", updatedAt: relistedAt }).where(eq(barang.id, input.barangId));
  await tx.update(buyerWishlist).set({ pemasaranId: relistedMarketingId }).where(eq(buyerWishlist.pemasaranId, input.marketingId));
  await tx.update(pemasaranViews).set({ pemasaranId: relistedMarketingId }).where(eq(pemasaranViews.pemasaranId, input.marketingId));
  await tx.insert(riwayatStatusBarang).values({
    id: randomUUID(),
    barangId: input.barangId,
    oldStatus: input.itemStatus,
    newStatus: "gagal",
    changedByUserId: input.adminId,
    note: `Verifikasi bukti pembayaran harga tetap ditolak admin unit. Alasan: ${input.reason}.`,
    createdAt: input.now
  });
  await tx.insert(riwayatStatusBarang).values({
    id: randomUUID(),
    barangId: input.barangId,
    oldStatus: "gagal",
    newStatus: "dipasarkan",
    changedByUserId: null,
    note: "Barang dipublikasikan kembali ke katalog sebagai sesi Harga Tetap.",
    createdAt: relistedAt
  });
}

export async function verifyAdminTransaction(unitId: string, adminId: string, transactionId: string, input: { reference?: unknown }) {
  const row = await getTransactionForUnit(unitId, transactionId);
  await ensureTransactionMutable(row.transaction.status);
  const payload = validateTransactionVerificationPayload(input);

  if (row.transaction.type === "fixed_price" && (row.transaction.status !== "bukti_diunggah" || !row.transaction.proofUrl)) {
    throw new Error("Bukti pembayaran belum diunggah oleh buyer.");
  }

  if (row.transaction.type !== "fixed_price" && row.transaction.status !== "menunggu_konfirmasi_langsung") {
    throw new Error("Status transaksi belum siap diverifikasi.");
  }

  const now = new Date();
  const expectedStatus = row.transaction.type === "fixed_price" ? "bukti_diunggah" : "menunggu_konfirmasi_langsung";
  const updated = await db.transaction(async (tx) => {
    const [lockedItem] = await tx
      .select()
      .from(barang)
      .where(and(eq(barang.id, row.item.id), eq(barang.unitId, unitId)))
      .limit(1)
      .for("update");

    if (!lockedItem) {
      throw new Error("Barang tidak ditemukan di unit Anda.");
    }

    const [updatedTransaction] = await tx
      .update(transaksi)
      .set({
        status: "lunas",
        referenceNumber: payload.reference,
        verifiedByUserId: adminId,
        verifiedAt: now,
        updatedAt: now
      })
      .where(
        and(
          eq(transaksi.id, transactionId),
          eq(transaksi.type, row.transaction.type),
          eq(transaksi.status, expectedStatus),
          ...(row.transaction.type === "fixed_price" ? [eq(transaksi.paymentMethod, "transfer")] : [])
        )
      )
      .returning();

    if (!updatedTransaction) {
      throw new Error("Transaksi sudah diproses oleh pengguna lain atau tidak lagi siap diverifikasi.");
    }

    const [soldItem] = await tx
      .update(barang)
      .set({ status: "terjual", updatedAt: now })
      .where(
        and(
          eq(barang.id, lockedItem.id),
          row.transaction.type === "vickrey"
            ? inArray(barang.status, ["dipasarkan", "menunggu_pembayaran"])
            : eq(barang.status, "dipasarkan")
        )
      )
      .returning({ id: barang.id });

    if (!soldItem) {
      throw new Error("Status barang berubah saat pembayaran diverifikasi.");
    }

    if (row.transaction.type === "fixed_price") {
      const [closedMarketing] = await tx
        .update(pemasaran)
        .set({ status: "selesai", updatedAt: now })
        .where(and(eq(pemasaran.id, row.transaction.pemasaranId), eq(pemasaran.status, "aktif")))
        .returning({ id: pemasaran.id });

      if (!closedMarketing) {
        throw new Error("Sesi pemasaran berubah saat pembayaran diverifikasi.");
      }
    }

    await tx.insert(riwayatStatusBarang).values({
      id: crypto.randomUUID(),
      barangId: lockedItem.id,
      oldStatus: lockedItem.status,
      newStatus: "terjual",
      changedByUserId: adminId,
      note:
        row.transaction.type === "vickrey"
          ? "Pemenang Lelang Tertutup menyelesaikan pembayaran dalam batas waktu 24 jam dan diverifikasi admin unit."
          : "Pembayaran harga tetap disetujui admin unit sehingga barang tercatat terjual."
    });

    return updatedTransaction;
  });
  await notifyPaymentVerified({
    userId: updated.userId,
    transactionId: updated.id,
    lotName: row.item.name,
    transactionType: row.transaction.type,
    unitName: row.unit.name,
    unitAddress: row.unit.address
  });
  await notifySuperAdminPaymentVerified({
    superAdminUserIds: await listActiveSuperAdminNotificationRecipientIds(),
    unitId,
    barangId: row.item.id,
    pemasaranId: row.transaction.pemasaranId,
    transactionId: updated.id,
    lotName: row.item.name
  });
  revalidateTransactionViews();

  return serializeTransactionJoin(await getTransactionForUnit(unitId, updated.id));
}

export async function rejectAdminTransactionProof(
  unitId: string,
  adminId: string,
  transactionId: string,
  input: { reason?: unknown }
) {
  const row = await getTransactionForUnit(unitId, transactionId);
  await ensureTransactionMutable(row.transaction.status);
  const payload = validateTransactionRejectPayload(input);

  if (row.transaction.status === "ditolak_bukti") {
    return serializeTransactionJoin(row);
  }

  if (row.transaction.status !== "bukti_diunggah") {
    throw new Error("Hanya bukti transfer yang sudah diunggah yang dapat ditolak.");
  }

  const now = new Date();
  const updated = await db.transaction(async (tx) => {
    const [lockedItem] = await tx
      .select()
      .from(barang)
      .where(and(eq(barang.id, row.item.id), eq(barang.unitId, unitId)))
      .limit(1)
      .for("update");

    if (!lockedItem) {
      throw new Error("Barang tidak ditemukan di unit Anda.");
    }

    const [updatedTransaction] = await tx
      .update(transaksi)
      .set({
        status: "ditolak_bukti",
        rejectionReason: payload.reason,
        verifiedByUserId: adminId,
        verifiedAt: now,
        updatedAt: now
      })
      .where(
        and(
          eq(transaksi.id, transactionId),
          eq(transaksi.type, "fixed_price"),
          eq(transaksi.status, "bukti_diunggah")
        )
      )
      .returning();

    if (!updatedTransaction) {
      throw new Error("Transaksi tidak ditemukan.");
    }

    if (row.transaction.type === "fixed_price") {
      await relistRejectedFixedPriceMarketing(tx, {
        adminId,
        barangId: lockedItem.id,
        itemStatus: lockedItem.status,
        marketingId: row.transaction.pemasaranId,
        now,
        originalPublishedAt: row.marketing.createdAt,
        price: String(row.marketing.price ?? row.transaction.amount),
        reason: payload.reason,
        sourceIteration: row.marketing.iteration
      });
    }

    return updatedTransaction;
  });

  await notifyPaymentRejected({
    userId: updated.userId,
    transactionId: updated.id,
    lotName: row.item.name,
    reason: payload.reason
  });
  await notifySuperAdminPaymentRejected({
    superAdminUserIds: await listActiveSuperAdminNotificationRecipientIds(),
    unitId,
    barangId: row.item.id,
    pemasaranId: row.transaction.pemasaranId,
    transactionId: updated.id,
    lotName: row.item.name,
    reason: payload.reason
  });
  revalidateTransactionViews();

  return serializeTransactionJoin(await getTransactionForUnit(unitId, updated.id));
}
