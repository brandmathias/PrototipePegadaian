import { AdminInventoryDetailPage } from "@/components/pages/admin-pages.lazy";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import {
  getAdminBarangById,
  listAdminBarangHistory,
} from "@/lib/services/admin-barang.service";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ riwayat?: string | string[] }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const selectedHistoryId = Array.isArray(query?.riwayat) ? query.riwayat[0] : query?.riwayat;
  const { unitId } = await getAdminUnitPageContext();
  const [item, history] = await Promise.all([
    getAdminBarangById(unitId, id),
    listAdminBarangHistory(unitId, undefined, id),
  ]);

  return (
    <AdminInventoryDetailPage
      history={history}
      item={item}
      itemId={id}
      selectedHistoryId={selectedHistoryId}
    />
  );
}
