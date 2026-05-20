import { describe, expect, it } from "vitest";

import { getBlacklistRestrictionPolicy } from "@/lib/blacklist/restrictions";

describe("blacklist restriction policy", () => {
  it("uses three graduated levels with fixed price blocked from the second violation", () => {
    expect(getBlacklistRestrictionPolicy(0)).toMatchObject({
      level: 0,
      durationDays: 0,
      blocksVickrey: false,
      blocksFixedPrice: false
    });
    expect(getBlacklistRestrictionPolicy(1)).toMatchObject({
      level: 1,
      durationDays: 7,
      blocksVickrey: true,
      blocksFixedPrice: false
    });
    expect(getBlacklistRestrictionPolicy(2)).toMatchObject({
      level: 2,
      durationDays: 30,
      blocksVickrey: true,
      blocksFixedPrice: true
    });
    expect(getBlacklistRestrictionPolicy(3)).toMatchObject({
      level: 3,
      durationDays: 365,
      blocksVickrey: true,
      blocksFixedPrice: true,
      requiresManualReview: true
    });
    expect(getBlacklistRestrictionPolicy(9)).toMatchObject({
      level: 3,
      durationDays: 365,
      requiresManualReview: true
    });
  });
});
