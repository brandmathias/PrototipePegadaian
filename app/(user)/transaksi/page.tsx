import { TransactionsPage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";

export default async function Page() {
  const buyer = await getBuyerSessionUser("/transaksi");

  return <TransactionsPage buyer={buyer} />;
}
