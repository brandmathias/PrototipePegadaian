import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAppPathFromRequestHeaders, getSuperAdminSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/superadmin", label: "Dashboard Nasional", icon: "dashboard" as const },
  { href: "/superadmin/blacklist", label: "Pelanggaran", icon: "blacklist" as const },
  { href: "/superadmin/monitoring-unit", label: "Monitoring Unit", icon: "monitoring" as const },
  { href: "/superadmin/manajemen-unit", label: "Manajemen Unit", icon: "unit" as const },
  { href: "/superadmin/manajemen-superadmin", label: "Manajemen Superadmin", icon: "superadmin" as const },
  { href: "/superadmin/kebijakan-pelanggaran", label: "Kebijakan Pelanggaran", icon: "admin" as const }
];

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const currentPath = await getAppPathFromRequestHeaders();
  const currentUser = await getSuperAdminSessionUser(currentPath);

  return (
    <DashboardShell
      currentUser={currentUser}
      forceWhiteShell
      profileHref="/superadmin/profil"
      showHeaderSearch={false}
      subtitle="Control Center Lintas Unit"
      title="Superadmin Nasional"
      nav={nav}
    >
      {children}
    </DashboardShell>
  );
}
