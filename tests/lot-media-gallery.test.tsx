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

  it("opens a fullscreen preview from the top-right media control without showing a 360 label", () => {
    render(
      <LotMediaGallery
        allowFullscreen
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
        variant="pdp"
      />
    );

    expect(screen.queryByText(/360\s*view/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /buka preview penuh media barang/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByAltText(/preview penuh kalung emas foto 1/i)).toBeInTheDocument();
  });

  it("prioritizes the PDP hero image while keeping video thumbnails previewable", () => {
    render(
      <LotMediaGallery
        category="Perhiasan"
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
        priority
        title="Kalung Emas"
        variant="pdp"
      />
    );

    const activeImage = within(screen.getByTestId("lot-media-active")).getByRole("img", {
      name: "Kalung Emas foto 1"
    });
    expect(activeImage).toHaveAttribute("fetchpriority", "high");
    expect(activeImage).toHaveAttribute("loading", "eager");

    const firstThumbnail = within(screen.getByRole("button", { name: /lihat foto 1/i })).getByRole("img", {
      name: "Kalung Emas foto 1"
    });
    expect(firstThumbnail).toHaveAttribute("sizes", "(min-width: 1280px) 9vw, (min-width: 640px) 18vw, 33vw");

    const videoThumbnail = within(screen.getByRole("button", { name: /lihat video 2/i })).getByLabelText(
      "Kalung Emas video 2"
    );
    expect(videoThumbnail).toHaveAttribute("preload", "metadata");
  });
});
