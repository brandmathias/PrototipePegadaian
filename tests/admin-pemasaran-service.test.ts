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

import { publishAdminBarang, sortAdminMarketingRowsByRecency } from "@/lib/services/admin-pemasaran.service";

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

describe("publishAdminBarang", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-12T08:30:45.000+08:00"));
    vi.clearAllMocks();
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
      status: "jaminan"
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
      status: "dipasarkan"
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

  it("closes an active fixed price session without transactions before remarketing", async () => {
    const now = new Date("2026-05-12T08:30:45.000+08:00");
    const item = {
      id: "barang-fixed-active",
      unitId: "unit-1",
      name: "Kalung Harga Tetap",
      code: "BRG-FIX-ACTIVE",
      category: "perhiasan",
      condition: "Cukup",
      description: "Sesi harga tetap aktif belum memiliki transaksi buyer.",
      appraisalValue: 15000000,
      specifications: {},
      status: "dipasarkan"
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
          where: vi.fn().mockResolvedValue([{ count: 0 }])
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
        note: "Sesi harga tetap lama ditutup dan barang dipublikasikan ulang ke katalog."
      })
    );
  });
});
