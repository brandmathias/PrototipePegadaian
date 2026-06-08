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

import { publishAdminBarang } from "@/lib/services/admin-pemasaran.service";

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
        createdByUserId: "user-1"
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
});
