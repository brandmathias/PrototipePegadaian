import React from "react";
import { render, screen } from "@testing-library/react";

import { CatalogPage } from "@/components/pages/catalog-page";

describe("CatalogPage", () => {
  it("shows filters, sort controls, and auction cards", () => {
    render(<CatalogPage />);

    expect(screen.getByText(/filter katalog/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /semua/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /urutkan/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /lihat detail/i }).length).toBeGreaterThan(2);
  });
});
