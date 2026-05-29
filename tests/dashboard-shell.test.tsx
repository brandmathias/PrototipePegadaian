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

  it("toggles dark and light mode from the header", () => {
    navigationMock.pathname = "/admin";

    renderShell();

    const notificationButton = screen.getByRole("button", { name: /notifikasi/i });
    const darkModeButton = screen.getByRole("button", { name: /aktifkan mode gelap/i });
    expect(notificationButton.compareDocumentPosition(darkModeButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    fireEvent.click(darkModeButton);

    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(window.localStorage.getItem("pegadaian:admin-theme")).toBe("dark");

    const lightModeButton = screen.getByRole("button", { name: /aktifkan mode terang/i });
    expect(lightModeButton).toHaveAttribute("aria-pressed", "true");
    expect(lightModeButton).toHaveAttribute("data-theme-switching", "true");
    fireEvent.click(lightModeButton);

    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(window.localStorage.getItem("pegadaian:admin-theme")).toBe("light");
  });
});
