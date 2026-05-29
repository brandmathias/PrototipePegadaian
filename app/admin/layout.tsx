import type { ReactNode } from "react";
import { eq } from "drizzle-orm";

import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import {
  getAdminInventoryMetrics,
  isAdminMarketingActionable,
  isAdminTransactionActionable
} from "@/lib/admin-unit/operational-metrics";
import { getAdminSessionUser, getAppPathFromRequestHeaders } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { units } from "@/lib/db/schema";
import { listAdminBarang } from "@/lib/services/admin-barang.service";
import { listAdminPemasaran } from "@/lib/services/admin-pemasaran.service";
import { listAdminTransactions } from "@/lib/services/admin-transaction.service";
import { formatAppDateTime } from "@/lib/timezone";

const baseNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  {
    href: "/admin/barang",
    label: "Kelola Barang",
    icon: "barang",
    children: [
      { href: "/admin/barang", label: "Daftar Barang", icon: "barang" },
      { href: "/admin/barang/riwayat", label: "Riwayat Barang", icon: "rekening" }
    ]
  },
  {
    href: "/admin/pemasaran",
    label: "Pemasaran",
    icon: "marketing"
  },
  {
    href: "/admin/transaksi",
    label: "Transaksi",
    icon: "transaksi",
    children: [
      { href: "/admin/transaksi/verifikasi-pembayaran", label: "Verifikasi Pembayaran", icon: "transaksi" },
      { href: "/admin/transaksi/riwayat", label: "Riwayat", icon: "rekening" }
    ]
  },
  { href: "/admin/blacklist", label: "Pelanggaran", icon: "blacklist" }
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const currentPath = await getAppPathFromRequestHeaders();
  const isDashboardRoute = currentPath === "/admin";
  const currentUser = await getAdminSessionUser(currentPath);
  const [unit] = currentUser.unitId
    ? await db.select().from(units).where(eq(units.id, currentUser.unitId)).limit(1)
    : [];
  const [items, marketingSessions, transactions] = currentUser.unitId
    ? await Promise.all([
        listAdminBarang(currentUser.unitId),
        listAdminPemasaran(currentUser.unitId),
        listAdminTransactions(currentUser.unitId)
      ])
    : [[], [], []];
  const inventoryMetrics = getAdminInventoryMetrics(items);
  const marketingActionCount = marketingSessions.filter((session) => isAdminMarketingActionable(session)).length;
  const transactionActionCount = transactions.filter(isAdminTransactionActionable).length;
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
    if (item.href === "/admin/transaksi") {
      return {
        ...item,
        badge: transactionActionCount || undefined,
        badgeTone: transactionActionCount > 0 ? "warning" : "default"
      } satisfies NavItem;
    }
    return item;
  });

  return (
    <DashboardShell
      currentUser={currentUser}
      headerBrandLabel={isDashboardRoute ? null : "Pegadaian Lelang"}
      headerLead={isDashboardRoute ? "Selamat pagi," : undefined}
      headerSubtitle={isDashboardRoute ? undefined : "Pusat kendali operasional unit"}
      headerTitle={isDashboardRoute ? "Admin Eksekutif" : unit?.name ?? "Admin Unit"}
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
