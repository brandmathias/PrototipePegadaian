import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    select: vi.fn()
  };
  const serializeBuyerTransaction = vi.fn((row) => row);
  const processExpiredVickreyAuctions = vi.fn();
  const processOverdueVickreyPayments = vi.fn();
  const getBuyerWishlistCount = vi.fn();

  return {
    db,
    getBuyerWishlistCount,
    processExpiredVickreyAuctions,
    processOverdueVickreyPayments,
    serializeBuyerTransaction
  };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("@/lib/buyer/serializers", () => ({
  serializeBuyerBid: vi.fn((row) => row),
  serializeBuyerTransaction: mocks.serializeBuyerTransaction
}));

vi.mock("@/lib/services/cron.service", () => ({
  processExpiredVickreyAuctions: mocks.processExpiredVickreyAuctions,
  processOverdueVickreyPayments: mocks.processOverdueVickreyPayments
}));

vi.mock("@/lib/services/wishlist.service", () => ({
  getBuyerWishlistCount: mocks.getBuyerWishlistCount
}));

import { getBuyerProfileSummary, getBuyerSummary, listBuyerTransactions } from "@/lib/services/buyer.service";

function mockBuyerTransactionRows(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(rows)
                })
              })
            })
          })
        })
      })
    })
  };
}

function mockLimitRows(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(rows)
      })
    })
  };
}

function mockOrderedLimitRows(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(rows)
        })
      })
    })
  };
}

function mockOrderedRows(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(rows)
      })
    })
  };
}

function mockWhereRows(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(rows)
    })
  };
}

function mockBuyerBidRows(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(rows)
                })
              })
            })
          })
        })
      })
    })
  };
}

describe("buyer auction state refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.db.select.mockReset();
    mocks.getBuyerWishlistCount.mockResolvedValue(0);
    mocks.processExpiredVickreyAuctions.mockResolvedValue({
      completed: 0,
      failed: 0,
      pendingReveal: 0,
      processed: 0
    });
    mocks.processOverdueVickreyPayments.mockResolvedValue({
      blacklisted: 0,
      processed: 0
    });
  });

  it("settles expired Lelang Tertutup sessions and overdue winner payments before listing buyer transactions", async () => {
    mocks.db.select.mockImplementationOnce(() =>
      mockBuyerTransactionRows([
        {
          id: "trx-1",
          status: "gagal",
          type: "vickrey"
        }
      ])
    );

    const rows = await listBuyerTransactions("buyer-1");

    expect(mocks.processExpiredVickreyAuctions).toHaveBeenCalledTimes(1);
    expect(mocks.processOverdueVickreyPayments).toHaveBeenCalledTimes(1);
    expect(mocks.processExpiredVickreyAuctions.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.processOverdueVickreyPayments.mock.invocationCallOrder[0]
    );
    expect(mocks.db.select.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.processOverdueVickreyPayments.mock.invocationCallOrder[0]
    );
    expect(rows).toEqual([
      expect.objectContaining({
        id: "trx-1",
        status: "gagal"
      })
    ]);
  });

  it("hides harga tetap waiting-payment rows because proof upload now creates the transaction", async () => {
    mocks.db.select.mockImplementationOnce(() =>
      mockBuyerTransactionRows([
        {
          id: "trx-draft-fixed",
          status: "menunggu_pembayaran",
          type: "fixed_price",
          proofUrl: null
        },
        {
          id: "trx-review-fixed",
          status: "bukti_diunggah",
          type: "fixed_price",
          proofUrl: "/uploads/bukti/transfer.jpg"
        }
      ])
    );

    const rows = await listBuyerTransactions("buyer-1");

    expect(rows).toEqual([
      expect.objectContaining({
        id: "trx-review-fixed",
        status: "bukti_diunggah"
      })
    ]);
  });

  it("refreshes overdue Lelang Tertutup payments before reading the buyer blacklist summary", async () => {
    mocks.db.select
      .mockImplementationOnce(() => mockLimitRows([]))
      .mockImplementationOnce(() =>
        mockLimitRows([
          {
            createdAt: new Date("2026-05-01T00:00:00.000Z"),
            email: "buyer@example.com",
            image: null,
            name: "Buyer Demo",
            nationalId: "7171000000000001",
            phoneNumber: "08123456789",
            updatedAt: new Date("2026-05-01T00:00:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() => mockOrderedLimitRows([]))
      .mockImplementationOnce(() => mockOrderedLimitRows([]))
      .mockImplementationOnce(() => mockWhereRows([]))
      .mockImplementationOnce(() =>
        mockLimitRows([
          {
            blockedUntil: new Date("2026-06-05T00:00:00.000Z"),
            totalViolations: 1
          }
        ])
      )
      .mockImplementationOnce(() =>
        mockOrderedRows([
          {
            createdAt: new Date("2026-05-29T00:00:00.000Z"),
            escalationEligible: true,
            id: "incident-1"
          }
        ])
      )
      .mockImplementationOnce(() => mockOrderedLimitRows([{ id: "incident-1" }]))
      .mockImplementationOnce(() => mockBuyerTransactionRows([]))
      .mockImplementationOnce(() => mockBuyerBidRows([]));

    const summary = await getBuyerSummary("buyer-1");

    expect(mocks.db.select.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.processOverdueVickreyPayments.mock.invocationCallOrder[0]
    );
    expect(summary.blacklist).toEqual(
      expect.objectContaining({
        active: false,
        incidentId: "incident-1",
        violations: 1
      })
    );
  });

  it("reads the profile page summary without loading transaction or bid history", async () => {
    mocks.getBuyerWishlistCount.mockResolvedValue(3);
    mocks.db.select
      .mockImplementationOnce(() =>
        mockLimitRows([
          {
            createdAt: new Date("2026-05-01T00:00:00.000Z"),
            email: "profile@example.com",
            fullName: "Buyer Profil",
            nationalId: "7171000000000002",
            phoneNumber: "081111111111",
            status: "active"
          }
        ])
      )
      .mockImplementationOnce(() =>
        mockLimitRows([
          {
            createdAt: new Date("2026-04-20T00:00:00.000Z"),
            email: "buyer@example.com",
            image: "data:image/jpeg;base64,avatar",
            name: "Buyer Fallback",
            nationalId: "7171000000000001",
            phoneNumber: "080000000000"
          }
        ])
      )
      .mockImplementationOnce(() =>
        mockOrderedLimitRows([
          {
            updatedAt: new Date("2026-05-10T00:00:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() =>
        mockOrderedLimitRows([
          {
            createdAt: new Date("2026-05-11T00:00:00.000Z"),
            expiresAt: new Date("2026-06-11T00:00:00.000Z"),
            id: "session-1",
            updatedAt: new Date("2026-05-11T08:00:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() => mockWhereRows([{ id: "session-1" }]))
      .mockImplementationOnce(() => mockLimitRows([]));

    const summary = await getBuyerProfileSummary("buyer-1");

    expect(mocks.db.select).toHaveBeenCalledTimes(6);
    expect(mocks.serializeBuyerTransaction).not.toHaveBeenCalled();
    expect(summary).toEqual(
      expect.objectContaining({
        email: "profile@example.com",
        image: "data:image/jpeg;base64,avatar",
        name: "Buyer Profil",
        nationalId: "7171000000000002",
        phone: "081111111111",
        wishlistCount: 3
      })
    );
    expect(summary.blacklist.active).toBe(false);
  });
});
