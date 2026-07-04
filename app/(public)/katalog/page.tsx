import { unstable_cache } from "next/cache";

import { CatalogPage } from "@/components/pages/catalog-page";
import { isAuthRole } from "@/lib/auth/guards";
import { getServerSession } from "@/lib/auth/session";
import { listPublicLots } from "@/lib/services/public-catalog.service";
import { getBuyerWishlistIds } from "@/lib/services/wishlist.service";

export const dynamic = "force-dynamic";

const getCachedPublicLots = unstable_cache(listPublicLots, ["public-catalog-lots"], {
  revalidate: 10,
  tags: ["public-catalog-lots"]
});

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const session = await getServerSession();
  const isBuyer = Boolean(session?.user && isAuthRole(session.user.role) && session.user.role === "buyer");
  const [lots, favoriteIds] = await Promise.all([
    getCachedPublicLots(),
    isBuyer && session?.user ? getBuyerWishlistIds(session.user.id) : Promise.resolve([])
  ]);
  const query = searchParams ? await searchParams : undefined;

  return (
    <CatalogPage
      initialFavoriteIds={favoriteIds}
      initialQuery={query?.q ?? ""}
      lots={lots}
      serverNow={new Date().toISOString()}
      wishlistSyncEnabled={isBuyer}
    />
  );
}
