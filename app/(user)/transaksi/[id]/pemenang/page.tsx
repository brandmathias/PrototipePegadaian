import { redirect } from "next/navigation";

import { AuctionWinnerPage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { isBuyerWinnerAnnouncementTransaction } from "@/lib/buyer/transaction-links";
import { getBuyerTransactionById } from "@/lib/services/buyer.service";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buyer = await getBuyerSessionUser(`/transaksi/${id}/pemenang`);
  const transaction = await getBuyerTransactionById(buyer.id, id).catch(() => null);

  if (!transaction || !isBuyerWinnerAnnouncementTransaction(transaction)) {
    redirect(`/transaksi/${id}`);
  }

  return <AuctionWinnerPage transaction={transaction} transactionId={id} />;
}
