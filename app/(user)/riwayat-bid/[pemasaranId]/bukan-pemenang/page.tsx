import { notFound, redirect } from "next/navigation";

import { AuctionLoserPage } from "@/components/pages/user-pages.lazy";
import { getBuyerTransactionHref } from "@/lib/buyer/transaction-links";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { listBuyerBids } from "@/lib/services/buyer.service";
import { listOngoingVickreyLotsWithLimit } from "@/lib/services/public-catalog.service";

export default async function Page({
  params,
}: {
  params: Promise<{ pemasaranId: string }>;
}) {
  const { pemasaranId } = await params;
  const buyer = await getBuyerSessionUser(`/riwayat-bid/${pemasaranId}/bukan-pemenang`);
  const [bids, lots] = await Promise.all([
    listBuyerBids(buyer.id),
    listOngoingVickreyLotsWithLimit(8),
  ]);
  const bid = bids.find((item) => item.lotId === pemasaranId);

  if (!bid) {
    notFound();
  }

  if (bid.status === "MENANG" && bid.linkedTransactionId) {
    redirect(
      getBuyerTransactionHref({
        id: bid.linkedTransactionId,
        kind: "VICKREY_WIN",
        status: bid.transactionStatus ?? "MENUNGGU_PEMBAYARAN"
      })
    );
  }

  if (bid.status === "GAGAL" && bid.linkedTransactionId) {
    redirect(`/transaksi/${bid.linkedTransactionId}`);
  }

  const recommendations = lots
    .filter((lot) => lot.id !== pemasaranId)
    .slice(0, 3);

  return <AuctionLoserPage bid={bid} recommendations={recommendations} />;
}
