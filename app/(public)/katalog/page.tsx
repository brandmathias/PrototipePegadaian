import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";

import { CatalogHero } from "@/components/pages/catalog-hero";
import { CatalogPage } from "@/components/pages/catalog-page";
import { listPublicLots } from "@/lib/services/public-catalog.service";

export const revalidate = 10;

const getCachedPublicLots = unstable_cache(listPublicLots, ["public-catalog-lots"], {
  revalidate: 10,
  tags: ["public-catalog-lots"]
});

function CatalogResultsFallback() {
  return (
    <section
      aria-busy="true"
      aria-label="Memuat katalog"
      className="container relative z-10 -mt-14 pb-12 pt-0"
    >
      <div className="h-[34rem] animate-pulse rounded-md border border-black/8 bg-[#f3f6f2]" />
    </section>
  );
}

async function CatalogResults() {
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

export default function Page() {
  return (
    <div className="bg-white">
      <CatalogHero />
      <Suspense fallback={<CatalogResultsFallback />}>
        <CatalogResults />
      </Suspense>
    </div>
  );
}
