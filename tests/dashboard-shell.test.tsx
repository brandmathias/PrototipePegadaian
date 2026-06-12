import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

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

const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  {
    href: "/admin/barang",
    label: "Kelola Barang",
    icon: "barang"
  },
  { href: "/admin/blacklist", label: "Pelanggaran", icon: "blacklist" },
  { href: "/admin/barang/riwayat", label: "Riwayat Barang", icon: "rekening" }
];

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
