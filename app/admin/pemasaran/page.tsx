import { eq } from "drizzle-orm";

import { AdminMarketingUnifiedPage } from "@/components/pages/admin-marketing-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { db } from "@/lib/db/client";
import { units } from "@/lib/db/schema";
import { listAdminPemasaran } from "@/lib/services/admin-pemasaran.service";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const [auctions, unitRows] = await Promise.all([
    listAdminPemasaran(unitId),
    db.select({ name: units.name }).from(units).where(eq(units.id, unitId)).limit(1)
  ]);
  const unitName = unitRows[0]?.name ?? "Unit aktif";

  return <AdminMarketingUnifiedPage auctions={auctions} unitName={unitName} />;
}
