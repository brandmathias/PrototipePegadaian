import { SuperAdminUnitDetailPage } from "@/components/pages/superadmin-pages.lazy";
import { getUnitById } from "@/lib/services/unit.service";
import { unstable_cache } from "next/cache";

const getCachedUnitById = unstable_cache(
  async (unitId: string) => getUnitById(unitId),
  ["superadmin-unit-detail"],
  {
    revalidate: 5,
    tags: ["superadmin-unit-detail"],
  },
);

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const unit = await getCachedUnitById(id);
    return <SuperAdminUnitDetailPage unit={unit} />;
  } catch (error) {
    if (error instanceof Error && error.message !== "Unit belum ditemukan.") {
      throw error;
    }

    return <SuperAdminUnitDetailPage unit={null} />;
  }
}
