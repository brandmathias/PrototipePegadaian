import { TransactionReceiptPage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buyer = await getBuyerSessionUser(`/transaksi/${id}/nota`);

  return <TransactionReceiptPage buyer={buyer} transactionId={id} />;
}
