import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    delete: vi.fn(),
    insert: vi.fn(),
    select: vi.fn()
  };

  return { db };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

import { getBuyerWishlistCount, toggleBuyerWishlist } from "@/lib/services/wishlist.service";

function mockSelectRows(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  mocks.db.select.mockReturnValueOnce({ from });
  return { from, where, limit };
}

describe("wishlist service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds an item when it is not in the buyer wishlist", async () => {
    mockSelectRows([]);
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
  });

  it("counts wishlist items for one buyer", async () => {
    mockSelectRows([{ count: 4 }]);

    await expect(getBuyerWishlistCount("buyer-1")).resolves.toBe(4);
  });
});
