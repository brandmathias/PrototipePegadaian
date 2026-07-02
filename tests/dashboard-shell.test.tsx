import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import {
  adminNavigation,
  superadminNavigation,
} from "@/components/layout/role-navigation";

const navigationMock = vi.hoisted(() => ({
  pathname: "/admin"
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

vi.mock("@/components/ui/alert-center", () => ({
  AlertCenter: () => <button type="button">Notifikasi</button>
}));

const nav = adminNavigation;

const groupedNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  {
    href: "/admin/operasional",
    label: "Operasional",
    icon: "barang",
    children: [
      { href: "/admin/operasional/daftar", label: "Daftar Operasional", icon: "barang" }
    ]
  }
];

function renderShell(items: NavItem[] = nav) {
  return render(
    <DashboardShell
      nav={items}
      showHeaderSearch={false}
      subtitle="Pusat kendali operasional unit"
      title="UPC Ranotana"
    >
      <div>Konten admin</div>
    </DashboardShell>
  );
}

describe("DashboardShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
  });

  it.each([
    ["admin unit", adminNavigation],
    ["superadmin", superadminNavigation]
  ])("uses optimized brand delivery in the %s shell", (_role, navigation) => {
    renderShell(navigation);

    const brandImages = screen.getByRole("img", { name: /ruang agunan/i }).querySelectorAll("img");
    expect(brandImages).toHaveLength(2);
    brandImages.forEach((image) => {
      expect(image).toHaveAttribute("loading", "eager");
      expect(image).not.toHaveAttribute("sizes");
    });
    expect(brandImages[0]).toHaveAttribute("fetchpriority", "low");
    expect(brandImages[1]).toHaveAttribute("fetchpriority", "high");
    expect(brandImages[0]).toHaveAttribute("width", "40");
    expect(brandImages[1]).toHaveAttribute("width", "118");
  });

  it("keeps kelola barang as a direct inventory link", () => {
    navigationMock.pathname = "/admin/barang";

    renderShell();

    expect(screen.getByRole("link", { name: /kelola barang/i })).toHaveAttribute("href", "/admin/barang");
    expect(screen.queryByRole("link", { name: /daftar barang/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /riwayat barang/i })).toBeInTheDocument();
  });

  it("keeps standalone riwayat barang outside the kelola barang group", () => {
    navigationMock.pathname = "/admin/barang/riwayat";

    renderShell();

    expect(screen.getByRole("link", { name: /riwayat barang/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /daftar barang/i })).not.toBeInTheDocument();
  });

  it.each([
    ["/admin", "Dashboard"],
    ["/admin/barang/barang-1", "Kelola Barang"],
    ["/admin/barang/riwayat", "Riwayat Barang"],
    ["/admin/pemasaran/vickrey-auction/lelang-1", "Pemasaran"],
    ["/admin/lelang/lelang-1", "Pemasaran"],
    ["/admin/transaksi/riwayat", "Pemasaran"],
    ["/admin/transaksi/transaksi-1/nota", "Pemasaran"],
    ["/admin/blacklist/buyer-1", "Pelanggaran"],
  ])("marks exactly one admin sidebar item for route %s", (pathname, expectedLabel) => {
    navigationMock.pathname = pathname;

    renderShell();

    const activeLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");

    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]).toHaveAccessibleName(expectedLabel);
  });

  it.each([
    ["/superadmin", "Dashboard Nasional"],
    ["/superadmin/blacklist/detail/buyer-1", "Pelanggaran User"],
    ["/superadmin/monitoring-unit", "Monitoring Unit"],
    ["/superadmin/monitoring", "Monitoring Unit"],
    ["/superadmin/unit/unit-1", "Monitoring Unit"],
    ["/superadmin/manajemen-unit/unit-1", "Manajemen Unit"],
    ["/superadmin/admin", "Manajemen Unit"],
    ["/superadmin/manajemen-superadmin/admin-1", "Manajemen Superadmin"],
    ["/superadmin/kebijakan-pelanggaran", "Kebijakan Pelanggaran"],
  ])("marks exactly one superadmin sidebar item for route %s", (pathname, expectedLabel) => {
    navigationMock.pathname = pathname;

    renderShell(superadminNavigation);

    const activeLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");

    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]).toHaveAccessibleName(expectedLabel);
  });

  it("places Pelanggaran User immediately before Kebijakan Pelanggaran", () => {
    const labels = superadminNavigation.map((item) => item.label);

    expect(labels.slice(-2)).toEqual([
      "Pelanggaran User",
      "Kebijakan Pelanggaran",
    ]);
  });

  it("uses a white admin shell background on every admin route", () => {
    navigationMock.pathname = "/admin/pemasaran";

    const { container } = renderShell();
    const shell = container.querySelector("[data-admin-shell]");

    expect(shell).toHaveClass("bg-white");
    expect(shell).not.toHaveClass("bg-[#efefed]");
    expect(container.querySelector("header")).toHaveClass("bg-white/95");
  });

  it("opens a navigation group when the pointer enters it", () => {
    navigationMock.pathname = "/admin";

    renderShell(groupedNav);

    expect(screen.queryByRole("button", { name: /submenu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /daftar operasional/i })).not.toBeInTheDocument();

    const navGroup = screen.getByRole("link", { name: /operasional/i }).parentElement?.parentElement;
    expect(navGroup).toBeTruthy();

    fireEvent.mouseEnter(navGroup as HTMLElement);

    expect(screen.getByRole("link", { name: /daftar operasional/i })).toBeInTheDocument();
  });

  it("removes the light and dark mode toggle from the admin header", () => {
    navigationMock.pathname = "/admin";

    const { container } = renderShell();
    const shell = container.querySelector("[data-admin-shell]");
    expect(shell).toBeTruthy();
    expect(shell).toHaveAttribute("data-admin-theme", "light");
    expect((shell as HTMLElement).style.colorScheme).toBe("light");

    const notificationButton = screen.getByRole("button", { name: /notifikasi/i });
    expect(notificationButton).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /aktifkan mode gelap/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /aktifkan mode terang/i })).not.toBeInTheDocument();
  });

  it("keeps the admin unit sidebar free from the old unit summary card", () => {
    navigationMock.pathname = "/admin";

    render(
      <DashboardShell
        currentUser={{ name: "Admin Unit", role: "admin_unit" }}
        nav={nav}
        showHeaderSearch={false}
        sidebarMetrics={[
          { label: "Total Barang", value: 9 },
          { label: "Siap Dipasarkan", value: 9 }
        ]}
        sidebarUpdatedAt="20 Jun 2026, 14.19 WIB"
        subtitle="Pusat kendali operasional unit"
        title="UPC Ranotana"
      >
        <div>Konten admin</div>
      </DashboardShell>
    );

    expect(screen.queryByText(/ringkasan unit/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/total barang/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/data per/i)).not.toBeInTheDocument();
  });

  it("does not render the office vector in admin unit and superadmin sidebars", () => {
    navigationMock.pathname = "/admin";

    const { container, rerender } = render(
      <DashboardShell
        currentUser={{ name: "Admin Unit", role: "admin_unit" }}
        nav={nav}
        showHeaderSearch={false}
        subtitle="Pusat kendali operasional unit"
        title="UPC Ranotana"
      >
        <div>Konten admin</div>
      </DashboardShell>
    );

    expect(container.querySelector('[style*="Sidebar"]')).not.toBeInTheDocument();

    navigationMock.pathname = "/superadmin";
    rerender(
      <DashboardShell
        currentUser={{ name: "Superadmin", role: "super_admin" }}
        nav={[{ href: "/superadmin", label: "Dashboard Global", icon: "dashboard" }]}
        showHeaderSearch={false}
        subtitle="Control center lintas unit"
        title="Superadmin Nasional"
      >
        <div>Konten superadmin</div>
      </DashboardShell>
    );

    expect(container.querySelector('[style*="Sidebar"]')).not.toBeInTheDocument();
  });

  it("uses the same profile dropdown for superadmin accounts", () => {
    navigationMock.pathname = "/superadmin";

    render(
      <DashboardShell
        currentUser={{
          image: null,
          name: "Super Admin Demo",
          role: "super_admin"
        }}
        nav={[{ href: "/superadmin", label: "Dashboard Global", icon: "dashboard" }]}
        profileHref="/superadmin/profil"
        showHeaderSearch={false}
        subtitle="Control center lintas unit"
        title="Superadmin Nasional"
      >
        <div>Konten superadmin</div>
      </DashboardShell>
    );

    fireEvent.click(screen.getByRole("button", { name: /super admin demo/i }));

    const menu = screen.getByRole("menu");
    expect(menu).toHaveClass("z-[90]");
    expect(menu).toHaveClass("max-h-[calc(100dvh-7rem)]");
    expect(menu).toHaveClass("overflow-y-auto");
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /profil/i })).toHaveAttribute("href", "/superadmin/profil");
    expect(screen.getByRole("menuitem", { name: /bantuan/i })).toHaveAttribute("href", "/superadmin/profil#panduan");
    expect(screen.getByRole("menuitem", { name: /keluar/i })).toBeInTheDocument();
  });

  it("cleans legacy global dark mode so buyer routes are not affected after leaving admin", () => {
    navigationMock.pathname = "/admin";
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";

    const { unmount } = renderShell();

    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("");

    unmount();

    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("");
  });
});
