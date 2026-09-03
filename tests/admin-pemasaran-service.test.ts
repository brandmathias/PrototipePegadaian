import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn()
  };

  return {
    db,
    getLotStatsByIds: vi.fn(),
    processExpiredVickreyAuctions: vi.fn(),
    serializeAdminPemasaran: vi.fn((marketing, extras) => ({
      ...marketing,
      ...extras
    }))
  };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("@/lib/admin-unit/serializers", () => ({
  serializeAdminPemasaran: mocks.serializeAdminPemasaran
}));

vi.mock("@/lib/services/cron.service", () => ({
  processExpiredVickreyAuctions: mocks.processExpiredVickreyAuctions
}));

vi.mock("@/lib/services/public-lot-stats.service", () => ({
  EMPTY_LOT_INSIGHTS: { likes: 0, participants: 0, views: 0 },
  getLotStatsByIds: mocks.getLotStatsByIds
}));

import {
  getAdminPemasaranById,
  publishAdminBarang,
  resolveMarketingPerformanceInsights,
  sortAdminMarketingRowsByRecency
} from "@/lib/services/admin-pemasaran.service";

function mockQueryChain(methods: string[], value: unknown) {
  return [...methods].reverse().reduce<unknown>(
    (next, method) => ({
      [method]: vi.fn(() => next)
    }),
    Promise.resolve(value)
  );
}

describe("sortAdminMarketingRowsByRecency", () => {
  it("places an updated marketing session before older untouched sessions", () => {
    const rows = sortAdminMarketingRowsByRecency([
      {
        id: "newly-created",
        marketing: {
          id: "newly-created",
          iteration: 1,
          createdAt: new Date("2026-06-14T10:00:00.000Z"),
          updatedAt: new Date("2026-06-14T10:00:00.000Z")
        }
      },
      {
        id: "repriced-fixed",
        marketing: {
          id: "repriced-fixed",
          iteration: 1,
          createdAt: new Date("2026-06-12T10:00:00.000Z"),
          updatedAt: new Date("2026-06-15T11:00:00.000Z")
        }
      },
      {
        id: "old-session",
        marketing: {
          id: "old-session",
          iteration: 2,
          createdAt: new Date("2026-06-10T10:00:00.000Z"),
          updatedAt: new Date("2026-06-10T10:00:00.000Z")
        }
      }
    ]);

    expect(rows.map((row) => row.id)).toEqual(["repriced-fixed", "newly-created", "old-session"]);
  });
});

describe("resolveMarketingPerformanceInsights", () => {
  it("aggregates fixed price metrics across fixed price iterations and keeps vickrey metrics per session", () => {
    const insights = resolveMarketingPerformanceInsights(
      [
        { id: "fixed-old", mode: "fixed_price" },
        { id: "fixed-current", mode: "fixed_price" },
        { id: "vickrey-old", mode: "vickrey" },
        { id: "vickrey-current", mode: "vickrey" }
      ],
      new Map([
        ["fixed-old", { views: 7, likes: 2, participants: 0 }],
        ["fixed-current", { views: 11, likes: 3, participants: 0 }],
        ["vickrey-old", { views: 19, likes: 4, participants: 5 }],
        ["vickrey-current", { views: 6, likes: 1, participants: 2 }]
      ])
    );

    expect(insights.get("fixed-old")).toEqual({ views: 18, likes: 5, participants: 0 });
    expect(insights.get("fixed-current")).toEqual({ views: 18, likes: 5, participants: 0 });
    expect(insights.get("vickrey-old")).toEqual({ views: 19, likes: 4, participants: 5 });
    expect(insights.get("vickrey-current")).toEqual({ views: 6, likes: 1, participants: 2 });
  });
});

