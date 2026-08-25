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
  extendAdminBarang,
  getAdminBarangById,
  listAdminBarang,
  listAdminBarangHistory,
  redeemAdminBarang,
  updateAdminBarang
} from "@/lib/services/admin-barang.service";

const editPayload = {
  appraisalValue: "12000000",
  category: "emas",
  condition: "baik",
  customerNumber: "0812345678901",
  description: "Detail diperbarui",
  dueAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
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
        dueDate: new Date(editPayload.dueAt),
      }),
    );
    expect(insertedValues).not.toHaveBeenCalledWith(expect.objectContaining({ loanValue: expect.anything() }));
  });

  it("records the standard barang masuk description when an item enters collateral", async () => {
    const created = { id: "barang-created", code: "SBG-1178725010004741", name: "Cincin Emas", status: "jaminan" };
    const insertedValues = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([created]) });
    const historyValues = vi.fn().mockResolvedValue(undefined);
    const tx = {
      execute: vi.fn().mockResolvedValue({ rows: [{ value: "25010004741" }] }),
      insert: vi
        .fn()
        .mockImplementationOnce(() => ({ values: insertedValues }))
        .mockImplementationOnce(() => ({ values: historyValues })),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ code: "CP-MND-11787" }]) }),
        }),
      }),
    };
    mocks.db.transaction.mockImplementationOnce(async (callback) => callback(tx));

    await createAdminBarang("unit-wanea", "admin-1", { ...editPayload, name: "Cincin Emas" });

    expect(historyValues).toHaveBeenCalledWith(
      expect.objectContaining({
        note: "Barang hasil input gadai dicatat sebagai barang jaminan unit.",
      }),
    );
  });

  it("rejects extension and redemption once the precise due deadline has passed", async () => {
    const expiredItem = {
      id: "barang-expired",
      unitId: "unit-1",
      status: "jaminan",
      dueDate: new Date("2020-05-01T10:57:00.000Z"),
    };
    const query = () => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([expiredItem]) }),
      }),
    });
    mocks.db.select.mockImplementation(query);

    await expect(
      extendAdminBarang("unit-1", "admin-1", "barang-expired", { newDueDate: "2026-06-01" }),
    ).rejects.toThrow("Perpanjangan tidak dapat dilakukan setelah jatuh tempo.");
    await expect(
      redeemAdminBarang("unit-1", "admin-1", "barang-expired", { reference: "TRX-1" }),
    ).rejects.toThrow("Penebusan tidak dapat dilakukan setelah jatuh tempo.");
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

  it("uses the violation item fallback media when the stored media rows are empty", async () => {
    const current = {
      id: "barang-violation",
      name: "Kalung Emas Rantai Singapura 22K",
      status: "gagal",
      unitId: "unit-sarinah"
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
            orderBy: vi.fn().mockResolvedValue([])
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

    const result = await getAdminBarangById("unit-sarinah", "barang-violation");

    expect(result.previewImageUrl).toBe(
      "/media/violation-items/kalung-emas-rantai-singapura-22k.webp"
    );
    expect(result.media).toEqual([
      expect.objectContaining({
        type: "foto",
        url: "/media/violation-items/kalung-emas-rantai-singapura-22k.webp"
      })
    ]);
  });

  it("rejects barang updates after the item has entered kelola barang", async () => {
    const current = {
      id: "barang-fixed",
      unitId: "unit-1",
      name: "Cincin Lama",
      status: "dipasarkan",
      customerNumber: "0812345678901"
    };

    mocks.db.select.mockImplementationOnce(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([current])
        })
      })
    }));

    await expect(updateAdminBarang("unit-1", "barang-fixed", editPayload)).rejects.toThrow(
      "Data barang tidak dapat diubah setelah masuk ke kelola barang."
    );
    expect(mocks.db.transaction).not.toHaveBeenCalled();
  });

});

