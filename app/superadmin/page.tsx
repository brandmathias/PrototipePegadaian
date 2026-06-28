import { SuperAdminDashboardPage } from "@/components/pages/superadmin-pages.lazy";
import { getSuperAdminMonitoring } from "@/lib/services/monitoring.service";
import { getSuperAdminSessionUser } from "@/lib/auth/session";

export default async function Page() {
  const superadmin = await getSuperAdminSessionUser("/superadmin");
  const data = await getSuperAdminMonitoring();
  return (
    <SuperAdminDashboardPage
      {...data}
      superAdminName={superadmin.name}
      serverNow={new Date().toISOString()}
    />
  );
}
