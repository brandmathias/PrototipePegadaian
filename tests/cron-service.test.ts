import { describe, expect, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/prototipe_pegadaian";

describe("cron service", () => {
  it("marks auction as failed when there are no bids", async () => {
    const { resolveVickreyOutcome } = await import("@/lib/services/cron.service");

    expect(
      resolveVickreyOutcome({
        basePrice: "10000000",
        bids: []
      })
    ).toEqual({
      bidCount: 0,
      finalPrice: null,
      runnerUpBidId: null,
      runnerUpUserId: null,
      status: "gagal",
      topBidId: null,
      winnerBidAmount: null,
      winnerId: null
    });
  });

  it("uses base price as payable amount when only one bid exists", async () => {
    const { resolveVickreyOutcome } = await import("@/lib/services/cron.service");

    expect(
      resolveVickreyOutcome({
        basePrice: "10000000",
        bids: [
          {
            id: "bid-1",
            userId: "buyer-1",
            nominal: "12500000"
          }
        ]
      })
    ).toEqual({
      bidCount: 1,
      finalPrice: "10000000.00",
      runnerUpBidId: null,
      runnerUpUserId: null,
      status: "menunggu_pembayaran",
      topBidId: "bid-1",
      winnerBidAmount: "12500000.00",
      winnerId: "buyer-1"
    });
  });

  it("uses the second highest bid as final payable amount", async () => {
    const { resolveVickreyOutcome } = await import("@/lib/services/cron.service");

    expect(
      resolveVickreyOutcome({
        basePrice: "10000000",
        bids: [
          {
            id: "bid-1",
            userId: "buyer-1",
            nominal: "15000000"
          },
          {
            id: "bid-2",
            userId: "buyer-2",
            nominal: "13250000"
          },
          {
            id: "bid-3",
            userId: "buyer-3",
            nominal: "12000000"
          }
        ]
      })
    ).toEqual({
      bidCount: 3,
      finalPrice: "13250000.00",
      runnerUpBidId: "bid-2",
      runnerUpUserId: "buyer-2",
      status: "menunggu_pembayaran",
      topBidId: "bid-1",
      winnerBidAmount: "15000000.00",
      winnerId: "buyer-1"
    });
  });

  it("maps blacklist duration by accumulated violation count", async () => {
    const { getBlacklistDurationDays } = await import("@/lib/services/cron.service");

    expect(getBlacklistDurationDays(1)).toBe(7);
    expect(getBlacklistDurationDays(2)).toBe(30);
    expect(getBlacklistDurationDays(3)).toBe(90);
    expect(getBlacklistDurationDays(4)).toBe(365);
    expect(getBlacklistDurationDays(9)).toBe(365);
  });
});
