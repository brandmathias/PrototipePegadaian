import { AdminBlacklistPage } from "@/components/pages/admin-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { listAdminBlacklist } from "@/lib/services/admin-blacklist.service";
import { listAdminBlacklistReviewCases } from "@/lib/services/blacklist-review.service";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const [entries, reviewCases] = await Promise.all([
    listAdminBlacklist(unitId),
    listAdminBlacklistReviewCases(unitId),
  ]);

  return <AdminBlacklistPage entries={entries} reviewCases={reviewCases} />;
}
