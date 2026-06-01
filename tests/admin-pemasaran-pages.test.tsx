import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
          },
          {
            id: "pm-no-bids",
            lotId: "barang-5",
            lot: "Jam Tangan Tanpa Peserta",
            code: "BRG-005",
            category: "perhiasan",
            condition: "baik",
            status: "GAGAL",
            mode: "VICKREY_AUCTION",
            ending: "2026-05-29",
            endingAt: "2026-05-29T02:29:44.886Z",
            participants: 0,
            basePrice: 8000000,
            finalPrice: null,
            winner: null,
            visibility: "HASIL_DIBUKA",
            media: [{ id: "m5", type: "foto", url: "/uploads/jam.jpg", fileName: "jam.jpg" }],
            primaryMedia: { id: "m5", type: "foto", url: "/uploads/jam.jpg", fileName: "jam.jpg" },
            note: "Sesi Vickrey berakhir tanpa penawar sehingga barang masuk status gagal."
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
    expect(screen.getByText("Jam Tangan Tanpa Peserta")).toBeInTheDocument();
    expect(screen.getByText(/pemenang gagal bayar 24 jam \/ tanpa peserta/i)).toBeInTheDocument();
    expect(screen.getByText("2 Produk")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aktif" }));

    expect(screen.getByText("Kalung Emas Aktif")).toBeInTheDocument();
    expect(screen.queryByText("Gelang Sudah Terjual")).not.toBeInTheDocument();
    expect(screen.queryByText("Iphone Gagal Bayar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Selesai" }));

    expect(screen.getByText("Gelang Sudah Terjual")).toBeInTheDocument();
    expect(screen.queryByText("Kalung Emas Aktif")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Perlu Strategi" }));

    expect(screen.getByText("Iphone Gagal Bayar")).toBeInTheDocument();
    expect(screen.getByText("Jam Tangan Tanpa Peserta")).toBeInTheDocument();
    expect(screen.queryByText("Gelang Sudah Terjual")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /lelang lagi/i })[0]).toHaveAttribute(
      "href",
      "/admin/barang/barang-4/pasarkan-ulang"
    );
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

  it("opens the ended vickrey winner workspace from the unified marketing action", () => {
    render(
      <AdminMarketingUnifiedPage
        unitName="UPC Ranotana"
        auctions={[
          {
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
            paymentDeadline: "2099-05-09T00:00:00.000Z",
            media: [{ id: "m3", type: "foto", url: "/uploads/gelang.jpg", fileName: "gelang.jpg" }],
            primaryMedia: { id: "m3", type: "foto", url: "/uploads/gelang.jpg", fileName: "gelang.jpg" },
            bids: []
          }
        ]}
      />
    );

    expect(screen.getByRole("link", { name: /kelola transaksi/i })).toHaveAttribute(
      "href",
      "/admin/pemasaran/vickrey-auction/pm-vickrey-payment"
    );
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
          appraisalValue: 11000000,
          description: "Cincin emas dengan kondisi appraisal baik.",
          finalPrice: null,
          winner: null,
          visibility: "TERKUNCI",
          specifications: {
            jenisEmas: "Cincin",
            kadarEmas: "24K",
            berat: "3,20 gram"
          },
          note: "Nominal bid belum dapat dibuka sebelum waktu penutupan terlewati.",
          media: [{ id: "m2", type: "foto", url: "/uploads/cincin.jpg", fileName: "cincin.jpg" }],
          primaryMedia: { id: "m2", type: "foto", url: "/uploads/cincin.jpg", fileName: "cincin.jpg" },
          bids: []
        }}
      />
    );

    expect(screen.getByText(/tetap tersembunyi sampai deadline selesai/i)).toBeInTheDocument();
    expect(screen.getByText(/informasi jaminan utama/i)).toBeInTheDocument();
    expect(screen.getByText(/aktivitas lelang live/i)).toBeInTheDocument();
    expect(screen.getByText(/deskripsi barang/i)).toBeInTheDocument();
    expect(screen.getByText(/cincin emas dengan kondisi appraisal baik/i)).toBeInTheDocument();
    expect(screen.queryByText(/24K/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /lihat detail/i }));
    expect(screen.getByText(/detail barang/i)).toBeInTheDocument();
    expect(screen.getAllByText(/cincin emas dengan kondisi appraisal baik/i).length).toBeGreaterThan(1);
    expect(screen.getByText(/24K/i)).toBeInTheDocument();
    expect(screen.getByText(/3,20 gram/i)).toBeInTheDocument();
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

  it("keeps the ended vickrey settlement prices and countdown compact", () => {
    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-long-price",
          lotId: "barang-long-price",
          lot: "Anting Berlian",
          code: "BRG-006",
          category: "perhiasan",
          condition: "sangat baik",
          status: "SELESAI",
          mode: "VICKREY_AUCTION",
          ending: "15 Mei 2026",
          endingAt: "2099-05-15T12:00:00.000Z",
          participants: 9,
          basePrice: 95000000,
          appraisalValue: 110000000,
          finalPrice: 123456789,
          winner: "Buyer A",
          visibility: "HASIL_DIBUKA",
          transactionId: "trx-long-price",
          transactionStatus: "MENUNGGU_PEMBAYARAN",
          buyerName: "Buyer A",
          paymentDeadline: "2099-05-15T12:00:00.000Z",
          media: [{ id: "m6", type: "foto", url: "/uploads/anting.jpg", fileName: "anting.jpg" }],
          bids: []
        }}
      />
    );

    const compactBidAmount = screen.getAllByText("Rp 123.456.789")[0];
    const dayLabel = screen.getByText("HARI");
    const dayValue = dayLabel.parentElement?.querySelector("p");

    expect(compactBidAmount).toBeInTheDocument();
    expect(screen.getByText(/lelang selesai .* menunggu pelunasan nasabah/i)).toBeInTheDocument();
    expect(dayLabel.closest("[data-settlement-countdown-tile='true']")).toHaveClass("h-[3.35rem]", "place-items-center");
    expect(dayValue).toHaveClass("w-full", "text-center");
    expect(dayLabel).toHaveClass("w-full", "text-center");
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
      "/admin/pemasaran/vickrey-auction/pm-payment"
    );
    expect(screen.getByRole("link", { name: /kelola transaksi pemenang/i })).toHaveAttribute(
      "href",
      "/admin/pemasaran/vickrey-auction/pm-payment"
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
              amount: 70000000,
              rank: 1,
              isWinner: true,
              determinesFinalPrice: false
            },
            {
              id: "bid-2",
              bidderId: "buyer-2",
              bidderName: "Alya",
              submittedAtLabel: "4 Mei 2026, 08.05",
              amount: 62000000,
              rank: 2,
              isWinner: false,
              determinesFinalPrice: true
            }
          ]
        }}
      />
    );

    expect(screen.getByText(/progress pembayaran lelang/i)).toBeInTheDocument();
    expect(screen.getByText(/menunggu konfirmasi langsung/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /verifikasi pembayaran/i })).toHaveAttribute(
      "href",
      "/admin/transaksi/trx-vickrey-1?from=vickrey"
    );
    expect(screen.queryByRole("link", { name: /buka bukti pembayaran/i })).not.toBeInTheDocument();
  });

  it("renders the ended vickrey winner workspace with printable summary actions", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    const { container } = render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-vickrey-winner",
          lotId: "barang-winner",
          lot: "22K Gold Bangle",
          code: "LGL-8829-XJ",
          category: "emas",
          condition: "sangat baik",
          status: "SELESAI",
          mode: "VICKREY_AUCTION",
          ending: "31 Mei 2026",
          endingAt: "2026-05-31T11:17:48.000Z",
          participants: 5,
          basePrice: 65000000,
          appraisalValue: 85000000,
          finalPrice: 78000000,
          winner: "Budi Santoso",
          visibility: "HASIL_DIBUKA",
          transactionId: "trx-vickrey-winner",
          transactionStatus: "MENUNGGU_KONFIRMASI_LANGSUNG",
          buyerName: "Budi Santoso",
          paymentMethod: "BAYAR_LANGSUNG",
          reference: "VCK-8829",
          proofUrl: null,
          paymentDeadline: "2099-06-02T23:35:00.000Z",
          specifications: {
            kadarEmas: "22 Karat (91,6%)",
            berat: "15,28 gram"
          },
          media: [{ id: "asset-1", type: "foto", url: "/uploads/bangle.jpg", fileName: "bangle.jpg" }],
          primaryMedia: { id: "asset-1", type: "foto", url: "/uploads/bangle.jpg", fileName: "bangle.jpg" },
          bids: [
            {
              id: "bid-1",
              bidderId: "PGD1029384",
              bidderName: "Budi Santoso",
              submittedAtLabel: "31 Mei 2026, 19:17:48 WIB",
              amount: 85000000,
              rank: 1,
              isWinner: true,
              determinesFinalPrice: false
            },
            {
              id: "bid-2",
              bidderId: "PGD5528761",
              bidderName: "Siti Nurfadila",
              submittedAtLabel: "31 Mei 2026, 19:14:23 WIB",
              amount: 78000000,
              rank: 2,
              isWinner: false,
              determinesFinalPrice: true
            }
          ]
        }}
      />
    );

    expect(screen.getByText(/lelang selesai .* menunggu pelunasan nasabah/i)).toBeInTheDocument();
    expect(screen.getByText(/detail pemenang lelang/i)).toBeInTheDocument();
    expect(screen.getAllByText("Budi Santoso").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rp 85.000.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rp 78.000.000").length).toBeGreaterThan(0);
    expect(screen.getByText(/ranking peserta lelang \(admin view\)/i)).toBeInTheDocument();
    const rankingTable = container.querySelector("table");
    expect(rankingTable).toHaveClass("table-fixed");
    expect(rankingTable).not.toHaveClass("min-w-[45rem]");
    expect(screen.getAllByText(/total pembayaran/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /verifikasi pembayaran/i })).toHaveAttribute(
      "href",
      "/admin/transaksi/trx-vickrey-winner?from=vickrey"
    );

    fireEvent.click(screen.getByRole("button", { name: /cetak ringkasan lelang/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it("uses category-specific asset fields on the ended vickrey winner page", () => {
    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-ipad-winner",
          lotId: "barang-ipad",
          lot: "Ipad Terbaru",
          code: "BRG-27863113",
          category: "elektronik",
          condition: "baik",
          status: "SELESAI",
          mode: "VICKREY_AUCTION",
          ending: "1 Jun 2026",
          endingAt: "2026-06-01T13:57:00.000Z",
          participants: 2,
          basePrice: 6500000,
          finalPrice: 7500000,
          winner: "Buyer Satu",
          visibility: "HASIL_DIBUKA",
          transactionId: "trx-ipad-winner",
          transactionStatus: "MENUNGGU_KONFIRMASI_LANGSUNG",
          buyerName: "Buyer Satu",
          paymentMethod: "BAYAR_LANGSUNG",
          paymentDeadline: "2099-06-02T23:35:00.000Z",
          specifications: {
            merek: "Apple",
            model: "iPad Pro 11",
            spesifikasi: "M2, 128GB, Wi-Fi"
          },
          media: [{ id: "asset-ipad", type: "foto", url: "/uploads/ipad.jpg", fileName: "ipad.jpg" }],
          primaryMedia: { id: "asset-ipad", type: "foto", url: "/uploads/ipad.jpg", fileName: "ipad.jpg" },
          bids: [
            {
              id: "bid-ipad-1",
              bidderId: "seed-buyer-simple-1",
              bidderName: "Buyer Satu",
              submittedAtLabel: "1 Jun 2026, 21.56 WIB",
              amount: 8500000,
              rank: 1,
              isWinner: true,
              determinesFinalPrice: false
            }
          ]
        }}
      />
    );

    expect(screen.getByText("Merek")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.getByText("iPad Pro 11")).toBeInTheDocument();
    expect(screen.getByText("Spesifikasi")).toBeInTheDocument();
    expect(screen.getByText("M2, 128GB, Wi-Fi")).toBeInTheDocument();
    expect(screen.queryByText("Kadar")).not.toBeInTheDocument();
    expect(screen.queryByText("Berat")).not.toBeInTheDocument();
  });
});
