import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  resolveViolationItemImageUrl,
  resolveViolationItemMedia,
} from "@/lib/blacklist/violation-item-media";
import type { ViolationItemMedia } from "@/lib/blacklist/violation-item-media";

describe("resolveViolationItemImageUrl", () => {
  it.each([
    "lib/services/blacklist.service.ts",
    "lib/services/admin-blacklist.service.ts",
  ])("uses the single-photo selector for violation images in %s", (servicePath) => {
    const source = readFileSync(resolve(process.cwd(), servicePath), "utf8");

    expect(source).toContain("imageUrl: primaryViolationPhotoUrl()");
    expect(source).toContain("imageFileName: primaryViolationPhotoFileName()");
  });

  it("uses the single-photo selector for buyer violation history", () => {
    const source = readFileSync(resolve(process.cwd(), "lib/services/buyer.service.ts"), "utf8");
    const historySource = source.slice(
      source.indexOf("async function listBuyerViolationHistory"),
      source.indexOf("async function getBuyerViolationLevelForTransaction"),
    );

    expect(historySource).toContain("imageUrl: primaryBarangPhotoUrl()");
  });

  it("keeps database media authoritative", () => {
    expect(
      resolveViolationItemImageUrl({
        databaseUrl: "/uploads/barang/foto-asli.webp",
        itemName: "Kalung Emas Rantai Singapura 22K",
      }),
    ).toBe("/uploads/barang/foto-asli.webp");
  });

  it.each([
    [
      "Kalung Emas Rantai Singapura 22K",
      "/media/violation-items/kalung-emas-rantai-singapura-22k.webp",
    ],
    [
      "cincin emas solitaire 22k",
      "/media/violation-items/cincin-emas-solitaire-22k.webp",
    ],
    [
      "  Gelang Emas Bangle Polos 22K  ",
      "/media/violation-items/gelang-emas-bangle-polos-22k.webp",
    ],
  ])("resolves the known historical item %s", (itemName, expected) => {
    expect(
      resolveViolationItemImageUrl({ databaseUrl: null, itemName }),
    ).toBe(expected);
  });

  it("does not invent media for unknown goods", () => {
    expect(
      resolveViolationItemImageUrl({
        databaseUrl: null,
        itemName: "Barang lain",
      }),
    ).toBeNull();
  });

  it("creates the same fallback photo for historical marketing when media is empty", () => {
    expect(
      resolveViolationItemMedia({
        itemName: "Kalung Emas Rantai Singapura 22K",
        media: [],
      }),
    ).toEqual([
      {
        fileName: "Kalung Emas Rantai Singapura 22K",
        id: "violation-fallback-kalung-emas-rantai-singapura-22k",
        type: "foto",
        url: "/media/violation-items/kalung-emas-rantai-singapura-22k.webp",
      },
    ]);
  });

  it("keeps existing marketing media unchanged", () => {
    const media: ViolationItemMedia[] = [
      {
        fileName: "foto-asli.webp",
        id: "media-asli",
        type: "foto",
        url: "/uploads/barang/foto-asli.webp",
      },
    ];

    expect(
      resolveViolationItemMedia({
        itemName: "Kalung Emas Rantai Singapura 22K",
        media,
      }),
    ).toEqual(media);
  });
});
