import { SuperAdminAdminsPage } from "@/components/pages/superadmin-pages";
import { listAdminUnits } from "@/lib/services/admin-unit.service";
import { listUnits } from "@/lib/services/unit.service";

export default async function Page() {
  const [admins, units] = await Promise.all([listAdminUnits(), listUnits()]);

  return (
    <SuperAdminAdminsPage
      admins={admins}
      units={units.map((unit) => ({ id: unit.id, name: unit.name, code: unit.code }))}
    />
  );
}
