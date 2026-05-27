import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn()
  };

  return {
    db,
    serializeBuyerTransaction: vi.fn((row) => row)
  };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("@/lib/buyer/serializers", () => ({
  serializeBuyerBid: vi.fn(),
  serializeBuyerTransaction: mocks.serializeBuyerTransaction
}));

import { createFixedPricePurchase } from "@/lib/services/buyer.service";

function mockMarketingQuery(row: {
  marketing: { mode: string; status: string; price: string | number };
  item: { id: string; name: string; status: string };
  unit: { name: string; address: string };
  account: { accountNumber: string } | null;
  media: { url: string | null } | null;
}) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([row])
              })
            })
          })
        })
      })
    })
  };
}

function mockTransactionListQuery(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(rows)
    })
  };
}

function mockBlacklistQuery() {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([])
      })
    })
  };
}

describe("createFixedPricePurchase locking rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows another buyer to continue when the previous buyer is only waiting for payment", async () => {
    mocks.db.select
      .mockImplementationOnce(() =>
        mockMarketingQuery({
          marketing: { mode: "fixed_price", status: "aktif", price: "12500000" },
          item: { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" },
          unit: { name: "UPC Ranotana", address: "Jl. Sam Ratulangi" },
          account: { accountNumber: "0123-4567-8901-234" },
          media: { url: "/uploads/cincin.jpg" }
        })
      )
      .mockImplementationOnce(() =>
        mockTransactionListQuery([
          {
            id: "trx-other-1",
            userId: "buyer-lain",
            status: "menunggu_pembayaran",
            createdAt: new Date("2026-05-27T09:00:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() => mockBlacklistQuery());

    const insertValuesSpy = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        {
          id: "trx-baru-1",
          pemasaranId: "pemasaran-1",
          userId: "buyer-baru",
          type: "fixed_price",
          amount: "12500000",
          paymentMethod: "transfer",
          status: "menunggu_pembayaran",
          paymentDeadline: new Date("2026-05-28T09:00:00.000Z"),
          createdAt: new Date("2026-05-27T09:00:00.000Z"),
          updatedAt: new Date("2026-05-27T09:00:00.000Z")
        }
      ])
    });

    mocks.db.insert.mockImplementationOnce(() => ({
      values: insertValuesSpy
    }));

    const result = await createFixedPricePurchase("buyer-baru", "pemasaran-1", {
      paymentMethod: "transfer"
    });

    expect(insertValuesSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        id: "trx-baru-1",
        status: "menunggu_pembayaran",
        userId: "buyer-baru"
      })
    );
  });

  it("blocks another buyer once the earlier buyer has uploaded proof for admin verification", async () => {
    mocks.db.select
      .mockImplementationOnce(() =>
        mockMarketingQuery({
          marketing: { mode: "fixed_price", status: "aktif", price: "12500000" },
          item: { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" },
          unit: { name: "UPC Ranotana", address: "Jl. Sam Ratulangi" },
          account: { accountNumber: "0123-4567-8901-234" },
          media: { url: "/uploads/cincin.jpg" }
        })
      )
      .mockImplementationOnce(() =>
        mockTransactionListQuery([
          {
            id: "trx-other-2",
            userId: "buyer-lain",
            status: "bukti_diunggah",
            createdAt: new Date("2026-05-27T09:00:00.000Z")
          }
        ])
      );

    await expect(
      createFixedPricePurchase("buyer-baru", "pemasaran-1", {
        paymentMethod: "transfer"
      })
    ).rejects.toThrow("Barang sedang dalam proses pembelian oleh pembeli lain.");

    expect(mocks.db.insert).not.toHaveBeenCalled();
  });
});
