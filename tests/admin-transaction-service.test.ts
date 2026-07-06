import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
      insert: vi.fn(),
      update: vi.fn()
    },
    query,
    revalidateTag: vi.fn(),
    serializeAdminTransaction: vi.fn((row) => row),
    notifyPaymentRejected: vi.fn(),
    notifyPaymentVerified: vi.fn()
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
  notifyPaymentVerified: mocks.notifyPaymentVerified
}));

vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag
}));

import {
  rejectAdminTransactionProof,
  uploadAdminTransactionHandoverProof,
  verifyAdminTransaction
} from "@/lib/services/admin-transaction.service";

function makeTransactionJoin(status = "ditolak_bukti", type = "fixed_price") {
  const date = new Date("2026-06-03T09:01:10.537Z");

  return {
    transaction: {
      id: "trx-fixed-rejected",
      pemasaranId: "pm-fixed",
      userId: "buyer-1",
      type,
      amount: "10000000",
      paymentMethod: "transfer",
      status,
      proofUrl: "/uploads/bukti/transfer.jpg",
      rejectionReason: "Nominal uang yang dikirim tidak sesuai harga barang",
      referenceNumber: null,
      paymentDeadline: new Date("2026-06-04T00:07:15.379Z"),
      verifiedByUserId: null,
      verifiedAt: null,
      handoverProofUrl: null,
      handoverProofUploadedAt: null,
      handoverProofUploadedByUserId: null,
      createdAt: date,
      updatedAt: date
    },
    item: {
      id: "barang-1",
      name: "Cincin Emas Berlian",
      status: "dipasarkan"
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
    mocks.query.limit.mockReset();
    mocks.query.limit.mockResolvedValue([makeTransactionJoin()]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function mockUpdateReturning(row?: Record<string, unknown>) {
    return {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(row ? [row] : [])
        })
      })
    };
  }

  function mockUpdateOnly() {
    return {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      })
    };
  }

  function mockInsertValues() {
    return vi.fn().mockResolvedValue(undefined);
  }

  function expectTransactionViewsRevalidated() {
    expect(mocks.revalidateTag).toHaveBeenCalledWith("admin-layout");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("admin-dashboard");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("public-catalog-lots");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("superadmin-monitoring");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("superadmin-unit-detail");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("superadmin-unit-barang-detail");
  }

  it("treats an already rejected harga tetap proof as an idempotent result", async () => {
    const result = await rejectAdminTransactionProof("unit-1", "admin-1", "trx-fixed-rejected", {
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
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
    expect(mocks.serializeAdminTransaction).toHaveBeenCalledTimes(1);
  });

  it("records sold item history when admin verifies a harga tetap payment", async () => {
    const verifiedAt = new Date("2026-06-03T10:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(verifiedAt);
    mocks.query.limit.mockResolvedValue([makeTransactionJoin("bukti_diunggah", "fixed_price")]);

    const updatedTransaction = {
      ...makeTransactionJoin("bukti_diunggah", "fixed_price").transaction,
      status: "lunas",
      referenceNumber: "BRI-2026-001",
      verifiedByUserId: "admin-1",
      verifiedAt
    };
    const statusHistoryValuesSpy = mockInsertValues();

    mocks.db.update
      .mockImplementationOnce(() => mockUpdateReturning(updatedTransaction))
      .mockImplementationOnce(() => mockUpdateOnly())
      .mockImplementationOnce(() => mockUpdateOnly());
    mocks.db.insert.mockImplementationOnce(() => ({
      values: statusHistoryValuesSpy
    }));

    await verifyAdminTransaction("unit-1", "admin-1", "trx-fixed-rejected", {
      reference: "BRI-2026-001"
    });

    expect(statusHistoryValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        barangId: "barang-1",
        oldStatus: "dipasarkan",
        newStatus: "terjual",
        changedByUserId: "admin-1",
        note: expect.stringMatching(/harga tetap disetujui/i)
      })
    );
    expectTransactionViewsRevalidated();

  });

  it("records failed item history when admin rejects a harga tetap proof", async () => {
    const updatedTransaction = {
      ...makeTransactionJoin("bukti_diunggah", "fixed_price").transaction,
      status: "ditolak_bukti",
      rejectionReason: "Nominal uang yang dikirim tidak sesuai harga barang",
      verifiedByUserId: "admin-1",
      verifiedAt: new Date("2026-06-03T10:00:00.000Z")
    };
    mocks.query.limit
      .mockResolvedValueOnce([makeTransactionJoin("bukti_diunggah", "fixed_price")])
      .mockResolvedValueOnce([
        {
          ...makeTransactionJoin("ditolak_bukti", "fixed_price"),
          transaction: updatedTransaction,
          paymentVerifier: { name: "Maria Supit" }
        }
      ]);
    const statusHistoryValuesSpy = mockInsertValues();

    mocks.db.update.mockImplementationOnce(() => mockUpdateReturning(updatedTransaction));
    mocks.db.insert.mockImplementationOnce(() => ({
      values: statusHistoryValuesSpy
    }));

    await rejectAdminTransactionProof("unit-1", "admin-1", "trx-fixed-rejected", {
      reason: "Nominal uang yang dikirim tidak sesuai harga barang"
    });

    expect(statusHistoryValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        barangId: "barang-1",
        oldStatus: "dipasarkan",
        newStatus: "gagal",
        changedByUserId: "admin-1",
        note: expect.stringMatching(/harga tetap ditolak/i)
      })
    );
    expect(mocks.serializeAdminTransaction).toHaveBeenLastCalledWith(
      expect.objectContaining({
        verifiedByName: "Maria Supit"
      })
    );
    expectTransactionViewsRevalidated();
  });

  it("stores admin-uploaded handover proof without changing the transaction status", async () => {
    const uploadedAt = new Date("2026-06-03T11:15:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(uploadedAt);
    mocks.query.limit.mockResolvedValue([makeTransactionJoin("lunas", "fixed_price")]);

    const updatedTransaction = {
      ...makeTransactionJoin("lunas", "fixed_price").transaction,
      handoverProofUrl: "/uploads/serah-terima/trx-fixed-rejected.jpg",
      handoverProofUploadedAt: uploadedAt,
      handoverProofUploadedByUserId: "admin-1"
    };
    const setSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([updatedTransaction])
      })
    });
    mocks.db.update.mockImplementationOnce(() => ({
      set: setSpy
    }));

    await uploadAdminTransactionHandoverProof("unit-1", "admin-1", "trx-fixed-rejected", {
      fileName: "/uploads/serah-terima/trx-fixed-rejected.jpg"
    });

    const [setPayload] = setSpy.mock.calls[0] as [Record<string, unknown>];

    expect(setPayload).toEqual(
      expect.objectContaining({
        handoverProofUrl: "/uploads/serah-terima/trx-fixed-rejected.jpg",
        handoverProofUploadedAt: uploadedAt,
        handoverProofUploadedByUserId: "admin-1"
      })
    );
    expect(setPayload).not.toHaveProperty("status");
    expectTransactionViewsRevalidated();
  });
});
