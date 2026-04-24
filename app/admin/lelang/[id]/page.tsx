import { AdminAuctionDetailPage } from "@/components/pages/admin-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { getAdminPemasaranById } from "@/lib/services/admin-pemasaran.service";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { unitId } = await getAdminUnitPageContext();
  const auction = await getAdminPemasaranById(unitId, id);

  return <AdminAuctionDetailPage auction={auction} auctionId={id} />;
}
