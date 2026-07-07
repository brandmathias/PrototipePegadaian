import { revalidateTag } from "next/cache";

const LOT_INSIGHTS_VIEW_TAGS = [
  "buyer-shell",
  "public-catalog-lots",
  "superadmin-monitoring",
  "superadmin-unit-detail",
  "superadmin-unit-barang-detail"
] as const;

export function revalidateLotInsightsViews() {
  for (const tag of LOT_INSIGHTS_VIEW_TAGS) {
    revalidateTag(tag);
  }
}
