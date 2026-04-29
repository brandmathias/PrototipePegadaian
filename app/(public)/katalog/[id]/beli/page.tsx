import { PurchasePage } from "@/components/pages/public-pages";
import { getPublicLotById } from "@/lib/services/public-catalog.service";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lot = await getPublicLotById(id);
  return <PurchasePage lot={lot} />;
}
