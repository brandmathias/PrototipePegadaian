import { SuperAdminDashboardPage } from "@/components/pages/superadmin-pages.lazy";
import { getSuperAdminMonitoring } from "@/lib/services/monitoring.service";
import { getSuperAdminSessionUser } from "@/lib/auth/session";
import { unstable_cache } from "next/cache";

const getCachedSuperAdminMonitoring = unstable_cache(
  async () => getSuperAdminMonitoring(),
  ["superadmin-monitoring-dashboard"],
  {
    revalidate: 10,
    tags: ["superadmin-monitoring"]
  }
);

export default async function Page() {
  const superadmin = await getSuperAdminSessionUser("/superadmin");
  const data = await getCachedSuperAdminMonitoring();
  return (
    <SuperAdminDashboardPage
      {...data}
      superAdminName={superadmin.name}
      serverNow={new Date().toISOString()}
    />
  );
}
