import React from "react";
import { render, screen } from "@testing-library/react";

import { HomePage } from "@/components/pages/home-page";

describe("HomePage", () => {
  it("renders the premium hero and featured auction preview from provided data", () => {
    render(
      <HomePage
        featuredLots={[
          {
            id: "mk-001",
            code: "LOT-001",
            name: "Kalung Uji Database",
            category: "Perhiasan",
            mode: "fixed_price",
            price: 1500000,
            location: "Makassar",
            unitName: "Pegadaian Makassar",
            city: "Makassar",
            condition: "Baik",
            status: "Tersedia",
            description: "Lot uji dari service database.",
            specs: [{ label: "Kategori", value: "Perhiasan" }]
          }
        ]}
        stats={[
          { label: "Barang dipasarkan", value: "1" },
          { label: "Unit aktif", value: "1" },
          { label: "Lelang aktif", value: "0" },
          { label: "Transaksi lunas", value: "0" }
        ]}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: /jelajahi barang jaminan/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Barang dipasarkan")).toBeInTheDocument();
    expect(screen.getByText("Kalung Uji Database")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /jelajahi katalog/i })
    ).toHaveAttribute("href", "/katalog");
    expect(
      screen.getByRole("heading", { name: /cuplikan barang/i })
    ).toBeInTheDocument();
  });
});
