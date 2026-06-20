import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { superadminNavigation } from "@/components/layout/role-navigation";
import { getAppPathFromRequestHeaders, getSuperAdminSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function isSuperAdminReceiptRoute(path: string) {
  const pathname = path.split(/[?#]/, 1)[0] || path;

  return /^\/superadmin\/transaksi\/[^/]+\/nota\/?$/.test(pathname);
}

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const currentPath = await getAppPathFromRequestHeaders();
  const currentUser = await getSuperAdminSessionUser(currentPath);

  if (isSuperAdminReceiptRoute(currentPath)) {
    return <>{children}</>;
  }

  return (
    <DashboardShell
      currentUser={currentUser}
      forceWhiteShell
      profileHref="/superadmin/profil"
      showHeaderSearch={false}
      subtitle="Control Center Lintas Unit"
      title="Superadmin Nasional"
      nav={superadminNavigation}
    >
      {children}
    </DashboardShell>
  );
}
