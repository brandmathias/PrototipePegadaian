import type { NavItem } from "@/components/layout/dashboard-shell";

export const adminNavigation: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  {
    href: "/admin/barang",
    label: "Kelola Barang",
    icon: "barang",
  },
  {
    href: "/admin/pemasaran",
    label: "Pemasaran",
    icon: "marketing",
    activePrefixes: ["/admin/lelang", "/admin/transaksi"],
  },
  { href: "/admin/blacklist", label: "Pelanggaran", icon: "blacklist" },
  {
    href: "/admin/barang/riwayat",
    label: "Riwayat Barang",
    icon: "rekening",
  },
];

export const superadminNavigation: NavItem[] = [
  {
    href: "/superadmin",
    label: "Dashboard Nasional",
    icon: "dashboard",
  },
  {
    href: "/superadmin/monitoring-unit",
    label: "Monitoring Unit",
    icon: "monitoring",
    activePrefixes: ["/superadmin/unit", "/superadmin/monitoring"],
  },
  {
    href: "/superadmin/manajemen-unit",
    label: "Manajemen Unit",
    icon: "unit",
    activePrefixes: ["/superadmin/admin"],
  },
  {
    href: "/superadmin/manajemen-superadmin",
    label: "Manajemen Superadmin",
    icon: "superadmin",
  },
  {
    href: "/superadmin/blacklist",
    label: "Pelanggaran User",
    icon: "blacklist",
  },
  {
    href: "/superadmin/kebijakan-pelanggaran",
    label: "Kebijakan Pelanggaran",
    icon: "admin",
  },
];
