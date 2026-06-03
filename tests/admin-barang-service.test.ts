import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    select: vi.fn(),
    update: vi.fn()
  };

  return {
    db,
    serializeAdminBarang: vi.fn((row, extra) => ({
      id: row.id,
      status: row.status,
      previewImageUrl: extra?.previewImageUrl ?? null,
      marketingMode: extra?.marketingMode ?? null,
      name: row.name
    }))
  };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("@/lib/admin-unit/serializers", () => ({
  serializeAdminBarang: mocks.serializeAdminBarang
}));

import {
  getAdminBarangById,
  listAdminBarang,
  listAdminBarangHistory,
  updateAdminBarang
} from "@/lib/services/admin-barang.service";

const editPayload = {
  appraisalValue: "12000000",
  category: "emas",
  condition: "baik",
  customerNumber: "NAS-001",
  description: "Detail diperbarui",
  dueDate: "2026-07-01",
  loanValue: "8000000",
  name: "Cincin Fixed Price",
  ownerName: "Nasabah Demo",
  pawnedAt: "2026-05-01",
  specifications: {
    berat: "8 gram"
  }
};

describe("listAdminBarang", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("only returns inventory items that still belong in daftar barang", async () => {
    const rows = [
      { id: "barang-1", status: "jaminan", createdAt: new Date("2026-05-26T00:00:00.000Z") },
      { id: "barang-2", status: "ditebus", createdAt: new Date("2026-05-25T00:00:00.000Z") },
      { id: "barang-3", status: "dipasarkan", createdAt: new Date("2026-05-24T00:00:00.000Z") },
      { id: "barang-4", status: "gagal", createdAt: new Date("2026-05-23T00:00:00.000Z") },
      { id: "barang-5", status: "gadai", createdAt: new Date("2026-05-22T00:00:00.000Z") },
      { id: "barang-6", status: "terjual", createdAt: new Date("2026-05-21T00:00:00.000Z") },
      { id: "barang-7", status: "menunggu_pembayaran", createdAt: new Date("2026-05-20T00:00:00.000Z") }
    ];

    mocks.db.select
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(rows)
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      }));

    const result = await listAdminBarang("unit-1");

    expect(result.map((item) => item.id)).toEqual(["barang-1", "barang-5"]);
    expect(result.map((item) => item.status)).toEqual(["jaminan", "gadai"]);
  });

  it("returns the first image media as preview image for detail pages", async () => {
    const current = {
      id: "barang-detail",
      name: "Ipad",
      status: "jaminan",
      unitId: "unit-1"
    };
    const mediaRows = [
      {
        id: "media-video",
        barangId: "barang-detail",
        type: "video",
        url: "/uploads/ipad-demo.mp4"
      },
      {
        id: "media-image",
        barangId: "barang-detail",
        type: "foto",
        url: "/uploads/ipad-asli.jpg"
      }
    ];

    mocks.db.select
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([current])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mediaRows)
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([])
            })
          })
        })
      }));

    const result = await getAdminBarangById("unit-1", "barang-detail");

    expect(result.previewImageUrl).toBe("/uploads/ipad-asli.jpg");
    expect(result.media).toEqual(mediaRows);
  });

  it("allows active fixed price barang to be updated through the Drizzle service gate", async () => {
    const current = {
      id: "barang-fixed",
      unitId: "unit-1",
      name: "Cincin Lama",
      status: "dipasarkan"
    };
    const updated = {
      ...current,
      name: "Cincin Fixed Price",
      status: "dipasarkan"
    };
    const updateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([updated])
      })
    });

    mocks.db.select
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([current])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ mode: "fixed_price" }])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: "pm-fixed",
                  mode: "fixed_price",
                  status: "aktif",
                  winnerId: null
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
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      }));
    mocks.db.update.mockImplementationOnce(() => ({
      set: updateSet
    }));

    const result = await updateAdminBarang("unit-1", "barang-fixed", editPayload);

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Cincin Fixed Price"
      })
    );
    expect(result.name).toBe("Cincin Fixed Price");
  });

  it("updates active fixed price marketing price through the pemasaran table", async () => {
    const current = {
      id: "barang-fixed",
      unitId: "unit-1",
      name: "Cincin Lama",
      status: "dipasarkan"
    };
    const updated = {
      ...current,
      name: "Cincin Fixed Price",
      status: "dipasarkan"
    };
    const updateBarangSet = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([updated])
      })
    });
    const updateMarketingSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([])
    });

    mocks.db.select
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([current])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "pm-fixed", mode: "fixed_price", price: "12500000" }])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: "pm-fixed",
                  mode: "fixed_price",
                  status: "aktif",
                  winnerId: null
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
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      }));
    mocks.db.update
      .mockImplementationOnce(() => ({
        set: updateBarangSet
      }))
      .mockImplementationOnce(() => ({
        set: updateMarketingSet
      }));

    await updateAdminBarang("unit-1", "barang-fixed", {
      ...editPayload,
      marketingPrice: "13500000"
    });

    expect(updateMarketingSet).toHaveBeenCalledWith(
      expect.objectContaining({
        price: "13500000"
      })
    );
  });

  it("blocks active auction barang from being updated before it becomes a failed strategy case", async () => {
    const current = {
      id: "barang-auction",
      unitId: "unit-1",
      name: "Cincin Lelang",
      status: "dipasarkan"
    };

    mocks.db.select
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([current])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ mode: "vickrey" }])
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: "pm-vickrey",
                  mode: "vickrey",
                  status: "aktif",
                  winnerId: null
                }
              ])
            })
          })
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 2 }])
        })
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      }));

    await expect(updateAdminBarang("unit-1", "barang-auction", editPayload)).rejects.toThrow(
      /barang lelang hanya dapat diedit/i
    );
    expect(mocks.db.update).not.toHaveBeenCalled();
  });
});

describe("listAdminBarangHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockHistoryQuery(rows: Array<Record<string, unknown>>) {
    return {
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(rows)
            })
          })
        })
      })
    };
  }

  it("maps sold and failed status rows into riwayat barang actions", async () => {
    const baseRow = {
      barangId: "barang-1",
      barangCode: "BRG-001",
      barangName: "Cincin Emas",
      category: "perhiasan",
      condition: "baik",
      description: "Barang perhiasan.",
      specifications: {},
      ownerName: "Nasabah Demo",
      customerNumber: "NSB-001",
      actorName: "Admin Unit",
      actorRole: "admin_unit"
    };

    mocks.db.select
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            id: "hist-sold",
            oldStatus: "dipasarkan",
            newStatus: "terjual",
            note: "Pembayaran fixed price disetujui admin unit.",
            createdAt: new Date("2026-06-03T02:00:00.000Z")
          },
          {
            ...baseRow,
            id: "hist-failed",
            oldStatus: "dipasarkan",
            newStatus: "gagal",
            note: "Sesi Vickrey berakhir tanpa penawar.",
            createdAt: new Date("2026-06-03T01:00:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() => mockHistoryQuery([]));

    const result = await listAdminBarangHistory("unit-1");

    expect(result).toEqual([
      expect.objectContaining({
        id: "hist-sold",
        actionKey: "terjual",
        actionLabel: "Terjual",
        actionTone: "success"
      }),
      expect.objectContaining({
        id: "hist-failed",
        actionKey: "gagal",
        actionLabel: "Gagal",
        actionTone: "danger"
      })
    ]);
  });
});
