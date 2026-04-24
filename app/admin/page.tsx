import { AdminDashboardPage } from "@/components/pages/admin-dashboard-page";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { getAdminDashboardData } from "@/lib/services/admin-dashboard.service";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const data = await getAdminDashboardData(unitId);

  return <AdminDashboardPage data={data} />;
}
