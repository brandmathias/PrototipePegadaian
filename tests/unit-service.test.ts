import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    transaction: vi.fn(),
    update: vi.fn()
  },
  revalidateTag: vi.fn()
}));

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag
}));

import { getUnitItemOperationalState } from "@/lib/services/unit.service";

describe("getUnitItemOperationalState", () => {
  it.each([
    ["menunggu_pembayaran", null, "Menunggu Pembayaran"],
    ["bukti_diunggah", null, "Bukti Transfer Diterima"],
    ["menunggu_konfirmasi_langsung", null, "Menunggu Verifikasi"],
    ["lunas", null, "Menunggu Serah-Terima"],
    ["lunas", "/bukti.jpg", "Menunggu Penyelesaian Buyer"],
    ["selesai", "/bukti.jpg", "Terjual"],
  ])("shows the transaction stage for %s with proof %s", (status, proof, expected) => {
    expect(getUnitItemOperationalState({
      itemStatus: status === "lunas" || status === "selesai" ? "terjual" : "dipasarkan",
      transactionStatus: status,
      handoverProofUrl: proof,
    }).operationalStatus).toBe(expected);
  });

  it("keeps a relisted harga tetap item marketed even when an older proof was rejected", () => {
    expect(
      getUnitItemOperationalState({
        itemStatus: "dipasarkan",
        activeMarketingMode: "fixed_price",
        activeMarketingStatus: "aktif",
        latestMarketingStatus: "aktif",
        transactionStatus: "ditolak_bukti"
      })
    ).toEqual({
      operationalStatus: "Sedang Dipasarkan",
      operationalTone: "blue"
    });
  });
});
