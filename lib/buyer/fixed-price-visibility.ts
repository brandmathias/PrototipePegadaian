export const FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES = [
  "bukti_diunggah",
  "menunggu_konfirmasi_langsung",
  "lunas",
  "selesai"
] as const;

export const FIXED_PRICE_BUYER_CATALOG_HIDDEN_STATUSES = [
  "BUKTI_DIUNGGAH",
  "MENUNGGU_KONFIRMASI_LANGSUNG",
  "LUNAS",
  "SELESAI"
] as const;

export function isFixedPriceTransactionCatalogHiddenStatus(status: string) {
  return FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES.includes(
    status as (typeof FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES)[number]
  );
}

export function isFixedPriceBuyerCatalogHiddenStatus(status: string) {
  return FIXED_PRICE_BUYER_CATALOG_HIDDEN_STATUSES.includes(
    status as (typeof FIXED_PRICE_BUYER_CATALOG_HIDDEN_STATUSES)[number]
  );
}
