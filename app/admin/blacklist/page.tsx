import { AdminBlacklistPage } from "@/components/pages/admin-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { listAdminBlacklist } from "@/lib/services/admin-blacklist.service";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const entries = await listAdminBlacklist(unitId);

  return <AdminBlacklistPage entries={entries} />;
}
