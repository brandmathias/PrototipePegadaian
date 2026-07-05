import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { BuyerShell } from "@/components/layout/buyer-shell";

const navigationMock = vi.hoisted(() => ({
  pathname: "/transaksi",
  search: "",
}));

const BUYER_VIEWER_CACHE_KEY = "pegadaian:buyer-nav-viewer:v1";

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(navigationMock.search)
}));

describe("BuyerShell", () => {
  beforeEach(() => {
    navigationMock.pathname = "/transaksi";
    navigationMock.search = "";
    window.sessionStorage.clear();
  });

  it("renders buyer summary details from provided database-backed summary", async () => {
    const { container } = render(
      <BuyerShell
        buyer={{
          id: "buyer-001",
          name: "Raras Maheswari",
          email: "raras@example.com",
          role: "buyer",
          phoneNumber: null
        }}
        description="Ringkasan akun pembeli."
        summary={{
          memberSince: "29 April 2026",
          wishlistCount: 2,
          blacklist: {
            active: true,
            until: "5 Mei 2026",
            reason: "Akun dibatasi sementara.",
            violations: 2
          }
        }}
        title="Akun Pembeli"
      >
        <div>Konten akun</div>
      </BuyerShell>
    );

    expect(screen.getByRole("link", { name: /ruang agunan/i })).toHaveAttribute("href", "/dashboard");
    expect(container.querySelector(".buyer-experience-root")).toBeInTheDocument();
    expect(container.querySelector("main.buyer-motion-main")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Beranda" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Katalog" })).toHaveAttribute("href", "/katalog");
    expect(screen.getByRole("link", { name: "Transaksi" })).toHaveAttribute("href", "/transaksi");
    expect(screen.getByRole("link", { name: "Pelanggaran" })).toHaveAttribute("href", "/pelanggaran");
    expect(screen.getByRole("link", { name: "Pusat Bantuan" })).toHaveAttribute("href", "/bantuan");
    expect(screen.getByRole("link", { name: "Buka Beranda" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Buka Katalog" })).toHaveAttribute("href", "/katalog");
    expect(screen.getByRole("link", { name: "Buka Transaksi" })).toHaveAttribute("href", "/transaksi");
    expect(screen.getByRole("link", { name: "Buka Pelanggaran" })).toHaveAttribute("href", "/pelanggaran");
    expect(screen.getByRole("link", { name: "Buka Pusat Bantuan" })).toHaveAttribute("href", "/bantuan");
    expect(screen.getByRole("link", { name: /wishlist, 2 barang disukai/i })).toHaveAttribute("href", "/wishlist");
    expect(screen.queryByText(/ruang pembeli/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/member sejak 29 april 2026/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/blacklist aktif sampai 5 mei 2026/i)).not.toBeInTheDocument();
    expect(screen.getByText("Konten akun")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^keluar$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /raras maheswari/i }));

    const menu = screen.getByRole("menu");
    expect(menu).toHaveClass("z-[90]");
    expect(menu).toHaveClass("max-h-[calc(100dvh-7rem)]");
    expect(menu).toHaveClass("overflow-y-auto");
    expect(screen.getByRole("menuitem", { name: /profil/i })).toHaveAttribute("href", "/profil");
    expect(screen.getByRole("menuitem", { name: /keluar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(window.sessionStorage.getItem(BUYER_VIEWER_CACHE_KEY)).toContain("Raras Maheswari");
    });
  });

  it.each([
    {
      currentPath: "/transaksi",
      expected: "Beranda",
      pathname: "/dashboard",
      stale: "Transaksi",
    },
    {
      currentPath: "/dashboard",
      expected: "Katalog",
      pathname: "/katalog/barang-1",
      stale: "Beranda",
    },
    {
      currentPath: "/dashboard",
      expected: "Transaksi",
      pathname: "/transaksi/transaksi-1",
      stale: "Beranda",
    },
    {
      currentPath: "/transaksi",
      expected: "Pelanggaran",
      pathname: "/pelanggaran",
      stale: "Transaksi",
    },
    {
      currentPath: "/dashboard",
      expected: "Pusat Bantuan",
      pathname: "/bantuan",
      stale: "Beranda",
    },
    {
      currentPath: "/dashboard",
      expected: "Transaksi",
      pathname: "/riwayat-bid/lelang-1/verifikasi",
      stale: "Beranda",
    },
  ])(
    "uses the live buyer route $pathname instead of stale server path $currentPath",
    ({ currentPath, expected, pathname, stale }) => {
      navigationMock.pathname = pathname;

      render(
        <BuyerShell
          buyer={{
            id: "buyer-001",
            name: "Raras Maheswari",
            email: "raras@example.com",
            role: "buyer",
            phoneNumber: null,
          }}
          currentPath={currentPath}
          description="Ringkasan akun pembeli."
          summary={{
            memberSince: "29 April 2026",
            wishlistCount: 0,
            blacklist: {
              active: false,
              until: "-",
            },
          }}
          title="Akun Pembeli"
        >
          <div>Konten akun</div>
        </BuyerShell>,
      );

      expect(screen.getByRole("link", { name: expected })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(screen.getByRole("link", { name: stale })).not.toHaveAttribute(
        "aria-current",
      );
    },
  );
});