describe("getAdminPemasaranById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.db.select.mockReset();
    mocks.processExpiredVickreyAuctions.mockResolvedValue(undefined);
    mocks.getLotStatsByIds.mockResolvedValue(new Map());
  });

  it("uses an uploaded fixed-price payment proof even when a newer checkout is still unpaid", async () => {
    const marketing = {
      id: "marketing-fixed",
      barangId: "barang-fixed",
      mode: "fixed_price",
      price: "15000000",
      basePrice: null,
      durationDays: null,
      durationSeconds: null,
      startsAt: new Date("2026-06-23T05:00:00.000Z"),
      endsAt: null,
      revealEndsAt: null,
      winnerId: null,
      finalPrice: null,
      iteration: 5,
      status: "aktif",
      createdByUserId: "admin-1",
      createdAt: new Date("2026-06-23T05:00:00.000Z"),
      updatedAt: new Date("2026-06-23T05:00:00.000Z")
    };
    const item = {
      id: "barang-fixed",
      unitId: "unit-1",
      name: "Kalung Salib Emas 17K",
      code: "SBG-117870000000024",
      category: "perhiasan",
      condition: "baik",
      description: "Kalung emas.",
      appraisalValue: "15000000",
      specifications: {}
    };
    const newerUnpaidTransaction = {
      id: "trx-newer-unpaid",
      pemasaranId: "marketing-fixed",
      status: "menunggu_pembayaran",
      paymentMethod: "transfer",
      proofUrl: null,
      verifiedBy: null,
      handoverProofUrl: null,
      handoverProofUploadedAt: null,
      handoverProofUploadedBy: null,
      reference: null,
      paymentDeadline: new Date("2026-07-02T00:00:00.000Z"),
      soldAt: null,
      completedAt: null,
      completionSource: null,
      buyerName: "Checkout Baru",
      buyerEmail: "newer@example.test",
      buyerPhone: null,
      buyerNationalId: null,
      transactionCreatedAt: new Date("2026-07-01T08:35:00.000Z")
    };
    const uploadedProofTransaction = {
      ...newerUnpaidTransaction,
      id: "trx-uploaded-proof",
      status: "bukti_diunggah",
      proofUrl: "/uploads/bukti-transfer.jpg",
      reference: "PAY-001",
      buyerName: "Lionel Messi",
      buyerEmail: "buyer@example.test",
      transactionCreatedAt: new Date("2026-07-01T08:29:00.000Z")
    };

    mocks.db.select
      .mockImplementationOnce(() =>
        mockQueryChain(["from", "innerJoin", "innerJoin", "leftJoin", "leftJoin", "where", "groupBy", "limit"], [
          {
            marketing,
            item,
            unitName: "UPC Wanea",
            unitAddress: "Manado",
            bidCount: 0,
            winnerName: null
          }
        ])
      )
      .mockImplementationOnce(() => mockQueryChain(["from", "where", "orderBy"], []))
      .mockImplementationOnce(() =>
        mockQueryChain(["from", "innerJoin", "leftJoin", "leftJoin", "where", "orderBy"], [
          newerUnpaidTransaction,
          uploadedProofTransaction
        ])
      )
      .mockImplementationOnce(() => mockQueryChain(["from", "innerJoin", "where", "orderBy"], []))
      .mockImplementationOnce(() => mockQueryChain(["from", "leftJoin", "leftJoin", "where", "groupBy", "orderBy"], []))
      .mockImplementationOnce(() => mockQueryChain(["from", "innerJoin", "where", "orderBy"], []));

    await getAdminPemasaranById("unit-1", "marketing-fixed");

    const detailExtras = mocks.serializeAdminPemasaran.mock.calls.at(-1)?.[1] as {
      transaction?: { id?: string | null; status?: string | null; proofUrl?: string | null };
    };

    expect(detailExtras.transaction?.id).toBe("trx-uploaded-proof");
    expect(detailExtras.transaction?.status).toBe("bukti_diunggah");
    expect(detailExtras.transaction?.proofUrl).toBe("/uploads/bukti-transfer.jpg");
  });

  it("loads active vickrey bids so the locked bid log can rank the current highest offer", async () => {
    const marketing = {
      id: "marketing-vickrey-active",
      barangId: "barang-vickrey-active",
      mode: "vickrey",
      price: null,
      basePrice: "10000000",
      durationDays: 1,
      durationSeconds: 3600,
      startsAt: new Date("2026-06-23T05:00:00.000Z"),
      endsAt: new Date("2099-06-23T06:00:00.000Z"),
      revealEndsAt: null,
      winnerId: null,
      finalPrice: null,
      iteration: 1,
      status: "aktif",
      createdByUserId: "admin-1",
      createdAt: new Date("2026-06-23T05:00:00.000Z"),
      updatedAt: new Date("2026-06-23T05:00:00.000Z")
    };
    const item = {
      id: "barang-vickrey-active",
      unitId: "unit-1",
      name: "Kalung Emas",
      code: "SBG-117870000000999",
      category: "emas",
      condition: "baik",
      description: "Kalung emas aktif.",
      appraisalValue: "12000000",
      specifications: {}
    };
    const activeBid = {
      pemasaranId: "marketing-vickrey-active",
      bid: {
        id: "bid-active-high",
        userId: "buyer-2",
        nominal: "14500000",
        createdAt: new Date("2026-06-23T05:10:00.000Z")
      },
      bidderName: "Buyer Dua"
    };

    mocks.db.select
      .mockImplementationOnce(() =>
        mockQueryChain(["from", "innerJoin", "innerJoin", "leftJoin", "leftJoin", "where", "groupBy", "limit"], [
          { marketing, item, unitName: "UPC Wanea", unitAddress: "Manado", bidCount: 1, winnerName: null }
        ])
      )
      .mockImplementationOnce(() => mockQueryChain(["from", "where", "orderBy"], []))
      .mockImplementationOnce(() => mockQueryChain(["from", "innerJoin", "leftJoin", "leftJoin", "where", "orderBy"], []))
      .mockImplementationOnce(() => mockQueryChain(["from", "innerJoin", "where", "orderBy"], []))
      .mockImplementationOnce(() => mockQueryChain(["from", "leftJoin", "leftJoin", "where", "groupBy", "orderBy"], []))
      .mockImplementationOnce(() => mockQueryChain(["from", "innerJoin", "where", "orderBy"], [activeBid]));

    await getAdminPemasaranById("unit-1", "marketing-vickrey-active");

    const detailExtras = mocks.serializeAdminPemasaran.mock.calls.at(-1)?.[1] as {
      bids?: Array<{ bid?: { id?: string } }>;
    };
    expect(detailExtras.bids).toEqual([
      expect.objectContaining({ bid: expect.objectContaining({ id: "bid-active-high" }) })
    ]);
  });

  it("keeps a rejected fixed-price proof visible instead of falling back to a newer unpaid checkout", async () => {
    const marketing = {
      id: "marketing-fixed",
      barangId: "barang-fixed",
      mode: "fixed_price",
      price: "15000000",
      basePrice: null,
      durationDays: null,
      durationSeconds: null,
      startsAt: new Date("2026-06-23T05:00:00.000Z"),
      endsAt: null,
      revealEndsAt: null,
      winnerId: null,
      finalPrice: null,
      iteration: 5,
      status: "aktif",
      createdByUserId: "admin-1",
      createdAt: new Date("2026-06-23T05:00:00.000Z"),
      updatedAt: new Date("2026-06-23T05:00:00.000Z")
    };
    const item = {
      id: "barang-fixed",
      unitId: "unit-1",
      name: "Kalung Salib Emas 17K",
      code: "SBG-117870000000024",
      category: "perhiasan",
      condition: "baik",
      description: "Kalung emas.",
      appraisalValue: "15000000",
      specifications: {}
    };
    const newerUnpaidTransaction = {
      id: "trx-newer-unpaid",
      pemasaranId: "marketing-fixed",
      status: "menunggu_pembayaran",
      paymentMethod: "transfer",
      proofUrl: null,
      rejectionReason: null,
      verifiedBy: null,
      verifiedAt: null,
      updatedAt: new Date("2026-07-01T08:35:00.000Z"),
      handoverProofUrl: null,
      handoverProofUploadedAt: null,
      handoverProofUploadedBy: null,
      reference: null,
      paymentDeadline: null,
      completedAt: null,
      completionSource: null,
      buyerName: "Cristiano Ronaldo",
      buyerEmail: "newer@example.test",
      buyerPhone: null,
      buyerNationalId: null,
      transactionCreatedAt: new Date("2026-07-01T08:35:00.000Z")
    };
    const rejectedTransaction = {
      ...newerUnpaidTransaction,
      id: "trx-rejected-proof",
      status: "ditolak_bukti",
      proofUrl: "/uploads/bukti-transfer.jpg",
      rejectionReason: "Uang dikirim bukan ke rekening tujuan.",
      verifiedBy: "Maria Supit",
      verifiedAt: new Date("2026-07-06T07:36:00.000Z"),
      updatedAt: new Date("2026-07-06T07:36:00.000Z"),
      buyerName: "Lionel Messi",
      buyerEmail: "buyer@example.test",
      transactionCreatedAt: new Date("2026-07-01T08:29:00.000Z")
    };

    mocks.db.select
      .mockImplementationOnce(() =>
        mockQueryChain(["from", "innerJoin", "innerJoin", "leftJoin", "leftJoin", "where", "groupBy", "limit"], [
          {
            marketing,
            item,
            unitName: "UPC Wanea",
            unitAddress: "Manado",
            bidCount: 0,
            winnerName: null
          }
        ])
      )
      .mockImplementationOnce(() => mockQueryChain(["from", "where", "orderBy"], []))
      .mockImplementationOnce(() =>
        mockQueryChain(["from", "innerJoin", "leftJoin", "leftJoin", "where", "orderBy"], [
          newerUnpaidTransaction,
          rejectedTransaction
        ])
      )
      .mockImplementationOnce(() => mockQueryChain(["from", "innerJoin", "where", "orderBy"], []))
      .mockImplementationOnce(() => mockQueryChain(["from", "leftJoin", "leftJoin", "where", "groupBy", "orderBy"], []))
      .mockImplementationOnce(() => mockQueryChain(["from", "innerJoin", "where", "orderBy"], []));

    await getAdminPemasaranById("unit-1", "marketing-fixed");

    const detailExtras = mocks.serializeAdminPemasaran.mock.calls.at(-1)?.[1] as {
      transaction?: {
        id?: string | null;
        status?: string | null;
        buyerName?: string | null;
        rejectionReason?: string | null;
      };
    };

    expect(detailExtras.transaction).toEqual(
      expect.objectContaining({
        id: "trx-rejected-proof",
        status: "ditolak_bukti",
        buyerName: "Lionel Messi",
        rejectionReason: "Uang dikirim bukan ke rekening tujuan."
      })
    );
  });

  it("loads bidder rows for an archived vickrey iteration", async () => {
    const currentMarketing = {
      id: "marketing-fixed-current",
      barangId: "barang-archive",
      mode: "fixed_price",
      price: "15000000",
      basePrice: null,
      durationDays: null,
      durationSeconds: null,
      startsAt: new Date("2026-06-23T05:00:00.000Z"),
      endsAt: null,
      revealEndsAt: null,
      winnerId: null,
      finalPrice: null,
      iteration: 5,
      status: "aktif",
      createdByUserId: "admin-1",
      createdAt: new Date("2026-06-23T05:00:00.000Z"),
      updatedAt: new Date("2026-06-23T05:00:00.000Z")
    };
    const archivedMarketing = {
      ...currentMarketing,
      id: "marketing-vickrey-archive",
      mode: "vickrey",
      price: null,
      basePrice: "15000000",
      endsAt: new Date("2026-06-18T00:59:00.000Z"),
      revealEndsAt: new Date("2026-06-18T01:09:00.000Z"),
      winnerId: "buyer-winner",
      finalPrice: "15000000",
      iteration: 4,
      status: "gagal",
      createdAt: new Date("2026-06-17T00:59:00.000Z"),
      updatedAt: new Date("2026-06-19T04:03:00.000Z")
    };
    const item = {
      id: "barang-archive",
      unitId: "unit-1",
      name: "Kalung Salib Emas 17K",
      code: "SBG-117870000000024",
      category: "perhiasan",
      condition: "baik",
      description: "Kalung emas.",
      appraisalValue: "15000000",
      specifications: {}
    };
    const archivedBid = {
      pemasaranId: "marketing-vickrey-archive",
      bid: {
        id: "bid-winner",
        userId: "buyer-winner",
        nominal: "17000000",
        createdAt: new Date("2026-06-18T00:40:00.000Z"),
        revealedAt: new Date("2026-06-18T01:02:00.000Z")
      },
      bidderName: "Kylian Mbappe"
    };

    mocks.db.select
      .mockImplementationOnce(() =>
        mockQueryChain(["from", "innerJoin", "innerJoin", "leftJoin", "leftJoin", "where", "groupBy", "limit"], [
          {
            marketing: currentMarketing,
            item,
            unitName: "UPC Wanea",
            unitAddress: "Manado",
            bidCount: 0,
            winnerName: null
          }
        ])
      )
      .mockImplementationOnce(() => mockQueryChain(["from", "where", "orderBy"], []))
      .mockImplementationOnce(() => mockQueryChain(["from", "innerJoin", "leftJoin", "leftJoin", "where", "orderBy"], []))
      .mockImplementationOnce(() => mockQueryChain(["from", "innerJoin", "where", "orderBy"], []))
      .mockImplementationOnce(() =>
        mockQueryChain(["from", "leftJoin", "leftJoin", "where", "groupBy", "orderBy"], [
          {
            marketing: archivedMarketing,
            bidCount: 1,
            winnerName: "Kylian Mbappe"
          }
        ])
      )
      .mockImplementationOnce(() =>
        mockQueryChain(["from", "innerJoin", "leftJoin", "leftJoin", "where", "orderBy"], [])
      )
      .mockImplementationOnce(() =>
        mockQueryChain(["from", "innerJoin", "where", "orderBy"], [archivedBid])
      );

    const detail = await getAdminPemasaranById("unit-1", "marketing-fixed-current");
    const archivedIteration = detail.iterationHistory.find(
      (entry: { id?: string }) => entry.id === "marketing-vickrey-archive"
    ) as { bids?: Array<{ bidderName?: string }> } | undefined;

    expect(archivedIteration?.bids).toEqual([
      expect.objectContaining({
        bidderName: "Kylian Mbappe"
      })
    ]);
  });
});

