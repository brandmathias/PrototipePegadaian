import { unstable_cache } from "next/cache";

import { SuperAdminUnitBarangDetailPage } from "@/components/pages/superadmin-unit-barang-detail-page";
import { getSuperAdminUnitBarangDetail } from "@/lib/services/unit.service";

const getCachedSuperAdminUnitBarangDetail = unstable_cache(
  (unitId: string, barangId: string) => getSuperAdminUnitBarangDetail(unitId, barangId),
  ["superadmin-unit-barang-detail"],
  { revalidate: 5, tags: ["superadmin-unit-barang-detail"] },
);

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string; barangId: string }>;
  searchParams?: Promise<{ iteration?: string | string[] }>;
}) {
  const [{ barangId, id }, query] = await Promise.all([params, searchParams]);
  const initialMarketingIterationId = Array.isArray(query?.iteration)
    ? query.iteration[0]
    : query?.iteration;

  try {
    const detail = await getCachedSuperAdminUnitBarangDetail(id, barangId);
    return (
      <SuperAdminUnitBarangDetailPage
        detail={detail}
        initialMarketingIterationId={initialMarketingIterationId}
      />
    );
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
