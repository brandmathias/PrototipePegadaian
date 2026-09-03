import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createMidtransSnapTransaction: vi.fn(),
  db: { insert: vi.fn(), select: vi.fn(), update: vi.fn(), transaction: vi.fn() },
  getMidtransTransactionStatus: vi.fn(),
  getMidtransGatewayConfig: vi.fn(),
  revalidateTag: vi.fn()
}));

vi.mock("@/lib/db/client", () => ({ db: mocks.db }));
vi.mock("@/lib/payments/midtrans", () => ({
  MIDTRANS_RESERVATION_MINUTES: 15,
  createMidtransSnapTransaction: mocks.createMidtransSnapTransaction,
  getMidtransGatewayConfig: mocks.getMidtransGatewayConfig,
  getMidtransTransactionStatus: mocks.getMidtransTransactionStatus,
  mapMidtransTransactionStatus: (status: string) =>
    status === "expire" ? "gagal" : status === "pending" ? "menunggu_pembayaran" : "unknown"
}));
vi.mock("@/lib/buyer/serializers", () => ({ serializeBuyerBid: vi.fn(), serializeBuyerTransaction: vi.fn() }));
vi.mock("@/lib/services/cron.service", () => ({
  processExpiredHandoverConfirmations: vi.fn(),
  processExpiredVickreyAuctions: vi.fn(),
  processHandoverAutoCompletions: vi.fn(),
  processOverdueVickreyPayments: vi.fn()
}));
vi.mock("@/lib/services/notification-events", () => ({
  listActiveAdminUnitNotificationRecipientIds: vi.fn(),
  listActiveSuperAdminNotificationRecipientIds: vi.fn(),
  notifyAdminUnitBidSubmitted: vi.fn(),
  notifyAdminUnitPaymentProofUploaded: vi.fn()
}));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));

import { createFixedPriceMidtransCheckout } from "@/lib/services/buyer.service";

function mockMarketingQuery() {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    account: { accountNumber: "0123" },
                    imageUrl: "/uploads/cincin.jpg",
                    item: { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" },
                    marketing: { mode: "fixed_price", price: "12500000", status: "aktif" },
                    unit: { address: "Jl. Sam Ratulangi", name: "UPC Ranotana" }
                  }
                ])
              })
            })
          })
        })
      })
    })
  };
}

function mockTransactionListQuery(rows: Array<Record<string, unknown>>) {
  return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(rows) }) };
}

function mockExpiredReservationQuery(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(rows)
      })
    })
  };
}

function mockLockedItemQuery() {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          for: vi.fn().mockResolvedValue([
            { id: "barang-1", status: "dipasarkan" }
          ])
        })
      })
    })
  };
}

function mockClaimsQuery(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(rows)
      })
    })
  };
}

function mockBlacklistQuery() {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) })
    })
  };
}

