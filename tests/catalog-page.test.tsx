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
});
