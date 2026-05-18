import { describe, expect, it } from "vitest";

import { createBidIntegrityHash } from "@/lib/bid-integrity";
import { decryptVickreyBidPayload, encryptVickreyBidPayload } from "@/lib/vickrey-escrow";

describe("vickrey escrow", () => {
  it("roundtrips encrypted bid payloads with integrity context", () => {
    const context = {
      pemasaranId: "pm-vickrey-1",
      userId: "buyer-1",
      bidHash: createBidIntegrityHash({
        pemasaranId: "pm-vickrey-1",
        userId: "buyer-1",
        amount: 150000000,
        salt: "client-salt-value-123"
      })
    };

    const encrypted = encryptVickreyBidPayload(
      { amount: 150000000, salt: "client-salt-value-123" },
      context
    );

    expect(encrypted).not.toContain("150000000");
    expect(decryptVickreyBidPayload(encrypted, context)).toEqual({
      amount: 150000000,
      salt: "client-salt-value-123"
    });
  });

  it("rejects escrow payloads opened with the wrong auction context", () => {
    const context = {
      pemasaranId: "pm-vickrey-1",
      userId: "buyer-1",
      bidHash: "864c8c7761ec3f2dc6c9f9fb35f7161915406597a38871d4b2b78cf231b87f6d"
    };
    const encrypted = encryptVickreyBidPayload({ amount: 150000000, salt: "client-salt-value-123" }, context);

    expect(() =>
      decryptVickreyBidPayload(encrypted, {
        ...context,
        userId: "buyer-2"
      })
    ).toThrow();
  });
});
