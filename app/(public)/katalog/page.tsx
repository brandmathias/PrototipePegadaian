import { unstable_cache } from "next/cache";
import { connection } from "next/server";

import { CatalogPage } from "@/components/pages/catalog-page";
import { listPublicLots } from "@/lib/services/public-catalog.service";

export const revalidate = 10;

const getCachedPublicLots = unstable_cache(listPublicLots, ["public-catalog-lots"], {
  revalidate: 10,
  tags: ["public-catalog-lots"]
});

export default async function Page() {
  await connection();

  const lots = await getCachedPublicLots();

  return (
    <CatalogPage
      lots={lots}
      serverNow={new Date().toISOString()}
      wishlistSyncEnabled
    />
  );
}
