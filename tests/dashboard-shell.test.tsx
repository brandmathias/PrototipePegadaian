import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const navigationMock = vi.hoisted(() => ({
  pathname: "/admin"
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname
}));

vi.mock("@/components/ui/alert-center", () => ({
  AlertCenter: () => <button type="button">Notifikasi</button>
}));

const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  {
    href: "/admin/barang",
    label: "Kelola Barang",
    icon: "barang",
    children: [
      { href: "/admin/barang", label: "Daftar Barang", icon: "barang" },
      { href: "/admin/barang/riwayat", label: "Riwayat Barang", icon: "rekening" }
    ]
  }
];

function renderShell() {
  return render(
    <DashboardShell
      nav={nav}
      showHeaderSearch={false}
      subtitle="Pusat kendali operasional unit"
      title="UPC Ranotana"
    >
      <div>Konten admin</div>
    </DashboardShell>
  );
}

describe("DashboardShell", () => {
  it("keeps the active navigation group expanded", () => {
    navigationMock.pathname = "/admin/barang";

    renderShell();

    expect(screen.getByRole("link", { name: /daftar barang/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /riwayat barang/i })).toBeInTheDocument();
  });

  it("opens a navigation group when the pointer enters it", () => {
    navigationMock.pathname = "/admin";

    renderShell();

    expect(screen.queryByRole("button", { name: /submenu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /daftar barang/i })).not.toBeInTheDocument();

    const navGroup = screen.getByRole("link", { name: /kelola barang/i }).parentElement?.parentElement;
    expect(navGroup).toBeTruthy();

    fireEvent.mouseEnter(navGroup as HTMLElement);

    expect(screen.getByRole("link", { name: /daftar barang/i })).toBeInTheDocument();
  });
});
