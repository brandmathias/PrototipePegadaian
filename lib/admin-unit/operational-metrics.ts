type InventoryMetricItem = {
  dueDate?: unknown;
  status?: unknown;
};

type MarketingMetricItem = {
  endingAt?: unknown;
  mode?: unknown;
  status?: unknown;
  transactionId?: unknown;
  visibility?: unknown;
};

type TransactionMetricItem = {
  status?: unknown;
};

export const ADMIN_VERIFICATION_ACTION_STATUSES = new Set([
  "BUKTI_DIUNGGAH",
  "MENUNGGU_KONFIRMASI_LANGSUNG"
]);

const ADMIN_COLLATERAL_STATUSES = new Set(["GADAI", "JAMINAN"]);
const ADMIN_INVENTORY_LIST_STATUSES = new Set(["GADAI", "JAMINAN"]);

export function getDaysUntilDateLabel(dateLabel: unknown, now = new Date()) {
  if (!dateLabel || dateLabel === "-") {
    return null;
  }

  const date =
    dateLabel instanceof Date
      ? dateLabel
      : /^\d{4}-\d{2}-\d{2}$/.test(String(dateLabel))
        ? new Date(`${String(dateLabel)}T00:00:00.000Z`)
        : new Date(String(dateLabel));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const targetUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  return Math.ceil((targetUtc - todayUtc) / 86_400_000);
}

export function isAdminInventoryDueSoon(item: InventoryMetricItem, now = new Date()) {
  if (!ADMIN_COLLATERAL_STATUSES.has(String(item.status ?? "").toUpperCase())) {
    return false;
  }

  const days = getDaysUntilDateLabel(item.dueDate, now);

  return days !== null && days >= 0 && days <= 7;
}

export function isAdminInventoryListItem(item: InventoryMetricItem) {
  return ADMIN_INVENTORY_LIST_STATUSES.has(String(item.status ?? "").toUpperCase());
}

export function isAdminInventoryReadyForMarketing(item: InventoryMetricItem, now = new Date()) {
  const status = String(item.status ?? "").toUpperCase();

  if (!ADMIN_COLLATERAL_STATUSES.has(status)) {
    return false;
  }

  const days = getDaysUntilDateLabel(item.dueDate, now);
  return days !== null && days <= 0;
}

export function getAdminInventoryMetrics(items: InventoryMetricItem[], now = new Date()) {
  const inventoryItems = items.filter(isAdminInventoryListItem);

  return {
    total: inventoryItems.length,
    readyForMarketing: inventoryItems.filter((item) => isAdminInventoryReadyForMarketing(item, now)).length,
    dueSoon: inventoryItems.filter((item) => isAdminInventoryDueSoon(item, now)).length
  };
}

export function isAdminMarketingActionable(item: MarketingMetricItem, now = new Date()) {
  const mode = String(item.mode ?? "").toUpperCase();
  const status = String(item.status ?? "").toUpperCase();
  const visibility = String(item.visibility ?? "").toUpperCase();

  if (!mode.includes("VICKREY")) {
    return false;
  }

  if (status === "GAGAL") {
    return true;
  }

  if (status !== "AKTIF") {
    return false;
  }

  if (visibility === "MENUNGGU_REVEAL") {
    return true;
  }

  if (visibility === "HASIL_DIBUKA" && !item.transactionId) {
    return true;
  }

  const endingAt = item.endingAt ? new Date(String(item.endingAt)).getTime() : Number.NaN;

  return Number.isFinite(endingAt) && endingAt <= now.getTime();
}

export function isAdminTransactionActionable(transaction: TransactionMetricItem) {
  return ADMIN_VERIFICATION_ACTION_STATUSES.has(String(transaction.status ?? "").toUpperCase());
}
