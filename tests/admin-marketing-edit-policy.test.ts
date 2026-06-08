import { describe, expect, it } from "vitest";

import { canEditMarketedBarang } from "@/lib/admin-unit/marketing-edit-policy";

describe("admin marketing edit policy", () => {
  it("allows active harga tetap barang to keep its public details editable", () => {
    expect(
      canEditMarketedBarang({
        status: "dipasarkan",
        activeMarketingMode: "fixed_price"
      })
    ).toBe(true);
  });

  it("keeps active auction barang locked while the auction is still running or waiting for payment", () => {
    expect(
      canEditMarketedBarang({
        status: "dipasarkan",
        activeMarketingMode: "vickrey"
      })
    ).toBe(false);

    expect(
      canEditMarketedBarang({
        status: "menunggu_pembayaran",
        latestMarketingMode: "vickrey",
        latestMarketingStatus: "selesai",
        hasFailedWinnerPayment: false
      })
    ).toBe(false);
  });

  it("allows failed auction barang to be edited when there were no participants", () => {
    expect(
      canEditMarketedBarang({
        status: "gagal",
        latestMarketingMode: "vickrey",
        latestMarketingStatus: "gagal",
        participantCount: 0,
        hasWinner: false
      })
    ).toBe(true);
  });

  it("allows failed auction barang to be edited when the winner missed the 24 hour payment deadline", () => {
    expect(
      canEditMarketedBarang({
        status: "gagal",
        latestMarketingMode: "vickrey",
        latestMarketingStatus: "gagal",
        participantCount: 3,
        hasWinner: true,
        hasFailedWinnerPayment: true
      })
    ).toBe(true);
  });

  it("does not treat failed harga tetap sessions as auction strategy cases", () => {
    expect(
      canEditMarketedBarang({
        status: "gagal",
        latestMarketingMode: "fixed_price",
        latestMarketingStatus: "gagal",
        participantCount: 0
      })
    ).toBe(false);
  });
});
