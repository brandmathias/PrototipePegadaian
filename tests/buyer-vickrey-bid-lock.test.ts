import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    insert: vi.fn(),
    select: vi.fn()
  };
  const processExpiredVickreyAuctions = vi.fn();
  const processOverdueVickreyPayments = vi.fn();

  return {
    db,
    processExpiredVickreyAuctions,
    processOverdueVickreyPayments
  };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("@/lib/services/cron.service", () => ({
  processExpiredVickreyAuctions: mocks.processExpiredVickreyAuctions,
  processOverdueVickreyPayments: mocks.processOverdueVickreyPayments
}));

import {
  isActiveVickreyBidLockRow,
  submitVickreyBid
} from "@/lib/services/buyer.service";

const ACTIVE_LOCK_MESSAGE =
  "Anda masih memiliki bid aktif pada lelang lain. Tunggu hasil lelang tersebut sebelum mengikuti lelang baru.";

function mockMarketingRows(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(rows)
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

function mockBidLockRows(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(rows)
            })
          })
        })
      })
    })
  };
}

function activeMarketingRow() {
  return {
    account: null,
    imageUrl: null,
    item: {
      id: "barang-target",
      status: "dipasarkan"
    },
    marketing: {
      basePrice: "90000000",
      endsAt: new Date("2099-06-17T00:00:00.000Z"),
      id: "pm-target",
      mode: "vickrey",
      status: "aktif"
    },
    media: null,
    unit: {
      id: "unit-1",
      name: "UPC Ranotana"
    }
  };
}

describe("single active Lelang Tertutup bid lock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("keeps a lock while a buyer bid is still in an active auction", () => {
    expect(
      isActiveVickreyBidLockRow(
        {
          marketingStatus: "aktif",
          transactionStatus: null,
          userId: "buyer-1",
          winnerId: null
        },
        "buyer-1"
      )
    ).toBe(true);
  });

  it("keeps a lock while a winning payment still waits for admin verification", () => {
    expect(
      isActiveVickreyBidLockRow(
        {
          marketingStatus: "selesai",
          transactionStatus: "menunggu_konfirmasi_langsung",
          userId: "buyer-1",
          winnerId: "buyer-1"
        },
        "buyer-1"
      )
    ).toBe(true);
  });

  it("releases the lock after losing, failed settlement, or admin-verified payment", () => {
    expect(
      isActiveVickreyBidLockRow(
        {
          marketingStatus: "selesai",
          transactionStatus: null,
          userId: "buyer-1",
          winnerId: "buyer-2"
        },
        "buyer-1"
      )
    ).toBe(false);
    expect(
      isActiveVickreyBidLockRow(
        {
          marketingStatus: "gagal",
          transactionStatus: null,
          userId: "buyer-1",
          winnerId: null
        },
        "buyer-1"
      )
    ).toBe(false);
    expect(
      isActiveVickreyBidLockRow(
        {
          marketingStatus: "selesai",
          transactionStatus: "lunas",
          userId: "buyer-1",
          winnerId: "buyer-1"
        },
        "buyer-1"
      )
    ).toBe(false);
    expect(
      isActiveVickreyBidLockRow(
        {
          marketingStatus: "selesai",
          transactionStatus: "gagal",
          userId: "buyer-1",
          winnerId: "buyer-1"
        },
        "buyer-1"
      )
    ).toBe(false);
  });

  it("rejects a second bid while the buyer has another active Lelang Tertutup lock", async () => {
    mocks.db.select
      .mockImplementationOnce(() => mockMarketingRows([activeMarketingRow()]))
      .mockImplementationOnce(() => mockLimitRows([]))
      .mockImplementationOnce(() => mockLimitRows([]))
      .mockImplementationOnce(() =>
        mockBidLockRows([
          {
            lotName: "Kalung Emas",
            marketingStatus: "aktif",
            pemasaranId: "pm-other",
            transactionStatus: null,
            userId: "buyer-1",
            winnerId: null
          }
        ])
      );

    await expect(submitVickreyBid("buyer-1", "pm-target", {})).rejects.toThrow(ACTIVE_LOCK_MESSAGE);
    expect(mocks.db.insert).not.toHaveBeenCalled();
  });
});
