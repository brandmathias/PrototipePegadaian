import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    delete: vi.fn(),
    insert: vi.fn(),
    select: vi.fn()
  };
  const revalidateTag = vi.fn();

  return { db, revalidateTag };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag
}));

vi.mock("@/lib/buyer/serializers", () => ({
  serializePublicLot: vi.fn((row) => ({
    id: row.marketingId,
    name: row.itemName,
    mode: row.marketingMode,
    price: Number(row.marketingPrice ?? 0),
    status: row.status,
    media: [],
    specs: []
  }))
}));

vi.mock("@/lib/services/public-lot-stats.service", () => ({
  getLotStatsByIds: vi.fn(async () => new Map())
}));

vi.mock("@/lib/services/public-catalog.service", () => ({
  publicCatalogVisibilityConditions: vi.fn(() => undefined)
}));

import {
  getBuyerWishlistCount,
  getBuyerWishlistIds,
  isBuyerWishlistItem,
  listBuyerWishlist,
  toggleBuyerWishlist
} from "@/lib/services/wishlist.service";

function mockSelectRows(rows: unknown[]) {
  const query = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
    then: <TResult1 = unknown[], TResult2 = never>(
      onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) => Promise.resolve(rows).then(onfulfilled, onrejected)
  };

  mocks.db.select.mockReturnValueOnce(query);
  return query;
}

function makeWishlistRow(overrides: Record<string, unknown> = {}) {
  return {
    wishlistCreatedAt: new Date("2026-09-05T05:00:00.000Z"),
    marketingId: "pm-visible",
    marketingMode: "fixed_price",
    marketingPrice: "10000000",
    marketingBasePrice: null,
    startsAt: null,
    endsAt: null,
    itemId: "item-visible",
    itemCode: "BRG-1",
    itemName: "Barang Terlihat",
    itemStatus: "dipasarkan",
    marketingStatus: "aktif",
    unitIsActive: true,
    category: "Perhiasan",
    condition: "Baik",
    description: "",
    specifications: {},
    updatedAt: new Date("2026-09-05T05:00:00.000Z"),
    unitName: "UPC Ranotana",
    unitAddress: "Manado",
    account: null,
    ...overrides
  };
}

describe("wishlist service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mocks.db.select.mockReset();
  });

  it("adds an item when it is not in the buyer wishlist", async () => {
    mockSelectRows([]);
    mockSelectRows([{ id: "pm-1" }]);
    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoNothing });
    mocks.db.insert.mockReturnValueOnce({ values });
    mockSelectRows([{ count: 1 }]);

    await expect(toggleBuyerWishlist("buyer-1", "pm-1")).resolves.toEqual({
      count: 1,
      favorited: true
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        pemasaranId: "pm-1",
        userId: "buyer-1"
      })
    );
    expect(mocks.revalidateTag).toHaveBeenCalledWith("public-catalog-lots");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("superadmin-unit-barang-detail");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("buyer-shell");
  });

  it("removes an item when it already exists in the buyer wishlist", async () => {
    mockSelectRows([{ id: "wish-1" }]);
    const where = vi.fn().mockResolvedValue(undefined);
    mocks.db.delete.mockReturnValueOnce({ where });
    mockSelectRows([{ count: 0 }]);

    await expect(toggleBuyerWishlist("buyer-1", "pm-1")).resolves.toEqual({
      count: 0,
      favorited: false
    });

    expect(mocks.db.delete).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledTimes(1);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("public-catalog-lots");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("superadmin-unit-barang-detail");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("buyer-shell");
  });

  it("counts wishlist items for one buyer", async () => {
    mockSelectRows([{ count: 4 }]);

    await expect(getBuyerWishlistCount("buyer-1")).resolves.toBe(4);
  });

  it("checks one detail item without loading the full wishlist", async () => {
    mockSelectRows([{ id: "wish-1" }]);

    await expect(isBuyerWishlistItem("buyer-1", "pm-1")).resolves.toBe(true);

    expect(mocks.db.select).toHaveBeenCalledWith({ id: expect.anything() });
  });

  it("keeps a catalog-hidden fixed-price item in wishlist as unavailable", async () => {
    mockSelectRows([
      makeWishlistRow(),
      makeWishlistRow({
        marketingId: "pm-hidden-by-transaction",
        itemId: "item-hidden-by-transaction",
        itemName: "Barang Sudah Tidak Di Katalog"
      })
    ]);
    mockSelectRows([]);
    mockSelectRows([{ id: "pm-visible" }]);

    await expect(listBuyerWishlist("buyer-1")).resolves.toMatchObject({
      activeItems: [expect.objectContaining({ lot: expect.objectContaining({ id: "pm-visible" }) })],
      unavailableItems: [
        expect.objectContaining({
          isAvailable: false,
          unavailableReason: "Barang sudah tidak tersedia",
          lot: expect.objectContaining({
            id: "pm-hidden-by-transaction",
            status: "Tidak tersedia"
          })
        })
      ]
    });
  });

  it("keeps saved ids and totals even after an item leaves the catalog", async () => {
    const idsQuery = mockSelectRows([{ pemasaranId: "pm-visible" }]);
    const countQuery = mockSelectRows([{ count: 1 }]);

    await expect(getBuyerWishlistIds("buyer-1")).resolves.toEqual(["pm-visible"]);
    await expect(getBuyerWishlistCount("buyer-1")).resolves.toBe(1);

    expect(idsQuery.innerJoin).not.toHaveBeenCalled();
    expect(countQuery.innerJoin).not.toHaveBeenCalled();
  });

  it("does not add a wishlist item that is no longer visible in the catalog", async () => {
    mockSelectRows([]);
    mockSelectRows([]);
    mockSelectRows([{ count: 0 }]);

    await expect(toggleBuyerWishlist("buyer-1", "pm-unavailable")).resolves.toEqual({
      count: 0,
      favorited: false
    });

    expect(mocks.db.insert).not.toHaveBeenCalled();
  });
});
