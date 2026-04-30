import React from "react";
import { render, screen } from "@testing-library/react";

import { CatalogPage } from "@/components/pages/catalog-page";

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
            specs: [{ label: "Kategori", value: "Logam Mulia" }]
          }
        ]}
      />
    );

    expect(screen.getByText(/pilih alur yang ingin anda ikuti/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /semua mode/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /urutkan/i })).toBeInTheDocument();
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
            specs: [{ label: "Kategori", value: "Perhiasan" }]
          }
        ]}
      />
    );

    expect(screen.getByText("Cincin Fixed Price")).toBeInTheDocument();
    expect(screen.queryByText(/sesi berakhir/i)).not.toBeInTheDocument();
  });
});
