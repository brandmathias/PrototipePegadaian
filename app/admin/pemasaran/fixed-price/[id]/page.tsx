import { notFound } from "next/navigation";

import { AdminFixedPriceDetailPage } from "@/components/pages/admin-marketing-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { getAdminPemasaranById } from "@/lib/services/admin-pemasaran.service";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { unitId } = await getAdminUnitPageContext();
  const auction = await getAdminPemasaranById(unitId, id);

  if (auction.mode !== "FIXED_PRICE") {
    notFound();
  }

  return <AdminFixedPriceDetailPage auction={auction} />;
}
