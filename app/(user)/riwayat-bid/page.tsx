import { BidHistoryPage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";

export default async function Page() {
  const buyer = await getBuyerSessionUser("/riwayat-bid");

  return <BidHistoryPage buyer={buyer} />;
}
