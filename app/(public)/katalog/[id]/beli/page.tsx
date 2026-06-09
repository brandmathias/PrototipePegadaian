import { PurchasePage } from "@/components/pages/public-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { getPublicLotById } from "@/lib/services/public-catalog.service";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getBuyerSessionUser(`/katalog/${id}/beli`);
  const lot = await getPublicLotById(id);
  return <PurchasePage lot={lot} />;
}
