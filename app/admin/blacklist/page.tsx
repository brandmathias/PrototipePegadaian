import { AdminBlacklistPage } from "@/components/pages/admin-pages.lazy";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { listAdminBlacklist } from "@/lib/services/admin-blacklist.service";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const entries = await listAdminBlacklist(unitId);

  return <AdminBlacklistPage entries={entries} />;
}
