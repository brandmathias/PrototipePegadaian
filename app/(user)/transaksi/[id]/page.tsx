import { TransactionDetailPage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buyer = await getBuyerSessionUser(`/transaksi/${id}`);

  return <TransactionDetailPage buyer={buyer} transactionId={id} />;
}
