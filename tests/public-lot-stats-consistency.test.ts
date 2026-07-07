import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    insert: vi.fn(),
    select: vi.fn()
  },
  revalidateTag: vi.fn()
}));

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag
}));

import { reconcileLotInsights, recordLotView } from "@/lib/services/public-lot-stats.service";

describe("public lot statistics consistency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses participant count as the minimum view count without changing other metrics", () => {
    expect(reconcileLotInsights({ views: 0, likes: 0, participants: 2 })).toEqual({
      views: 2,
      likes: 0,
      participants: 2
    });
    expect(reconcileLotInsights({ views: 8, likes: 3, participants: 2 })).toEqual({
      views: 8,
      likes: 3,
      participants: 2
    });
  });

  it("backfills a deterministic view for historical bidders during production startup", () => {
    const startup = readFileSync(resolve(process.cwd(), "scripts/start-production.mjs"), "utf8");

    expect(startup).toContain("bid-view-backfill-");
    expect(startup).toContain(`'user:' || bid."user_id"`);
    expect(startup).toContain('on conflict ("pemasaran_id", "viewer_key") do nothing');
  });

  it("revalidates cross-role lot insight views after recording a public view", async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    mocks.db.insert.mockReturnValueOnce({ values });

    function mockGroupedRows(rows: unknown[]) {
      const groupBy = vi.fn().mockResolvedValue(rows);
      const where = vi.fn().mockReturnValue({ groupBy });
      const from = vi.fn().mockReturnValue({ where });
      mocks.db.select.mockReturnValueOnce({ from });
    }

    mockGroupedRows([{ count: 1, pemasaranId: "pm-1" }]);
    mockGroupedRows([]);
    mockGroupedRows([]);

    await expect(recordLotView("pm-1", "anon:test")).resolves.toEqual({
      likes: 0,
      participants: 0,
      views: 1
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        pemasaranId: "pm-1",
        viewerKey: "anon:test"
      })
    );
    expect(mocks.revalidateTag).toHaveBeenCalledWith("public-catalog-lots");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("superadmin-unit-barang-detail");
  });
});
