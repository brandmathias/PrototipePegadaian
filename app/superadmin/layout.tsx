import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAppPathFromRequestHeaders, getSuperAdminSessionUser } from "@/lib/auth/session";

const nav = [
  { href: "/superadmin", label: "Dashboard Global", icon: "dashboard" as const },
  { href: "/superadmin/unit", label: "Unit & Rekening", icon: "unit" as const },
  { href: "/superadmin/admin", label: "Admin Unit", icon: "admin" as const },
  { href: "/superadmin/monitoring", label: "Monitoring Nasional", icon: "monitoring" as const },
  { href: "/superadmin/blacklist", label: "Blacklist Global", icon: "blacklist" as const }
];

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const currentPath = await getAppPathFromRequestHeaders();
  const currentUser = await getSuperAdminSessionUser(currentPath);

  return (
    <DashboardShell
      currentUser={currentUser}
      profileHref="/superadmin/admin"
      subtitle="Control center lintas unit"
      title="Superadmin Nasional"
      nav={nav}
    >
      {children}
    </DashboardShell>
  );
}
