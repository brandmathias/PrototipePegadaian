import { beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/prototipe_pegadaian";

describe("cron service", () => {
  let cronService: Awaited<typeof import("@/lib/services/cron.service")>;

  beforeAll(async () => {
    cronService = await import("@/lib/services/cron.service");
  }, 20_000);

  it("marks auction as failed when there are no bids", async () => {
    expect(
      cronService.resolveVickreyOutcome({
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
    expect(
      cronService.resolveVickreyOutcome({
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
    expect(
      cronService.resolveVickreyOutcome({
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

  it("breaks equal highest Lelang Tertutup bids by earliest submitted bid and charges the tied bid amount", async () => {
    expect(
      cronService.resolveVickreyOutcome({
        basePrice: "10000000",
        bids: [
          {
            id: "bid-late",
            userId: "buyer-late",
            nominal: "15000000",
            createdAt: new Date("2026-05-21T10:05:00.000Z")
          },
          {
            id: "bid-early",
            userId: "buyer-early",
            nominal: "15000000",
            createdAt: new Date("2026-05-21T10:00:00.000Z")
          },
          {
            id: "bid-third",
            userId: "buyer-third",
            nominal: "14000000",
            createdAt: new Date("2026-05-21T09:55:00.000Z")
          }
        ]
      })
    ).toEqual({
      bidCount: 3,
      finalPrice: "15000000.00",
      runnerUpBidId: "bid-late",
      runnerUpUserId: "buyer-late",
      status: "menunggu_pembayaran",
      topBidId: "bid-early",
      winnerBidAmount: "15000000.00",
      winnerId: "buyer-early"
    });
  });

  it("ignores unrevealed bid commitments when resolving vickrey outcome", async () => {
    expect(
      cronService.resolveVickreyOutcome({
        basePrice: "10000000",
        bids: [
          {
            id: "bid-hidden",
            userId: "buyer-hidden",
            nominal: null
          },
          {
            id: "bid-1",
            userId: "buyer-1",
            nominal: "15000000"
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
      winnerBidAmount: "15000000.00",
      winnerId: "buyer-1"
    });
  });

  it("settles immediately after the deadline while active bids remain private", async () => {
    const endsAt = new Date("2026-05-12T10:00:00.000Z");
    const afterDeadline = new Date("2026-05-12T10:02:00.000Z");

    expect(cronService.canSettleVickreySession({ endsAt }, afterDeadline)).toBe(true);
  });

  it("maps blacklist duration by accumulated violation count", async () => {
    expect(cronService.getBlacklistDurationDays(1)).toBe(7);
    expect(cronService.getBlacklistDurationDays(2)).toBe(30);
    expect(cronService.getBlacklistDurationDays(3)).toBe(365);
    expect(cronService.getBlacklistDurationDays(4)).toBe(365);
    expect(cronService.getBlacklistDurationDays(9)).toBe(365);
  });

  it("continues blacklist escalation from historical totals after a restriction expires", async () => {
    expect(
      cronService.resolveAccumulatedBlacklistViolations({
        eligibleViolationCount: 1,
        previousTotalViolations: 1
      })
    ).toBe(2);

    expect(
      cronService.resolveAccumulatedBlacklistViolations({
        eligibleViolationCount: 1,
        previousTotalViolations: 2
      })
    ).toBe(3);

    expect(
      cronService.resolveAccumulatedBlacklistViolations({
        eligibleViolationCount: 3,
        previousTotalViolations: 1
      })
    ).toBe(2);
  });
});
