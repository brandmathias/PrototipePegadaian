import { revalidateTag } from "next/cache";

const TRANSACTION_VIEW_TAGS = [
  "admin-layout",
  "admin-dashboard",
  "public-catalog-lots",
  "superadmin-monitoring",
  "superadmin-unit-detail",
  "superadmin-unit-barang-detail"
] as const;

export function revalidateTransactionViews() {
  for (const tag of TRANSACTION_VIEW_TAGS) {
    revalidateTag(tag);
  }
}
