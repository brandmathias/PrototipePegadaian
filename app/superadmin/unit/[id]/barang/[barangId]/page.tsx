import { unstable_cache } from "next/cache";

import { SuperAdminUnitBarangDetailPage } from "@/components/pages/superadmin-unit-barang-detail-page";
import { getSuperAdminUnitBarangDetail } from "@/lib/services/unit.service";

const getCachedSuperAdminUnitBarangDetail = unstable_cache(
  (unitId: string, barangId: string) => getSuperAdminUnitBarangDetail(unitId, barangId),
  ["superadmin-unit-barang-detail"],
  { revalidate: 5, tags: ["superadmin-unit-barang-detail"] },
);

export default async function Page({
  params
}: {
  params: Promise<{ id: string; barangId: string }>;
}) {
  const { barangId, id } = await params;

  try {
    const detail = await getCachedSuperAdminUnitBarangDetail(id, barangId);
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
