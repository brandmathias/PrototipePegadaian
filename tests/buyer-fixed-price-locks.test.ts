import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn()
  };

  return {
    db,
    listActiveAdminUnitNotificationRecipientIds: vi.fn().mockResolvedValue(["admin-unit-1"]),
    listActiveSuperAdminNotificationRecipientIds: vi.fn().mockResolvedValue(["superadmin-1"]),
    notifyAdminUnitPaymentProofUploaded: vi.fn(),
    revalidateTag: vi.fn(),
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

vi.mock("@/lib/services/cron.service", () => ({
  processExpiredVickreyAuctions: vi.fn(),
  processOverdueVickreyPayments: vi.fn(),
  processHandoverAutoCompletions: vi.fn()
}));

vi.mock("@/lib/services/notification-events", () => ({
  listActiveAdminUnitNotificationRecipientIds: mocks.listActiveAdminUnitNotificationRecipientIds,
  listActiveSuperAdminNotificationRecipientIds: mocks.listActiveSuperAdminNotificationRecipientIds,
  notifyAdminUnitPaymentProofUploaded: mocks.notifyAdminUnitPaymentProofUploaded
}));

vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag
}));

import { createFixedPricePurchase, uploadBuyerPaymentProof } from "@/lib/services/buyer.service";

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
      where: vi.fn().mockResolvedValue(rows),
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(rows)
      })
    })
  };
}

function mockTransactionLockQuery(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          for: vi.fn().mockResolvedValue(rows)
        })
      })
    })
  };
}

function mockCurrentTransactionQuery(row: Record<string, unknown>) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([row])
      })
    })
  };
}

function mockFixedPriceClaimQuery(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(rows)
      })
    })
  };
}

function mockFixedPriceClaimLockQuery(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(rows)
        })
      })
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

function mockTransactionDetailQuery(row: Record<string, unknown>) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
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
    })
  };
}

