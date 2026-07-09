import { describe, expect, it } from "vitest";

import {
  validateBuyerBidCommitmentPayload,
  validateBuyerBidEscrowPayload,
  validateBuyerBidPayload,
  validateBuyerPaymentProofPayload,
  validateBuyerProfileUpdatePayload,
  validateBuyerPurchasePayload
} from "@/lib/buyer/validation";

describe("buyer validation", () => {
  it("accepts harga tetap transfer checkout before proof metadata is present", () => {
    expect(validateBuyerPurchasePayload({ paymentMethod: "transfer" })).toEqual({
      paymentMethod: "transfer"
    });
  });

  it("accepts harga tetap transfer payment when proof metadata is present", () => {
    expect(
      validateBuyerPurchasePayload({
        paymentMethod: "transfer",
        fileName: "bukti-transfer.png",
        reference: "BRI-2026-001"
      })
    ).toEqual({
      paymentMethod: "transfer",
      fileName: "bukti-transfer.png",
      reference: "BRI-2026-001"
    });
  });

  it("rejects unsupported buyer payment methods", () => {
    expect(() => validateBuyerPurchasePayload({ paymentMethod: "cashless" })).toThrow(
      "Fixed price hanya mendukung pembayaran transfer bank."
    );
    expect(() => validateBuyerPurchasePayload({ paymentMethod: "langsung" })).toThrow(
      "Fixed price hanya mendukung pembayaran transfer bank."
    );
  });

  it("accepts bid payloads above the base price", () => {
    expect(validateBuyerBidPayload({ amount: 1500000 }, 1000000)).toEqual({
      amount: 1500000
    });
  });

  it("accepts client-side bid commitments without receiving nominal", () => {
    expect(
      validateBuyerBidCommitmentPayload({
        bidHash: "864c8c7761ec3f2dc6c9f9fb35f7161915406597a38871d4b2b78cf231b87f6d"
      })
    ).toEqual({
      bidHash: "864c8c7761ec3f2dc6c9f9fb35f7161915406597a38871d4b2b78cf231b87f6d"
    });
  });

  it("rejects bid commitments that include malformed hashes", () => {
    expect(() => validateBuyerBidCommitmentPayload({ bidHash: "not-a-hash" })).toThrow(
      "Hash bid belum valid."
    );
  });

  it("accepts encrypted escrow bid payload metadata", () => {
    expect(
      validateBuyerBidEscrowPayload(
        {
          amount: 1500000,
          bidHash: "864c8c7761ec3f2dc6c9f9fb35f7161915406597a38871d4b2b78cf231b87f6d",
          salt: "client-salt-value-123"
        },
        1000000
      )
    ).toEqual({
      amount: 1500000,
      bidHash: "864c8c7761ec3f2dc6c9f9fb35f7161915406597a38871d4b2b78cf231b87f6d",
      salt: "client-salt-value-123"
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

  it("accepts buyer profile updates for username and photo only", () => {
    expect(validateBuyerProfileUpdatePayload({ name: "Buyer Baru" })).toEqual({
      name: "Buyer Baru"
    });
    expect(
      validateBuyerProfileUpdatePayload({
        name: "Buyer Baru",
        image: null
      })
    ).toEqual({
      name: "Buyer Baru",
      image: null
    });
  });

  it("rejects buyer profile updates that try to change tracked identity fields", () => {
    expect(() =>
      validateBuyerProfileUpdatePayload({
        name: "Buyer Baru",
        email: "buyer.baru@example.com"
      })
    ).toThrow("Email, nomor telepon, dan NIK tidak dapat diubah dari profil.");
    expect(() =>
      validateBuyerProfileUpdatePayload({
        name: "Buyer Baru",
        phoneNumber: "081234567890"
      })
    ).toThrow("Email, nomor telepon, dan NIK tidak dapat diubah dari profil.");
    expect(() =>
      validateBuyerProfileUpdatePayload({
        name: "Buyer Baru",
        nationalId: "7371123052600002"
      })
    ).toThrow("Email, nomor telepon, dan NIK tidak dapat diubah dari profil.");
  });
});
