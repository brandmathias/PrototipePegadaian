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

vi.mock("@/lib/services/cron.service", () => ({
  processExpiredVickreyAuctions: vi.fn(),
  processOverdueVickreyPayments: vi.fn()
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
  });

  it("creates a harga tetap transaction directly in proof review after receiving payment proof", async () => {
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
          status: "bukti_diunggah",
          proofUrl: "/uploads/bukti/transfer-baru.png",
          referenceNumber: "BRI-2026-004",
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
      paymentMethod: "transfer",
      fileName: "/uploads/bukti/transfer-baru.png",
      reference: "BRI-2026-004"
    });

    expect(insertValuesSpy).toHaveBeenCalledTimes(1);
    expect(insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "bukti_diunggah",
        proofUrl: "/uploads/bukti/transfer-baru.png",
        referenceNumber: "BRI-2026-004",
        paymentDeadline: null
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: "trx-baru-1",
        status: "bukti_diunggah",
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
        paymentMethod: "transfer",
        fileName: "/uploads/bukti/transfer-baru.png"
      })
    ).rejects.toThrow("Barang sedang dalam proses pembelian oleh pembeli lain.");

    expect(mocks.db.insert).not.toHaveBeenCalled();
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
  });
});
