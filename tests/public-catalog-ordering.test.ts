import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/client", () => ({ db: {} }));

import { sortPublicCatalogRowsByLatestListing } from "@/lib/services/public-catalog.service";

describe("public catalog listing order", () => {
  it("keeps a rejected fixed-price relist in its original catalog position", () => {
    const rows = sortPublicCatalogRowsByLatestListing([
      {
        marketingCreatedAt: new Date("2026-07-01T08:00:00.000Z"),
        marketingId: "fixed-legacy",
        marketingIteration: 1,
        marketingMode: "fixed_price"
      },
      {
        marketingCreatedAt: new Date("2026-07-24T08:02:00.000Z"),
        marketingId: "vickrey-new",
        marketingIteration: 1,
        marketingMode: "vickrey"
      },
      {
        marketingCreatedAt: new Date("2026-07-01T08:00:00.000Z"),
        marketingId: "fixed-relisted-after-rejected-payment",
        marketingIteration: 2,
        marketingMode: "fixed_price"
      }
    ]);

    expect(rows.map((row) => row.marketingId)).toEqual([
      "vickrey-new",
      "fixed-relisted-after-rejected-payment",
      "fixed-legacy"
    ]);
  });
});
