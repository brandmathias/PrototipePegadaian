import { LotDetailPage } from "@/components/pages/public-pages";
import { getServerSession } from "@/lib/auth/session";
import { getBuyerBidState, getBuyerProfileStatus } from "@/lib/services/buyer.service";
import { getPublicLotById } from "@/lib/services/public-catalog.service";
import { getBuyerWishlistIds } from "@/lib/services/wishlist.service";

export const dynamic = "force-dynamic";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lotPromise = getPublicLotById(id);
  const sessionPromise = getServerSession();
  const [lot, session] = await Promise.all([lotPromise, sessionPromise]);
  const isBuyer = session?.user?.role === "buyer";
  const [bidState, buyerStatus, favoriteIds] =
    isBuyer && session?.user?.id
      ? await Promise.all([
          getBuyerBidState(session.user.id, id),
          getBuyerProfileStatus(session.user.id),
          getBuyerWishlistIds(session.user.id)
        ])
      : [null, null, [] as string[]];

  return (
    <LotDetailPage
      buyerId={isBuyer ? session?.user?.id : null}
      buyerStatus={buyerStatus}
      bidState={bidState}
      initialFavorited={favoriteIds.includes(id)}
      lot={lot}
      wishlistSyncEnabled={isBuyer}
    />
  );
}