describe("publishAdminBarang", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-12T08:30:45.000+08:00"));
    vi.clearAllMocks();
    mocks.db.select.mockReset();
    mocks.db.transaction.mockImplementation(async (callback) =>
      callback({
        insert: mocks.db.insert,
        update: mocks.db.update
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores a vickrey deadline using totalSeconds precision", async () => {
    const now = new Date("2026-05-12T08:30:45.000+08:00");
    const item = {
      id: "barang-1",
      unitId: "unit-1",
      name: "Laptop ThinkPad",
      status: "jaminan",
      dueDate: new Date("2026-05-11T08:30:45.000+08:00")
    };
    const createdRow = {
      id: "marketing-1",
      barangId: "barang-1",
      mode: "vickrey",
      basePrice: 1500000,
      durationDays: 0,
      durationSeconds: 135,
      startsAt: now,
      endsAt: new Date(now.getTime() + 135_000),
      revealEndsAt: new Date(now.getTime() + 135_000 + 600_000),
      iteration: 3,
      status: "aktif",
      createdByUserId: "user-1"
    };
    const insertValuesSpy = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([createdRow])
    });
    const statusHistoryValuesSpy = vi.fn().mockResolvedValue(undefined);
    const updateWhereSpy = vi.fn().mockResolvedValue(undefined);

    mocks.db.select
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([item])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ nextIteration: 3 }])
        })
      }));

    mocks.db.insert
      .mockImplementationOnce(() => ({
        values: insertValuesSpy
      }))
      .mockImplementationOnce(() => ({
        values: statusHistoryValuesSpy
      }));

    mocks.db.update.mockImplementationOnce(() => ({
      set: vi.fn().mockReturnValue({
        where: updateWhereSpy
      })
    }));

    await publishAdminBarang("unit-1", "user-1", "barang-1", {
      mode: "vickrey",
      price: "1500000",
      durationDays: "0",
      durationHours: "0",
      durationMinutes: "2",
      durationSeconds: "15"
    });

    expect(mocks.db.transaction).toHaveBeenCalledTimes(1);
    expect(insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "vickrey",
        price: null,
        basePrice: "1500000",
        startsAt: now,
        endsAt: new Date(now.getTime() + 135_000),
        revealEndsAt: new Date(now.getTime() + 135_000 + 600_000),
        durationDays: 0,
        durationSeconds: 135,
        status: "aktif",
        createdByUserId: "user-1",
        updatedAt: now
      })
    );
    expect(updateWhereSpy).toHaveBeenCalledTimes(1);
    expect(statusHistoryValuesSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects marketing before the barang due deadline", async () => {
    const item = {
      id: "barang-belum-tempo",
      unitId: "unit-1",
      name: "Laptop Belum Tempo",
      status: "jaminan",
      dueDate: new Date("2026-05-12T08:35:45.000+08:00")
    };

    mocks.db.select.mockImplementationOnce(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([item])
        })
      })
    }));

    await expect(
      publishAdminBarang("unit-1", "user-1", "barang-belum-tempo", {
        mode: "fixed_price",
        price: "1500000"
      })
    ).rejects.toThrow("Barang baru dapat dipasarkan setelah durasi jatuh tempo berakhir.");

    expect(mocks.db.transaction).not.toHaveBeenCalled();
  });

  it("allows a failed vickrey lot without bidders to be republished as harga tetap", async () => {
    const item = {
      id: "barang-failed",
      unitId: "unit-1",
      name: "Ipad Tanpa Bid",
      code: "BRG-FAILED",
      category: "elektronik",
      condition: "Baik",
      description: "Sesi lelang sebelumnya gagal karena tidak ada peserta.",
      appraisalValue: 10000000,
      specifications: {},
      status: "dipasarkan",
      dueDate: new Date("2026-05-11T08:30:45.000+08:00")
    };
    const createdRow = {
      id: "marketing-fixed",
      barangId: "barang-failed",
      mode: "fixed_price",
      price: 10000000,
      basePrice: null,
      durationDays: null,
      durationSeconds: null,
      startsAt: new Date("2026-05-12T00:30:45.000Z"),
      endsAt: null,
      revealEndsAt: null,
      iteration: 2,
      status: "aktif",
      createdByUserId: "user-1"
    };
    const insertValuesSpy = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([createdRow])
    });
    const statusHistoryValuesSpy = vi.fn().mockResolvedValue(undefined);
    const updateWhereSpy = vi.fn().mockResolvedValue(undefined);

    mocks.db.select
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([item])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ status: "gagal" }])
            })
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ nextIteration: 2 }])
        })
      }));

    mocks.db.insert
      .mockImplementationOnce(() => ({
        values: insertValuesSpy
      }))
      .mockImplementationOnce(() => ({
        values: statusHistoryValuesSpy
      }));

    mocks.db.update.mockImplementationOnce(() => ({
      set: vi.fn().mockReturnValue({
        where: updateWhereSpy
      })
    }));

    await publishAdminBarang("unit-1", "user-1", "barang-failed", {
      mode: "fixed_price",
      price: "10000000"
    });

    expect(insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "fixed_price",
        price: "10000000",
        basePrice: null,
        durationDays: null,
        durationSeconds: null,
        endsAt: null,
        revealEndsAt: null,
        iteration: 2,
        status: "aktif"
      })
    );
    expect(updateWhereSpy).toHaveBeenCalledTimes(1);
    expect(statusHistoryValuesSpy).toHaveBeenCalledTimes(1);
  });

  it("closes an active fixed price session with only waiting-payment checkouts before remarketing", async () => {
    const now = new Date("2026-05-12T08:30:45.000+08:00");
    const item = {
      id: "barang-fixed-active",
      unitId: "unit-1",
      name: "Kalung Harga Tetap",
      code: "BRG-FIX-ACTIVE",
      category: "perhiasan",
      condition: "Cukup",
      description: "Sesi harga tetap aktif hanya memiliki checkout yang belum mengunggah bukti.",
      appraisalValue: 15000000,
      specifications: {},
      status: "dipasarkan",
      dueDate: new Date("2026-05-11T08:30:45.000+08:00")
    };
    const createdRow = {
      id: "marketing-fixed-new",
      barangId: "barang-fixed-active",
      mode: "fixed_price",
      price: 15000000,
      basePrice: null,
      durationDays: null,
      durationSeconds: null,
      startsAt: now,
      endsAt: null,
      revealEndsAt: null,
      iteration: 3,
      status: "aktif",
      createdByUserId: "user-1"
    };
    const closeMarketingSetSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined)
    });
    const insertValuesSpy = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([createdRow])
    });
    const remarketingLockWhereSpy = vi.fn().mockResolvedValue([{ count: 0 }]);
    const updateBarangWhereSpy = vi.fn().mockResolvedValue(undefined);
    const statusHistoryValuesSpy = vi.fn().mockResolvedValue(undefined);

    mocks.db.select
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([item])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: "marketing-fixed-active",
                  mode: "fixed_price",
                  status: "aktif"
                }
              ])
            })
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: remarketingLockWhereSpy
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ nextIteration: 3 }])
        })
      }));

    mocks.db.update
      .mockImplementationOnce(() => ({
        set: closeMarketingSetSpy
      }))
      .mockImplementationOnce(() => ({
        set: vi.fn().mockReturnValue({
          where: updateBarangWhereSpy
        })
      }));
    mocks.db.insert
      .mockImplementationOnce(() => ({
        values: insertValuesSpy
      }))
      .mockImplementationOnce(() => ({
        values: statusHistoryValuesSpy
      }));

    await publishAdminBarang("unit-1", "user-1", "barang-fixed-active", {
      mode: "fixed_price",
      price: "15000000"
    });

    expect(closeMarketingSetSpy).toHaveBeenCalledWith({
      status: "gagal",
      updatedAt: now
    });
    expect(insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "fixed_price",
        price: "15000000",
        iteration: 3,
        status: "aktif"
      })
    );
    expect(updateBarangWhereSpy).toHaveBeenCalledTimes(1);
    expect(statusHistoryValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        oldStatus: "dipasarkan",
        newStatus: "dipasarkan",
        note: "Sesi harga tetap lama ditutup dan barang dipublikasikan ulang ke katalog sebagai sesi Harga Tetap."
      })
    );
    const remarketingLockValues = getSqlParameterValues(
      remarketingLockWhereSpy.mock.calls[0]?.[0]
    );
    expect(remarketingLockValues).toContain("bukti_diunggah");
    expect(remarketingLockValues).not.toContain("menunggu_pembayaran");
  });
});

function getSqlParameterValues(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.flatMap(getSqlParameterValues);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const candidate = value as {
    queryChunks?: unknown[];
    value?: unknown;
  };

  if (candidate.queryChunks) {
    return candidate.queryChunks.flatMap(getSqlParameterValues);
  }

  return "value" in candidate ? [candidate.value] : [];
}