describe("createFixedPriceMidtransCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.db.transaction.mockImplementation(async (callback) => callback(mocks.db));
    mocks.getMidtransGatewayConfig.mockReturnValue({
      isProduction: false,
      serverKey: "SB-Mid-server-test",
      snapApiUrl: "https://app.sandbox.midtrans.com/snap/v1/transactions",
      statusApiBaseUrl: "https://api.sandbox.midtrans.com"
    });
    mocks.getMidtransTransactionStatus.mockResolvedValue({ transaction_status: "pending" });
  });

  it("creates one 15-minute Midtrans reservation and returns the Snap token", async () => {
    mocks.db.select
      .mockImplementationOnce(mockMarketingQuery)
      .mockImplementationOnce(mockBlacklistQuery)
      .mockImplementationOnce(() => mockExpiredReservationQuery([]))
      .mockImplementationOnce(mockLockedItemQuery)
      .mockImplementationOnce(mockMarketingQuery)
      .mockImplementationOnce(() => mockClaimsQuery([]));
    const valuesSpy = vi.fn((values) => ({ returning: vi.fn().mockResolvedValue([values]) }));
    mocks.db.insert.mockReturnValue({ values: valuesSpy });
    mocks.db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: "created" }]) })
      })
    });
    mocks.createMidtransSnapTransaction.mockResolvedValue({
      redirectUrl: "https://app.sandbox.midtrans.com/snap/v2/checkout",
      token: "snap-token-1"
    });

    const result = await createFixedPriceMidtransCheckout("buyer-1", "pemasaran-1");

    expect(result).toEqual({
      snapRedirectUrl: "https://app.sandbox.midtrans.com/snap/v2/checkout",
      snapToken: "snap-token-1",
      transactionId: expect.any(String)
    });
    const inserted = valuesSpy.mock.calls[0][0];
    expect(inserted).toMatchObject({
      paymentMethod: "midtrans",
      paymentProvider: "midtrans",
      status: "menunggu_pembayaran"
    });
    expect(inserted.paymentOrderId).toBe(`FP-${inserted.id}`);
    expect(mocks.createMidtransSnapTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 12_500_000, itemName: "Cincin Emas", orderId: inserted.paymentOrderId })
    );
  });

  it("does not reserve a catalog item when Midtrans is not configured", async () => {
    mocks.getMidtransGatewayConfig.mockImplementation(() => {
      throw new Error("Konfigurasi Midtrans belum lengkap.");
    });

    await expect(createFixedPriceMidtransCheckout("buyer-1", "pemasaran-1")).rejects.toThrow(
      "Konfigurasi Midtrans belum lengkap."
    );

    expect(mocks.db.insert).not.toHaveBeenCalled();
  });

  it("releases an expired Midtrans reservation before creating a new checkout", async () => {
    mocks.db.select
      .mockImplementationOnce(mockMarketingQuery)
      .mockImplementationOnce(mockBlacklistQuery)
      .mockImplementationOnce(() =>
        mockExpiredReservationQuery([
          {
            transaction: {
              id: "expired-transaction",
              paymentDeadline: new Date(Date.now() - 60_000),
              paymentMethod: "midtrans",
              paymentOrderId: "FP-expired",
              status: "menunggu_pembayaran",
              userId: "buyer-lama",
              type: "fixed_price"
            }
          }
        ])
      )
      .mockImplementationOnce(mockLockedItemQuery)
      .mockImplementationOnce(mockLockedItemQuery)
      .mockImplementationOnce(mockMarketingQuery)
      .mockImplementationOnce(() => mockClaimsQuery([]));
    const valuesSpy = vi.fn((values) => ({ returning: vi.fn().mockResolvedValue([values]) }));
    const setSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: "expired-transaction" }]) })
    });
    mocks.db.insert.mockReturnValue({ values: valuesSpy });
    mocks.db.update.mockReturnValue({ set: setSpy });
    mocks.getMidtransTransactionStatus.mockResolvedValue({ transaction_status: "expire" });
    mocks.createMidtransSnapTransaction.mockResolvedValue({
      redirectUrl: "https://app.sandbox.midtrans.com/snap/v2/checkout",
      token: "snap-token-2"
    });

    await createFixedPriceMidtransCheckout("buyer-1", "pemasaran-1");

    expect(mocks.getMidtransTransactionStatus).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "FP-expired" })
    );
    expect(setSpy.mock.calls[0][0]).toMatchObject({ gatewayStatus: "expire", status: "gagal" });
    expect(valuesSpy).toHaveBeenCalledTimes(1);
  });

  it("reuses the buyer's pending reservation instead of creating a second Midtrans order", async () => {
    const existing = {
      id: "trx-existing",
      paymentMethod: "midtrans",
      paymentToken: "snap-existing",
      paymentRedirectUrl: "https://example.test/checkout",
      paymentDeadline: new Date(Date.now() + 60_000),
      status: "menunggu_pembayaran",
      type: "fixed_price",
      userId: "buyer-1"
    };

    mocks.db.select
      .mockImplementationOnce(mockMarketingQuery)
      .mockImplementationOnce(mockBlacklistQuery)
      .mockImplementationOnce(() => mockExpiredReservationQuery([]))
      .mockImplementationOnce(mockLockedItemQuery)
      .mockImplementationOnce(mockMarketingQuery)
      .mockImplementationOnce(() => mockClaimsQuery([{ transaction: existing, marketing: { id: "pemasaran-1" } }]));

    const result = await createFixedPriceMidtransCheckout("buyer-1", "pemasaran-1");

    expect(result).toEqual({
      transactionId: "trx-existing",
      snapToken: "snap-existing",
      snapRedirectUrl: "https://example.test/checkout"
    });
    expect(mocks.db.insert).not.toHaveBeenCalled();
    expect(mocks.createMidtransSnapTransaction).not.toHaveBeenCalled();
  });
});
