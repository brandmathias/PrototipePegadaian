import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { CatalogHero } from "@/components/pages/catalog-hero";
import { CatalogPage } from "@/components/pages/catalog-page";
import type { Lot } from "@/lib/contracts/catalog";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/katalog",
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams("")
}));

describe("CatalogPage", () => {
  beforeEach(() => {
    router.push.mockClear();
    router.refresh.mockClear();
  });

  function makeLot(index: number, overrides: Partial<Lot> = {}): Lot {
    return {
      id: `lot-db-${index}`,
      code: `BRG-${String(index).padStart(4, "0")}`,
      name: `Barang Katalog ${index}`,
      category: index % 2 === 0 ? "Elektronik" : "Perhiasan",
      mode: index % 2 === 0 ? "vickrey" : "fixed_price",
      price: 5_000_000 + index * 1_000_000,
      location: index % 2 === 0 ? "UPC Bandung" : "UPC Jakarta Pusat",
      unitName: index % 2 === 0 ? "UPC Bandung" : "UPC Jakarta Pusat",
      domicile: index % 2 === 0 ? "Jawa Barat" : "DKI Jakarta",
      city: index % 2 === 0 ? "Bandung" : "Jakarta",
      condition: index % 3 === 0 ? "Bekas Like New" : "Baru",
      status: "Tersedia",
      description: "Data katalog dari database.",
      endsAt: new Date("2026-05-30T10:00:00+08:00").toISOString(),
      media: [
        {
          id: `media-${index}`,
          type: "foto" as const,
          url: `/uploads/barang/demo-${index}.jpg`,
          fileName: `demo-${index}.jpg`
        }
      ],
      specs: [
        { label: "Jenis", value: index % 2 === 0 ? "Laptop" : "Cincin" },
        { label: "Kondisi", value: index % 3 === 0 ? "Bekas Like New" : "Baru" }
      ],
      ...overrides
    };
  }

  it("renders the buyer catalog hero, filter rail, product stats, and premium cards", () => {
    render(
      <>
        <CatalogHero />
        <CatalogPage
          serverNow={new Date("2026-05-29T12:15:00+08:00").toISOString()}
          lots={[
            makeLot(1, { name: "Cincin Emas Berlian", category: "Perhiasan" }),
            makeLot(2, {
              name: "Laptop ASUS VivoBook 14",
              category: "Elektronik",
              mode: "vickrey",
              endsAt: new Date("2026-05-30T10:00:30+08:00").toISOString()
            })
          ]}
        />
      </>
    );

    expect(screen.getByText(/katalog premium/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /pilih cara pembelian yang tepat untuk anda/i })).toBeInTheDocument();
    expect(screen.getByTestId("catalog-hero-image").getAttribute("style")).toContain(
      "/assets/catalog-hero-buyer.webp"
    );
    expect(screen.getByTestId("catalog-hero-image").getAttribute("style")).toContain(
      "/assets/catalog-hero-buyer.png"
    );
    expect(screen.getAllByText("Harga Tetap")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Lelang Tertutup")[0]).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Filter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /semua mode/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /perhiasan/i })).toBeInTheDocument();
    expect(screen.getAllByText(/dilihat/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/suka/i)[0]).toBeInTheDocument();
    expect(screen.getByText("Harga")).toBeInTheDocument();
    expect(screen.getByText("Harga Dasar")).toBeInTheDocument();
    expect(screen.getByText(/peserta/i)).toBeInTheDocument();
    expect(screen.getAllByText("Pembayaran aman").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Penawaran tertutup").length).toBeGreaterThan(0);
    expect(screen.queryByText(/stok/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^foto\s+\d+/i)).not.toBeInTheDocument();
    expect(screen.getByText("21 jam 45 menit")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /lihat detail/i })).toHaveLength(2);
    const catalogImages = screen.getAllByRole("img");
    catalogImages.forEach((image) => {
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).not.toHaveAttribute("fetchpriority", "high");
    });
    catalogImages.forEach((image) => {
      expect(image).toHaveAttribute(
        "sizes",
        "(min-width: 1536px) 24vw, (min-width: 1280px) 23vw, (min-width: 1024px) 31vw, (min-width: 768px) 48vw, 100vw"
      );
    });
  });

  it("does not show auction countdowns on harga tetap lots even if stale endsAt data exists", () => {
    render(
      <CatalogPage
        lots={[
          {
            id: "lot-db-fixed",
            code: "LOT-FIXED",
            name: "Cincin Harga Tetap",
            category: "Perhiasan",
            mode: "fixed_price",
            price: 12500000,
            location: "Manado",
            unitName: "Pegadaian Manado",
            city: "Manado",
            condition: "Baik",
            status: "Tersedia",
            description: "Data harga tetap dari database.",
            endsAt: new Date("2026-05-05T10:00:00+08:00").toISOString(),
            media: [],
            specs: [{ label: "Kategori", value: "Perhiasan" }]
          }
        ]}
      />
    );

    expect(screen.getByText("Cincin Harga Tetap")).toBeInTheDocument();
    expect(screen.queryByText(/menunggu hasil/i)).not.toBeInTheDocument();
  });

  it("shows a clear unlike affordance on favorited catalog items", () => {
    render(
      <CatalogPage
        initialFavoriteIds={["lot-db-1"]}
        lots={[makeLot(1, { name: "Cincin Favorit" })]}
      />
    );

    expect(screen.getByRole("button", { name: /hapus suka cincin favorit/i })).toHaveAttribute(
      "title",
      "Hapus dari disukai"
    );
    expect(screen.getByText("Hapus dari disukai")).toBeInTheDocument();
  });

  it("redirects guest users to login before saving a catalog item to wishlist", () => {
    render(<CatalogPage lots={[makeLot(1, { name: "Cincin Guest" })]} wishlistSyncEnabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /sukai cincin guest/i }));

    expect(router.push).toHaveBeenCalledWith("/login?next=%2Fkatalog");
  });

  it("renders uploaded lot media instead of the category placeholder when media exists", () => {
    render(
      <CatalogPage
        lots={[
          {
            id: "lot-media",
            code: "LOT-MEDIA",
            name: "Kalung Dengan Foto",
            category: "Perhiasan",
            mode: "fixed_price",
            price: 12500000,
            location: "Manado",
            unitName: "Pegadaian Manado",
            city: "Manado",
            condition: "Baik",
            status: "Tersedia",
            description: "Data media berasal dari upload admin.",
            media: [
              {
                id: "media-1",
                type: "foto",
                url: "/uploads/barang/kalung.jpg",
                fileName: "kalung.jpg"
              }
            ],
            specs: [{ label: "Kategori", value: "Perhiasan" }]
          }
        ]}
      />
    );

    expect(screen.getByRole("img", { name: "Perhiasan foto utama" }).getAttribute("src")).toContain(
      "%2Fuploads%2Fbarang%2Fkalung.jpg"
    );
  });

  it("filters catalog items with the incoming buyer search query and visual mode controls", () => {
    render(
      <CatalogPage
        initialQuery="manado"
        lots={[
          {
            id: "lot-1",
            code: "LOT-1",
            name: "Kalung Emas",
            category: "Perhiasan",
            mode: "fixed_price",
            price: 100000000,
            location: "Ranotana",
            unitName: "UPC Ranotana",
            domicile: "Sulawesi Utara",
            city: "Manado",
            condition: "Baik",
            status: "Tersedia",
            description: "Barang emas premium.",
            media: [],
            specs: [{ label: "Kategori", value: "Perhiasan" }]
          },
          {
            id: "lot-2",
            code: "LOT-2",
            name: "Laptop Kantor",
            category: "Elektronik",
            mode: "fixed_price",
            price: 15000000,
            location: "Makassar",
            unitName: "UPC Makassar",
            domicile: "Sulawesi Selatan",
            city: "Makassar",
            condition: "Baik",
            status: "Tersedia",
            description: "Perangkat kerja.",
            media: [],
            specs: [{ label: "Kategori", value: "Elektronik" }]
          }
        ]}
      />
    );

    expect(screen.getByText("Kalung Emas")).toBeInTheDocument();
    expect(screen.queryByText("Laptop Kantor")).not.toBeInTheDocument();
    expect(screen.getByText(/pencarian: manado/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /lelang tertutup/i }));

    expect(screen.queryByText("Kalung Emas")).not.toBeInTheDocument();
    expect(screen.getByText(/belum ada barang sesuai filter/i)).toBeInTheDocument();
  });

  it("paginates catalog cards with twelve items per page", () => {
    render(<CatalogPage lots={Array.from({ length: 13 }, (_, index) => makeLot(index + 1))} />);

    expect(screen.getByText("Barang Katalog 1")).toBeInTheDocument();
    expect(screen.queryByText("Barang Katalog 13")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(screen.getByText("Barang Katalog 13")).toBeInTheDocument();
  });

  it("keeps card metadata tidy and shows only top units before expanding the unit list", () => {
    render(
      <CatalogPage
        lots={Array.from({ length: 6 }, (_, index) =>
          makeLot(index + 1, {
            unitName: `Unit Prioritas ${index + 1}`,
            location: `Unit Prioritas ${index + 1}`,
            category:
              index === 5
                ? "Kendaraan"
                : index === 4
                  ? "Logam Mulia"
                  : index % 2 === 0
                    ? "Elektronik"
                    : "Perhiasan"
          })
        )}
      />
    );

    expect(screen.getAllByText("Pembayaran aman").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Aturan transparan").length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText("0")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Tidak terbatas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tampilkan 2 lainnya/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /unit prioritas 5/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /tampilkan 2 lainnya/i }));

    expect(screen.getByRole("button", { name: /unit prioritas 5/i })).toBeInTheDocument();
  });

  it("filters catalog by domicile with searchable province options", () => {
    render(
      <CatalogPage
        lots={[
          makeLot(1, { name: "Cincin Jakarta", domicile: "DKI Jakarta" }),
          makeLot(2, { name: "Laptop Jakarta", domicile: "DKI Jakarta" }),
          makeLot(3, { name: "Emas Barat", domicile: "Jawa Barat" }),
          makeLot(4, { name: "Emas Timur", domicile: "Jawa Timur" }),
          makeLot(5, { name: "Emas Utara", domicile: "Sulawesi Utara" }),
          makeLot(6, { name: "Emas Bali", domicile: "Bali" }),
        ]}
      />
    );

    expect(screen.getByRole("button", { name: /dki jakarta/i })).toHaveTextContent("2");

    fireEvent.click(screen.getByRole("button", { name: /dki jakarta/i }));

    expect(screen.getByText("Cincin Jakarta")).toBeInTheDocument();
    expect(screen.getByText("Laptop Jakarta")).toBeInTheDocument();
    expect(screen.queryByText("Emas Barat")).not.toBeInTheDocument();
    expect(screen.getByText(/domisili: dki jakarta/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/cari domisili/i), { target: { value: "bali" } });

    expect(screen.getByRole("button", { name: /bali/i })).toBeInTheDocument();
  });

  it("supports buyer price filters up to 10000000000", () => {
    render(<CatalogPage lots={[makeLot(1)]} />);

    const maxInput = screen.getByPlaceholderText("Tidak terbatas");
    fireEvent.change(maxInput, { target: { value: "10000000000" } });

    expect(maxInput).toHaveValue("10.000.000.000");
  });

  it("keeps catalog CTA blocks visible and stable when cards have different tag counts", () => {
    render(
      <CatalogPage
        lots={[
          makeLot(1, {
            name: "Cincin Emas 3",
            mode: "fixed_price",
            category: "Perhiasan",
            condition: "Baik",
            specs: [{ label: "Jenis", value: "Cincin" }],
          }),
          makeLot(2, {
            name: "Cincin Emas 2",
            mode: "fixed_price",
            category: "Perhiasan",
            condition: "Baik",
            specs: [{ label: "Jenis", value: "Cincin" }],
          }),
        ]}
      />
    );

    expect(screen.getAllByText("Beli Sekarang")).toHaveLength(2);
    expect(screen.getAllByText("Harga")).toHaveLength(2);
  });
});
