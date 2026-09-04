import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import {
  getMidtransTransactionStatus,
  mapMidtransTransactionStatus,
  type MidtransGatewayConfig
} from "@/lib/payments/midtrans";
import { db } from "@/lib/db/client";
import { barang, pemasaran, riwayatStatusBarang, transaksi, units } from "@/lib/db/schema";
import {
  listActiveAdminUnitNotificationRecipientIds,
  listActiveSuperAdminNotificationRecipientIds,
  notifyAdminUnitMidtransPaymentVerified,
  notifyFixedPricePaymentFailed,
  notifyPaymentVerified,
  notifySuperAdminPaymentVerified
} from "@/lib/services/notification-events";
import { revalidateTransactionViews } from "@/lib/services/revalidate-transaction-views";

type MidtransPaymentStatus = "menunggu_pembayaran" | "gagal" | "lunas" | "unknown";

export type MidtransPaymentSyncResult = {
  changed: boolean;
  status: MidtransPaymentStatus;
  transactionId: string;
};

export class MidtransPaymentSyncError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 404
  ) {
    super(message);
    this.name = "MidtransPaymentSyncError";
  }
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function lookupCondition(orderId: string, userId?: string) {
  return userId
    ? and(eq(transaksi.paymentOrderId, orderId), eq(transaksi.userId, userId))
    : eq(transaksi.paymentOrderId, orderId);
}

export async function syncMidtransTransactionStatus({
  config,
  orderId,
  userId
}: {
  config: MidtransGatewayConfig;
  orderId: string;
  userId?: string;
}): Promise<MidtransPaymentSyncResult> {
  const gateway = await getMidtransTransactionStatus({ config, orderId });

  if (readString(gateway.order_id) !== orderId) {
    throw new MidtransPaymentSyncError("Order Midtrans tidak cocok.", 400);
  }

  const [row] = await db
    .select({ transaction: transaksi, item: barang, marketing: pemasaran, unit: units })
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .where(lookupCondition(orderId, userId))
    .limit(1);

  if (
    !row ||
    row.transaction.paymentProvider !== "midtrans" ||
    Number(row.transaction.amount) !== Number(gateway.gross_amount)
  ) {
    throw new MidtransPaymentSyncError("Transaksi Midtrans tidak ditemukan atau nominal tidak cocok.", 404);
  }

  const nextStatus = mapMidtransTransactionStatus(readString(gateway.transaction_status)) as MidtransPaymentStatus;
  if (nextStatus === "unknown") {
    return { changed: false, status: nextStatus, transactionId: row.transaction.id };
  }

  if (nextStatus === "menunggu_pembayaran") {
    if (row.transaction.status !== "menunggu_pembayaran") {
      return { changed: false, status: nextStatus, transactionId: row.transaction.id };
    }

    const [updated] = await db
      .update(transaksi)
      .set({
        gatewayPayload: gateway,
        gatewayStatus: readString(gateway.transaction_status),
        updatedAt: new Date()
      })
      .where(and(eq(transaksi.id, row.transaction.id), eq(transaksi.status, "menunggu_pembayaran")))
      .returning();

    return { changed: Boolean(updated), status: nextStatus, transactionId: row.transaction.id };
  }

  if (nextStatus === "gagal") {
    if (row.transaction.status !== "menunggu_pembayaran") {
      return { changed: false, status: nextStatus, transactionId: row.transaction.id };
    }

    const [updated] = await db
      .update(transaksi)
      .set({
        gatewayPayload: gateway,
        gatewayStatus: readString(gateway.transaction_status),
        status: "gagal",
        updatedAt: new Date()
      })
      .where(and(eq(transaksi.id, row.transaction.id), eq(transaksi.status, "menunggu_pembayaran")))
      .returning();

    if (!updated) {
      return { changed: false, status: nextStatus, transactionId: row.transaction.id };
    }

    await notifyFixedPricePaymentFailed({
      userId: row.transaction.userId,
      transactionId: row.transaction.id,
      lotName: row.item.name
    });
    revalidateTransactionViews();

    return { changed: true, status: nextStatus, transactionId: row.transaction.id };
  }

  if (
    readString(gateway.status_code) !== "200" ||
    (gateway.fraud_status && readString(gateway.fraud_status) !== "accept")
  ) {
    throw new MidtransPaymentSyncError("Status sukses Midtrans tidak valid.", 400);
  }

  if (row.transaction.status !== "menunggu_pembayaran") {
    return { changed: false, status: nextStatus, transactionId: row.transaction.id };
  }

  const now = new Date();
  const settled = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(transaksi)
      .set({
        gatewayPayload: gateway,
        gatewayPaymentType: readString(gateway.payment_type) || null,
        gatewayStatus: readString(gateway.transaction_status),
        gatewayTransactionId: readString(gateway.transaction_id) || null,
        paidAt: now,
        status: "lunas",
        updatedAt: now,
        verifiedAt: now
      })
      .where(and(eq(transaksi.id, row.transaction.id), eq(transaksi.status, "menunggu_pembayaran")))
      .returning();

    if (!updated) return null;

    await tx.update(pemasaran).set({ status: "selesai", updatedAt: now }).where(eq(pemasaran.id, row.marketing.id));
    await tx.update(barang).set({ status: "terjual", updatedAt: now }).where(eq(barang.id, row.item.id));
    await tx.insert(riwayatStatusBarang).values({
      id: randomUUID(),
      barangId: row.item.id,
      oldStatus: row.item.status,
      newStatus: "terjual",
      changedByUserId: null,
      note: "Pembayaran Harga Tetap dikonfirmasi otomatis oleh Midtrans."
    });

    return updated;
  });

  if (!settled) {
    return { changed: false, status: nextStatus, transactionId: row.transaction.id };
  }

  await notifyPaymentVerified({
    userId: settled.userId,
    transactionId: settled.id,
    lotName: row.item.name,
    transactionType: "fixed_price",
    paymentProvider: "midtrans",
    unitName: row.unit.name,
    unitAddress: row.unit.address
  });
  const [adminUserIds, superAdminUserIds] = await Promise.all([
    listActiveAdminUnitNotificationRecipientIds(row.unit.id),
    listActiveSuperAdminNotificationRecipientIds()
  ]);
  await Promise.all([
    notifyAdminUnitMidtransPaymentVerified({
      adminUserIds,
      pemasaranId: row.marketing.id,
      transactionId: settled.id,
      lotName: row.item.name
    }),
    notifySuperAdminPaymentVerified({
      superAdminUserIds,
      unitId: row.unit.id,
      barangId: row.item.id,
      pemasaranId: row.marketing.id,
      transactionId: settled.id,
      lotName: row.item.name,
      paymentProvider: "midtrans"
    })
  ]);
  revalidateTransactionViews();

  return { changed: true, status: nextStatus, transactionId: settled.id };
}
