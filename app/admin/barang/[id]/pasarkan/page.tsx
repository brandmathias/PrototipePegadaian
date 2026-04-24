import { AdminInventoryMarketPage } from "@/components/pages/admin-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { getAdminBarangById } from "@/lib/services/admin-barang.service";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { unitId } = await getAdminUnitPageContext();
  const item = await getAdminBarangById(unitId, id);

  return <AdminInventoryMarketPage item={item} itemId={id} />;
}
