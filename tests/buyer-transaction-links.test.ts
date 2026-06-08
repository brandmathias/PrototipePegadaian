import { describe, expect, it } from "vitest";

import {
  getBuyerBidTransactionHref,
  getBuyerTransactionHref,
  isBuyerWinnerAnnouncementTransaction,
} from "@/lib/buyer/transaction-links";

describe("buyer transaction links", () => {
  it("routes active Lelang Tertutup winners to the winner announcement page before payment detail", () => {
    expect(
      isBuyerWinnerAnnouncementTransaction({
        kind: "VICKREY_WIN",
        status: "MENUNGGU_PEMBAYARAN",
      })
    ).toBe(true);
    expect(
      isBuyerWinnerAnnouncementTransaction({
        kind: "VICKREY_WIN",
        status: "MENUNGGU_KONFIRMASI_LANGSUNG",
      })
    ).toBe(true);
    expect(
      isBuyerWinnerAnnouncementTransaction({
        kind: "VICKREY_WIN",
        status: "LUNAS",
      })
    ).toBe(true);
    expect(
      isBuyerWinnerAnnouncementTransaction({
        kind: "VICKREY_WIN",
        status: "SELESAI",
      })
    ).toBe(false);
    expect(
      getBuyerTransactionHref({
        id: "trx-vickrey-1",
        kind: "VICKREY_WIN",
        status: "MENUNGGU_PEMBAYARAN",
      })
    ).toBe("/transaksi/trx-vickrey-1/pemenang");
    expect(
      getBuyerBidTransactionHref({
        linkedTransactionId: "trx-vickrey-1",
        status: "MENANG",
        transactionStatus: "MENUNGGU_PEMBAYARAN",
      })
    ).toBe("/transaksi/trx-vickrey-1/pemenang");
    expect(
      getBuyerTransactionHref({
        id: "trx-vickrey-lunas",
        kind: "VICKREY_WIN",
        status: "LUNAS",
      })
    ).toBe("/transaksi/trx-vickrey-lunas/pemenang");
  });
});
