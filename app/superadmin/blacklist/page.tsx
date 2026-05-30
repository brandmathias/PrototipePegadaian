import { SuperAdminBlacklistPage } from "@/components/pages/superadmin-pages";
import { listSuperadminBlacklistReviewCases } from "@/lib/services/blacklist-review.service";
import { listBlacklists } from "@/lib/services/blacklist.service";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [entries, reviewCases] = await Promise.all([
    listBlacklists(),
    listSuperadminBlacklistReviewCases(),
  ]);

  return (
    <SuperAdminBlacklistPage
      entries={entries}
      reviewCases={reviewCases}
      serverNow={new Date().toISOString()}
    />
  );
}
