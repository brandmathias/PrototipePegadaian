import { AdminInventoryPage } from "@/components/pages/admin-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { listAdminBarang } from "@/lib/services/admin-barang.service";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const items = await listAdminBarang(unitId);

  return <AdminInventoryPage items={items} />;
}
