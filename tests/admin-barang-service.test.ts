import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    select: vi.fn()
  };

  return {
    db,
    serializeAdminBarang: vi.fn((row, extra) => ({
      id: row.id,
      status: row.status,
      previewImageUrl: extra?.previewImageUrl ?? null,
      marketingMode: extra?.marketingMode ?? null
    }))
  };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("@/lib/admin-unit/serializers", () => ({
  serializeAdminBarang: mocks.serializeAdminBarang
}));

import { listAdminBarang } from "@/lib/services/admin-barang.service";

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
});
