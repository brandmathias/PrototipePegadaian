import { fireEvent, render, screen } from "@testing-library/react";

import { BuyerHelpCenterPage } from "@/components/buyer/help-center-page";

describe("BuyerHelpCenterPage", () => {
  it("renders the buyer help center with compact white layout content", () => {
    const { container } = render(<BuyerHelpCenterPage />);

    expect(container.querySelector(".full-bleed-safe")).toHaveClass("bg-white");
    expect(screen.getByRole("heading", { name: "Pusat Bantuan Ruang Agunan" })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Cari solusi, panduan lelang, atau aturan pembatasan...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /kenapa fitur penawaran \(bidding\) saya terkunci dan bagaimana memulihkannya/i
      })
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/masih ada bid aktif pada Lelang Tertutup lain/i)).toBeInTheDocument();
    expect(screen.getByText(/Masih butuh konfirmasi lanjutan/i)).toBeInTheDocument();
  });

  it("states the real level 2 fixed-price restriction from the system rules", () => {
    render(<BuyerHelpCenterPage />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /akun saya dibatasi Level 2, apakah saya masih bisa membeli barang Harga Tetap/i
      })
    );

    expect(screen.getByText(/Tidak\. Pada Level 2/i)).toBeInTheDocument();
    expect(screen.getByText(/membatasi transaksi baru/i)).toBeInTheDocument();
    expect(screen.getByText(/pembelian Harga Tetap/i)).toBeInTheDocument();
    expect(screen.queryByText(/masih dapat membeli barang Harga Tetap pada Level 2/i)).not.toBeInTheDocument();
  });

  it("filters FAQ content through the search field and shows an empty state", () => {
    render(<BuyerHelpCenterPage />);

    const search = screen.getByPlaceholderText("Cari solusi, panduan lelang, atau aturan pembatasan...");
    fireEvent.change(search, { target: { value: "Level 2" } });

    expect(
      screen.getByRole("button", {
        name: /akun saya dibatasi Level 2, apakah saya masih bisa membeli barang Harga Tetap/i
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /apakah saya tetap bisa mengambil fisik barang yang sudah saya lunasi/i
      })
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "tidak ada kata kunci seperti ini" } });

    expect(screen.getByText("Tidak ada hasil bantuan")).toBeInTheDocument();
  });
});
