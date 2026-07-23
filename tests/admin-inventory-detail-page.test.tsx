import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { AdminInventoryDetailPage } from "@/components/pages/admin-pages";

const baseItem = {
  id: "barang-demo",
  code: "BRG-001",
  name: "Kalung Emas",
  category: "emas",
  appraisalValue: 10000000,
  pawnedAt: "2026-04-01",
  dueDate: "2026-05-01",
  mediaSummary: "2 media",
  status: "JAMINAN",
  description: "Lengkap",
  ownerName: "Nasabah Demo",
  customerNumber: "0812111122222",
  media: [],
};

describe("AdminInventoryDetailPage", () => {
  it("keeps operational actions available before publishing without edit access", () => {
    render(<AdminInventoryDetailPage item={baseItem} />);

    expect(
      screen.queryByRole("link", { name: /edit data barang/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /perpanjang gadai/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /penebusan barang/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /pasarkan barang/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/riwayat kronologi aset/i)).toBeInTheDocument();
  });

  it("shows the marketing action as a disabled button until the precise due deadline has elapsed", () => {
    render(
      <AdminInventoryDetailPage
        item={{
          ...baseItem,
          dueAt: "2099-05-01T00:05:00.000Z",
          dueDateTime: "1 Mei 2099, 08.05"
        }}
      />,
    );

    expect(screen.queryByRole("link", { name: /pasarkan barang/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pasarkan barang/i })).toBeDisabled();
    expect(screen.queryByText(/menunggu jatuh tempo/i)).not.toBeInTheDocument();
  });

  it("keeps failed auction remarketing available without edit access", () => {
    render(
      <AdminInventoryDetailPage
        item={{
          ...baseItem,
          status: "GAGAL",
          marketingMode: "vickrey",
          marketingIteration: 2,
          nextAction:
            "Evaluasi harga dasar dan tayangkan ulang sebagai lelang.",
        }}
      />,
    );

    expect(
      screen.queryByRole("link", { name: /edit data barang/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /lelang lagi/i }),
    ).toBeInTheDocument();
  });

  it("keeps sold item data locked from edit access", () => {
    render(
      <AdminInventoryDetailPage item={{ ...baseItem, status: "TERJUAL" }} />,
    );

    expect(
      screen.queryByRole("link", { name: /edit data barang/i }),
    ).not.toBeInTheDocument();
  });

  it("shows asset chronology from first action to latest with internal actors", () => {
    render(
      <AdminInventoryDetailPage
        item={baseItem}
        history={[
          {
            id: "hist-latest",
            barangId: "barang-demo",
            actionLabel: "Gagal",
            actionKey: "gagal",
            note: "Pembayaran tidak selesai.",
            actorName: "Admin Verifikasi",
            createdAtLabel: "4 Jun 2026, 11.00 WIB",
          },
          {
            id: "hist-marketing",
            barangId: "barang-demo",
            actionLabel: "Dipasarkan",
            actionKey: "dipasarkan",
            note: "Barang dipublikasikan ke katalog.",
            actorName: "Admin Pemasaran",
            createdAtLabel: "3 Jun 2026, 10.00 WIB",
          },
          {
            id: "hist-first",
            barangId: "barang-demo",
            actionLabel: "Barang Masuk",
            actionKey: "input_baru",
            note: "Barang dicatat sebagai barang jaminan unit.",
            actorName: "Admin Input",
            createdAtLabel: "1 Jun 2026, 09.00 WIB",
          },
        ]}
      />,
    );

    const timeline = screen.getByRole("table").closest("section");

    expect(timeline).not.toBeNull();
    expect(timeline).toHaveTextContent("Riwayat Kronologi Aset");
    expect(timeline).toHaveTextContent("Aktor Internal:Admin Input");
    expect(timeline).toHaveTextContent("Aktor Internal:Admin Pemasaran");
    expect(timeline).toHaveTextContent("Aktor Internal:Admin Verifikasi");
    expect(timeline?.querySelector("table")).not.toBeNull();
    expect(timeline?.querySelector(".lucide-megaphone")).not.toBeNull();
    expect(timeline?.querySelector(".lucide-ban")).not.toBeNull();

    const timelineText = timeline?.textContent ?? "";
    expect(timelineText.indexOf("Barang Masuk")).toBeLessThan(
      timelineText.indexOf("Dipasarkan"),
    );
    expect(timelineText.indexOf("Dipasarkan")).toBeLessThan(
      timelineText.indexOf("Gagal"),
    );
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
      />,
    );

    expect(
      within(screen.getByTestId("admin-detail-active-media")).getByRole("img", {
        name: /utama.jpg/i,
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /lihat media barang 2/i }),
    );

    expect(
      within(screen.getByTestId("admin-detail-active-media")).getByRole("img", {
        name: /samping-1.jpg/i,
      }),
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
      />,
    );

    const thumbnailVideo = screen.getByLabelText(
      /thumbnail video kalung emas: barang\.mp4/i,
    );
    expect(thumbnailVideo).toBeInTheDocument();
    expect(thumbnailVideo).toHaveAttribute(
      "src",
      "https://example.com/barang.mp4",
    );
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
      />,
    );

    expect(screen.queryByText(/360\s*view/i)).not.toBeInTheDocument();
    fireEvent.click(
      screen.getAllByLabelText(/buka preview penuh media barang/i)[1],
    );

    expect(
      screen.getByLabelText(/preview penuh video barang/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tutup preview media barang/i }),
    ).toBeInTheDocument();
  });
});
