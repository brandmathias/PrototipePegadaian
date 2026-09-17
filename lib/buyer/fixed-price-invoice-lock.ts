export type FixedPriceInvoiceLockRow = {
  id: string;
  pemasaranId: string;
  userId: string;
  type?: string | null;
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

export function isActiveFixedPriceInvoice(
  transaction: FixedPriceInvoiceLockRow,
  now = new Date()
) {
  const deadline = toDate(transaction.paymentDeadline);

  return Boolean(
    (!transaction.type || transaction.type.toLowerCase() === "fixed_price") &&
      transaction.paymentMethod?.toLowerCase() === "midtrans" &&
      transaction.status.toLowerCase() === "menunggu_pembayaran" &&
      deadline &&
      deadline.getTime() > now.getTime()
  );
}

export function findActiveFixedPriceInvoice(
  transactions: FixedPriceInvoiceLockRow[],
  userId: string,
  now = new Date()
) {
  return (
    transactions.find(
      (transaction) => transaction.userId === userId && isActiveFixedPriceInvoice(transaction, now)
    ) ?? null
  );
}

export function getFixedPriceInvoiceExpiry(transaction: FixedPriceInvoiceLockRow) {
  return toDate(transaction.paymentDeadline)?.toISOString() ?? null;
}
