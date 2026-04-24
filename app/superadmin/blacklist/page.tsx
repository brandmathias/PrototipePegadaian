import { SuperAdminBlacklistPage } from "@/components/pages/superadmin-pages";
import { listBlacklists } from "@/lib/services/blacklist.service";

export default async function Page() {
  const entries = await listBlacklists();
  return <SuperAdminBlacklistPage entries={entries} />;
}
