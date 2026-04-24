import { AdminBlacklistDetailPage } from "@/components/pages/admin-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { getAdminBlacklistByUserId } from "@/lib/services/admin-blacklist.service";

export default async function Page({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { unitId } = await getAdminUnitPageContext();
  const entry = await getAdminBlacklistByUserId(unitId, userId);

  return <AdminBlacklistDetailPage entry={entry} userId={userId} />;
}
