import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    select: vi.fn(),
    transaction: vi.fn(),
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
  createAdminBarang,
  getAdminBarangById,
  listAdminBarang,
  listAdminBarangHistory,
  updateAdminBarang
} from "@/lib/services/admin-barang.service";

const editPayload = {
  appraisalValue: "12000000",
  category: "emas",
  condition: "baik",
  customerNumber: "081234567890",
  description: "Detail diperbarui",
  dueDate: "2026-07-01",
  name: "Cincin Harga Tetap",
  ownerName: "Nasabah Demo",
  pawnedAt: "2026-05-01",
  specifications: {
    berat: "8 gram"
  }
};

describe("createAdminBarang", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allocates an SBG code from the owning unit and PostgreSQL sequence", async () => {
    const created = {
      id: "barang-created",
      code: "SBG-1178725010004741",
      name: "Cincin Emas",
      status: "jaminan",
    };
    const insertedValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([created]),
    });
    const tx = {
      execute: vi.fn().mockResolvedValue({ rows: [{ value: "25010004741" }] }),
      insert: vi
        .fn()
        .mockImplementationOnce(() => ({ values: insertedValues }))
        .mockImplementationOnce(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ code: "CP-MND-11787" }]),
          }),
        }),
      }),
    };
    mocks.db.transaction.mockImplementationOnce(async (callback) => callback(tx));

    await createAdminBarang("unit-wanea", "admin-1", {
      ...editPayload,
      name: "Cincin Emas",
    });

    expect(tx.execute).toHaveBeenCalledOnce();
    expect(insertedValues).toHaveBeenCalledWith(
      expect.objectContaining({
        unitId: "unit-wanea",
        code: "SBG-1178725010004741",
        name: "Cincin Emas",
        appraisalValue: "12000000",
      }),
    );
    expect(insertedValues).not.toHaveBeenCalledWith(expect.objectContaining({ loanValue: expect.anything() }));
  });
});

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

    expect(result.map((item) => item.id)).toEqual(["barang-1", "barang-4", "barang-5"]);
    expect(result.map((item) => item.status)).toEqual(["jaminan", "gagal", "gadai"]);
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

  it("allows active harga tetap barang to be updated through the Drizzle service gate", async () => {
    const current = {
      id: "barang-fixed",
      unitId: "unit-1",
      name: "Cincin Lama",
      status: "dipasarkan",
      customerNumber: "081234567890"
    };
    const updated = {
      ...current,
      name: "Cincin Harga Tetap",
      status: "dipasarkan"
    };
    const updateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([updated])
      })
    });
    const customerSet = vi.fn().mockReturnValue({
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
    mocks.db.transaction.mockImplementationOnce(async (callback) =>
      callback({
        update: vi
          .fn()
          .mockImplementationOnce(() => ({ set: customerSet }))
          .mockImplementationOnce(() => ({ set: updateSet }))
      })
    );

    const result = await updateAdminBarang("unit-1", "barang-fixed", editPayload);

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Cincin Harga Tetap"
      })
    );
    expect(result.name).toBe("Cincin Harga Tetap");
  });

  it("updates active harga tetap marketing price through the pemasaran table", async () => {
    const current = {
      id: "barang-fixed",
      unitId: "unit-1",
      name: "Cincin Lama",
      status: "dipasarkan",
      customerNumber: "081234567890",
    };
    const updated = {
      ...current,
      name: "Cincin Harga Tetap",
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
    const updateCustomerSet = vi.fn().mockReturnValue({
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
    mocks.db.transaction.mockImplementationOnce(async (callback) =>
      callback({
        update: vi
          .fn()
          .mockImplementationOnce(() => ({ set: updateCustomerSet }))
          .mockImplementationOnce(() => ({ set: updateBarangSet }))
          .mockImplementationOnce(() => ({ set: updateMarketingSet }))
      })
    );

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

  it("corrects terminal item customer data across the same unit and appraisal only on the selected item", async () => {
    const current = {
      id: "barang-sold",
      unitId: "unit-1",
      name: "Cincin Terjual",
      status: "terjual",
      ownerName: "Raras Lama",
      customerNumber: "081211112222",
      appraisalValue: "8500000"
    };
    const updated = {
      ...current,
      ownerName: "Raras Maheswari",
      customerNumber: "081234567890",
      appraisalValue: "9000000"
    };
    const customerWhere = vi.fn().mockResolvedValue([]);
    const appraisalWhere = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([updated])
    });
    const customerSet = vi.fn().mockReturnValue({ where: customerWhere });
    const appraisalSet = vi.fn().mockReturnValue({ where: appraisalWhere });
    const tx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      }),
      update: vi
        .fn()
        .mockImplementationOnce(() => ({ set: customerSet }))
        .mockImplementationOnce(() => ({ set: appraisalSet }))
    };

    mocks.db.select.mockImplementationOnce(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([current])
        })
      })
    }));
    mocks.db.transaction.mockImplementationOnce(async (callback) => callback(tx));

    const result = await updateAdminBarang("unit-1", "barang-sold", {
      correctionOnly: true,
      ownerName: "Raras Maheswari",
      customerNumber: "0812-3456-7890",
      appraisalValue: "9000000"
    });

    expect(customerSet).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerName: "Raras Maheswari",
        customerNumber: "081234567890"
      })
    );
    expect(appraisalSet).toHaveBeenCalledWith(
      expect.objectContaining({
        appraisalValue: "9000000"
      })
    );
    expect(customerWhere).toHaveBeenCalledOnce();
    expect(appraisalWhere).toHaveBeenCalledOnce();
    expect(result.name).toBe("Cincin Terjual");
  });

  it("rejects correction fields that could mutate locked terminal item data", async () => {
    const current = {
      id: "barang-sold",
      unitId: "unit-1",
      name: "Cincin Terjual",
      status: "terjual",
      ownerName: "Raras Lama",
      customerNumber: "081211112222",
      appraisalValue: "8500000"
    };

    mocks.db.select.mockImplementationOnce(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([current])
        })
      })
    }));

    await expect(
      updateAdminBarang("unit-1", "barang-sold", {
        correctionOnly: true,
        name: "Nama Barang Diubah",
        ownerName: "Raras Maheswari",
        customerNumber: "081234567890",
        appraisalValue: "9000000"
      })
    ).rejects.toThrow("Koreksi riwayat hanya dapat mengubah data nasabah dan nilai taksiran.");

    expect(mocks.db.transaction).not.toHaveBeenCalled();
  });

  it("rejects a corrected phone owned by a different customer in the same unit", async () => {
    const current = {
      id: "barang-sold",
      unitId: "unit-1",
      name: "Cincin Terjual",
      status: "terjual",
      ownerName: "Raras Lama",
      customerNumber: "081211112222",
      appraisalValue: "8500000"
    };
    const tx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ ownerName: "Nasabah Berbeda" }])
          })
        })
      }),
      update: vi.fn()
    };

    mocks.db.select.mockImplementationOnce(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([current])
        })
      })
    }));
    mocks.db.transaction.mockImplementationOnce(async (callback) => callback(tx));

    await expect(
      updateAdminBarang("unit-1", "barang-sold", {
        correctionOnly: true,
        ownerName: "Raras Maheswari",
        customerNumber: "081234567890",
        appraisalValue: "9000000"
      })
    ).rejects.toThrow("Nomor telepon sudah digunakan nasabah lain di unit ini.");

    expect(tx.update).not.toHaveBeenCalled();
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
            note: "Pembayaran harga tetap disetujui admin unit.",
            createdAt: new Date("2026-06-03T02:00:00.000Z")
          },
          {
            ...baseRow,
            id: "hist-failed",
            oldStatus: "dipasarkan",
            newStatus: "gagal",
            note: "Sesi Lelang Tertutup berakhir tanpa penawar.",
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

  it("maps new collateral rows into barang masuk actions", async () => {
    const baseRow = {
      barangId: "barang-2",
      barangCode: "BRG-002",
      barangName: "Ipad Pro",
      category: "elektronik",
      condition: "baik",
      description: "Barang elektronik baru dicatat.",
      specifications: {},
      ownerName: "Nasabah Demo",
      customerNumber: "NSB-002",
      actorName: "Admin Unit",
      actorRole: "admin_unit"
    };

    mocks.db.select
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            id: "hist-new",
            oldStatus: null,
            newStatus: "jaminan",
            note: "Barang hasil input gadai dicatat sebagai barang jaminan unit.",
            createdAt: new Date("2026-06-03T03:00:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() => mockHistoryQuery([]));

    const result = await listAdminBarangHistory("unit-1");

    expect(result).toEqual([
      expect.objectContaining({
        id: "hist-new",
        actionKey: "input_baru",
        actionLabel: "Barang Masuk",
        actionTone: "default"
      })
    ]);
  });

  it("keeps internal actor names from status and extension history joins", async () => {
    const baseRow = {
      barangId: "barang-actor",
      barangCode: "BRG-ACTOR",
      barangName: "Kalung Emas",
      category: "perhiasan",
      condition: "baik",
      description: "Barang perhiasan.",
      specifications: {},
      ownerName: "Nasabah Demo",
      customerNumber: "NSB-ACTOR"
    };

    mocks.db.select
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            id: "hist-status-actor",
            oldStatus: null,
            newStatus: "jaminan",
            note: "Barang dicatat oleh admin unit.",
            actorName: "Admin Unit Ranotana",
            actorRole: "admin_unit",
            createdAt: new Date("2026-06-03T04:00:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            id: "hist-extension-actor",
            note: "Jatuh tempo diperpanjang.",
            actorName: "Operator Arsip Ranotana",
            actorRole: "admin_unit",
            createdAt: new Date("2026-06-03T05:00:00.000Z")
          }
        ])
      );

    const result = await listAdminBarangHistory("unit-1");

    expect(result).toEqual([
      expect.objectContaining({
        id: "hist-extension-actor",
        actionKey: "perpanjangan",
        actorName: "Operator Arsip Ranotana",
        actorRole: "admin_unit"
      }),
      expect.objectContaining({
        id: "hist-status-actor",
        actionKey: "input_baru",
        actorName: "Admin Unit Ranotana",
        actorRole: "admin_unit"
      })
    ]);
  });

  it("labels status changes without a user actor as system automation", async () => {
    const baseRow = {
      barangId: "barang-system",
      barangCode: "BRG-SYSTEM",
      barangName: "Kalung Emas",
      category: "perhiasan",
      condition: "baik",
      description: "Barang perhiasan.",
      specifications: {},
      ownerName: "Nasabah Demo",
      customerNumber: "NSB-SYSTEM"
    };

    mocks.db.select
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            id: "hist-system",
            oldStatus: "dipasarkan",
            newStatus: "gagal",
            note: "Pemenang tidak menyelesaikan pembayaran dalam 24 jam.",
            actorName: null,
            actorRole: null,
            createdAt: new Date("2026-06-03T06:00:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() => mockHistoryQuery([]));

    const result = await listAdminBarangHistory("unit-1");

    expect(result).toEqual([
      expect.objectContaining({
        id: "hist-system",
        actorName: "Sistem Otomatis",
        actorRole: null
      })
    ]);
  });
});
