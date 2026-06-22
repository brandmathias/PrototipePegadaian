import { eq } from "drizzle-orm";

import { AdminMarketingUnifiedPage } from "@/components/pages/admin-marketing-pages.lazy";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { db } from "@/lib/db/client";
import { units } from "@/lib/db/schema";
import { listAdminPemasaran } from "@/lib/services/admin-pemasaran.service";
import { getPublicCatalogUnitMetrics } from "@/lib/services/public-catalog.service";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const [auctions, unitRows, catalogMetrics] = await Promise.all([
    listAdminPemasaran(unitId),
    db.select({ name: units.name }).from(units).where(eq(units.id, unitId)).limit(1),
    getPublicCatalogUnitMetrics(unitId)
  ]);
  const unitName = unitRows[0]?.name ?? "Unit aktif";

  return (
    <AdminMarketingUnifiedPage
      auctions={auctions}
      catalogMetrics={catalogMetrics}
      unitName={unitName}
    />
  );
}
