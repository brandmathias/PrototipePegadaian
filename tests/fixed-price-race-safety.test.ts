import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

async function readSource(filePath: string) {
  return readFile(path.join(process.cwd(), filePath), "utf8");
}

describe("fixed-price race safety contracts", () => {
  it("serializes checkout claims through a physical barang row lock", async () => {
    const service = await readSource("lib/services/buyer.service.ts");

    expect(service).toContain("db.transaction(async (tx)");
    expect(service).toContain('.for("update")');
    expect(service).toContain("eq(pemasaran.barangId, lockedItem.id)");
  });

  it("reconciles an expired Midtrans reservation before releasing the item", async () => {
    const service = await readSource("lib/services/buyer.service.ts");

    expect(service).toContain("getMidtransTransactionStatus");
    expect(service).not.toContain('set({ gatewayStatus: "expire", status: "gagal", updatedAt: now })');
  });

  it("cannot mark a checkout creation failed after another process settled it", async () => {
    const service = await readSource("lib/services/buyer.service.ts");

    expect(service).toContain('eq(transaksi.status, "menunggu_pembayaran")');
    expect(service).toContain('eq(transaksi.gatewayStatus, "creating")');
  });

  it("revalidates the physical item while applying a successful Midtrans webhook", async () => {
    const route = await readSource("app/api/payments/midtrans/notification/route.ts");

    expect(route).toContain('.for("update")');
    expect(route).toContain('eq(barang.status, "dipasarkan")');
    expect(route).toContain('eq(transaksi.status, "menunggu_pembayaran")');
  });

  it("serializes admin payment decisions on the same physical item lock", async () => {
    const service = await readSource("lib/services/admin-transaction.service.ts");

    expect(service).toContain('.for("update")');
    expect(service).toContain('eq(transaksi.status, "bukti_diunggah")');
  });

  it("guards legacy transfer proof uploads against a second concurrent write", async () => {
    const service = await readSource("lib/services/buyer.service.ts");

    expect(service).toContain('eq(transaksi.status, "menunggu_pembayaran")');
    expect(service).toContain("db.transaction(async (tx)");
  });

  it("serializes inventory lifecycle actions before an item can be purchased", async () => {
    const service = await readSource("lib/services/admin-barang.service.ts");
    const lifecycle = service.slice(service.indexOf("export async function extendAdminBarang"));

    expect(lifecycle).toContain("db.transaction(async (tx)");
    expect(lifecycle).toContain('.for("update")');
  });

  it("serializes handover proof uploads with buyer completion", async () => {
    const service = await readSource("lib/services/admin-transaction.service.ts");
    const handover = service.slice(
      service.indexOf("export async function uploadAdminTransactionHandoverProof"),
      service.indexOf("async function ensureTransactionMutable")
    );

    expect(handover).toContain("db.transaction(async (tx)");
    expect(handover).toContain('.for("update")');
    expect(handover).toContain('eq(transaksi.status, "lunas")');
  });

  it("serializes automatic handover completion with all other sale transitions", async () => {
    const service = await readSource("lib/services/cron.service.ts");
    const handover = service.slice(service.indexOf("export async function processHandoverAutoCompletions"));

    expect(handover).toContain('.for("update")');
    expect(handover).toContain('eq(barang.status, "dipasarkan")');
  });
});