describe("listAdminBarangHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.db.select.mockImplementation(() => mockHistoryQuery([]));
  });

  function mockHistoryQuery(rows: Array<Record<string, unknown>>) {
    const query = {
      innerJoin: vi.fn(),
      leftJoin: vi.fn(),
      where: vi.fn(),
      groupBy: vi.fn(),
      orderBy: vi.fn()
    };

    query.innerJoin.mockReturnValue(query);
    query.leftJoin.mockReturnValue(query);
    query.where.mockReturnValue(query);
    query.groupBy.mockReturnValue(query);
    query.orderBy.mockResolvedValue(rows);

    return {
      from: vi.fn().mockReturnValue(query)
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

  it("standardizes legacy due-date notes into the barang masuk chronology description", async () => {
    mocks.db.select
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            barangId: "barang-legacy-due-date",
            barangCode: "BRG-LEGACY",
            barangName: "Cincin Emas",
            category: "emas",
            condition: "baik",
            description: "Barang jaminan.",
            specifications: {},
            ownerName: "Nasabah Demo",
            customerNumber: "NSB-003",
            id: "hist-legacy-due-date",
            oldStatus: null,
            newStatus: "jaminan",
            note: "Barang hasil input gadai dicatat sebagai barang jaminan unit dengan jatuh tempo 2026-08-17T03:57:10.000Z.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: new Date("2026-08-17T02:44:00.000Z"),
          },
        ]),
      )
      .mockImplementationOnce(() => mockHistoryQuery([]));

    const [entry] = await listAdminBarangHistory("unit-1");

    expect(entry.note).toBe("Barang hasil input gadai dicatat sebagai barang jaminan unit.");
    expect(entry.note).not.toContain("jatuh tempo");
  });

  it("anchors a stale barang masuk timestamp ten days before its first marketing event", async () => {
    const baseRow = {
      barangId: "barang-stale-input",
      barangCode: "BRG-STALE-INPUT",
      barangName: "Kalung Emas Rantai Singapura 22K",
      category: "perhiasan",
      condition: "baik",
      description: "Barang untuk uji pelanggaran lintas unit.",
      specifications: {},
      ownerName: "Nasabah Demo",
      customerNumber: "NSB-STALE"
    };
    const marketedAt = new Date("2026-04-30T01:07:00.000Z");

    mocks.db.select
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            id: "hist-stale-input",
            oldStatus: null,
            newStatus: "jaminan",
            note: "Barang hasil input gadai dicatat sebagai barang jaminan unit.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: new Date("2025-10-25T01:07:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() => mockHistoryQuery([]))
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            marketingId: "marketing-stale-input",
            mode: "vickrey",
            status: "gagal",
            iteration: 1,
            createdAt: marketedAt,
            updatedAt: marketedAt,
            endsAt: new Date("2026-05-01T01:07:00.000Z"),
            actorName: "Admin Pemasaran",
            actorRole: "admin_unit",
            bidCount: 0
          }
        ])
      )
      .mockImplementationOnce(() => mockHistoryQuery([]));

    const result = await listAdminBarangHistory("unit-sarinah", undefined, "barang-stale-input");
    const inputEntry = result.find((entry) => entry.actionKey === "input_baru");

    expect(inputEntry?.createdAt).toBe("2026-04-20T01:07:00.000Z");
    expect(inputEntry?.createdAtLabel).toContain("20 Apr 2026");
  });

  it("keeps legacy entry without exposing intermediate statuses in riwayat barang", async () => {
    const baseRow = {
      barangId: "barang-complete-history",
      barangCode: "BRG-HISTORY",
      barangName: "Mobil",
      category: "kendaraan",
      condition: "baik",
      description: "Riwayat lengkap.",
      specifications: {},
      ownerName: "Nasabah Demo",
      customerNumber: "NSB-HISTORY",
      actorName: "Admin Unit",
      actorRole: "admin_unit"
    };

    mocks.db.select
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            id: "hist-payment",
            oldStatus: "dipasarkan",
            newStatus: "menunggu_pembayaran",
            note: "Menunggu pembayaran pemenang.",
            createdAt: new Date("2026-06-03T05:00:00.000Z")
          },
          {
            ...baseRow,
            id: "hist-collateral",
            oldStatus: "gadai",
            newStatus: "jaminan",
            note: "Barang menjadi jaminan.",
            createdAt: new Date("2026-06-03T04:00:00.000Z")
          },
          {
            ...baseRow,
            id: "hist-legacy-entry",
            oldStatus: null,
            newStatus: "gadai",
            note: "Barang lama masuk.",
            createdAt: new Date("2026-06-03T03:00:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() => mockHistoryQuery([]));

    const result = await listAdminBarangHistory("unit-1");

    expect(result).toEqual([
      expect.objectContaining({
        id: "hist-legacy-entry",
        actionKey: "input_baru",
        actionLabel: "Barang Masuk"
      })
    ]);
  });

  it("does not truncate unit history before frontend filters run", async () => {
    const rows = Array.from({ length: 30 }, (_, index) => ({
      id: `hist-${index}`,
      barangId: `barang-${index}`,
      barangCode: `BRG-${index}`,
      barangName: `Barang ${index}`,
      category: "lainnya",
      condition: "baik",
      description: "",
      specifications: {},
      ownerName: "Nasabah Demo",
      customerNumber: `NSB-${index}`,
      oldStatus: null,
      newStatus: "jaminan",
      note: "Barang masuk.",
      actorName: "Admin Unit",
      actorRole: "admin_unit",
      createdAt: new Date(Date.UTC(2026, 5, 3, 0, index))
    }));

    mocks.db.select
      .mockImplementationOnce(() => mockHistoryQuery(rows))
      .mockImplementationOnce(() => mockHistoryQuery([]));

    const result = await listAdminBarangHistory("unit-1");

    expect(result).toHaveLength(30);
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

  it("orders same-moment fixed-price relist after the rejected payment in newest-first chronology", async () => {
    const eventAt = new Date("2026-07-13T01:05:00.000Z");
    const baseRow = {
      barangId: "barang-same-moment-relist",
      barangCode: "BRG-SAME-MOMENT",
      barangName: "Emas Batangan ANTAM 5 Gram",
      category: "emas",
      condition: "baik",
      description: "Emas batangan.",
      specifications: {},
      ownerName: "Nasabah Same Moment",
      customerNumber: "NSB-SAME",
      actorRole: "admin_unit"
    };

    mocks.db.select.mockImplementationOnce(() =>
      mockHistoryQuery([
        {
          ...baseRow,
          id: "hist-rejected",
          oldStatus: "dipasarkan",
          newStatus: "gagal",
          note: "Verifikasi bukti pembayaran harga tetap ditolak admin unit. Alasan: Uang dikirim bukan ke rekening tujuan.",
          actorName: "Andika Pratama",
          createdAt: eventAt
        },
        {
          ...baseRow,
          id: "hist-relisted",
          oldStatus: "gagal",
          newStatus: "dipasarkan",
          note: "Barang dipublikasikan kembali ke katalog sebagai sesi Harga Tetap.",
          actorName: null,
          createdAt: eventAt
        }
      ])
    );

    const result = await listAdminBarangHistory("unit-1", undefined, "barang-same-moment-relist");

    expect(result.map((entry) => entry.id)).toEqual(["hist-relisted", "hist-rejected"]);
  });

  it("fills missing marketed, sold, and failed milestones from pemasaran and transaksi history", async () => {
    const baseRow = {
      barangId: "barang-sync",
      barangCode: "BRG-SYNC",
      barangName: "Ipad Terbaru",
      category: "elektronik",
      condition: "baik",
      description: "Perangkat flagship.",
      specifications: {},
      ownerName: "Nasabah Sync",
      customerNumber: "NSB-SYNC"
    };

    mocks.db.select
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            id: "hist-input",
            oldStatus: null,
            newStatus: "jaminan",
            note: "Barang hasil input gadai dicatat sebagai barang jaminan unit.",
            actorName: "Admin Input",
            actorRole: "admin_unit",
            createdAt: new Date("2026-05-31T10:44:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() => mockHistoryQuery([]))
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            marketingId: "marketing-fixed",
            mode: "fixed_price",
            status: "gagal",
            iteration: 1,
            createdAt: new Date("2026-06-01T13:47:00.000Z"),
            actorName: "Admin Pemasaran",
            actorRole: "admin_unit",
            bidCount: 0
          },
          {
            ...baseRow,
            marketingId: "marketing-vickrey",
            mode: "vickrey",
            status: "selesai",
            iteration: 2,
            createdAt: new Date("2026-06-02T13:47:00.000Z"),
            actorName: "Admin Pemasaran",
            actorRole: "admin_unit",
            bidCount: 2
          }
        ])
      )
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            marketingId: "marketing-fixed",
            type: "fixed_price",
            status: "ditolak_bukti",
            rejectionReason: "Nominal tidak sesuai.",
            createdAt: new Date("2026-06-01T14:00:00.000Z"),
            updatedAt: new Date("2026-06-01T15:30:00.000Z"),
            verifiedAt: new Date("2026-06-01T15:30:00.000Z"),
            completedAt: null,
            paymentDeadline: null,
            actorName: "Admin Verifikasi",
            actorRole: "admin_unit"
          },
          {
            ...baseRow,
            marketingId: "marketing-vickrey",
            type: "vickrey",
            status: "selesai",
            rejectionReason: null,
            createdAt: new Date("2026-06-02T14:00:00.000Z"),
            updatedAt: new Date("2026-06-03T13:57:00.000Z"),
            verifiedAt: new Date("2026-06-03T13:57:00.000Z"),
            completedAt: new Date("2026-06-04T09:00:00.000Z"),
            paymentDeadline: new Date("2026-06-03T14:10:00.000Z"),
            actorName: "Admin Verifikasi",
            actorRole: "admin_unit"
          }
        ])
      );

    const result = await listAdminBarangHistory("unit-1");

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionKey: "dipasarkan",
          note: "Barang dipublikasikan ke katalog sebagai sesi Harga Tetap."
        }),
        expect.objectContaining({
          actionKey: "gagal",
          note: "Verifikasi bukti pembayaran harga tetap ditolak admin unit. Alasan: Nominal tidak sesuai."
        }),
        expect.objectContaining({
          actionKey: "dipasarkan",
          note: "Barang dipublikasikan ke katalog sebagai sesi Lelang Tertutup."
        }),
        expect.objectContaining({
          actionKey: "terjual",
          note: "Pemenang Lelang Tertutup menyelesaikan pembayaran dan barang tercatat terjual."
        })
      ])
    );
  });

  it("keeps failed marketing chronology synced to the real failure event once", async () => {
    const baseRow = {
      barangId: "barang-chronology",
      barangCode: "BRG-CHRONOLOGY",
      barangName: "Kalung Salib Emas 17K",
      category: "perhiasan",
      condition: "baik",
      description: "Kalung emas.",
      specifications: {},
      ownerName: "Nasabah Chronology",
      customerNumber: "NSB-CHRONOLOGY"
    };

    mocks.db.select
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            id: "hist-failed",
            oldStatus: "dipasarkan",
            newStatus: "gagal",
            note: "Sesi Vickrey berakhir tanpa penawar sehingga barang masuk status gagal.",
            actorName: null,
            actorRole: null,
            createdAt: new Date("2026-05-27T07:51:00.000Z")
          },
          {
            ...baseRow,
            id: "hist-failed-duplicate",
            oldStatus: "dipasarkan",
            newStatus: "gagal",
            note: "Sesi Vickrey berakhir tanpa penawar sehingga barang masuk status gagal.",
            actorName: null,
            actorRole: null,
            createdAt: new Date("2026-05-27T07:51:30.000Z")
          },
          {
            ...baseRow,
            id: "hist-input",
            oldStatus: null,
            newStatus: "jaminan",
            note: "Barang hasil input gadai dicatat sebagai barang jaminan unit.",
            actorName: "Admin Input",
            actorRole: "admin_unit",
            createdAt: new Date("2026-05-26T07:28:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() => mockHistoryQuery([]))
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            marketingId: "marketing-vickrey-failed",
            mode: "vickrey",
            status: "gagal",
            iteration: 1,
            createdAt: new Date("2026-05-26T07:36:00.000Z"),
            updatedAt: new Date("2026-05-27T07:51:00.000Z"),
            endsAt: new Date("2026-05-27T07:36:00.000Z"),
            actorName: "Admin Pemasaran",
            actorRole: "admin_unit",
            bidCount: 0
          }
        ])
      )
      .mockImplementationOnce(() => mockHistoryQuery([]));

    const result = await listAdminBarangHistory("unit-1", undefined, "barang-chronology");
    const failedEntries = result.filter((entry) => entry.actionKey === "gagal");

    expect(failedEntries).toHaveLength(1);
    expect(failedEntries[0]).toEqual(
      expect.objectContaining({
        id: "hist-failed",
        createdAt: "2026-05-27T07:51:00.000Z",
        note: "Sesi Lelang Tertutup berakhir tanpa penawar sehingga barang masuk status gagal."
      })
    );
    expect(result.map((entry) => entry.actionKey)).toEqual(["gagal", "dipasarkan", "input_baru"]);
    expect(result.map((entry) => entry.note).join(" ")).not.toMatch(/Vickrey|Repair DB/i);
  });

  it("uses the actual status update time when synthesizing a failed payment chronology", async () => {
    const baseRow = {
      barangId: "barang-payment-failure",
      barangCode: "BRG-PAYMENT-FAILURE",
      barangName: "Cincin Emas Terlambat Bayar",
      category: "perhiasan",
      condition: "baik",
      description: "Cincin emas.",
      specifications: {},
      ownerName: "Nasabah Payment Failure",
      customerNumber: "NSB-PAYMENT-FAILURE"
    };

    mocks.db.select
      .mockImplementationOnce(() => mockHistoryQuery([]))
      .mockImplementationOnce(() => mockHistoryQuery([]))
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            marketingId: "marketing-payment-failure",
            mode: "vickrey",
            status: "gagal",
            iteration: 1,
            createdAt: new Date("2026-05-26T07:36:00.000Z"),
            updatedAt: new Date("2026-05-27T07:51:00.000Z"),
            endsAt: new Date("2026-05-26T07:36:00.000Z"),
            actorName: "Admin Pemasaran",
            actorRole: "admin_unit",
            bidCount: 2
          }
        ])
      )
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            marketingId: "marketing-payment-failure",
            type: "vickrey",
            status: "gagal",
            rejectionReason: null,
            createdAt: new Date("2026-05-26T07:36:00.000Z"),
            updatedAt: new Date("2026-05-27T07:51:00.000Z"),
            verifiedAt: null,
            completedAt: null,
            paymentDeadline: new Date("2026-05-27T07:36:00.000Z"),
            actorName: "Sistem Otomatis",
            actorRole: "system"
          }
        ])
      );

    const result = await listAdminBarangHistory(
      "unit-1",
      undefined,
      "barang-payment-failure"
    );
    const failedEntry = result.find((entry) => entry.actionKey === "gagal");

    expect(failedEntry).toEqual(
      expect.objectContaining({
        createdAt: "2026-05-27T07:51:00.000Z"
      })
    );
  });

  it("omits database repair audit rows from the business chronology", async () => {
    const baseRow = {
      barangId: "barang-repair",
      barangCode: "BRG-REPAIR",
      barangName: "Jam Tangan Harga Tetap",
      category: "aksesoris",
      condition: "baik",
      description: "Jam tangan.",
      specifications: {},
      ownerName: "Nasabah Repair",
      customerNumber: "NSB-REPAIR",
      actorName: "Repair DB",
      actorRole: "admin_unit"
    };

    mocks.db.select.mockImplementationOnce(() =>
      mockHistoryQuery([
        {
          ...baseRow,
          id: "hist-repair",
          oldStatus: "dipasarkan",
          newStatus: "gagal",
          note: "Repair DB: bukti pembayaran harga tetap transaksi trx-1 sudah ditolak, tetapi pemasaran pm-5 masih aktif. Alasan: Nominal kurang. Barang dipasarkan ulang otomatis ke iterasi 6.",
          createdAt: new Date("2026-07-06T08:00:00.000Z")
        }
      ])
    );

    const result = await listAdminBarangHistory("unit-1", undefined, "barang-repair");

    expect(result).toEqual([]);
  });

  it("normalizes production repair history and aligns fixed-price relist chronology to the rejection time", async () => {
    const publishedAt = new Date("2026-06-22T21:00:00.000Z");
    const rejectedAt = new Date("2026-07-06T07:36:00.000Z");
    const relistedAt = new Date(rejectedAt.getTime() + 1);
    const repairAt = new Date("2026-07-06T14:48:00.000Z");
    const baseRow = {
      barangId: "barang-production-repair",
      barangCode: "BRG-PROD-REPAIR",
      barangName: "Kalung Salib Emas 17K",
      category: "perhiasan",
      condition: "baik",
      description: "Kalung emas.",
      specifications: {},
      ownerName: "Nasabah Production",
      customerNumber: "NSB-PROD"
    };

    mocks.db.select
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            id: "hist-published-generic",
            oldStatus: "jaminan",
            newStatus: "dipasarkan",
            note: "Barang dipublikasikan ke katalog.",
            actorName: "Hendra Wijaya",
            actorRole: "admin_unit",
            createdAt: publishedAt
          },
          {
            ...baseRow,
            id: "hist-repair-production",
            oldStatus: "dipasarkan",
            newStatus: "gagal",
            note: "Repair DB production: bukti pembayaran harga tetap transaksi trx-ditolak sudah ditolak, tetapi pemasaran pm-5 masih aktif. Alasan: Uang dikirim bukan ke rekening tujuan. Barang dipasarkan ulang otomatis ke iterasi 6.",
            actorName: "Hendra Wijaya",
            actorRole: "admin_unit",
            createdAt: repairAt
          }
        ])
      )
      .mockImplementationOnce(() => mockHistoryQuery([]))
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            marketingId: "pm-6",
            mode: "fixed_price",
            status: "aktif",
            iteration: 6,
            createdAt: repairAt,
            updatedAt: repairAt,
            endsAt: null,
            actorName: "Hendra Wijaya",
            actorRole: "admin_unit",
            bidCount: 0
          },
          {
            ...baseRow,
            marketingId: "pm-5",
            mode: "fixed_price",
            status: "gagal",
            iteration: 5,
            createdAt: publishedAt,
            updatedAt: rejectedAt,
            endsAt: null,
            actorName: "Hendra Wijaya",
            actorRole: "admin_unit",
            bidCount: 0
          }
        ])
      )
      .mockImplementationOnce(() =>
        mockHistoryQuery([
          {
            ...baseRow,
            marketingId: "pm-5",
            type: "fixed_price",
            status: "ditolak_bukti",
            rejectionReason: "Uang dikirim bukan ke rekening tujuan",
            createdAt: new Date("2026-07-06T07:10:00.000Z"),
            updatedAt: rejectedAt,
            verifiedAt: rejectedAt,
            completedAt: null,
            paymentDeadline: null,
            actorName: "Maria Supit",
            actorRole: "admin_unit"
          }
        ])
      );

    const result = await listAdminBarangHistory("unit-1", undefined, "barang-production-repair");
    const notes = result.map((entry) => entry.note).join(" ");
    const firstPublish = result.find((entry) => entry.id === "hist-published-generic");
    const failedEntries = result.filter((entry) => entry.actionKey === "gagal");
    const relistPublish = result.find((entry) => entry.id === "marketing-pm-6");
    const rejectionSequenceEntries = result.filter(
      (entry) => new Date(entry.createdAt).getTime() >= rejectedAt.getTime()
        && new Date(entry.createdAt).getTime() <= relistedAt.getTime()
    );

    expect(notes).not.toMatch(/Repair DB|production|iterasi|dipasarkan ulang otomatis/i);
    expect(firstPublish).toEqual(
      expect.objectContaining({
        note: "Barang dipublikasikan ke katalog sebagai sesi Harga Tetap."
      })
    );
    expect(failedEntries).toEqual([
      expect.objectContaining({
        id: "transaction-failed-pm-5",
        createdAt: rejectedAt.toISOString(),
        note: "Verifikasi bukti pembayaran harga tetap ditolak admin unit. Alasan: Uang dikirim bukan ke rekening tujuan."
      })
    ]);
    expect(relistPublish).toEqual(
      expect.objectContaining({
        actorName: "Sistem Otomatis",
        actorRole: null,
        createdAt: relistedAt.toISOString(),
        note: "Barang dipublikasikan kembali ke katalog sebagai sesi Harga Tetap."
      })
    );
    expect(rejectionSequenceEntries.map((entry) => entry.actionKey)).toEqual([
      "dipasarkan",
      "gagal"
    ]);
  });
});
