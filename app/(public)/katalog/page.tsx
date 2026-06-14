import { CatalogPage } from "@/components/pages/catalog-page";
import { isAuthRole } from "@/lib/auth/guards";
import { getServerSession } from "@/lib/auth/session";
import { listPublicLots } from "@/lib/services/public-catalog.service";
import { getBuyerWishlistIds } from "@/lib/services/wishlist.service";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const sessionPromise = getServerSession();
  const lotsPromise = listPublicLots();
  const queryPromise = searchParams ?? Promise.resolve(undefined);

  const [session, lots, query] = await Promise.all([sessionPromise, lotsPromise, queryPromise]);
  const isBuyer = Boolean(session?.user && isAuthRole(session.user.role) && session.user.role === "buyer");
  const favoriteIds = isBuyer && session?.user ? await getBuyerWishlistIds(session.user.id) : [];

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
