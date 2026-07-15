import { describe, expect, it } from "vitest";

import { resolveViolationItemImageUrl } from "@/lib/blacklist/violation-item-media";

describe("resolveViolationItemImageUrl", () => {
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
});
