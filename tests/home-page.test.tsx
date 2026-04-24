import React from "react";
import { render, screen } from "@testing-library/react";

import { HomePage } from "@/components/pages/home-page";

describe("HomePage", () => {
  it("renders the premium hero and featured auction preview", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /jelajahi barang jaminan/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /jelajahi katalog/i })
    ).toHaveAttribute("href", "/katalog");
    expect(
      screen.getByRole("heading", { name: /cuplikan barang/i })
    ).toBeInTheDocument();
  });
});
