import type { ReactNode } from "react";
import { eq } from "drizzle-orm";

import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import {
  getAdminInventoryMetrics,
  isAdminMarketingActionable
} from "@/lib/admin-unit/operational-metrics";
import { getAdminSessionUser, getAppPathFromRequestHeaders } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { units } from "@/lib/db/schema";
import { listAdminBarang } from "@/lib/services/admin-barang.service";
import { listAdminPemasaran } from "@/lib/services/admin-pemasaran.service";
import { formatAppDateTime } from "@/lib/timezone";

const baseNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  {
    href: "/admin/barang",
    label: "Kelola Barang",
    icon: "barang"
  },
  {
    href: "/admin/pemasaran",
    label: "Pemasaran",
    icon: "marketing"
  },
  { href: "/admin/blacklist", label: "Pelanggaran", icon: "blacklist" },
  { href: "/admin/barang/riwayat", label: "Riwayat Barang", icon: "rekening" }
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const currentPath = await getAppPathFromRequestHeaders();
  const isDashboardRoute = currentPath === "/admin";
  const currentUser = await getAdminSessionUser(currentPath);
  const [unit] = currentUser.unitId
    ? await db.select().from(units).where(eq(units.id, currentUser.unitId)).limit(1)
    : [];
  const [items, marketingSessions] = currentUser.unitId
    ? await Promise.all([
        listAdminBarang(currentUser.unitId),
        listAdminPemasaran(currentUser.unitId)
      ])
    : [[], []];
  const inventoryMetrics = getAdminInventoryMetrics(items);
  const marketingActionCount = marketingSessions.filter((session) => isAdminMarketingActionable(session)).length;
  const nav = baseNav.map((item) => {
    if (item.href === "/admin/barang") {
      return {
        ...item,
        badge: inventoryMetrics.dueSoon || undefined,
        badgeTone: inventoryMetrics.dueSoon > 0 ? "warning" : "default"
      } satisfies NavItem;
    }
    if (item.href === "/admin/pemasaran") {
      return {
        ...item,
        badge: marketingActionCount || undefined,
        badgeTone: marketingActionCount > 0 ? "warning" : "default"
      } satisfies NavItem;
    }
    return item;
  });

  return (
    <DashboardShell
      currentUser={currentUser}
      headerBrandLabel={isDashboardRoute ? null : "Pegadaian Lelang"}
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
