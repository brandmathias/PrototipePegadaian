import type { ReactNode } from "react";
import { eq } from "drizzle-orm";

import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import { adminNavigation } from "@/components/layout/role-navigation";
import { BRAND_NAME } from "@/components/shared/brand";
import { getAdminSessionUser, getAppPathFromRequestHeaders } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { units } from "@/lib/db/schema";
import { getAdminLayoutMetrics } from "@/lib/services/admin-layout.service";
import { formatAppDateTime } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function isAdminReceiptRoute(path: string) {
  const pathname = path.split(/[?#]/, 1)[0] || path;

  return /^\/admin\/transaksi\/[^/]+\/nota\/?$/.test(pathname);
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const currentPath = await getAppPathFromRequestHeaders();
  const isDashboardRoute = currentPath === "/admin";
  const currentUser = await getAdminSessionUser(currentPath);

  if (isAdminReceiptRoute(currentPath)) {
    return <>{children}</>;
  }

  const [unit] = currentUser.unitId
    ? await db.select().from(units).where(eq(units.id, currentUser.unitId)).limit(1)
    : [];
  const { inventoryMetrics } = currentUser.unitId
    ? await getAdminLayoutMetrics(currentUser.unitId)
    : {
        inventoryMetrics: { dueSoon: 0, readyForMarketing: 0, total: 0 }
      };
  const nav = adminNavigation.map((item) => {
    if (item.href === "/admin/barang") {
      return {
        ...item,
        badge: inventoryMetrics.dueSoon || undefined,
        badgeTone: inventoryMetrics.dueSoon > 0 ? "warning" : "default"
      } satisfies NavItem;
    }
    return item;
  });

  return (
    <DashboardShell
      currentUser={currentUser}
      headerBrandLabel={isDashboardRoute ? null : BRAND_NAME}
      headerSubtitle="Pusat Kendali Operasional Unit"
      headerTitle={unit?.name ?? "Admin Unit"}
      hideHeaderIdentity={false}
      profileHref="/admin/profil"
      searchPlaceholder={isDashboardRoute ? "Cari data, pengguna, atau laporan..." : "Cari transaksi atau barang..."}
      searchShortcutHint={isDashboardRoute ? "Ctrl /" : undefined}
      showHeaderSearch={false}
      sidebarMetrics={[
        { label: "Total Barang", value: inventoryMetrics.total },
        { label: "Siap Dipasarkan", value: inventoryMetrics.readyForMarketing },
        {
          label: "Jatuh Tempo Dekat",
          value: inventoryMetrics.dueSoon,
          tone: inventoryMetrics.dueSoon > 0 ? "danger" : "default"
        }
      ]}
      sidebarUpdatedAt={formatAppDateTime(new Date())}
      subtitle="Pusat kendali operasional unit"
      title={unit?.name ?? "Admin Unit"}
      nav={nav}
    >
      {children}
    </DashboardShell>
  );
}
