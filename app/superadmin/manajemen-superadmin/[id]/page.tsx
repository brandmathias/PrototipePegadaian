import { notFound } from "next/navigation";

import { SuperAdminAccountDetailWorkspace } from "@/components/superadmin/superadmin-account-workspace";
import { getSuperAdminSessionUser } from "@/lib/auth/session";
import { listSuperAdminAccounts } from "@/lib/services/superadmin-account.service";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getSuperAdminSessionUser(`/superadmin/manajemen-superadmin/${id}`);
  const data = await listSuperAdminAccounts(currentUser.id);
  const account = data.accounts.find((item) => item.id === id);

  if (!account) {
    notFound();
  }

  return <SuperAdminAccountDetailWorkspace account={account} audit={data.audit} currentUser={data.currentUser} />;
}
