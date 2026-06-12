import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WishlistPage } from "@/components/pages/wishlist-page";
import type { BuyerWishlistItem } from "@/lib/contracts/wishlist";

const router = vi.hoisted(() => ({
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router
}));

function makeWishlistItem(overrides: Partial<BuyerWishlistItem> = {}): BuyerWishlistItem {
  return {
    likedAt: "26 Mei 2026, 19.30 WITA",
    isAvailable: true,
    lot: {
      id: "lot-fixed-1",
      code: "BRG-55154818",
      name: "Cincin Emas 2",
      category: "Emas & Perhiasan",
      mode: "fixed_price",
      price: 10000000,
      location: "Manado",
      unitName: "UPC Ranotana",
      city: "Manado",
      condition: "Baik",
      status: "Tersedia",
      description: "Cincin emas premium.",
      media: [
        {
          id: "media-1",
          type: "foto",
          url: "/uploads/barang/cincin.jpg",
          fileName: "cincin.jpg"
        }
      ],
      specs: [
        { label: "Kategori", value: "Emas & Perhiasan" },
        { label: "Kondisi", value: "Baik" }
      ]
    },
    ...overrides
  };
}

describe("WishlistPage", () => {
  beforeEach(() => {
    router.refresh.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ favorited: false }), {
            headers: { "Content-Type": "application/json" },
            status: 200
          })
        )
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders available wishlist items with buyer actions and unavailable items separately", () => {
    render(
      <WishlistPage
        activeItems={[
          makeWishlistItem(),
          makeWishlistItem({
            likedAt: "26 Mei 2026, 20.10 WITA",
            lot: {
              ...makeWishlistItem().lot,
              id: "lot-vickrey-1",
              name: "Kalung Emas 2",
              mode: "vickrey",
              price: 14999998,
              endsAt: "2026-05-28T07:37:00.000Z"
            }
          })
        ]}
        unavailableItems={[
          makeWishlistItem({
            isAvailable: false,
            likedAt: "25 Mei 2026, 12.00 WITA",
            unavailableReason: "Barang sudah tidak tersedia",
            lot: {
              ...makeWishlistItem().lot,
              id: "lot-archived-1",
              name: "Liontin Emas Lama",
              status: "Tidak tersedia"
            }
          })
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: /^wishlist$/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /urut/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /semua barang/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /harga tetap/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lelang tertutup/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tampilan grid/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tampilan daftar/i })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /kategori/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /kondisi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /lokasi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /^harga$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /masih tersedia/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /tidak tersedia/i })).not.toBeInTheDocument();
    expect(screen.getByText("Cincin Emas 2")).toBeInTheDocument();
    expect(screen.getByText("Kalung Emas 2")).toBeInTheDocument();
    expect(screen.queryByText("Liontin Emas Lama")).not.toBeInTheDocument();
    expect(screen.queryByText(/barang sudah tidak tersedia/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bagikan wishlist/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/arsip/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Hapus dari disukai").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /beli sekarang cincin emas 2/i })).toHaveAttribute(
      "href",
      "/katalog/lot-fixed-1"
    );
    expect(screen.getByRole("link", { name: /ikut lelang kalung emas 2/i })).toHaveAttribute(
      "href",
      "/katalog/lot-vickrey-1"
    );
  });

  it("removes a liked item from the wishlist when the heart button is clicked", async () => {
    render(<WishlistPage activeItems={[makeWishlistItem()]} unavailableItems={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /hapus suka cincin emas 2/i }));

    await waitFor(() => {
      expect(screen.queryByText("Cincin Emas 2")).not.toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith("/api/user/wishlist/lot-fixed-1", {
      method: "DELETE"
    });
    expect(router.refresh).toHaveBeenCalled();
  });

  it("renders a composed empty state when the buyer has not liked any item yet", () => {
    render(<WishlistPage activeItems={[]} unavailableItems={[]} />);

    expect(screen.getByRole("heading", { name: /belum ada barang disukai/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /jelajahi katalog/i })).toHaveAttribute("href", "/katalog");
  });
});
