import { BidHistoryPage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { listBuyerBids } from "@/lib/services/buyer.service";

export default async function Page() {
  const buyer = await getBuyerSessionUser("/riwayat-bid");
  const bids = await listBuyerBids(buyer.id);

  return <BidHistoryPage bids={bids} buyer={buyer} />;
}
