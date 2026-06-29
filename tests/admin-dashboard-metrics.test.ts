import { describe, expect, it } from "vitest";

describe("admin dashboard transaction metrics", () => {
  it("counts sold items uniquely while preserving validated transaction totals", async () => {
    process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/prototipe_pegadaian";

    const service = await import("@/lib/services/admin-dashboard.service");
    const summarize = (service as Record<string, unknown>).summarizeAdminDashboardTransactions;

    expect(typeof summarize).toBe("function");
    if (typeof summarize !== "function") {
      return;
    }

    const result = summarize([
      {
        id: "trx-1",
        itemId: "barang-1",
        userId: "buyer-1",
        amount: "12500000",
        status: "lunas",
        transactionType: "fixed_price",
        marketingMode: "fixed_price",
        createdAt: new Date("2026-06-20T10:00:00.000Z"),
        verifiedAt: new Date("2026-06-20T11:00:00.000Z")
      },
      {
        id: "trx-2",
        itemId: "barang-1",
        userId: "buyer-1",
        amount: "7500000",
        status: "selesai",
        transactionType: "fixed_price",
        marketingMode: "fixed_price",
        createdAt: new Date("2026-06-21T10:00:00.000Z"),
        verifiedAt: new Date("2026-06-21T11:00:00.000Z")
      },
      {
        id: "trx-3",
        itemId: "barang-2",
        userId: "buyer-2",
        amount: "9000000",
        status: "menunggu_pembayaran",
        transactionType: "vickrey",
        marketingMode: "vickrey",
        createdAt: new Date("2026-06-22T10:00:00.000Z"),
        verifiedAt: null
      }
    ]);

    expect(result.soldItems).toBe(1);
    expect(result.verifiedTransactions).toHaveLength(2);
    expect(result.totalRevenue).toBe(20_000_000);
  });
});
