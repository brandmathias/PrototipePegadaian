import { AdminDashboardPage } from "@/components/pages/admin-dashboard-page";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { getAdminDashboardData } from "@/lib/services/admin-dashboard.service";
import { unstable_cache } from "next/cache";

const getCachedAdminDashboardData = unstable_cache(
  async (unitId: string) => getAdminDashboardData(unitId),
  ["admin-dashboard-data"],
  {
    revalidate: 10,
    tags: ["admin-dashboard"]
  }
);

export default async function Page() {
  const { user, unitId } = await getAdminUnitPageContext();
  const data = await getCachedAdminDashboardData(unitId);

  return <AdminDashboardPage data={data} adminName={user.name} />;
}
