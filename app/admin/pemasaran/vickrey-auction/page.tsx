import { AdminVickreyAuctionListPage } from "@/components/pages/admin-marketing-pages.lazy";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { listAdminPemasaran } from "@/lib/services/admin-pemasaran.service";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const auctions = await listAdminPemasaran(unitId);
  const vickreyAuctions = auctions.filter((auction) => auction.mode === "VICKREY_AUCTION");

  return (
    <AdminVickreyAuctionListPage
      auctions={vickreyAuctions}
      emptyDescription="Belum ada sesi lelang tertutup untuk unit ini."
    />
  );
}
