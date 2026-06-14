import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { LotMediaGallery } from "@/components/shared/lot-media-gallery";

describe("LotMediaGallery", () => {
  it("switches the main media when a thumbnail is clicked", () => {
    render(
      <LotMediaGallery
        category="Perhiasan"
        title="Kalung Emas"
        media={[
          {
            id: "media-photo-1",
            type: "foto",
            url: "/uploads/barang/foto-1.jpg",
            fileName: "foto-1.jpg"
          },
          {
            id: "media-video-1",
            type: "video",
            url: "/uploads/barang/video-1.mp4",
            fileName: "video-1.mp4"
          },
          {
            id: "media-photo-2",
            type: "foto",
            url: "/uploads/barang/foto-2.jpg",
            fileName: "foto-2.jpg"
          }
        ]}
      />
    );

    expect(
      within(screen.getByTestId("lot-media-active")).getByRole("img", { name: "Kalung Emas foto 1" })
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("lot-media-active")).getByRole("img", { name: "Kalung Emas foto 1" }).className
    ).toContain("object-cover");

    fireEvent.click(screen.getByRole("button", { name: /lihat video 2/i }));
    expect(
      within(screen.getByTestId("lot-media-active")).getByLabelText("Kalung Emas video 2")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("lot-media-active")).getByLabelText("Kalung Emas video 2").className
    ).toContain("object-cover");

    fireEvent.click(screen.getByRole("button", { name: /lihat foto 3/i }));
    expect(
      within(screen.getByTestId("lot-media-active")).getByRole("img", { name: "Kalung Emas foto 3" })
    ).toBeInTheDocument();
  });

  it("opens the active media in a fullscreen preview", () => {
    render(
      <LotMediaGallery
        category="Perhiasan"
        title="Kalung Emas"
        media={[
          {
            id: "media-photo-1",
            type: "foto",
            url: "/uploads/barang/foto-1.jpg",
            fileName: "foto-1.jpg"
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /buka media layar penuh/i }));

    const dialog = screen.getByRole("dialog", { name: /kalung emas preview layar penuh/i });
    expect(within(dialog).getByRole("img", { name: "Kalung Emas foto 1" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /tutup preview media/i }));

    expect(screen.queryByRole("dialog", { name: /kalung emas preview layar penuh/i })).not.toBeInTheDocument();
  });

  it("can open fullscreen from an existing external trigger", () => {
    render(
      <>
        <LotMediaGallery
          category="Perhiasan"
          fullscreenTriggerId="existing-fullscreen-trigger"
          showInlineFullscreenButton={false}
          title="Kalung Emas"
          media={[
            {
              id: "media-photo-1",
              type: "foto",
              url: "/uploads/barang/foto-1.jpg",
              fileName: "foto-1.jpg"
            }
          ]}
        />
        <button id="existing-fullscreen-trigger" type="button">
          Perbesar media barang
        </button>
      </>
    );

    expect(screen.queryByRole("button", { name: /buka media layar penuh/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /perbesar media barang/i }));

    expect(screen.getByRole("dialog", { name: /kalung emas preview layar penuh/i })).toBeInTheDocument();
  });

  it("uses compact mobile sizes for product detail thumbnails", () => {
    render(
      <LotMediaGallery
        category="Perhiasan"
        title="Kalung Emas"
        variant="pdp"
        media={[
          {
            id: "media-photo-1",
            type: "foto",
            url: "/uploads/barang/foto-1.jpg",
            fileName: "foto-1.jpg"
          },
          {
            id: "media-photo-2",
            type: "foto",
            url: "/uploads/barang/foto-2.jpg",
            fileName: "foto-2.jpg"
          },
          {
            id: "media-photo-3",
            type: "foto",
            url: "/uploads/barang/foto-3.jpg",
            fileName: "foto-3.jpg"
          }
        ]}
      />
    );

    const secondThumbnail = screen.getByRole("button", { name: /lihat foto 2/i }).querySelector("img");

    expect(secondThumbnail).toHaveAttribute(
      "sizes",
      "(min-width: 1280px) 9vw, (min-width: 640px) 18vw, 30vw"
    );
  });
});
