import { TransactionsPage } from "@/components/pages/user-pages.lazy";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { getBuyerDashboardData } from "@/lib/services/buyer.service";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ lot?: string; tab?: string }>;
}) {
  const buyer = await getBuyerSessionUser("/transaksi");
  const data = await getBuyerDashboardData(buyer.id);
  const params = searchParams ? await searchParams : undefined;
  const initialTab = params?.tab === "bids" ? "bids" : "transactions";
  const highlightedBidLotId = params?.lot ?? null;

  return (
    <TransactionsPage
      buyer={buyer}
      data={data}
      highlightedBidLotId={highlightedBidLotId}
      initialTab={initialTab}
    />
  );
}
