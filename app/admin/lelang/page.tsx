import { AdminAuctionListPage } from "@/components/pages/admin-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { listAdminPemasaran } from "@/lib/services/admin-pemasaran.service";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const auctions = await listAdminPemasaran(unitId);

  return <AdminAuctionListPage auctions={auctions} />;
}
