import { SuperAdminAccountWorkspace } from "@/components/superadmin/superadmin-account-workspace";
import { getSuperAdminSessionUser } from "@/lib/auth/session";
import { listSuperAdminAccounts } from "@/lib/services/superadmin-account.service";

export default async function Page() {
  const currentUser = await getSuperAdminSessionUser("/superadmin/manajemen-superadmin");
  const data = await listSuperAdminAccounts(currentUser.id);

  return <SuperAdminAccountWorkspace data={data} />;
}
