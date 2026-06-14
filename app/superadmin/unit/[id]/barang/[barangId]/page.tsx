import { SuperAdminUnitBarangDetailPage } from "@/components/pages/superadmin-pages.lazy";
import { getSuperAdminUnitBarangDetail } from "@/lib/services/unit.service";

export default async function Page({
  params
}: {
  params: Promise<{ id: string; barangId: string }>;
}) {
  const { barangId, id } = await params;

  try {
    const detail = await getSuperAdminUnitBarangDetail(id, barangId);
    return <SuperAdminUnitBarangDetailPage detail={detail} />;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message !== "Unit belum ditemukan." &&
      error.message !== "Barang tidak ditemukan pada unit ini." &&
      error.message !== "Barang tidak ditemukan di unit Anda."
    ) {
      throw error;
    }

    return <SuperAdminUnitBarangDetailPage detail={null} />;
  }
}
