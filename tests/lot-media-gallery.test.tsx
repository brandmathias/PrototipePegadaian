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

  it("renders object storage photo URLs directly for the active media and thumbnails", () => {
    const firstPhotoUrl = "https://pub-example.r2.dev/barang/liontin-1.jpg";
    const secondPhotoUrl = "https://pub-example.r2.dev/barang/liontin-2.jpg";

    render(
      <LotMediaGallery
        category="Perhiasan"
        title="Liontin Remote"
        media={[
          {
            id: "remote-photo-1",
            type: "foto",
            url: firstPhotoUrl,
            fileName: "liontin-1.jpg"
          },
          {
            id: "remote-photo-2",
            type: "foto",
            url: secondPhotoUrl,
            fileName: "liontin-2.jpg"
          }
        ]}
      />
    );

    const activeImage = within(screen.getByTestId("lot-media-active")).getByRole("img", {
      name: "Liontin Remote foto 1"
    });
    const secondThumbnail = screen.getByRole("img", { name: "Liontin Remote foto 2" });

    expect(activeImage).toHaveAttribute("src", firstPhotoUrl);
    expect(activeImage).not.toHaveAttribute("srcset");
    expect(secondThumbnail).toHaveAttribute("src", secondPhotoUrl);
    expect(secondThumbnail).not.toHaveAttribute("srcset");
  });
});
