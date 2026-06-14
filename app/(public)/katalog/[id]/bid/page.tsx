import { BidPage } from "@/components/pages/public-bid-page";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { getBuyerBidState, getBuyerProfileStatus } from "@/lib/services/buyer.service";
import { getPublicLotById } from "@/lib/services/public-catalog.service";

export const dynamic = "force-dynamic";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nextPath = `/katalog/${id}/bid`;
  const buyerPromise = getBuyerSessionUser(nextPath);
  const lotPromise = getPublicLotById(id);
  const [buyer, lot] = await Promise.all([buyerPromise, lotPromise]);
  const [bidState, buyerStatus] = await Promise.all([
    getBuyerBidState(buyer.id, id),
    getBuyerProfileStatus(buyer.id)
  ]);

  return <BidPage bidState={bidState} buyerId={buyer.id} buyerStatus={buyerStatus} lot={lot} />;
}
