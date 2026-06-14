import { AdminInventoryHistoryPage } from "@/components/pages/admin-pages.lazy";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { listAdminBarangHistory } from "@/lib/services/admin-barang.service";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const history = await listAdminBarangHistory(unitId);

  return <AdminInventoryHistoryPage history={history} />;
}
