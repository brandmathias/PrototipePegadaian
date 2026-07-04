import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/client", () => ({
  db: {}
}));

import { reconcileLotInsights } from "@/lib/services/public-lot-stats.service";

describe("public lot statistics consistency", () => {
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
});
