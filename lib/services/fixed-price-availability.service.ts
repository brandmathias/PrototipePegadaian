import { and, eq, gt } from "drizzle-orm";

import { FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES } from "@/lib/buyer/fixed-price-visibility";
import { getFixedPriceInvoiceExpiry } from "@/lib/buyer/fixed-price-invoice-lock";
import type { FixedPriceAvailability } from "@/lib/contracts/fixed-price-availability";
import { db } from "@/lib/db/client";
import { transaksi } from "@/lib/db/schema";

const SOLD_STATUSES = new Set(["lunas", "selesai"]);

export type FixedPriceAvailabilityTransaction = {
  userId: string;
  status: string;
  paymentMethod?: string | null;
  paymentDeadline?: Date | string | null;
};

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isActiveMidtransReservation(
  transaction: FixedPriceAvailabilityTransaction,
  now: Date
) {
  const deadline = toDate(transaction.paymentDeadline);

  return Boolean(
    transaction.paymentMethod?.toLowerCase() === "midtrans" &&
      transaction.status.toLowerCase() === "menunggu_pembayaran" &&
      deadline &&
      deadline.getTime() > now.getTime()
  );
}

export function resolveFixedPriceAvailability(
  transactions: FixedPriceAvailabilityTransaction[],
  viewerId: string | null = null,
  now = new Date()
): FixedPriceAvailability {
  if (transactions.some((transaction) => SOLD_STATUSES.has(transaction.status.toLowerCase()))) {
    return {
      status: "sold",
      owner: null,
      expiresAt: null,
      canContinue: false
    };
  }

  const reservation = transactions.find((transaction) => {
    const status = transaction.status.toLowerCase();

    return (
      FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES.includes(
        status as (typeof FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES)[number]
      ) || isActiveMidtransReservation(transaction, now)
    );
  });

  if (!reservation) {
    return {
      status: "available",
      owner: null,
      expiresAt: null,
      canContinue: false
    };
  }

  const owner = viewerId && reservation.userId === viewerId ? "self" : "other";
  const canContinue = owner === "self" && isActiveMidtransReservation(reservation, now);
  const deadline = isActiveMidtransReservation(reservation, now)
    ? toDate(reservation.paymentDeadline)
    : null;

  return {
    status: "reserved",
    owner,
    expiresAt: deadline?.toISOString() ?? null,
    canContinue
  };
}

export async function getFixedPriceAvailability(
  pemasaranId: string,
  viewerId: string | null = null,
  now = new Date()
) {
  const rows = await db
    .select({
      userId: transaksi.userId,
      status: transaksi.status,
      paymentMethod: transaksi.paymentMethod,
      paymentDeadline: transaksi.paymentDeadline
    })
    .from(transaksi)
    .where(and(eq(transaksi.pemasaranId, pemasaranId), eq(transaksi.type, "fixed_price")));

  const availability = resolveFixedPriceAvailability(rows, viewerId, now);

  if (!viewerId) {
    return { ...availability, buyerActiveInvoice: null };
  }

  const [activeInvoice] = await db
    .select({
      id: transaksi.id,
      pemasaranId: transaksi.pemasaranId,
      userId: transaksi.userId,
      type: transaksi.type,
      status: transaksi.status,
      paymentMethod: transaksi.paymentMethod,
      paymentDeadline: transaksi.paymentDeadline
    })
    .from(transaksi)
    .where(
      and(
        eq(transaksi.userId, viewerId),
        eq(transaksi.type, "fixed_price"),
        eq(transaksi.paymentMethod, "midtrans"),
        eq(transaksi.status, "menunggu_pembayaran"),
        gt(transaksi.paymentDeadline, now)
      )
    )
    .limit(1);

  return {
    ...availability,
    buyerActiveInvoice:
      activeInvoice && activeInvoice.pemasaranId !== pemasaranId
        ? {
            transactionId: activeInvoice.id,
            expiresAt: getFixedPriceInvoiceExpiry(activeInvoice)
          }
        : null
  };
}
