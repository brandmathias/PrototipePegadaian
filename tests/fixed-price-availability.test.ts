import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/client", () => ({ db: {} }));

import { resolveFixedPriceAvailability } from "@/lib/services/fixed-price-availability.service";

const NOW = new Date("2026-09-05T05:00:00.000Z");

describe("fixed-price availability", () => {
  it("reserves the detail page for another buyer with an active Midtrans deadline", () => {
    const result = resolveFixedPriceAvailability(
      [
        {
          userId: "buyer-lain",
          status: "menunggu_pembayaran",
          paymentMethod: "midtrans",
          paymentDeadline: new Date("2026-09-05T05:15:00.000Z")
        }
      ],
      "buyer-saya",
      NOW
    );

    expect(result).toEqual({
      status: "reserved",
      owner: "other",
      expiresAt: "2026-09-05T05:15:00.000Z",
      canContinue: false
    });
  });

  it("keeps an active reservation resumable for its own buyer", () => {
    const result = resolveFixedPriceAvailability(
      [
        {
          userId: "buyer-saya",
          status: "menunggu_pembayaran",
          paymentMethod: "midtrans",
          paymentDeadline: "2026-09-05T05:15:00.000Z"
        }
      ],
      "buyer-saya",
      NOW
    );

    expect(result.owner).toBe("self");
    expect(result.canContinue).toBe(true);
  });

  it("releases an expired Midtrans reservation without adding a fixed-price deadline", () => {
    const result = resolveFixedPriceAvailability(
      [
        {
          userId: "buyer-lama",
          status: "menunggu_pembayaran",
          paymentMethod: "midtrans",
          paymentDeadline: new Date("2026-09-05T04:59:59.000Z")
        }
      ],
      "buyer-saya",
      NOW
    );

    expect(result).toEqual({
      status: "available",
      owner: null,
      expiresAt: null,
      canContinue: false
    });
  });

  it("keeps a verified sale unavailable even when an old reservation is also present", () => {
    const result = resolveFixedPriceAvailability([
      {
        userId: "buyer-lain",
        status: "lunas",
        paymentMethod: "midtrans",
        paymentDeadline: null
      },
      {
        userId: "buyer-saya",
        status: "menunggu_pembayaran",
        paymentMethod: "midtrans",
        paymentDeadline: new Date("2026-09-05T05:15:00.000Z")
      }
    ], "buyer-saya", NOW);

    expect(result).toEqual({
      status: "sold",
      owner: null,
      expiresAt: null,
      canContinue: false
    });
  });
});
