import { TransactionReceiptPage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { getBuyerTransactionById } from "@/lib/services/buyer.service";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buyer = await getBuyerSessionUser(`/transaksi/${id}/nota`);
  const transaction = await getBuyerTransactionById(buyer.id, id).catch(() => null);

  return <TransactionReceiptPage buyer={buyer} transaction={transaction} transactionId={id} />;
}
