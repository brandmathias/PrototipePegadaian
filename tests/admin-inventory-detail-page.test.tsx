import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { AdminInventoryDetailPage } from "@/components/pages/admin-pages";

const baseItem = {
  id: "barang-demo",
  code: "BRG-001",
  name: "Kalung Emas",
  category: "emas",
  appraisalValue: 10000000,
  loanValue: 7000000,
  pawnedAt: "2026-04-01",
  dueDate: "2026-05-01",
  mediaSummary: "2 media",
  status: "JAMINAN",
  description: "Lengkap",
  ownerName: "Nasabah Demo",
  customerNumber: "NAS-001",
  media: []
};

describe("AdminInventoryDetailPage", () => {
  it("keeps extension, redemption, marketing, and edit actions available before publishing", () => {
    render(<AdminInventoryDetailPage item={baseItem} />);

    expect(screen.getByRole("link", { name: /edit data barang/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /catat perpanjangan/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /catat penebusan/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pasarkan barang/i })).toBeInTheDocument();
    expect(screen.getByText(/riwayat kronologi aset/i)).toBeInTheDocument();
  });

  it("keeps failed auction barang editable before it is auctioned again", () => {
    render(
      <AdminInventoryDetailPage
        item={{
          ...baseItem,
          status: "GAGAL",
          marketingMode: "vickrey",
          marketingIteration: 2,
          nextAction: "Evaluasi harga dasar dan tayangkan ulang sebagai lelang."
        }}
      />
    );

    expect(screen.getAllByRole("link", { name: /edit data barang/i })).toHaveLength(1);
    expect(screen.getByRole("link", { name: /lelang lagi/i })).toBeInTheDocument();
  });

  it("switches additional media thumbnails into the main preview", () => {
    render(
      <AdminInventoryDetailPage
        item={{
          ...baseItem,
          media: [
            {
              id: "media-1",
              type: "image",
              url: "https://example.com/utama.jpg",
              fileName: "utama.jpg",
            },
            {
              id: "media-2",
              type: "image",
              url: "https://example.com/samping-1.jpg",
              fileName: "samping-1.jpg",
            },
            {
              id: "media-3",
              type: "image",
              url: "https://example.com/samping-2.jpg",
              fileName: "samping-2.jpg",
            },
          ],
        }}
      />
    );

    expect(
      within(screen.getByTestId("admin-detail-active-media")).getByRole("img", {
        name: /utama.jpg/i,
      })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /lihat media barang 2/i }));

    expect(
      within(screen.getByTestId("admin-detail-active-media")).getByRole("img", {
        name: /samping-1.jpg/i,
      })
    ).toBeInTheDocument();
  });

  it("renders video thumbnails with the real video source", () => {
    render(
      <AdminInventoryDetailPage
        item={{
          ...baseItem,
          media: [
            {
              id: "media-image",
              type: "image",
              url: "https://example.com/utama.jpg",
              fileName: "utama.jpg",
            },
            {
              id: "media-video",
              type: "video",
              url: "https://example.com/barang.mp4",
              fileName: "barang.mp4",
            },
          ],
        }}
      />
    );

    const thumbnailVideo = screen.getByLabelText(/thumbnail video kalung emas: barang\.mp4/i);
    expect(thumbnailVideo).toBeInTheDocument();
    expect(thumbnailVideo).toHaveAttribute("src", "https://example.com/barang.mp4");
  });

  it("opens video media in the fullscreen preview", () => {
    render(
      <AdminInventoryDetailPage
        item={{
          ...baseItem,
          media: [
            {
              id: "media-video",
              type: "video",
              url: "https://example.com/barang.mp4",
              fileName: "barang.mp4",
            },
          ],
        }}
      />
    );

    fireEvent.click(screen.getByLabelText(/buka preview penuh media barang/i));

    expect(screen.getByLabelText(/preview penuh video barang/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tutup preview media barang/i })).toBeInTheDocument();
  });
});
