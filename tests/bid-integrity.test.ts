import { describe, expect, it } from "vitest";

import { createBidIntegrityHash, verifyBidIntegrityHash } from "@/lib/bid-integrity";

describe("bid integrity hash", () => {
  it("creates a stable sha256 commitment for a sealed bid", () => {
    const bidHash = createBidIntegrityHash({
      pemasaranId: "pm-vickrey-1",
      userId: "buyer-1",
      amount: 150000000,
      salt: "salt-1"
    });

    expect(bidHash).toBe("864c8c7761ec3f2dc6c9f9fb35f7161915406597a38871d4b2b78cf231b87f6d");
    expect(
      verifyBidIntegrityHash({
        pemasaranId: "pm-vickrey-1",
        userId: "buyer-1",
        amount: 150000000,
        salt: "salt-1",
        bidHash
      })
    ).toEqual({
      computedHash: bidHash,
      isMatch: true
    });
  });
});
