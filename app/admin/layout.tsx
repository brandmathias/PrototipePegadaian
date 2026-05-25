import type { ReactNode } from "react";
import { eq } from "drizzle-orm";

import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import { getAdminSessionUser, getAppPathFromRequestHeaders } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { units } from "@/lib/db/schema";
import { listAdminBarang } from "@/lib/services/admin-barang.service";
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
    icon: "lelang",
    children: [
      { href: "/admin/pemasaran/fixed-price", label: "Fixed Price", icon: "shopping" },
      { href: "/admin/pemasaran/vickrey-auction", label: "Vickrey Auction", icon: "lelang" }
    ]
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

function daysUntil(dateLabel: string | null | undefined) {
  if (!dateLabel || dateLabel === "-") return null;

  const date = new Date(`${dateLabel}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const targetUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  return Math.ceil((targetUtc - todayUtc) / 86_400_000);
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const currentPath = await getAppPathFromRequestHeaders();
  const currentUser = await getAdminSessionUser(currentPath);
  const [unit] = currentUser.unitId
    ? await db.select().from(units).where(eq(units.id, currentUser.unitId)).limit(1)
    : [];
  const [items, transactions] = currentUser.unitId
    ? await Promise.all([
        listAdminBarang(currentUser.unitId),
        listAdminTransactions(currentUser.unitId)
      ])
    : [[], []];
  const dueSoonCount = items.filter((item) => {
    const days = daysUntil(item.dueDate);
    return days !== null && days >= 0 && days <= 7 && ["JAMINAN", "GADAI"].includes(item.status);
  }).length;
  const actionItemCount = items.filter((item) => {
    const days = daysUntil(item.dueDate);
    return item.status === "GAGAL" || item.status === "JAMINAN" || (days !== null && days >= 0 && days <= 7);
  }).length;
  const activeMarketingCount = items.filter((item) => item.status === "DIPASARKAN").length;
  const transactionActionCount = transactions.filter((transaction) =>
    ["BUKTI_DIUNGGAH", "MENUNGGU_KONFIRMASI_LANGSUNG"].includes(transaction.status)
  ).length;
  const nav = baseNav.map((item) => {
    if (item.href === "/admin/barang") {
      return { ...item, badge: actionItemCount, badgeTone: dueSoonCount > 0 ? "warning" : "default" } satisfies NavItem;
    }
    if (item.href === "/admin/pemasaran") {
      return { ...item, badge: activeMarketingCount, badgeTone: "default" } satisfies NavItem;
    }
    if (item.href === "/admin/transaksi") {
      return { ...item, badge: transactionActionCount, badgeTone: transactionActionCount > 0 ? "warning" : "default" } satisfies NavItem;
    }
    return item;
  });

  return (
    <DashboardShell
      currentUser={currentUser}
      profileHref="/admin/profil"
      quickActions={[
        { href: "/admin/barang/tambah", label: "Tambah Barang", icon: "barang" },
        { href: "/admin/barang/riwayat", label: "Riwayat Barang", icon: "rekening" },
        { href: "/admin/transaksi/verifikasi-pembayaran", label: "Verifikasi Bayar", icon: "transaksi" }
      ]}
      showHeaderSearch={false}
      sidebarMetrics={[
        { label: "Total Barang", value: items.length },
        { label: "Perlu Tindakan", value: actionItemCount, tone: actionItemCount > 0 ? "warning" : "default" },
        { label: "Jatuh Tempo Dekat", value: dueSoonCount, tone: dueSoonCount > 0 ? "danger" : "default" }
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
