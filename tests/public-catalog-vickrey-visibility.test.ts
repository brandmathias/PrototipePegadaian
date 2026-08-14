import { beforeEach, describe, expect, it, vi } from "vitest";

type CatalogRow = {
  marketingId: string;
  marketingMode: string;
  marketingCreatedAt: Date;
  marketingIteration: number;
  endsAt: Date | null;
  itemId: string;
};

let queryResults: CatalogRow[][] = [];

function createQuery(rows: CatalogRow[]) {
  const query = {
    from: () => query,
    innerJoin: () => query,
    leftJoin: () => query,
    where: () => query,
    orderBy: () => query,
    limit: () => Promise.resolve(rows),
    then: <TResult1 = CatalogRow[], TResult2 = never>(
      onfulfilled?: ((value: CatalogRow[]) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) => Promise.resolve(rows).then(onfulfilled, onrejected)
  };

  return query;
}

vi.mock("@/lib/db/client", () => ({
  db: {
    select: vi.fn(() => createQuery(queryResults.shift() ?? []))
  }
}));

vi.mock("@/lib/buyer/serializers", () => ({
  serializePublicLot: vi.fn((row) => row)
}));

vi.mock("@/lib/services/public-lot-stats.service", () => ({
  getLotStatsByIds: vi.fn(async () => new Map())
}));

import { listPublicLots } from "@/lib/services/public-catalog.service";

describe("public Vickrey catalog visibility", () => {
  beforeEach(() => {
    queryResults = [
      [
        {
          marketingId: "expired-vickrey",
          marketingMode: "vickrey",
          marketingCreatedAt: new Date("2026-08-14T08:00:00.000Z"),
          marketingIteration: 1,
          endsAt: new Date("2026-08-14T08:55:00.000Z"),
          itemId: "expired-item"
        },
        {
          marketingId: "fixed-price",
          marketingMode: "fixed_price",
          marketingCreatedAt: new Date("2026-08-14T08:00:00.000Z"),
          marketingIteration: 1,
          endsAt: new Date("2026-08-14T08:55:00.000Z"),
          itemId: "fixed-price-item"
        }
      ],
      []
    ];
  });

  it("does not return an active Vickrey listing after its end time while retaining fixed-price listings", async () => {
    const lots = await listPublicLots();

    expect(lots.map((lot) => lot.marketingId)).toEqual(["fixed-price"]);
  });
});
