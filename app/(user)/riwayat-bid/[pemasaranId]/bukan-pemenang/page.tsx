import { notFound } from "next/navigation";

import { AuctionLoserPage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { listBuyerBids } from "@/lib/services/buyer.service";
import { listPublicLotsWithLimit } from "@/lib/services/public-catalog.service";

export default async function Page({
  params,
}: {
  params: Promise<{ pemasaranId: string }>;
}) {
  const { pemasaranId } = await params;
  const buyer = await getBuyerSessionUser(`/riwayat-bid/${pemasaranId}/bukan-pemenang`);
  const [bids, lots] = await Promise.all([
    listBuyerBids(buyer.id),
    listPublicLotsWithLimit(8),
  ]);
  const bid = bids.find((item) => item.lotId === pemasaranId);

  if (!bid || bid.status !== "TIDAK_MENANG") {
    notFound();
  }

  const recommendations = lots
    .filter((lot) => lot.id !== pemasaranId)
    .slice(0, 3);

  return <AuctionLoserPage bid={bid} recommendations={recommendations} />;
}
