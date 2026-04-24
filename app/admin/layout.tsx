import type { ReactNode } from "react";
import { eq } from "drizzle-orm";

import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import { getAdminSessionUser, getAppPathFromRequestHeaders } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { units } from "@/lib/db/schema";

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
  const [unit] = currentUser.unitId
    ? await db.select().from(units).where(eq(units.id, currentUser.unitId)).limit(1)
    : [];

  return (
    <DashboardShell
      currentUser={currentUser}
      profileHref="/admin/profil"
      subtitle="Pusat kendali operasional unit"
      title={unit?.name ?? "Admin Unit"}
      nav={nav}
    >
      {children}
    </DashboardShell>
  );
}
