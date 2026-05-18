import React from "react";
import { render, screen } from "@testing-library/react";

import { CatalogPage } from "@/components/pages/catalog-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/katalog",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams("")
}));

describe("CatalogPage", () => {
  it("shows filters, sort controls, and categories derived from real lots", () => {
    render(
      <CatalogPage
        lots={[
          {
            id: "lot-db-001",
            code: "LOT-DB-001",
            name: "Emas Antam 5 Gram",
            category: "Logam Mulia",
            mode: "fixed_price",
            price: 7500000,
            location: "Makassar",
            unitName: "Pegadaian Makassar",
            city: "Makassar",
            condition: "Baik",
            status: "Tersedia",
            description: "Data katalog dari database.",
            media: [],
            specs: [{ label: "Kategori", value: "Logam Mulia" }]
          }
        ]}
      />
    );

    expect(screen.getByText(/pilih alur yang ingin anda ikuti/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /semua mode/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /urutkan/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logam Mulia" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Perhiasan" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lihat detail/i })).toBeInTheDocument();
  });

  it("does not show auction countdowns on fixed price lots even if stale endsAt data exists", () => {
    render(
      <CatalogPage
        lots={[
          {
            id: "lot-db-fixed",
            code: "LOT-FIXED",
            name: "Cincin Fixed Price",
            category: "Perhiasan",
            mode: "fixed_price",
            price: 12500000,
            location: "Manado",
            unitName: "Pegadaian Manado",
            city: "Manado",
            condition: "Baik",
            status: "Tersedia",
            description: "Data fixed price dari database.",
            endsAt: new Date("2026-05-05T10:00:00+08:00").toISOString(),
            media: [],
            specs: [{ label: "Kategori", value: "Perhiasan" }]
          }
        ]}
      />
    );

    expect(screen.getByText("Cincin Fixed Price")).toBeInTheDocument();
    expect(screen.queryByText(/sesi berakhir/i)).not.toBeInTheDocument();
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

  it("filters catalog items with the incoming buyer search query", () => {
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
    expect(screen.getByText(/keyword "manado" ikut dipakai/i)).toBeInTheDocument();
  });
});
