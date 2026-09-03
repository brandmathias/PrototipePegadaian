import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: { select: vi.fn(), update: vi.fn(), transaction: vi.fn() },
  getMidtransGatewayConfig: vi.fn(),
  getMidtransTransactionStatus: vi.fn(),
  listActiveAdminUnitNotificationRecipientIds: vi.fn(),
  listActiveSuperAdminNotificationRecipientIds: vi.fn(),
  notifyAdminUnitMidtransPaymentVerified: vi.fn(),
  notifyPaymentVerified: vi.fn(),
  notifySuperAdminPaymentVerified: vi.fn(),
  revalidateTransactionViews: vi.fn(),
  verifyMidtransNotificationSignature: vi.fn()
}));

vi.mock("@/lib/db/client", () => ({ db: mocks.db }));
vi.mock("@/lib/payments/midtrans", () => ({
  getMidtransGatewayConfig: mocks.getMidtransGatewayConfig,
  getMidtransTransactionStatus: mocks.getMidtransTransactionStatus,
  mapMidtransTransactionStatus: (status: string) => (status === "pending" ? "menunggu_pembayaran" : "unknown"),
  verifyMidtransNotificationSignature: mocks.verifyMidtransNotificationSignature
}));
vi.mock("@/lib/services/notification-events", () => ({
  listActiveAdminUnitNotificationRecipientIds: mocks.listActiveAdminUnitNotificationRecipientIds,
  listActiveSuperAdminNotificationRecipientIds: mocks.listActiveSuperAdminNotificationRecipientIds,
  notifyAdminUnitMidtransPaymentVerified: mocks.notifyAdminUnitMidtransPaymentVerified,
  notifyPaymentVerified: mocks.notifyPaymentVerified,
  notifySuperAdminPaymentVerified: mocks.notifySuperAdminPaymentVerified
}));
vi.mock("@/lib/services/revalidate-transaction-views", () => ({ revalidateTransactionViews: mocks.revalidateTransactionViews }));

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

function mockLockedItemLookup() {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          for: vi.fn().mockResolvedValue([{ id: "barang-1", status: "dipasarkan" }])
        })
      })
    })
  };
}

describe("Midtrans notification route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.db.transaction.mockImplementation(async (callback) => callback(mocks.db));
    mocks.getMidtransGatewayConfig.mockReturnValue({ serverKey: "SB-Mid-server-test" });
    mocks.verifyMidtransNotificationSignature.mockReturnValue(true);
    mocks.db.select
      .mockImplementationOnce(() => mockTransactionLookup({
        transaction: {
          id: "trx-1",
          amount: "12500000",
          type: "fixed_price",
          paymentMethod: "midtrans",
          paymentProvider: "midtrans",
          status: "menunggu_pembayaran"
        },
        item: { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" },
        marketing: { id: "pemasaran-1" },
        unit: { id: "unit-1", name: "UPC Ranotana", address: "Manado" }
      }))
      .mockImplementationOnce(mockLockedItemLookup);
    mocks.db.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) });
  });

  it("records a pending gateway state without selling the item", async () => {
    mocks.getMidtransTransactionStatus.mockResolvedValue({
      order_id: "FP-trx-1",
      gross_amount: "12500000",
      status_code: "201",
      transaction_status: "pending"
    });

    const { POST } = await import("@/app/api/payments/midtrans/notification/route");
    const response = await POST(
      new Request("http://localhost/api/payments/midtrans/notification", {
        method: "POST",
        body: JSON.stringify({
          order_id: "FP-trx-1",
          gross_amount: "12500000",
          status_code: "201",
          signature_key: "valid"
        })
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.db.update).toHaveBeenCalledTimes(1);
    expect(mocks.db.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.notifyPaymentVerified).not.toHaveBeenCalled();
  });

  it("rejects a notification with an invalid signature before checking Midtrans", async () => {
    mocks.verifyMidtransNotificationSignature.mockReturnValue(false);

    const { POST } = await import("@/app/api/payments/midtrans/notification/route");
    const response = await POST(
      new Request("http://localhost/api/payments/midtrans/notification", {
        method: "POST",
        body: JSON.stringify({
          order_id: "FP-trx-1",
          gross_amount: "12500000",
          status_code: "201",
          signature_key: "forged"
        })
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.getMidtransTransactionStatus).not.toHaveBeenCalled();
    expect(mocks.db.select).not.toHaveBeenCalled();
  });
});
