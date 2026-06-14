import { TransactionReceiptPage } from "@/components/pages/user-pages.lazy";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { getBuyerTransactionById } from "@/lib/services/buyer.service";

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ output?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : undefined;
  const buyer = await getBuyerSessionUser(`/transaksi/${id}/nota`);
  const transaction = await getBuyerTransactionById(buyer.id, id).catch(() => null);

  return (
    <TransactionReceiptPage
      buyer={buyer}
      outputMode={query?.output}
      transaction={transaction}
      transactionId={id}
    />
  );
}
