import { AdminInventoryDetailPage } from "@/components/pages/admin-pages.lazy";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import {
  getAdminBarangById,
  listAdminBarangHistory,
} from "@/lib/services/admin-barang.service";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { unitId } = await getAdminUnitPageContext();
  const [item, history] = await Promise.all([
    getAdminBarangById(unitId, id),
    listAdminBarangHistory(unitId, undefined, id),
  ]);

  return <AdminInventoryDetailPage history={history} item={item} itemId={id} />;
}
