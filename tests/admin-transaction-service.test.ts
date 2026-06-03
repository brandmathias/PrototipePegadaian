import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query: any = {};
  query.from = vi.fn(() => query);
  query.innerJoin = vi.fn(() => query);
  query.leftJoin = vi.fn(() => query);
  query.where = vi.fn(() => query);
  query.limit = vi.fn();

  return {
    db: {
      select: vi.fn(() => query),
      update: vi.fn()
    },
    query,
    serializeAdminTransaction: vi.fn((row) => row),
    notifyPaymentRejected: vi.fn()
  };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("@/lib/admin-unit/serializers", () => ({
  serializeAdminTransaction: mocks.serializeAdminTransaction
}));

vi.mock("@/lib/services/notification-events", () => ({
  notifyPaymentRejected: mocks.notifyPaymentRejected,
  notifyPaymentVerified: vi.fn()
}));

import { rejectAdminTransactionProof } from "@/lib/services/admin-transaction.service";

function makeTransactionJoin(status = "ditolak_bukti") {
  const date = new Date("2026-06-03T09:01:10.537Z");

  return {
    transaction: {
      id: "trx-fixed-rejected",
      pemasaranId: "pm-fixed",
      userId: "buyer-1",
      type: "fixed_price",
      amount: "10000000",
      paymentMethod: "transfer",
      status,
      proofUrl: "/uploads/bukti/transfer.jpg",
      rejectionReason: "Nominal uang yang dikirim tidak sesuai harga barang",
      referenceNumber: null,
      paymentDeadline: new Date("2026-06-04T00:07:15.379Z"),
      verifiedByUserId: null,
      verifiedAt: null,
      createdAt: date,
      updatedAt: date
    },
    item: {
      id: "barang-1",
      name: "Cincin Emas Berlian"
    },
    imageUrl: "/uploads/barang/cincin.jpg",
    unit: {
      name: "UPC Ranotana",
      address: "Jl. Sam Ratulangi"
    },
    buyer: {
      name: "Buyer Satu",
      email: "buyer1@mail.com",
      phoneNumber: "6281200001001",
      nationalId: "1234567890"
    },
    buyerProfile: null,
    account: null
  };
}

describe("admin transaction service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.limit.mockResolvedValue([makeTransactionJoin()]);
  });

  it("treats an already rejected fixed price proof as an idempotent result", async () => {
    const result = await rejectAdminTransactionProof("unit-1", "trx-fixed-rejected", {
      reason: "Nominal uang yang dikirim tidak sesuai harga barang"
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: "trx-fixed-rejected",
        status: "ditolak_bukti",
        proofUrl: "/uploads/bukti/transfer.jpg",
        rejectionReason: "Nominal uang yang dikirim tidak sesuai harga barang"
      })
    );
    expect(mocks.db.update).not.toHaveBeenCalled();
    expect(mocks.notifyPaymentRejected).not.toHaveBeenCalled();
    expect(mocks.serializeAdminTransaction).toHaveBeenCalledTimes(1);
  });
});
