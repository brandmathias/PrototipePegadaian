import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AdminMarketingUnifiedPage,
  AdminFixedPriceListPage,
  AdminFixedPriceDetailPage,
  AdminVickreyAuctionListPage,
  AdminVickreyAuctionDetailPage
} from "@/components/pages/admin-marketing-pages";

describe("admin pemasaran pages", () => {
  it("renders a compact unified marketing workspace from backend sessions", () => {
    render(
      <AdminMarketingUnifiedPage
        unitName="UPC Ranotana"
        auctions={[
          {
            id: "pm-fixed-active",
            lotId: "barang-1",
            lot: "Kalung Emas Aktif",
            code: "BRG-001",
            category: "emas",
            condition: "baik",
            status: "AKTIF",
            mode: "FIXED_PRICE",
            startsAt: "2026-05-01T00:00:00.000Z",
            price: 12500000,
            media: [{ id: "m1", type: "foto", url: "/uploads/kalung.jpg", fileName: "kalung.jpg" }],
            primaryMedia: { id: "m1", type: "foto", url: "/uploads/kalung.jpg", fileName: "kalung.jpg" },
            note: "Belum ada transaksi pembeli pada sesi fixed price ini."
          },
          {
            id: "pm-vickrey-active",
            lotId: "barang-2",
            lot: "Cincin Emas Aktif",
            code: "BRG-002",
            category: "emas",
            condition: "baik",
            status: "AKTIF",
            mode: "VICKREY_AUCTION",
            ending: "2026-05-08",
            endingAt: "2099-05-08T00:00:00.000Z",
            participants: 12,
            basePrice: 10000000,
            finalPrice: null,
            winner: null,
            visibility: "TERKUNCI",
            media: [{ id: "m2", type: "foto", url: "/uploads/cincin.jpg", fileName: "cincin.jpg" }],
            primaryMedia: { id: "m2", type: "foto", url: "/uploads/cincin.jpg", fileName: "cincin.jpg" },
            bids: []
          },
          {
            id: "pm-sold",
            lotId: "barang-3",
            lot: "Gelang Sudah Terjual",
            code: "BRG-003",
            category: "perhiasan",
            condition: "sangat baik",
            status: "SELESAI",
            mode: "FIXED_PRICE",
            price: 17000000,
            transactionStatus: "LUNAS",
            buyerName: "Raras Maheswari Demo",
            soldAt: "2026-05-03T00:00:00.000Z",
            media: [{ id: "m3", type: "foto", url: "/uploads/gelang.jpg", fileName: "gelang.jpg" }],
            primaryMedia: { id: "m3", type: "foto", url: "/uploads/gelang.jpg", fileName: "gelang.jpg" }
          },
          {
            id: "pm-failed",
            lotId: "barang-4",
            lot: "Iphone Gagal Bayar",
            code: "BRG-004",
            category: "elektronik",
            condition: "baik",
            status: "GAGAL",
            mode: "VICKREY_AUCTION",
            ending: "2026-05-29",
            endingAt: "2026-05-29T02:29:44.886Z",
            participants: 2,
            basePrice: 12000000,
            finalPrice: 20000000,
            winner: "Buyer Demo 13 B",
            visibility: "HASIL_DIBUKA",
            transactionId: "trx-failed",
            transactionStatus: "GAGAL",
            paymentDeadline: "2026-05-29T02:29:44.886Z",
            media: [{ id: "m4", type: "foto", url: "/uploads/iphone.jpg", fileName: "iphone.jpg" }],
            primaryMedia: { id: "m4", type: "foto", url: "/uploads/iphone.jpg", fileName: "iphone.jpg" },
            note: "Pemenang melewati batas pembayaran 24 jam."
          }
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: /pemasaran barang/i })).toBeInTheDocument();
    expect(screen.getByText("UPC Ranotana")).toBeInTheDocument();
    expect(screen.getByText("2 Sesi")).toBeInTheDocument();
    expect(screen.getByText(/1 Beli Putus \/ 1 Lelang/i)).toBeInTheDocument();
    expect(screen.getByText("Kalung Emas Aktif")).toBeInTheDocument();
    expect(screen.getByText("Cincin Emas Aktif")).toBeInTheDocument();
    expect(screen.getAllByText("Peserta").length).toBeGreaterThan(0);
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getAllByText("Kode Lot").length).toBeGreaterThan(0);
    expect(screen.getByText("Sesi Berakhir")).toBeInTheDocument();
    expect(screen.getByText("Gelang Sudah Terjual")).toBeInTheDocument();
    expect(screen.getByText("Iphone Gagal Bayar")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aktif" }));

    expect(screen.getByText("Kalung Emas Aktif")).toBeInTheDocument();
    expect(screen.queryByText("Gelang Sudah Terjual")).not.toBeInTheDocument();
    expect(screen.queryByText("Iphone Gagal Bayar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Selesai" }));

    expect(screen.getByText("Gelang Sudah Terjual")).toBeInTheDocument();
    expect(screen.queryByText("Kalung Emas Aktif")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Perlu Strategi" }));

    expect(screen.getByText("Iphone Gagal Bayar")).toBeInTheDocument();
    expect(screen.queryByText("Gelang Sudah Terjual")).not.toBeInTheDocument();
  });

  it("renders fixed price cards without auction-only language", () => {
    render(
      <AdminFixedPriceListPage
        auctions={[
          {
            id: "pm-fixed",
            lotId: "barang-1",
            lot: "Kalung Emas",
            code: "BRG-001",
            category: "emas",
            condition: "baik",
            status: "AKTIF",
            mode: "FIXED_PRICE",
            price: 12500000,
            transactionStatus: "BUKTI_DIUNGGAH",
            buyerName: "Raras",
            paymentMethod: "TRANSFER_BANK",
            proofUrl: "/uploads/bukti.jpg",
            reference: "TRX-001",
            soldAt: null,
            paymentDeadline: "2026-05-03T00:00:00.000Z",
            media: [{ id: "m1", type: "foto", url: "/uploads/kalung.jpg", fileName: "kalung.jpg" }],
            primaryMedia: { id: "m1", type: "foto", url: "/uploads/kalung.jpg", fileName: "kalung.jpg" },
            note: "Pembeli menunggu verifikasi"
          }
        ]}
      />
    );

    expect(screen.getByText(/kalung emas/i)).toBeInTheDocument();
    expect(screen.queryByText(/visibilitas bid/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/peserta/i)).not.toBeInTheDocument();
  });

  it("renders fixed price detail media with the buyer-style gallery", () => {
    render(
      <AdminFixedPriceDetailPage
        auction={{
          id: "pm-fixed-detail",
          lotId: "barang-1",
          lot: "Kalung Emas",
          code: "BRG-001",
          category: "emas",
          condition: "baik",
          status: "AKTIF",
          mode: "FIXED_PRICE",
          startsAt: "2026-05-01T00:00:00.000Z",
          ending: "-",
          endingAt: undefined,
          price: 12500000,
          transactionStatus: "BUKTI_DIUNGGAH",
          buyerName: "Raras",
          paymentMethod: "TRANSFER_BANK",
          proofUrl: "/uploads/bukti.jpg",
          reference: "TRX-001",
          soldAt: null,
          paymentDeadline: "2026-05-03T00:00:00.000Z",
          media: [
            { id: "m1", type: "foto", url: "/uploads/kalung.jpg", fileName: "kalung.jpg" },
            { id: "m2", type: "video", url: "/uploads/kalung.mp4", fileName: "kalung.mp4" }
          ],
          primaryMedia: { id: "m1", type: "foto", url: "/uploads/kalung.jpg", fileName: "kalung.jpg" },
          note: "Pembeli menunggu verifikasi"
        }}
      />
    );

    expect(screen.getByTestId("lot-media-active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lihat video 2/i })).toBeInTheDocument();
  });

  it("keeps vickrey bids locked before deadline", () => {
    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-vickrey",
          lotId: "barang-2",
          lot: "Cincin Emas",
          code: "BRG-002",
          category: "emas",
          condition: "baik",
          status: "AKTIF",
          mode: "VICKREY_AUCTION",
          ending: "1 hari 2 jam",
          endingAt: new Date("2026-05-06T12:00:00+08:00").toISOString(),
          participants: 3,
          basePrice: 10000000,
          finalPrice: null,
          winner: null,
          visibility: "TERKUNCI",
          note: "Nominal bid belum dapat dibuka sebelum waktu penutupan terlewati.",
          media: [{ id: "m2", type: "foto", url: "/uploads/cincin.jpg", fileName: "cincin.jpg" }],
          primaryMedia: { id: "m2", type: "foto", url: "/uploads/cincin.jpg", fileName: "cincin.jpg" },
          bids: []
        }}
      />
    );

    expect(screen.getByText(/tetap tersembunyi sampai deadline selesai/i)).toBeInTheDocument();
    expect(screen.queryByText(/pemenang \(b1\)/i)).not.toBeInTheDocument();
  });

  it("shows waiting reveal state after deadline without winner data", () => {
    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-waiting-reveal",
          lotId: "barang-2",
          lot: "Mobil",
          code: "BRG-004",
          category: "kendaraan",
          condition: "baik",
          status: "AKTIF",
          mode: "VICKREY_AUCTION",
          ending: "13 Mei 2026",
          endingAt: "2026-05-12T22:29:31.032Z",
          revealDeadline: "13 Mei 2026, 06.39",
          revealDeadlineAt: "2099-05-12T22:39:31.032Z",
          participants: 2,
          revealedBidCount: 1,
          pendingRevealCount: 1,
          basePrice: 100000000,
          finalPrice: null,
          winner: null,
          visibility: "MENUNGGU_REVEAL",
          note: "Deadline sudah lewat. Sistem menunggu buyer reveal nominal sebelum pemenang dihitung.",
          media: [{ id: "m2", type: "foto", url: "/uploads/mobil.jpg", fileName: "mobil.jpg" }],
          bids: [
            {
              id: "bid-1",
              bidderId: "buyer-1",
              bidderName: "Buyer A",
              submittedAtLabel: "13 Mei 2026, 06.01",
              isRevealed: true,
              rank: 1,
              isWinner: false,
              determinesFinalPrice: false
            },
            {
              id: "bid-2",
              bidderId: "buyer-2",
              bidderName: "Buyer B",
              submittedAtLabel: "13 Mei 2026, 06.06",
              isRevealed: false,
              rank: 2,
              isWinner: false,
              determinesFinalPrice: false
            }
          ]
        }}
      />
    );

    expect(screen.getAllByText(/menunggu buyer reveal nominal/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/sudah reveal/i)).toBeInTheDocument();
    expect(screen.getByText(/belum reveal/i)).toBeInTheDocument();
    expect(screen.queryByText(/pemenang \(b1\)/i)).not.toBeInTheDocument();
  });

  it("renders vickrey as an operational workspace for admin unit", () => {
    render(
      <AdminVickreyAuctionListPage
        auctions={[
          {
            id: "pm-active",
            lotId: "barang-active",
            lot: "Cincin Emas",
            code: "BRG-002",
            category: "emas",
            condition: "baik",
            status: "AKTIF",
            mode: "VICKREY_AUCTION",
            ending: "2026-05-08",
            endingAt: "2099-05-08T00:00:00.000Z",
            participants: 3,
            basePrice: 10000000,
            finalPrice: null,
            winner: null,
            visibility: "TERKUNCI",
            media: [{ id: "m2", type: "foto", url: "/uploads/cincin.jpg", fileName: "cincin.jpg" }],
            primaryMedia: { id: "m2", type: "foto", url: "/uploads/cincin.jpg", fileName: "cincin.jpg" },
            bids: []
          },
          {
            id: "pm-payment",
            lotId: "barang-payment",
            lot: "Gelang Berlian",
            code: "BRG-003",
            category: "perhiasan",
            condition: "sangat baik",
            status: "SELESAI",
            mode: "VICKREY_AUCTION",
            ending: "2026-05-04",
            endingAt: "2026-05-04T00:00:00.000Z",
            participants: 2,
            basePrice: 50000000,
            finalPrice: 62000000,
            winner: "Raras",
            visibility: "HASIL_DIBUKA",
            transactionId: "trx-vickrey-1",
            transactionStatus: "MENUNGGU_KONFIRMASI_LANGSUNG",
            buyerName: "Raras",
            paymentMethod: "BAYAR_LANGSUNG",
            paymentDeadline: "2099-05-09T00:00:00.000Z",
            media: [{ id: "m3", type: "foto", url: "/uploads/gelang.jpg", fileName: "gelang.jpg" }],
            primaryMedia: { id: "m3", type: "foto", url: "/uploads/gelang.jpg", fileName: "gelang.jpg" },
            bids: []
          }
        ]}
      />
    );

    expect(screen.getByText(/ruang kerja lelang tertutup/i)).toBeInTheDocument();
    expect(screen.getAllByText(/sesi aktif/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/antrian pembayaran/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /buka transaksi pemenang/i })).toHaveAttribute(
      "href",
      "/admin/transaksi/trx-vickrey-1?from=vickrey"
    );
  });

  it("shows vickrey payment operations on the detail page after a winner exists", () => {
    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-vickrey-payment",
          lotId: "barang-payment",
          lot: "Gelang Berlian",
          code: "BRG-003",
          category: "perhiasan",
          condition: "sangat baik",
          status: "SELESAI",
          mode: "VICKREY_AUCTION",
          ending: "2026-05-04",
          endingAt: "2026-05-04T00:00:00.000Z",
          participants: 2,
          basePrice: 50000000,
          finalPrice: 62000000,
          winner: "Raras",
          visibility: "HASIL_DIBUKA",
          transactionId: "trx-vickrey-1",
          transactionStatus: "MENUNGGU_KONFIRMASI_LANGSUNG",
          buyerName: "Raras",
          paymentMethod: "BAYAR_LANGSUNG",
          proofUrl: null,
          paymentDeadline: "2099-05-09T00:00:00.000Z",
          media: [{ id: "m3", type: "foto", url: "/uploads/gelang.jpg", fileName: "gelang.jpg" }],
          primaryMedia: { id: "m3", type: "foto", url: "/uploads/gelang.jpg", fileName: "gelang.jpg" },
          bids: [
            {
              id: "bid-1",
              bidderId: "buyer-1",
              bidderName: "Raras",
              submittedAtLabel: "4 Mei 2026, 08.00",
              rank: 1,
              isWinner: true,
              determinesFinalPrice: false
            },
            {
              id: "bid-2",
              bidderId: "buyer-2",
              bidderName: "Alya",
              submittedAtLabel: "4 Mei 2026, 08.05",
              rank: 2,
              isWinner: false,
              determinesFinalPrice: false
            }
          ]
        }}
      />
    );

    expect(screen.getByText(/pembayaran pemenang/i)).toBeInTheDocument();
    expect(screen.getByText(/menunggu konfirmasi langsung/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buka transaksi pemenang/i })).toHaveAttribute(
      "href",
      "/admin/transaksi/trx-vickrey-1?from=vickrey"
    );
    expect(screen.queryByRole("link", { name: /buka bukti pembayaran/i })).not.toBeInTheDocument();
  });
});
