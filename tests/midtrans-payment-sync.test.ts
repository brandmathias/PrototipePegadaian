import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: { select: vi.fn(), update: vi.fn(), transaction: vi.fn() },
  getMidtransTransactionStatus: vi.fn(),
  listActiveAdminUnitNotificationRecipientIds: vi.fn(),
  listActiveSuperAdminNotificationRecipientIds: vi.fn(),
  notifyAdminUnitMidtransPaymentVerified: vi.fn(),
  notifyFixedPricePaymentFailed: vi.fn(),
  notifyPaymentVerified: vi.fn(),
  notifySuperAdminPaymentVerified: vi.fn(),
  revalidateTransactionViews: vi.fn()
}));

vi.mock("@/lib/db/client", () => ({ db: mocks.db }));
vi.mock("@/lib/payments/midtrans", () => ({
  getMidtransTransactionStatus: mocks.getMidtransTransactionStatus,
  mapMidtransTransactionStatus: (status: string) =>
    status === "pending"
      ? "menunggu_pembayaran"
      : status === "expire"
        ? "gagal"
        : status === "settlement" || status === "capture"
          ? "lunas"
          : "unknown"
}));
vi.mock("@/lib/services/notification-events", () => ({
  listActiveAdminUnitNotificationRecipientIds: mocks.listActiveAdminUnitNotificationRecipientIds,
  listActiveSuperAdminNotificationRecipientIds: mocks.listActiveSuperAdminNotificationRecipientIds,
  notifyAdminUnitMidtransPaymentVerified: mocks.notifyAdminUnitMidtransPaymentVerified,
  notifyPaymentVerified: mocks.notifyPaymentVerified,
  notifySuperAdminPaymentVerified: mocks.notifySuperAdminPaymentVerified,
  notifyFixedPricePaymentFailed: mocks.notifyFixedPricePaymentFailed
}));
vi.mock("@/lib/services/revalidate-transaction-views", () => ({
  revalidateTransactionViews: mocks.revalidateTransactionViews
}));

function mockTransactionLookup(row: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([row]) })
          })
        })
      })
    })
  };
}

describe("Midtrans payment status sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getMidtransTransactionStatus.mockResolvedValue({
      order_id: "FP-trx-1",
      gross_amount: "12500000",
      status_code: "201",
      transaction_status: "expire"
    });
    mocks.db.select.mockReturnValue(
      mockTransactionLookup({
        transaction: {
          id: "trx-1",
          userId: "buyer-1",
          amount: "12500000",
          paymentProvider: "midtrans",
          status: "menunggu_pembayaran"
        },
        item: { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" },
        marketing: { id: "pemasaran-1" },
        unit: { id: "unit-1", name: "UPC Ranotana", address: "Manado" }
      })
    );

    const returning = vi.fn().mockResolvedValue([{ id: "trx-1", userId: "buyer-1" }]);
    mocks.db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning })
      })
    });
  });

  it("moves an expired pending payment to failed and emits the buyer update", async () => {
    const { syncMidtransTransactionStatus } = await import("@/lib/services/midtrans-payment.service");

    const result = await syncMidtransTransactionStatus({
      config: {
        isProduction: false,
        serverKey: "SB-Mid-server-test",
        snapApiUrl: "https://app.sandbox.midtrans.com/snap/v1/transactions",
        statusApiBaseUrl: "https://api.sandbox.midtrans.com"
      },
      orderId: "FP-trx-1",
      userId: "buyer-1"
    });

    expect(result).toEqual({ changed: true, status: "gagal", transactionId: "trx-1" });
    expect(mocks.db.update).toHaveBeenCalledTimes(1);
    expect(mocks.notifyFixedPricePaymentFailed).toHaveBeenCalledWith({
      userId: "buyer-1",
      transactionId: "trx-1",
      lotName: "Cincin Emas"
    });
    expect(mocks.revalidateTransactionViews).toHaveBeenCalledTimes(1);
  });

  it("settles a successful pending payment and preserves the completed workflow transition", async () => {
    mocks.getMidtransTransactionStatus.mockResolvedValue({
      order_id: "FP-trx-1",
      gross_amount: "12500000",
      status_code: "200",
      transaction_status: "settlement",
      transaction_id: "midtrans-1",
      payment_type: "bank_transfer",
      fraud_status: "accept"
    });
    mocks.listActiveAdminUnitNotificationRecipientIds.mockResolvedValue(["admin-1"]);
    mocks.listActiveSuperAdminNotificationRecipientIds.mockResolvedValue(["superadmin-1"]);

    const transactionUpdate = {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "trx-1", userId: "buyer-1" }])
        })
      })
    };
    const followUpUpdate = {
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    };
    const transactionContext = {
      update: vi.fn().mockReturnValueOnce(transactionUpdate).mockReturnValue(followUpUpdate),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) })
    };
    mocks.db.transaction.mockImplementation(async (callback: (tx: typeof transactionContext) => Promise<unknown>) =>
      callback(transactionContext)
    );

    const { syncMidtransTransactionStatus } = await import("@/lib/services/midtrans-payment.service");

    const result = await syncMidtransTransactionStatus({
      config: {
        isProduction: false,
        serverKey: "SB-Mid-server-test",
        snapApiUrl: "https://app.sandbox.midtrans.com/snap/v1/transactions",
        statusApiBaseUrl: "https://api.sandbox.midtrans.com"
      },
      orderId: "FP-trx-1",
      userId: "buyer-1"
    });

    expect(result).toEqual({ changed: true, status: "lunas", transactionId: "trx-1" });
    expect(transactionContext.update).toHaveBeenCalledTimes(3);
    expect(transactionContext.insert).toHaveBeenCalledTimes(1);
    expect(mocks.notifyPaymentVerified).toHaveBeenCalledWith(
      expect.objectContaining({ transactionId: "trx-1", paymentProvider: "midtrans" })
    );
    expect(mocks.notifyAdminUnitMidtransPaymentVerified).toHaveBeenCalledWith(
      expect.objectContaining({ adminUserIds: ["admin-1"], transactionId: "trx-1" })
    );
    expect(mocks.notifySuperAdminPaymentVerified).toHaveBeenCalledWith(
      expect.objectContaining({ superAdminUserIds: ["superadmin-1"], transactionId: "trx-1" })
    );
    expect(mocks.revalidateTransactionViews).toHaveBeenCalledTimes(1);
  });
});
