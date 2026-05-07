import { AdminMarketingHubPage } from "@/components/pages/admin-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { listAdminPemasaran } from "@/lib/services/admin-pemasaran.service";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const auctions = await listAdminPemasaran(unitId);
  const fixedPriceCount = auctions.filter((auction) => auction.mode === "FIXED_PRICE").length;
  const vickreyCount = auctions.filter((auction) => auction.mode === "VICKREY_AUCTION").length;

  return (
    <AdminMarketingHubPage
      fixedPriceCount={fixedPriceCount}
      vickreyCount={vickreyCount}
    />
  );
}
