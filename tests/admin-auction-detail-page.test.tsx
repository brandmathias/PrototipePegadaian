import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminAuctionDetailPage } from "@/components/pages/admin-pages";

describe("AdminAuctionDetailPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T10:00:00+08:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps bid list hidden while auction is still active", () => {
    render(
      <AdminAuctionDetailPage
        auction={{
          id: "pm-1",
          lotId: "barang-1",
          lot: "Cincin Emas",
          status: "AKTIF",
          ending: "1 hari 2 jam",
          endingAt: new Date("2026-04-30T12:00:00+08:00").toISOString(),
          participants: 3,
          mode: "VICKREY_AUCTION",
          basePrice: 10000000,
          finalPrice: null,
          winner: null,
          visibility: "TERKUNCI",
          note: "Nominal bid belum dapat dibuka sebelum waktu penutupan terlewati.",
          bids: []
        }}
      />
    );

    expect(screen.getByText(/daftar nominal bid baru dibuka setelah deadline terlewati/i)).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: /pemenang/i })).not.toBeInTheDocument();
  });

  it("renders ranked bids after results are open", () => {
    render(
      <AdminAuctionDetailPage
        auction={{
          id: "pm-2",
          lotId: "barang-2",
          lot: "Laptop Pro",
          status: "SELESAI",
          ending: "deadline terlewati",
          endingAt: new Date("2026-04-28T10:00:00+08:00").toISOString(),
          participants: 2,
          mode: "VICKREY_AUCTION",
          basePrice: 10000000,
          finalPrice: 13250000,
          winner: "Raras",
          visibility: "HASIL_DIBUKA",
          note: "Hasil pemasaran dapat ditinjau oleh admin unit.",
          bids: [
            {
              id: "bid-1",
              bidderId: "buyer-1",
              bidderName: "Raras",
              nominal: 15000000,
              submittedAt: "2026-04-28T02:00:00.000Z",
              submittedAtLabel: "28 Apr 2026, 10.00",
              rank: 1,
              isWinner: true,
              determinesFinalPrice: false
            },
            {
              id: "bid-2",
              bidderId: "buyer-2",
              bidderName: "Alya",
              nominal: 13250000,
              submittedAt: "2026-04-28T01:55:00.000Z",
              submittedAtLabel: "28 Apr 2026, 09.55",
              rank: 2,
              isWinner: false,
              determinesFinalPrice: true
            }
          ]
        }}
      />
    );

    expect(screen.getByText(/pemenang \(b1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/penentu harga bayar \(b2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/rp\s?15\.000\.000/i)).toBeInTheDocument();
    expect(screen.getAllByText(/rp\s?13\.250\.000/i)).toHaveLength(2);
  });
});
