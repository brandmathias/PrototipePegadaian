import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class ConflictError extends Error {
    readonly code = "FIXED_PRICE_RESERVED";

    constructor() {
      super("Barang sedang dalam proses pembelian oleh pembeli lain.");
    }
  }

  return {
    ConflictError,
    createCheckout: vi.fn(),
    requireBuyerApiSession: vi.fn()
  };
});

vi.mock("@/lib/auth/session", () => ({
  requireBuyerApiSession: mocks.requireBuyerApiSession
}));
vi.mock("@/lib/services/buyer.service", () => ({
  FixedPriceClaimConflictError: mocks.ConflictError,
  createFixedPriceMidtransCheckout: mocks.createCheckout
}));

import { POST } from "@/app/api/user/beli/[pemasaranId]/route";

describe("fixed-price purchase route", () => {
  it("returns a conflict response when another buyer already reserved the item", async () => {
    mocks.requireBuyerApiSession.mockResolvedValue({ ok: true, userId: "buyer-saya" });
    mocks.createCheckout.mockRejectedValue(new mocks.ConflictError());

    const response = await POST(new Request("http://localhost/api/user/beli/lot-1"), {
      params: Promise.resolve({ pemasaranId: "lot-1" })
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: "FIXED_PRICE_RESERVED",
      message: "Barang sedang dalam proses pembelian oleh pembeli lain."
    });
  });
});
