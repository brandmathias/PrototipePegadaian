import { AdminFixedPriceListPage } from "@/components/pages/admin-marketing-pages.lazy";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { listAdminPemasaran } from "@/lib/services/admin-pemasaran.service";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const auctions = await listAdminPemasaran(unitId);
  const fixedPriceAuctions = auctions.filter((auction) => auction.mode === "FIXED_PRICE");

  return (
    <AdminFixedPriceListPage
      auctions={fixedPriceAuctions}
      emptyDescription="Belum ada sesi harga tetap untuk unit ini."
    />
  );
}
