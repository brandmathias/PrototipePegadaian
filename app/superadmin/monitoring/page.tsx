import { SuperAdminMonitoringPage } from "@/components/pages/superadmin-pages";
import { getSuperAdminMonitoring } from "@/lib/services/monitoring.service";

export default async function Page() {
  const data = await getSuperAdminMonitoring();
  return <SuperAdminMonitoringPage data={data} />;
}
