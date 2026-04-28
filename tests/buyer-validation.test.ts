import { describe, expect, it } from "vitest";

import {
  validateBuyerBidPayload,
  validateBuyerPaymentProofPayload,
  validateBuyerPurchasePayload
} from "@/lib/buyer/validation";

describe("buyer validation", () => {
  it("accepts supported buyer payment methods", () => {
    expect(validateBuyerPurchasePayload({ paymentMethod: "transfer" })).toEqual({
      paymentMethod: "transfer"
    });

    expect(validateBuyerPurchasePayload({ paymentMethod: "langsung" })).toEqual({
      paymentMethod: "langsung"
    });
  });

  it("rejects unsupported buyer payment methods", () => {
    expect(() => validateBuyerPurchasePayload({ paymentMethod: "cashless" })).toThrow(
      "Pilih metode pembayaran yang tersedia."
    );
  });

  it("accepts bid payloads above the base price", () => {
    expect(validateBuyerBidPayload({ amount: 1500000 }, 1000000)).toEqual({
      amount: 1500000
    });
  });

  it("rejects bid payloads below the base price", () => {
    expect(() => validateBuyerBidPayload({ amount: 900000 }, 1000000)).toThrow(
      "Nominal bid minimal Rp\u00a01.000.000."
    );
  });

  it("validates simulated payment proof metadata", () => {
    expect(
      validateBuyerPaymentProofPayload({
        fileName: "bukti-transfer.pdf",
        reference: "TRF-00991"
      })
    ).toEqual({
      fileName: "bukti-transfer.pdf",
      reference: "TRF-00991"
    });
  });
});
