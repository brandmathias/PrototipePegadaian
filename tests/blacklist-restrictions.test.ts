import { describe, expect, it } from "vitest";

import {
  getBlacklistBlockedUntil,
  getBlacklistDurationLabel,
  getBlacklistRestrictionPolicy,
  shouldSuspendLoginForBlacklist
} from "@/lib/blacklist/restrictions";

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
      blocksFixedPrice: false,
      blocksTransactionSettlement: true
    });
    expect(getBlacklistRestrictionPolicy(2)).toMatchObject({
      level: 2,
      durationDays: 30,
      blocksVickrey: true,
      blocksFixedPrice: true,
      blocksTransactionSettlement: true
    });
    expect(getBlacklistRestrictionPolicy(3)).toMatchObject({
      level: 3,
      durationDays: 365,
      blocksVickrey: true,
      blocksFixedPrice: true,
      blocksTransactionSettlement: true,
      requiresManualReview: true
    });
    expect(getBlacklistRestrictionPolicy(9)).toMatchObject({
      level: 3,
      durationDays: 365,
      requiresManualReview: true
    });
  });

  it("can shorten blacklist duration to hours for demo testing without changing level rules", () => {
    const base = new Date("2026-05-21T00:00:00.000Z");

    expect(getBlacklistBlockedUntil(base, 1, "hours").toISOString()).toBe("2026-05-21T07:00:00.000Z");
    expect(getBlacklistBlockedUntil(base, 2, "hours").toISOString()).toBe("2026-05-22T06:00:00.000Z");
    expect(getBlacklistDurationLabel(3, "hours")).toBe("365 jam");
  });

  it("suspends login only when the blacklist reaches level 3 manual review", () => {
    expect(shouldSuspendLoginForBlacklist(0)).toBe(false);
    expect(shouldSuspendLoginForBlacklist(1)).toBe(false);
    expect(shouldSuspendLoginForBlacklist(2)).toBe(false);
    expect(shouldSuspendLoginForBlacklist(3)).toBe(true);
    expect(shouldSuspendLoginForBlacklist(9)).toBe(true);
  });
});
