import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createMidtransSnapTransaction: vi.fn(),
  db: { insert: vi.fn(), select: vi.fn(), update: vi.fn() },
  getMidtransGatewayConfig: vi.fn(),
  revalidateTag: vi.fn()
}));

vi.mock("@/lib/db/client", () => ({ db: mocks.db }));
vi.mock("@/lib/payments/midtrans", () => ({
  MIDTRANS_RESERVATION_MINUTES: 15,
  createMidtransSnapTransaction: mocks.createMidtransSnapTransaction,
  getMidtransGatewayConfig: mocks.getMidtransGatewayConfig
}));
vi.mock("@/lib/buyer/serializers", () => ({ serializeBuyerBid: vi.fn(), serializeBuyerTransaction: vi.fn() }));
vi.mock("@/lib/services/cron.service", () => ({
  processExpiredHandoverConfirmations: vi.fn(),
  processExpiredVickreyAuctions: vi.fn(),
  processHandoverAutoCompletions: vi.fn(),
  processOverdueFixedPricePayments: vi.fn(),
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
import { MIDTRANS_SNAP_ENABLED_PAYMENTS } from "@/lib/payments/midtrans-payment-options";

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
    mocks.getMidtransGatewayConfig.mockReturnValue({
      isProduction: false,
      serverKey: "SB-Mid-server-test",
      snapApiUrl: "https://app.sandbox.midtrans.com/snap/v1/transactions",
      statusApiBaseUrl: "https://api.sandbox.midtrans.com"
    });
  });

  it("creates one 15-minute Midtrans reservation and returns the Snap token", async () => {
    mocks.db.select
      .mockImplementationOnce(mockMarketingQuery)
      .mockImplementationOnce(() => mockTransactionListQuery([]))
      .mockImplementationOnce(mockBlacklistQuery);
    const valuesSpy = vi.fn((values) => ({ returning: vi.fn().mockResolvedValue([values]) }));
    mocks.db.insert.mockReturnValue({ values: valuesSpy });
    mocks.db.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) });
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
      expect.objectContaining({
        amount: 12_500_000,
        enabledPayments: MIDTRANS_SNAP_ENABLED_PAYMENTS,
        itemName: "Cincin Emas",
        orderId: inserted.paymentOrderId
      })
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
      .mockImplementationOnce(() =>
        mockTransactionListQuery([
          {
            id: "expired-transaction",
            paymentDeadline: new Date(Date.now() - 60_000),
            paymentMethod: "midtrans",
            status: "menunggu_pembayaran",
            userId: "buyer-lama"
          }
        ])
      )
      .mockImplementationOnce(mockBlacklistQuery);
    const valuesSpy = vi.fn((values) => ({ returning: vi.fn().mockResolvedValue([values]) }));
    const setSpy = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
    mocks.db.insert.mockReturnValue({ values: valuesSpy });
    mocks.db.update.mockReturnValue({ set: setSpy });
    mocks.createMidtransSnapTransaction.mockResolvedValue({
      redirectUrl: "https://app.sandbox.midtrans.com/snap/v2/checkout",
      token: "snap-token-2"
    });

    await createFixedPriceMidtransCheckout("buyer-1", "pemasaran-1");

    expect(setSpy.mock.calls[0][0]).toMatchObject({ gatewayStatus: "expire", status: "gagal" });
    expect(valuesSpy).toHaveBeenCalledTimes(1);
  });

  it("blocks a buyer who already has an active fixed-price invoice for another item", async () => {
    mocks.db.select
      .mockImplementationOnce(mockMarketingQuery)
      .mockImplementationOnce(() =>
        mockTransactionListQuery([
          {
            id: "active-invoice",
            pemasaranId: "pemasaran-lain",
            userId: "buyer-1",
            type: "fixed_price",
            paymentDeadline: new Date(Date.now() + 60_000),
            paymentMethod: "midtrans",
            status: "menunggu_pembayaran"
          }
        ])
      );
    mocks.db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) })
    });

    await expect(
      createFixedPriceMidtransCheckout("buyer-1", "pemasaran-1")
    ).rejects.toThrow("pembayaran Harga Tetap yang aktif");

    expect(mocks.db.insert).not.toHaveBeenCalled();
    expect(mocks.createMidtransSnapTransaction).not.toHaveBeenCalled();
  });

  it("allows a buyer to create another checkout after the earlier invoice failed", async () => {
    mocks.db.select
      .mockImplementationOnce(mockMarketingQuery)
      .mockImplementationOnce(() =>
        mockTransactionListQuery([
          {
            id: "failed-invoice",
            pemasaranId: "pemasaran-lain",
            userId: "buyer-1",
            type: "fixed_price",
            paymentDeadline: new Date(Date.now() - 60_000),
            paymentMethod: "midtrans",
            status: "gagal"
          }
        ])
      )
      .mockImplementationOnce(mockBlacklistQuery);
    const valuesSpy = vi.fn((values) => ({ returning: vi.fn().mockResolvedValue([values]) }));
    mocks.db.insert.mockReturnValue({ values: valuesSpy });
    mocks.db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) })
    });
    mocks.createMidtransSnapTransaction.mockResolvedValue({
      redirectUrl: "https://app.sandbox.midtrans.com/snap/v2/checkout",
      token: "snap-token-after-failed-invoice"
    });

    await expect(createFixedPriceMidtransCheckout("buyer-1", "pemasaran-1")).resolves.toEqual(
      expect.objectContaining({ transactionId: expect.any(String) })
    );

    expect(valuesSpy).toHaveBeenCalledTimes(1);
  });

  it("returns the active-invoice conflict when the database rejects a concurrent checkout", async () => {
    mocks.db.select
      .mockImplementationOnce(mockMarketingQuery)
      .mockImplementationOnce(() => mockTransactionListQuery([]))
      .mockImplementationOnce(mockBlacklistQuery);
    mocks.db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) })
    });
    mocks.db.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(
          Object.assign(new Error("duplicate key value violates unique constraint"), {
            code: "23505",
            constraint: "transaksi_fixed_price_buyer_active_unique"
          })
        )
      })
    });

    await expect(
      createFixedPriceMidtransCheckout("buyer-1", "pemasaran-1")
    ).rejects.toThrow("pembayaran Harga Tetap yang aktif");
  });
});
