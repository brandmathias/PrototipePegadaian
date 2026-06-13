import { SuperAdminBlacklistPage } from "@/components/pages/superadmin-pages";
import { listBlacklists } from "@/lib/services/blacklist.service";

export const dynamic = "force-dynamic";

export default async function Page() {
  const entries = await listBlacklists();

  return (
    <SuperAdminBlacklistPage
      entries={entries}
      serverNow={new Date().toISOString()}
    />
  );
}
