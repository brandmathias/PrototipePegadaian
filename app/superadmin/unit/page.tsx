import { SuperAdminUnitsPage } from "@/components/pages/superadmin-pages";
import { listUnits } from "@/lib/services/unit.service";

export default async function Page() {
  const units = await listUnits();
  return <SuperAdminUnitsPage units={units} />;
}
