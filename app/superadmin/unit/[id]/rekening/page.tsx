import { SuperAdminUnitAccountsPage } from "@/components/pages/superadmin-pages.lazy";
import { getUnitById } from "@/lib/services/unit.service";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const unit = await getUnitById(id);
    return <SuperAdminUnitAccountsPage unit={unit} />;
  } catch {
    return <SuperAdminUnitAccountsPage unit={null} />;
  }
}
