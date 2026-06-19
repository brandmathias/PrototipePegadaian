import { SuperAdminManagementUnitDetailPage } from "@/components/pages/superadmin-pages.lazy";
import { getUnitById } from "@/lib/services/unit.service";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const unit = await getUnitById(id);
    return <SuperAdminManagementUnitDetailPage unit={unit} />;
  } catch (error) {
    if (error instanceof Error && error.message !== "Unit belum ditemukan.") {
      throw error;
    }

    return <SuperAdminManagementUnitDetailPage unit={null} />;
  }
}
