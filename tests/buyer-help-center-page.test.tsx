import { fireEvent, render, screen } from "@testing-library/react";

import { BuyerHelpCenterPage } from "@/components/buyer/help-center-page";

describe("BuyerHelpCenterPage", () => {
  it("renders the buyer help center with compact white layout content", () => {
    const { container } = render(<BuyerHelpCenterPage />);

    expect(container.querySelector(".full-bleed-safe")).toHaveClass("bg-white");
    expect(screen.getByRole("heading", { name: "Pusat Bantuan Ruang Agunan" })).toBeInTheDocument();
    expect(screen.getByAltText("Ilustrasi pusat bantuan Ruang Agunan")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Cari solusi, panduan lelang, atau aturan pembatasan...")
    ).toBeInTheDocument();
    expect(container.querySelector('[data-help-rail="active"]')).toHaveClass("bg-primary");
    expect(container.querySelector('[data-help-card="active"]')).toHaveClass("border-t-amber-400");
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

  it("explains the auction flow, fixed price flow, and transaction disclaimer", () => {
    render(<BuyerHelpCenterPage />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /mengapa saya harus berani memasang penawaran tertinggi/i
      })
    );
    expect(screen.getByText(/sistem membantu menjaga harga akhir tetap fair dan proporsional/i)).toBeInTheDocument();
    expect(screen.queryByText(/diskon otomatis/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/penawaran tertinggi kedua/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /bagaimana mekanisme Lelang Tertutup/i }));
    expect(screen.getByText(/langsung di unit maksimal 24 jam/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /bagaimana alur pembelian barang Harga Tetap/i }));
    expect(screen.getByText(/unggah bukti pembayaran dan nomor referensi/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /disclaimer penting/i }));
    expect(screen.getByText(/Pembayaran harus dilakukan ke rekening unit yang ditampilkan sistem/i)).toBeInTheDocument();
  });

  it("keeps technical bidder censorship details out of buyer help content", () => {
    render(<BuyerHelpCenterPage />);

    expect(
      screen.queryByRole("button", {
        name: /mengapa nama penawar dan nominal penawaran disensor selama lelang/i
      })
    ).not.toBeInTheDocument();
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
