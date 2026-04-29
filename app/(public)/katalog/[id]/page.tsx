import { LotDetailPage } from "@/components/pages/public-pages";
import { getServerSession } from "@/lib/auth/session";
import { getBuyerBidState, getBuyerProfileStatus } from "@/lib/services/buyer.service";
import { getPublicLotById } from "@/lib/services/public-catalog.service";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lot = await getPublicLotById(id);
  const session = await getServerSession();
  const isBuyer = session?.user?.role === "buyer";
  const [bidState, buyerStatus] =
    isBuyer && session?.user?.id
      ? await Promise.all([
          getBuyerBidState(session.user.id, id),
          getBuyerProfileStatus(session.user.id)
        ])
      : [null, null];

  return <LotDetailPage buyerStatus={buyerStatus} bidState={bidState} lot={lot} />;
}