describe("createFixedPricePurchase locking rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.db.transaction.mockImplementation(async (callback) => callback(mocks.db));
  });

  function expectTransactionViewsRevalidated() {
    expect(mocks.revalidateTag).toHaveBeenCalledWith("admin-layout");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("admin-dashboard");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("public-catalog-lots");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("superadmin-monitoring");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("superadmin-unit-detail");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("superadmin-unit-barang-detail");
  }

  it("creates a harga tetap transaction in waiting payment before receiving payment proof", async () => {
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
      .mockImplementationOnce(() => mockBlacklistQuery())
      .mockImplementationOnce(() =>
        mockTransactionLockQuery([
          { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" }
        ])
      )
      .mockImplementationOnce(() =>
        mockMarketingQuery({
          marketing: { mode: "fixed_price", status: "aktif", price: "12500000" },
          item: { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" },
          unit: { name: "UPC Ranotana", address: "Jl. Sam Ratulangi" },
          account: { accountNumber: "0123-4567-8901-234" },
          media: { url: "/uploads/cincin.jpg" }
        })
      )
      .mockImplementationOnce(() => mockTransactionListQuery([]));

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
          proofUrl: null,
          referenceNumber: null,
          paymentDeadline: null,
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
    expect(insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "menunggu_pembayaran",
        proofUrl: null,
        referenceNumber: null,
        paymentDeadline: null
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: "trx-baru-1",
        status: "menunggu_pembayaran",
        userId: "buyer-baru"
      })
    );
    expectTransactionViewsRevalidated();
  });

  it("blocks another buyer while the earlier buyer is only waiting for payment", async () => {
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
      .mockImplementationOnce(() => mockBlacklistQuery())
      .mockImplementationOnce(() =>
        mockTransactionLockQuery([
          { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" }
        ])
      )
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
            transaction: {
              id: "trx-other-2",
              userId: "buyer-lain",
              type: "fixed_price",
              status: "menunggu_pembayaran",
              createdAt: new Date("2026-05-27T09:00:00.000Z")
            },
            marketing: { id: "pemasaran-1" }
          }
        ])
      );

    await expect(
      createFixedPricePurchase("buyer-baru", "pemasaran-1", {
        paymentMethod: "transfer"
      })
    ).rejects.toThrow("Barang sedang dalam proses pembelian oleh pembeli lain.");

    expect(mocks.db.insert).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("blocks another buyer once the earlier buyer has uploaded payment proof", async () => {
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
      .mockImplementationOnce(() => mockBlacklistQuery())
      .mockImplementationOnce(() =>
        mockTransactionLockQuery([
          { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" }
        ])
      )
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
            transaction: {
              id: "trx-other-proof",
              userId: "buyer-lain",
              type: "fixed_price",
              status: "bukti_diunggah",
              createdAt: new Date("2026-05-27T09:00:00.000Z")
            },
            marketing: { id: "pemasaran-1" }
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

  it("reports a clear business conflict when a first-screen proof loses the fixed-price claim race", async () => {
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
      .mockImplementationOnce(() => mockBlacklistQuery())
      .mockImplementationOnce(() =>
        mockTransactionLockQuery([
          { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" }
        ])
      )
      .mockImplementationOnce(() =>
        mockMarketingQuery({
          marketing: { mode: "fixed_price", status: "aktif", price: "12500000" },
          item: { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" },
          unit: { name: "UPC Ranotana", address: "Jl. Sam Ratulangi" },
          account: { accountNumber: "0123-4567-8901-234" },
          media: { url: "/uploads/cincin.jpg" }
        })
      )
      .mockImplementationOnce(() => mockTransactionListQuery([]));

    mocks.db.insert.mockImplementationOnce(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(
          Object.assign(new Error("duplicate key value violates unique constraint"), {
            code: "23505",
            constraint: "transaksi_fixed_price_claim_unique"
          })
        )
      })
    }));

    await expect(
      createFixedPricePurchase("buyer-baru", "pemasaran-1", {
        paymentMethod: "transfer",
        fileName: "/uploads/bukti/transfer-race.jpg"
      })
    ).rejects.toThrow("Barang sedang dalam proses pembelian oleh pembeli lain.");

    expect(mocks.notifyAdminUnitPaymentProofUploaded).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("uploads buyer payment proof and revalidates synced transaction views", async () => {
    mocks.db.select
      .mockImplementationOnce(() => mockBlacklistQuery())
      .mockImplementationOnce(() =>
        mockTransactionDetailQuery({
          id: "trx-proof-1",
          pemasaranId: "pemasaran-1",
          userId: "buyer-1",
          status: "menunggu_pembayaran",
          paymentMethod: "transfer",
          referenceNumber: "BRI-2026-001",
          proofUrl: null,
          unitId: "unit-1",
          lotId: "barang-1",
          lotName: "Cincin Emas"
        })
      )
      .mockImplementationOnce(() =>
        mockTransactionLockQuery([
          { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" }
        ])
      )
      .mockImplementationOnce(() =>
        mockCurrentTransactionQuery({
          id: "trx-proof-1",
          userId: "buyer-1",
          status: "menunggu_pembayaran",
          paymentMethod: "transfer",
          referenceNumber: "BRI-2026-001"
        })
      )
      .mockImplementationOnce(() => mockFixedPriceClaimLockQuery([]));

    const updatedAt = new Date("2026-05-27T09:10:00.000Z");
    const setSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: "trx-proof-1",
            pemasaranId: "pemasaran-1",
            userId: "buyer-1",
            type: "fixed_price",
            amount: "12500000",
            paymentMethod: "transfer",
            status: "bukti_diunggah",
            proofUrl: "/uploads/bukti/transfer-baru.jpg",
            referenceNumber: "BRI-2026-002",
            paymentDeadline: null,
            createdAt: updatedAt,
            updatedAt
          }
        ])
      })
    });

    mocks.db.update.mockImplementationOnce(() => ({
      set: setSpy
    }));

    await uploadBuyerPaymentProof("buyer-1", "trx-proof-1", {
      fileName: "/uploads/bukti/transfer-baru.jpg",
      reference: "BRI-2026-002"
    });

    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "bukti_diunggah",
        proofUrl: "/uploads/bukti/transfer-baru.jpg",
        referenceNumber: "BRI-2026-002"
      })
    );
    expect(mocks.notifyAdminUnitPaymentProofUploaded).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: "trx-proof-1",
        pemasaranId: "pemasaran-1",
        barangId: "barang-1",
        unitId: "unit-1",
        superAdminUserIds: ["superadmin-1"],
        lotName: "Cincin Emas"
      })
    );
    expectTransactionViewsRevalidated();
  });

  it("blocks proof upload when another buyer claims the same item first", async () => {
    mocks.db.select
      .mockImplementationOnce(() => mockBlacklistQuery())
      .mockImplementationOnce(() =>
        mockTransactionDetailQuery({
          id: "trx-proof-race",
          pemasaranId: "pemasaran-1",
          userId: "buyer-1",
          status: "menunggu_pembayaran",
          paymentMethod: "transfer",
          referenceNumber: "BRI-2026-001",
          proofUrl: null,
          unitId: "unit-1",
          lotId: "barang-1",
          lotName: "Cincin Emas"
        })
      )
      .mockImplementationOnce(() =>
        mockTransactionLockQuery([
          { id: "barang-1", name: "Cincin Emas", status: "dipasarkan" }
        ])
      )
      .mockImplementationOnce(() =>
        mockCurrentTransactionQuery({
          id: "trx-proof-race",
          userId: "buyer-1",
          status: "menunggu_pembayaran",
          paymentMethod: "transfer",
          referenceNumber: "BRI-2026-001"
        })
      )
      .mockImplementationOnce(() =>
        mockFixedPriceClaimLockQuery([
          { id: "trx-other", userId: "buyer-lain" }
        ])
      );

    await expect(
      uploadBuyerPaymentProof("buyer-1", "trx-proof-race", {
        fileName: "/uploads/bukti/transfer-race.jpg",
        reference: "BRI-2026-002"
      })
    ).rejects.toThrow("Barang sedang dalam proses pembelian oleh pembeli lain.");

    expect(mocks.notifyAdminUnitPaymentProofUploaded).not.toHaveBeenCalled();
    expect(mocks.db.update).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("blocks proof upload while the current proof is already waiting for admin review", async () => {
    mocks.db.select
      .mockImplementationOnce(() => mockBlacklistQuery())
      .mockImplementationOnce(() =>
        mockTransactionDetailQuery({
          id: "trx-review-1",
          pemasaranId: "pemasaran-1",
          status: "bukti_diunggah",
          paymentMethod: "transfer",
          referenceNumber: "BRI-2026-001",
          proofUrl: "/uploads/bukti/transfer.jpg"
        })
      );

    await expect(
      uploadBuyerPaymentProof("buyer-1", "trx-review-1", {
        fileName: "/uploads/bukti/transfer-lagi.jpg",
        reference: "BRI-2026-002"
      })
    ).rejects.toThrow("Bukti pembayaran sudah terkirim dan sedang diverifikasi admin unit.");

    expect(mocks.db.update).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("blocks proof upload after admin rejects the harga tetap payment proof", async () => {
    mocks.db.select
      .mockImplementationOnce(() => mockBlacklistQuery())
      .mockImplementationOnce(() =>
        mockTransactionDetailQuery({
          id: "trx-rejected-1",
          pemasaranId: "pemasaran-1",
          status: "ditolak_bukti",
          paymentMethod: "transfer",
          referenceNumber: "BRI-2026-001",
          proofUrl: "/uploads/bukti/transfer-ditolak.jpg"
        })
      );

    await expect(
      uploadBuyerPaymentProof("buyer-1", "trx-rejected-1", {
        fileName: "/uploads/bukti/transfer-baru.jpg",
        reference: "BRI-2026-002"
      })
    ).rejects.toThrow("Transaksi ini sudah dibatalkan dan tidak dapat diperbarui.");

    expect(mocks.db.update).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });
});
