import type { ReactNode } from "react";

import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import { getAdminSessionUser, getAppPathFromRequestHeaders } from "@/lib/auth/session";

const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/barang", label: "Kelola Barang", icon: "barang" },
  { href: "/admin/lelang", label: "Pantau Penjualan", icon: "lelang" },
  { href: "/admin/transaksi", label: "Pembayaran", icon: "transaksi" },
  { href: "/admin/blacklist", label: "Pelanggaran", icon: "blacklist" },
  { href: "/admin/profil", label: "Profil", icon: "profil" }
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const currentPath = await getAppPathFromRequestHeaders();
  const currentUser = await getAdminSessionUser(currentPath);

  return (
    <DashboardShell
      currentUser={currentUser}
      profileHref="/admin/profil"
      subtitle="Pusat kendali operasional unit"
      title="Admin Unit Manado"
      nav={nav}
    >
      {children}
    </DashboardShell>
  );
}
