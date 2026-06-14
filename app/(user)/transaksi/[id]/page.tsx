import { TransactionDetailPage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { getBuyerProfileStatus, getBuyerTransactionById } from "@/lib/services/buyer.service";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buyer = await getBuyerSessionUser(`/transaksi/${id}`);
  const [buyerStatus, transaction] = await Promise.all([
    getBuyerProfileStatus(buyer.id),
    getBuyerTransactionById(buyer.id, id).catch(() => null)
  ]);

  return (
    <TransactionDetailPage
      buyer={buyer}
      buyerStatus={buyerStatus}
      transaction={transaction}
      transactionId={id}
    />
  );
}
