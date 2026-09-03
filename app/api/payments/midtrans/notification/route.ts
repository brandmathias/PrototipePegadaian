import { randomUUID } from "node:crypto";

import { and, eq, inArray, ne } from "drizzle-orm";
import { NextResponse } from "next/server";

import { FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES } from "@/lib/buyer/fixed-price-visibility";
import {
  getMidtransGatewayConfig,
  getMidtransTransactionStatus,
  mapMidtransTransactionStatus,
  verifyMidtransNotificationSignature
} from "@/lib/payments/midtrans";
import { db } from "@/lib/db/client";
import { barang, pemasaran, riwayatStatusBarang, transaksi, units } from "@/lib/db/schema";
import {
  listActiveAdminUnitNotificationRecipientIds,
  listActiveSuperAdminNotificationRecipientIds,
  notifyAdminUnitMidtransPaymentVerified,
  notifyPaymentVerified,
  notifySuperAdminPaymentVerified
} from "@/lib/services/notification-events";
import { revalidateTransactionViews } from "@/lib/services/revalidate-transaction-views";

type MidtransNotification = {
  gross_amount?: string;
  order_id?: string;
  signature_key?: string;
  status_code?: string;
};

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const notification = (await request.json().catch(() => ({}))) as MidtransNotification;
  const orderId = readString(notification.order_id);
  const statusCode = readString(notification.status_code);
  const grossAmount = readString(notification.gross_amount);
  const signatureKey = readString(notification.signature_key);
  const config = getMidtransGatewayConfig();

  if (
    !orderId ||
    !statusCode ||
    !grossAmount ||
    !signatureKey ||
    !verifyMidtransNotificationSignature({ orderId, statusCode, grossAmount, signatureKey }, config.serverKey)
  ) {
    return NextResponse.json({ message: "Signature Midtrans tidak valid." }, { status: 401 });
  }

  const gateway = await getMidtransTransactionStatus({ config, orderId });
  if (readString(gateway.order_id) !== orderId) {
    return NextResponse.json({ message: "Order Midtrans tidak cocok." }, { status: 400 });
  }

  const [row] = await db
    .select({ transaction: transaksi, item: barang, marketing: pemasaran, unit: units })
    .from(transaksi)
    .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .where(eq(transaksi.paymentOrderId, orderId))
    .limit(1);

  if (
    !row ||
    row.transaction.type !== "fixed_price" ||
    row.transaction.paymentMethod !== "midtrans" ||
    row.transaction.paymentProvider !== "midtrans" ||
    Number(row.transaction.amount) !== Number(gateway.gross_amount)
  ) {
    return NextResponse.json({ message: "Transaksi Midtrans tidak ditemukan atau nominal tidak cocok." }, { status: 404 });
  }

  const nextStatus = mapMidtransTransactionStatus(readString(gateway.transaction_status));
  if (nextStatus === "unknown") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (nextStatus === "menunggu_pembayaran") {
    await db.transaction(async (tx) => {
      const [lockedItem] = await tx
        .select()
        .from(barang)
        .where(eq(barang.id, row.item.id))
        .limit(1)
        .for("update");

      if (!lockedItem) {
        return;
      }

      await tx
        .update(transaksi)
        .set({
          gatewayPayload: gateway,
          gatewayStatus: readString(gateway.transaction_status),
          updatedAt: new Date()
        })
        .where(and(eq(transaksi.id, row.transaction.id), eq(transaksi.status, "menunggu_pembayaran")));
    });
    return NextResponse.json({ ok: true });
  }

  if (nextStatus === "gagal") {
    await db.transaction(async (tx) => {
      const [lockedItem] = await tx
        .select()
        .from(barang)
        .where(eq(barang.id, row.item.id))
        .limit(1)
        .for("update");

      if (!lockedItem) {
        return;
      }

      await tx
        .update(transaksi)
        .set({
          gatewayPayload: gateway,
          gatewayStatus: readString(gateway.transaction_status),
          status: "gagal",
          updatedAt: new Date()
        })
        .where(and(eq(transaksi.id, row.transaction.id), eq(transaksi.status, "menunggu_pembayaran")));
    });
    revalidateTransactionViews();
    return NextResponse.json({ ok: true });
  }

  if (
    readString(gateway.status_code) !== "200" ||
    (gateway.fraud_status && readString(gateway.fraud_status) !== "accept")
  ) {
    return NextResponse.json({ message: "Status sukses Midtrans tidak valid." }, { status: 400 });
  }

  const now = new Date();
  const settlement = await db.transaction(async (tx) => {
    const [lockedItem] = await tx
      .select()
      .from(barang)
      .where(eq(barang.id, row.item.id))
      .limit(1)
      .for("update");

    if (!lockedItem) {
      return { kind: "ignored" as const, transaction: null };
    }

    const [currentTransaction] = await tx
      .select()
      .from(transaksi)
      .where(and(eq(transaksi.id, row.transaction.id), eq(transaksi.paymentOrderId, orderId)))
      .limit(1);

    if (
      !currentTransaction ||
      currentTransaction.type !== "fixed_price" ||
      currentTransaction.paymentMethod !== "midtrans" ||
      currentTransaction.paymentProvider !== "midtrans"
    ) {
      return { kind: "ignored" as const, transaction: null };
    }

    if (currentTransaction.status !== "menunggu_pembayaran") {
      return { kind: "ignored" as const, transaction: null };
    }

    const [currentMarketing] = await tx
      .select()
      .from(pemasaran)
      .where(eq(pemasaran.id, currentTransaction.pemasaranId))
      .limit(1);

    const [otherClaim] = await tx
      .select({ id: transaksi.id })
      .from(transaksi)
      .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
      .where(
        and(
          eq(pemasaran.barangId, lockedItem.id),
          eq(transaksi.type, "fixed_price"),
          ne(transaksi.id, currentTransaction.id),
          inArray(transaksi.status, FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES)
        )
      )
      .limit(1);

    if (
      lockedItem.status !== "dipasarkan" ||
      !currentMarketing ||
      currentMarketing.mode !== "fixed_price" ||
      currentMarketing.status !== "aktif" ||
      currentMarketing.barangId !== lockedItem.id ||
      otherClaim
    ) {
      const [conflicted] = await tx
        .update(transaksi)
        .set({
          gatewayPayload: gateway,
          gatewayStatus: "payment_conflict",
          rejectionReason: "Pembayaran Midtrans diterima ketika barang sudah tidak tersedia untuk transaksi ini.",
          status: "gagal",
          updatedAt: now,
          verifiedAt: now
        })
        .where(and(eq(transaksi.id, currentTransaction.id), eq(transaksi.status, "menunggu_pembayaran")))
        .returning();

      return { kind: "conflict" as const, transaction: conflicted ?? null };
    }

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
      .where(
        and(
          eq(transaksi.id, currentTransaction.id),
          eq(transaksi.status, "menunggu_pembayaran"),
          eq(transaksi.type, "fixed_price"),
          eq(transaksi.paymentProvider, "midtrans")
        )
      )
      .returning();
    if (!updated) return { kind: "ignored" as const, transaction: null };

    await tx
      .update(pemasaran)
      .set({ status: "selesai", updatedAt: now })
      .where(and(eq(pemasaran.id, currentMarketing.id), eq(pemasaran.status, "aktif")));
    const [soldItem] = await tx
      .update(barang)
      .set({ status: "terjual", updatedAt: now })
      .where(and(eq(barang.id, lockedItem.id), eq(barang.status, "dipasarkan")))
      .returning({ id: barang.id });

    if (!soldItem) {
      throw new Error("Status barang berubah saat pembayaran Midtrans diproses.");
    }

    await tx.insert(riwayatStatusBarang).values({
      id: randomUUID(),
      barangId: lockedItem.id,
      oldStatus: lockedItem.status,
      newStatus: "terjual",
      changedByUserId: null,
      note: "Pembayaran Harga Tetap dikonfirmasi otomatis oleh Midtrans."
    });
    return { kind: "settled" as const, transaction: updated };
  });

  if (settlement.kind === "conflict") {
    revalidateTransactionViews();
    return NextResponse.json({ ok: true, conflict: true });
  }

  if (settlement.kind === "settled" && settlement.transaction) {
    const settled = settlement.transaction;
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
  }

  return NextResponse.json({ ok: true });
}
