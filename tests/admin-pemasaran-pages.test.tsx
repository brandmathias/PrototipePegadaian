import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router
}));

import {
  AdminMarketingUnifiedPage,
  AdminFixedPriceListPage,
  AdminFixedPriceDetailPage,
  AdminVickreyAuctionListPage,
  AdminVickreyAuctionDetailPage
} from "@/components/pages/admin-marketing-pages";

describe("admin pemasaran pages", () => {
  beforeEach(() => {
    router.push.mockClear();
    router.refresh.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

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
            note: "Belum ada transaksi pembeli pada sesi harga tetap ini."
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
            id: "pm-sold-old-failed",
            lotId: "barang-3",
            lot: "Gelang Pernah Gagal",
            code: "BRG-003",
            category: "perhiasan",
            condition: "sangat baik",
            status: "GAGAL",
            mode: "VICKREY_AUCTION",
            iteration: 1,
            createdAt: "2026-05-02T00:00:00.000Z",
            ending: "2026-05-02",
            endingAt: "2026-05-02T00:00:00.000Z",
            participants: 0,
            basePrice: 16000000,
            finalPrice: null,
            winner: null,
            visibility: "HASIL_DIBUKA",
            media: [{ id: "m3-old", type: "foto", url: "/uploads/gelang.jpg", fileName: "gelang.jpg" }],
            primaryMedia: { id: "m3-old", type: "foto", url: "/uploads/gelang.jpg", fileName: "gelang.jpg" }
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
            iteration: 2,
            createdAt: "2026-05-03T00:00:00.000Z",
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
            note: "Sesi Lelang Tertutup berakhir tanpa penawar sehingga barang masuk status gagal."
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
    expect(screen.queryByText("Gelang Pernah Gagal")).not.toBeInTheDocument();
    expect(screen.getByText("Iphone Gagal Bayar")).toBeInTheDocument();
    expect(screen.getByText("Jam Tangan Tanpa Peserta")).toBeInTheDocument();
    expect(screen.getAllByText("Perhiasan - Sangat Baik").length).toBeGreaterThan(0);
    expect(screen.queryByText("perhiasan - sangat baik")).not.toBeInTheDocument();
    expect(screen.getByText(/pemenang gagal bayar 24 jam \/ tanpa peserta/i)).toBeInTheDocument();
    expect(screen.getByText("2 Produk")).toBeInTheDocument();
    expect(screen.getByText("Lelang Gagal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aktif" }));

    expect(screen.getByText("Kalung Emas Aktif")).toBeInTheDocument();
    expect(screen.queryByText("Gelang Sudah Terjual")).not.toBeInTheDocument();
    expect(screen.queryByText("Iphone Gagal Bayar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Menunggu Buyer" }));

    expect(screen.getByText("Gelang Sudah Terjual")).toBeInTheDocument();
    expect(screen.getByText("Iterasi 2/2")).toBeInTheDocument();
    expect(screen.queryByText("Kalung Emas Aktif")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Gagal" }));

    expect(screen.getByText("Iphone Gagal Bayar")).toBeInTheDocument();
    expect(screen.getByText("Jam Tangan Tanpa Peserta")).toBeInTheDocument();
    expect(screen.queryByText("Gelang Sudah Terjual")).not.toBeInTheDocument();
    expect(screen.queryByText("Gelang Pernah Gagal")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /lihat detail/i })[0]).toHaveAttribute(
      "href",
      "/admin/pemasaran/vickrey-auction/pm-failed"
    );
  }, 10000);

  it("renders harga tetap cards without auction-only language", () => {
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
    expect(screen.getAllByText(/aktif/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/bukti diunggah/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/menunggu pembayaran/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lihat sesi/i })).toHaveAttribute(
      "href",
      "/admin/pemasaran/fixed-price/pm-fixed"
    );
    expect(screen.queryByText(/visibilitas bid/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/peserta/i)).not.toBeInTheDocument();
  });

  it("keeps harga tetap buyer staging hidden until payment proof is submitted", () => {
    render(
      <AdminMarketingUnifiedPage
        auctions={[
          {
            id: "pm-fixed-pending",
            lotId: "barang-fixed-pending",
            lot: "Cincin Emas 3",
            code: "BRG-02393124",
            category: "perhiasan",
            condition: "baik",
            status: "AKTIF",
            mode: "FIXED_PRICE",
            price: 15000000,
            transactionStatus: "MENUNGGU_PEMBAYARAN",
            buyerName: "Buyer Demo 13 B",
            paymentMethod: "TRANSFER_BANK",
            proofUrl: null,
            soldAt: null,
            startsAt: "2026-05-26T12:49:00.000Z",
            media: [{ id: "m1", type: "foto", url: "/uploads/cincin.jpg", fileName: "cincin.jpg" }],
            primaryMedia: { id: "m1", type: "foto", url: "/uploads/cincin.jpg", fileName: "cincin.jpg" }
          }
        ]}
      />
    );

    expect(screen.getByText(/cincin emas 3/i)).toBeInTheDocument();
    expect(screen.getAllByText(/aktif/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/belum ada pembeli/i)).toBeInTheDocument();
    expect(screen.getByText(/menunggu pembeli dari katalog/i)).toBeInTheDocument();
    expect(screen.queryByText(/buyer demo 13 b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pembelian harga tetap tercatat/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/menunggu pembayaran/i)).not.toBeInTheDocument();
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

    expect(screen.getByRole("link", { name: /lihat detail/i })).toHaveAttribute(
      "href",
      "/admin/pemasaran/vickrey-auction/pm-vickrey-payment"
    );
  });

  it("renders harga tetap detail media with the buyer-style gallery", () => {
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

  it("opens harga tetap payment verification when buyer proof has been uploaded", () => {
    render(
      <AdminFixedPriceDetailPage
        auction={{
          id: "pm-fixed-verification",
          lotId: "barang-fixed-verify",
          lot: "Cincin Emas 3",
          code: "BRG-02393124",
          category: "perhiasan",
          condition: "baik",
          status: "AKTIF",
          mode: "FIXED_PRICE",
          startsAt: "2026-05-26T12:49:00.000Z",
          price: 15000000,
          transactionId: "trx-fixed-verify",
          transactionStatus: "BUKTI_DIUNGGAH",
          buyerName: "Buyer Demo 13 B",
          paymentMethod: "TRANSFER_BANK",
          proofUrl: "/uploads/bukti-fixed-price.jpg",
          reference: "FP-02393124",
          paymentDeadline: "2099-06-05T12:00:00.000Z",
          media: [{ id: "m1", type: "foto", url: "/uploads/cincin-utama.jpg", fileName: "cincin-utama.jpg" }],
          primaryMedia: { id: "m1", type: "foto", url: "/uploads/cincin-utama.jpg", fileName: "cincin-utama.jpg" },
          note: "Buyer sudah mengirim bukti pembayaran transfer."
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /verifikasi pembayaran/i }));
    const dialog = screen.getByRole("dialog", { name: /verifikasi pelunasan dana harga tetap/i });

    expect(within(dialog).getByText(/kewajiban nominal harga tetap/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("img", { name: /ikon kategori perhiasan/i })).toBeInTheDocument();
    expect(within(dialog).getAllByText(/buyer demo 13 b/i).length).toBeGreaterThan(0);
    expect(within(dialog).getByRole("link", { name: /buka bukti pembayaran/i })).toHaveAttribute(
      "href",
      "/uploads/bukti-fixed-price.jpg"
    );

    const reasonSelect = within(dialog).getByLabelText(/alasan penolakan pembayaran harga tetap/i);
    const options = within(reasonSelect).getAllByRole("option");

    expect(options).toHaveLength(3);
    expect(within(dialog).getByRole("button", { name: /tolak pembayaran/i })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: /setujui pembayaran/i })).toBeEnabled();

    fireEvent.change(reasonSelect, {
      target: { value: "Nominal uang yang dikirim tidak sesuai harga barang" }
    });

    expect(within(dialog).getByRole("button", { name: /tolak pembayaran/i })).toBeEnabled();
    expect(within(dialog).getByRole("button", { name: /setujui pembayaran/i })).toBeDisabled();
  });

  it("does not reopen harga tetap verification actions after payment proof has been rejected", () => {
    render(
      <AdminFixedPriceDetailPage
        auction={{
          id: "pm-fixed-rejected",
          lotId: "barang-fixed-rejected",
          lot: "Cincin Emas 3",
          code: "BRG-02393124",
          category: "perhiasan",
          condition: "baik",
          status: "AKTIF",
          mode: "FIXED_PRICE",
          startsAt: "2026-05-26T12:49:00.000Z",
          price: 15000000,
          transactionId: "trx-fixed-rejected",
          transactionStatus: "DITOLAK_BUKTI",
          buyerName: "Buyer Demo 13 B",
          paymentMethod: "TRANSFER_BANK",
          proofUrl: "/uploads/bukti-fixed-price.jpg",
          reference: "FP-02393124",
          paymentDeadline: "2099-06-05T12:00:00.000Z",
          media: [{ id: "m1", type: "foto", url: "/uploads/cincin-utama.jpg", fileName: "cincin-utama.jpg" }],
          primaryMedia: { id: "m1", type: "foto", url: "/uploads/cincin-utama.jpg", fileName: "cincin-utama.jpg" },
          note: "Bukti pembayaran harga tetap ditolak."
        }}
      />
    );

    const verifyButton = screen.getByRole("button", { name: /verifikasi pembayaran/i });

    expect(verifyButton).toBeDisabled();
    fireEvent.click(verifyButton);
    expect(screen.queryByRole("dialog", { name: /verifikasi pelunasan dana harga tetap/i })).not.toBeInTheDocument();
  });

  it("prints a harga tetap receipt inline after admin verifies payment", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(
      <AdminFixedPriceDetailPage
        auction={{
          id: "pm-fixed-paid",
          lotId: "barang-fixed-paid",
          lot: "Cincin Emas 3",
          code: "BRG-02393124",
          category: "perhiasan",
          condition: "baik",
          status: "AKTIF",
          mode: "FIXED_PRICE",
          startsAt: "2026-05-26T12:49:00.000Z",
          price: 15000000,
          transactionId: "trx-fixed-paid",
          transactionStatus: "LUNAS",
          buyerName: "Buyer Satu",
          buyerEmail: "buyer1@mail.com",
          buyerPhone: "6281200001001",
          paymentMethod: "TRANSFER_BANK",
          reference: "FP-02393124",
          soldAt: "2026-06-03T00:39:00.000Z",
          unitName: "UPC Ranotana",
          unitAddress: "Jl. Sam Ratulangi",
          media: [{ id: "m1", type: "foto", url: "/uploads/cincin-utama.jpg", fileName: "cincin-utama.jpg" }],
          primaryMedia: { id: "m1", type: "foto", url: "/uploads/cincin-utama.jpg", fileName: "cincin-utama.jpg" },
          note: "Pembayaran sudah diverifikasi admin unit."
        }}
      />
    );

    expect(screen.getByText(/menunggu buyer menekan pembelian selesai/i)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /cetak nota/i })[0]);
    await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1), { timeout: 4000 });

    const receiptPrintRoot = document.getElementById("fixed-price-receipt-print-root-trx-fixed-paid");

    expect(receiptPrintRoot).not.toBeNull();
    expect(receiptPrintRoot!).toHaveClass("transaction-receipt-print-document", "hidden", "print:block");
    expect(receiptPrintRoot!.closest(".print\\:hidden")).toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-header-grid")).not.toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-main-grid")).not.toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-summary-grid")).not.toBeNull();
    expect(receiptPrintRoot!).toHaveTextContent("Harga Tetap");
    expect(receiptPrintRoot!).toHaveTextContent("Terverifikasi admin");
    expect(receiptPrintRoot!.querySelector('img[src*="/uploads/cincin-utama.jpg"]')).not.toBeNull();
    expect(screen.queryByRole("link", { name: /cetak nota/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /verifikasi pelunasan dana harga tetap/i })).not.toBeInTheDocument();

    printSpy.mockRestore();
  });

  it("prints the prepared admin receipt in place on mobile for verified harga tetap payments", async () => {
    const originalUserAgent = window.navigator.userAgent;
    const openSpy = vi.spyOn(window, "open").mockReturnValue({ focus: vi.fn() } as unknown as Window);
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36"
    });

    try {
      render(
        <AdminFixedPriceDetailPage
          auction={{
            id: "pm-fixed-paid",
            lotId: "barang-fixed-paid",
            lot: "Cincin Emas 3",
            code: "BRG-02393124",
            category: "perhiasan",
            condition: "baik",
            status: "AKTIF",
            mode: "FIXED_PRICE",
            startsAt: "2026-05-26T12:49:00.000Z",
            price: 15000000,
            transactionId: "trx-fixed-paid",
            transactionStatus: "LUNAS",
            buyerName: "Buyer Satu",
            buyerEmail: "buyer1@mail.com",
            buyerPhone: "6281200001001",
            paymentMethod: "TRANSFER_BANK",
            reference: "FP-02393124",
            soldAt: "2026-06-03T00:39:00.000Z",
            unitName: "UPC Ranotana",
            unitAddress: "Jl. Sam Ratulangi",
            media: [{ id: "m1", type: "foto", url: "/uploads/cincin-utama.jpg", fileName: "cincin-utama.jpg" }],
            primaryMedia: { id: "m1", type: "foto", url: "/uploads/cincin-utama.jpg", fileName: "cincin-utama.jpg" },
            note: "Pembayaran sudah diverifikasi admin unit."
          }}
        />
      );

      fireEvent.click(screen.getAllByRole("button", { name: /cetak nota/i })[0]);

      await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1));
      expect(openSpy).not.toHaveBeenCalled();
      const receiptPrintRoot = document.getElementById("fixed-price-receipt-print-root-trx-fixed-paid");
      expect(receiptPrintRoot).not.toBeNull();
      expect(receiptPrintRoot!.querySelector(".receipt-output-header-grid")).not.toBeNull();
      expect(receiptPrintRoot!.querySelector(".receipt-output-main-grid")).not.toBeNull();
    } finally {
      Object.defineProperty(window.navigator, "userAgent", {
        configurable: true,
        value: originalUserAgent
      });
      openSpy.mockRestore();
      printSpy.mockRestore();
    }
  });

  it("renders harga tetap detail as the compact marketing inventory workspace", () => {
    render(
      <AdminFixedPriceDetailPage
        auction={{
          id: "pm-fixed-detail-design",
          lotId: "barang-fixed-3",
          lot: "Cincin Emas 3",
          code: "BRG-02393124",
          category: "perhiasan",
          condition: "baik",
          description: "Cincin emas wanita dengan taburan berlian crown set.",
          status: "AKTIF",
          mode: "FIXED_PRICE",
          startsAt: "2026-05-26T12:49:00.000Z",
          price: 15000000,
          unitName: "UPC Ranotana",
          unitAddress: "Ranotana",
          insights: {
            views: 17,
            likes: 1,
            participants: 0
          },
          specifications: {
            jenisEmas: "Cincin Wanita / Eternity Ring",
            kadarEmas: "18 Karat atau 75%",
            berat: "4.25 gram",
            bentuk: "Cincin Berlian Crown Set",
            panjang: "0 cm",
            diameter: "16.5 mm"
          },
          media: [
            { id: "m1", type: "foto", url: "/uploads/cincin-utama.jpg", fileName: "cincin-utama.jpg" },
            { id: "m2", type: "foto", url: "/uploads/cincin-samping.jpg", fileName: "cincin-samping.jpg" }
          ],
          primaryMedia: { id: "m1", type: "foto", url: "/uploads/cincin-utama.jpg", fileName: "cincin-utama.jpg" },
          note: "Belum ada transaksi pembeli pada sesi harga tetap ini."
        }}
      />
    );

    expect(screen.getByText("Galeri Media Barang")).toBeInTheDocument();
    expect(screen.getByText("Spesifikasi Lengkap")).toBeInTheDocument();
    expect(screen.getByText("Harga Barang")).toBeInTheDocument();
    expect(screen.getByText("Total Tayangan")).toBeInTheDocument();
    expect(screen.getByText("17x")).toBeInTheDocument();
    expect(screen.getByText("Watchlist Nasabah")).toBeInTheDocument();
    expect(screen.getByText("1 Akun")).toBeInTheDocument();
    expect(screen.getByText("Cincin Wanita / Eternity Ring")).toBeInTheDocument();
    expect(screen.getByText("18 Karat atau 75%")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /edit data/i })).toHaveAttribute(
      "href",
      "/admin/barang/barang-fixed-3/edit"
    );
    expect(screen.queryByRole("link", { name: /lihat log/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verifikasi pembayaran/i })).toBeDisabled();
  });

  it("keeps vickrey bids locked before deadline", () => {
    const { container } = render(
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
          participantPreviews: [
            {
              bidderId: "buyer-1",
              bidderName: "Buyer Satu",
              submittedAtLabel: "11 Jun 2026, 10.06 WIB"
            },
            {
              bidderId: "buyer-2",
              bidderName: "Buyer Dua",
              submittedAtLabel: "11 Jun 2026, 10.11 WIB"
            }
          ],
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
    expect(screen.getByRole("columnheader", { name: /nama penawar/i })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /id penawar/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Buyer Satu")).not.toBeInTheDocument();
    expect(screen.queryByText("Buyer Dua")).not.toBeInTheDocument();
    expect(screen.getAllByText("************").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("11 Jun 2026, 10.06 WIB")).toBeInTheDocument();
    expect(screen.getByText("11 Jun 2026, 10.11 WIB")).toBeInTheDocument();
    expect(screen.getByText("Tertinggi")).toHaveClass("whitespace-nowrap");
    const bidLogTable = container.querySelector("table");
    expect(bidLogTable).toHaveClass("table-fixed");
    expect(bidLogTable).not.toHaveClass("min-w-[46rem]");
    expect(bidLogTable?.parentElement).toHaveClass("overflow-hidden");
    expect(bidLogTable?.parentElement).not.toHaveClass("overflow-x-auto");
  });

  it("shows iteration history links on marketing detail pages", () => {
    const firstIteration = {
      id: "pm-ipad-iteration-1",
      lotId: "barang-ipad-history",
      lot: "Ipad",
      code: "BRG-42969709",
      category: "elektronik",
      condition: "baik",
      status: "GAGAL",
      mode: "VICKREY_AUCTION",
      iteration: 1,
      createdAt: "2026-06-01T00:00:00.000Z",
      ending: "1 Jun 2026",
      endingAt: "2026-06-01T07:16:00.000Z",
      participants: 0,
      basePrice: 10000000,
      finalPrice: null,
      winner: null,
      visibility: "HASIL_DIBUKA",
      media: [{ id: "ipad-1", type: "foto", url: "/uploads/ipad.jpg", fileName: "ipad.jpg" }],
      primaryMedia: { id: "ipad-1", type: "foto", url: "/uploads/ipad.jpg", fileName: "ipad.jpg" }
    };
    const secondIteration = {
      id: "pm-ipad-iteration-2",
      lotId: "barang-ipad-history",
      lot: "Ipad",
      code: "BRG-42969709",
      category: "elektronik",
      condition: "baik",
      status: "GAGAL",
      mode: "VICKREY_AUCTION",
      iteration: 2,
      createdAt: "2026-06-02T00:00:00.000Z",
      ending: "2 Jun 2026",
      endingAt: "2026-06-02T20:13:00.000Z",
      participants: 2,
      basePrice: 10000000,
      finalPrice: 10000000,
      winner: "Buyer Satu",
      buyerName: "Buyer Satu",
      transactionId: "trx-ipad-failed",
      transactionStatus: "GAGAL",
      paymentDeadline: "2026-06-03T20:13:00.000Z",
      visibility: "HASIL_DIBUKA",
      media: [{ id: "ipad-2", type: "foto", url: "/uploads/ipad.jpg", fileName: "ipad.jpg" }],
      primaryMedia: { id: "ipad-2", type: "foto", url: "/uploads/ipad.jpg", fileName: "ipad.jpg" },
      bids: []
    };

    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          ...secondIteration,
          iterationHistory: [firstIteration, secondIteration]
        }}
      />
    );

    expect(screen.getByText("Riwayat Iterasi Pemasaran")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iterasi 2 \(terkini\)/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gagal pemenang gagal bayar 24 jam/i })).toHaveAttribute(
      "href",
      "/admin/pemasaran/vickrey-auction/pm-ipad-iteration-2"
    );
    expect(screen.queryByText("Tidak ada peserta")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /iterasi 2 \(terkini\)/i }));
    const visualFirstIterationOption = screen
      .getAllByRole("option", { name: /iterasi 1/i })
      .find((element) => element.tagName.toLowerCase() === "button");
    expect(visualFirstIterationOption).toBeDefined();
    fireEvent.click(visualFirstIterationOption!);

    expect(router.push).toHaveBeenCalledWith("/admin/pemasaran/vickrey-auction/pm-ipad-iteration-1");
    expect(screen.getByRole("button", { name: /jadwalkan pasarkan ulang/i })).toBeInTheDocument();
  });

  it("refreshes the admin vickrey detail automatically when the live countdown expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T20:18:59+08:00"));

    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-vickrey-expiring",
          lotId: "barang-expiring",
          lot: "Ipad",
          code: "BRG-42969709",
          category: "elektronik",
          condition: "baik",
          status: "AKTIF",
          mode: "VICKREY_AUCTION",
          ending: "2 Jun 2026",
          endingAt: new Date("2026-06-02T20:19:00+08:00").toISOString(),
          participants: 1,
          basePrice: 10000000,
          appraisalValue: 10000000,
          finalPrice: null,
          winner: null,
          visibility: "TERKUNCI",
          specifications: {
            merek: "Apple",
            model: "iPad"
          },
          media: [{ id: "asset-expiring", type: "foto", url: "/uploads/ipad.jpg", fileName: "ipad.jpg" }],
          primaryMedia: { id: "asset-expiring", type: "foto", url: "/uploads/ipad.jpg", fileName: "ipad.jpg" },
          bids: []
        }}
      />
    );

    expect(router.refresh).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(router.refresh).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(router.refresh).toHaveBeenCalledTimes(1);
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
    expect(screen.queryByText("Buyer A")).not.toBeInTheDocument();
    expect(screen.queryByText("Buyer B")).not.toBeInTheDocument();
    expect(screen.getAllByText("************").length).toBeGreaterThanOrEqual(2);
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
    const { container } = render(
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
    expect(screen.getByLabelText(/pembayaran: berjalan/i)).toHaveClass("border-[#d7ad2f]", "text-[#006747]");
    expect(screen.getByLabelText(/verifikasi: belum terjadi/i)).toHaveClass("border-[#dfe6e2]");
    expect(screen.getByText(/menunggu konfirmasi langsung/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /verifikasi pembayaran/i }));
    expect(screen.getByRole("heading", { name: /verifikasi transaksi pemenang lelang/i })).toBeInTheDocument();
    const paymentDialog = screen.getByRole("dialog", { name: /verifikasi transaksi pemenang lelang/i });
    const paymentOverlay = paymentDialog.parentElement;
    expect(paymentOverlay?.parentElement).toBe(document.body);
    expect(paymentOverlay).toHaveClass("overflow-y-auto");
    expect(paymentDialog).not.toHaveClass("max-h-[calc(100dvh-2rem)]");
    expect(screen.getByText(/jumlah pelunasan yang dibayarkan/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /ikon kategori perhiasan/i })).toBeInTheDocument();
    expect(screen.getByText(/keamanan transaksi & kepatuhan/i)).toBeInTheDocument();
    const directPaymentButton = screen.getByRole("button", { name: /konfirmasi pembayaran langsung/i });
    expect(directPaymentButton).toBeInTheDocument();
    expect(directPaymentButton.querySelector("svg")).toBeNull();
    expect(screen.queryByRole("link", { name: /buka bukti pembayaran/i })).not.toBeInTheDocument();
  });

  it("renders the ended vickrey winner workspace with payment verification actions", () => {
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
    fireEvent.click(screen.getByRole("button", { name: /verifikasi pembayaran/i }));
    expect(screen.getByRole("heading", { name: /verifikasi transaksi pemenang lelang/i })).toBeInTheDocument();
    expect(screen.getByText(/jumlah pelunasan yang dibayarkan/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /ikon kategori emas/i })).toBeInTheDocument();
    expect(screen.getAllByText(/budi santoso/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /konfirmasi pembayaran langsung/i })).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /cetak ringkasan lelang/i })).not.toBeInTheDocument();
    printSpy.mockRestore();
  });

  it("renders the verified vickrey winner page as waiting for buyer completion", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-vickrey-paid",
          lotId: "barang-paid",
          lot: "22K Gold Bangle",
          code: "LGL-8829-XJ",
          category: "emas",
          condition: "sangat baik",
          unitName: "UPC Ranotana",
          unitAddress: "Jl. Sam Ratulangi",
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
          transactionId: "trx-vickrey-paid",
          transactionStatus: "LUNAS",
          buyerName: "Budi Santoso",
          buyerEmail: "budi.santoso@email.com",
          buyerPhone: "0812-3456-7890",
          paymentMethod: "BAYAR_LANGSUNG",
          reference: "PGD1029384",
          proofUrl: null,
          soldAt: "2026-06-01T12:25:00.000Z",
          paymentDeadline: "2026-06-02T23:35:00.000Z",
          specifications: {
            kadarEmas: "22 Karat (91,6%)",
            berat: "15,28 gram"
          },
          media: [{ id: "asset-paid", type: "foto", url: "/uploads/bangle.jpg", fileName: "bangle.jpg" }],
          primaryMedia: { id: "asset-paid", type: "foto", url: "/uploads/bangle.jpg", fileName: "bangle.jpg" },
          bids: [
            {
              id: "bid-paid-1",
              bidderId: "PGD1029384",
              bidderName: "Budi Santoso",
              submittedAtLabel: "31 Mei 2026, 10:14:26 WIB",
              amount: 85000000,
              rank: 1,
              isWinner: true,
              determinesFinalPrice: false
            },
            {
              id: "bid-paid-2",
              bidderId: "PGD5528761",
              bidderName: "Siti Nurfadila",
              submittedAtLabel: "31 Mei 2026, 10:14:23 WIB",
              amount: 78000000,
              rank: 2,
              isWinner: false,
              determinesFinalPrice: true
            }
          ]
        }}
      />
    );

    expect(screen.getByText(/pembayaran terverifikasi .* menunggu buyer selesai/i)).toBeInTheDocument();
    expect(screen.getByText(/nota tersedia, arsip final belum ditutup/i)).toBeInTheDocument();
    expect(screen.getByText(/pemenang terverifikasi/i)).toBeInTheDocument();
    expect(screen.getAllByText(/pembayaran terverifikasi/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/menunggu buyer selesai/i).length).toBeGreaterThan(0);
    const rankingTitle = screen.getByText(/ranking peserta lelang \(admin view\)/i);
    expect(rankingTitle).toBeInTheDocument();
    const handoverPanel = screen.getByLabelText(/area upload bukti serah-terima pemenang/i);
    expect(handoverPanel).toHaveClass("w-full");
    expect(handoverPanel).not.toHaveClass("lg:col-span-2");
    expect(rankingTitle.compareDocumentPosition(handoverPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(screen.getByText(/^Pemenang$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/harga bayar/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/detail aset lelang$/i)).toBeInTheDocument();
    const assetPanel = screen.getByText(/detail aset lelang$/i).closest("section");
    const progressPanel = screen.getByText(/progress penyelesaian/i).closest("section");
    expect(assetPanel).not.toHaveClass("h-full");
    expect(progressPanel?.parentElement).toHaveClass("grid", "lg:grid-rows-[minmax(0,1fr)_auto]");
    expect(progressPanel?.parentElement).not.toHaveClass("space-y-4");
    expect(screen.getByText(/progress penyelesaian/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pembayaran: selesai/i)).toHaveClass("border-[#006747]");
    expect(screen.getByLabelText(/verifikasi: selesai/i)).toHaveClass("border-[#006747]");
    expect(screen.getByLabelText(/selesai: menunggu buyer/i)).toHaveClass("border-[#d7ad2f]");
    const noteTitle = screen.getByText(/nota & konfirmasi buyer/i);
    const notePanel = noteTitle.closest("section");
    expect(notePanel).not.toBeNull();
    expect(notePanel).toHaveTextContent(/harga akhir lelang/i);
    expect(notePanel).toHaveTextContent(/status admin/i);
    expect(notePanel).toHaveTextContent(/terverifikasi/i);
    expect(notePanel).toContainElement(screen.getByRole("button", { name: /cetak nota/i }));
    expect(notePanel).toContainElement(screen.getByRole("button", { name: /menunggu buyer selesai/i }));
    expect(handoverPanel.compareDocumentPosition(noteTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(screen.getByText(/progress penyelesaian/i).closest("section")?.parentElement).not.toHaveClass("lg:sticky");
    fireEvent.click(screen.getByRole("button", { name: /cetak nota/i }));
    await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1), { timeout: 4000 });
    const receiptPrintRoot = document.getElementById("vickrey-receipt-print-root-trx-vickrey-paid");
    expect(receiptPrintRoot).not.toBeNull();
    expect(receiptPrintRoot!).toHaveClass("vickrey-receipt-print-document", "hidden", "print:block");
    expect(receiptPrintRoot!.closest(".print\\:hidden")).toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-header-grid")).not.toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-main-grid")).not.toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-summary-grid")).not.toBeNull();
    expect(receiptPrintRoot!).toHaveTextContent("Lelang");
    expect(receiptPrintRoot!).not.toHaveTextContent("Lelang Tertutup");
    expect(receiptPrintRoot!).not.toHaveClass("h-0", "w-0", "opacity-0");
    expect(receiptPrintRoot!.querySelector('img[src*="/uploads/bangle.jpg"]')).not.toBeNull();
    expect(screen.queryByRole("dialog", { name: /pratinjau nota pengambilan barang/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /cetak nota/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /menunggu buyer selesai/i })).toBeDisabled();

    printSpy.mockRestore();
  });

  it("prints the prepared admin receipt in place on mobile for verified vickrey winners", async () => {
    const originalUserAgent = window.navigator.userAgent;
    const openSpy = vi.spyOn(window, "open").mockReturnValue({ focus: vi.fn() } as unknown as Window);
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36"
    });

    try {
      render(
        <AdminVickreyAuctionDetailPage
          auction={{
            id: "pm-vickrey-paid",
            lotId: "barang-paid",
            lot: "22K Gold Bangle",
            code: "LGL-8829-XJ",
            category: "emas",
            condition: "sangat baik",
            unitName: "UPC Ranotana",
            unitAddress: "Jl. Sam Ratulangi",
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
            transactionId: "trx-vickrey-paid",
            transactionStatus: "LUNAS",
            buyerName: "Budi Santoso",
            buyerEmail: "budi.santoso@email.com",
            buyerPhone: "0812-3456-7890",
            paymentMethod: "BAYAR_LANGSUNG",
            reference: "PGD1029384",
            proofUrl: null,
            soldAt: "2026-06-01T12:25:00.000Z",
            paymentDeadline: "2026-06-02T23:35:00.000Z",
            media: [{ id: "asset-paid", type: "foto", url: "/uploads/bangle.jpg", fileName: "bangle.jpg" }],
            primaryMedia: { id: "asset-paid", type: "foto", url: "/uploads/bangle.jpg", fileName: "bangle.jpg" },
            bids: []
          }}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /cetak nota/i }));

      await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1));
      expect(openSpy).not.toHaveBeenCalled();
      const receiptPrintRoot = document.getElementById("vickrey-receipt-print-root-trx-vickrey-paid");
      expect(receiptPrintRoot).not.toBeNull();
      expect(receiptPrintRoot!.querySelector(".receipt-output-header-grid")).not.toBeNull();
      expect(receiptPrintRoot!.querySelector(".receipt-output-main-grid")).not.toBeNull();
    } finally {
      Object.defineProperty(window.navigator, "userAgent", {
        configurable: true,
        value: originalUserAgent
      });
      openSpy.mockRestore();
      printSpy.mockRestore();
    }
  });

  it("renders the completed vickrey winner page as a final fulfillment archive with nota action", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-vickrey-completed",
          lotId: "barang-completed",
          lot: "22K Gold Bangle",
          code: "LGL-8829-XJ",
          category: "emas",
          condition: "sangat baik",
          unitName: "UPC Ranotana",
          unitAddress: "Jl. Sam Ratulangi",
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
          transactionId: "trx-vickrey-completed",
          transactionStatus: "SELESAI",
          buyerName: "Budi Santoso",
          buyerEmail: "budi.santoso@email.com",
          buyerPhone: "0812-3456-7890",
          paymentMethod: "BAYAR_LANGSUNG",
          reference: "PGD1029384",
          proofUrl: null,
          soldAt: "2026-06-01T12:25:00.000Z",
          paymentDeadline: "2026-06-02T23:35:00.000Z",
          specifications: {
            kadarEmas: "22 Karat (91,6%)",
            berat: "15,28 gram"
          },
          media: [{ id: "asset-completed", type: "foto", url: "/uploads/bangle.jpg", fileName: "bangle.jpg" }],
          primaryMedia: { id: "asset-completed", type: "foto", url: "/uploads/bangle.jpg", fileName: "bangle.jpg" },
          bids: [
            {
              id: "bid-completed-1",
              bidderId: "PGD1029384",
              bidderName: "Budi Santoso",
              submittedAtLabel: "31 Mei 2026, 10:14:26 WIB",
              amount: 85000000,
              rank: 1,
              isWinner: true,
              determinesFinalPrice: false
            },
            {
              id: "bid-completed-2",
              bidderId: "PGD5528761",
              bidderName: "Siti Nurfadila",
              submittedAtLabel: "31 Mei 2026, 10:14:23 WIB",
              amount: 78000000,
              rank: 2,
              isWinner: false,
              determinesFinalPrice: true
            }
          ]
        }}
      />
    );

    expect(screen.getByText(/lelang selesai sempurna .* aset telah diserahkan/i)).toBeInTheDocument();
    expect(screen.getByText(/pembayaran & penyerahan selesai/i)).toBeInTheDocument();
    expect(screen.getByText(/manifes penyerahan & pemenang/i)).toBeInTheDocument();
    expect(screen.getByText(/barang sudah diambil/i)).toBeInTheDocument();
    expect(screen.getByText(/bidders ranking table \(arsip\)/i)).toBeInTheDocument();
    expect(screen.getByText(/lunas & diserahkan/i)).toBeInTheDocument();
    expect(screen.getByText(/detail aset lelang \(arsip\)/i)).toBeInTheDocument();
    const archivedAuctionStatus = screen.getByText("Selesai & Diarsipkan");
    expect(archivedAuctionStatus).toHaveClass(
      "max-w-full",
      "min-w-0",
      "gap-1",
      "px-2",
      "text-[0.52rem]"
    );
    expect(archivedAuctionStatus).not.toHaveClass("2xl:text-[0.64rem]");
    expect(archivedAuctionStatus.querySelector("svg")).toHaveClass("size-3", "shrink-0");
    expect(archivedAuctionStatus.parentElement).toHaveClass("min-w-0", "overflow-hidden");
    expect(screen.getByText("Lokasi Barang")).toBeInTheDocument();
    expect(screen.getAllByText("UPC Ranotana").length).toBeGreaterThan(0);
    expect(screen.getByText(/progress penyelesaian/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pembayaran: selesai/i)).toHaveClass("bg-[#006747]");
    expect(screen.getByLabelText(/verifikasi: selesai/i)).toHaveClass("bg-[#006747]");
    expect(screen.getByLabelText(/^selesai: selesai$/i)).toHaveClass("bg-[#006747]");
    expect(screen.getByText(/nota dokumen final/i)).toBeInTheDocument();
    const handoverPanel = screen.getByLabelText(/area upload bukti serah-terima pemenang/i);
    const finalNoteTitle = screen.getByText(/nota dokumen final/i);
    const finalNotePanel = finalNoteTitle.closest("section");
    expect(finalNotePanel).not.toBeNull();
    expect(finalNotePanel).toContainElement(screen.getByRole("button", { name: /cetak nota/i }));
    expect(finalNotePanel).toContainElement(screen.getByRole("link", { name: /tutup & arsipkan berkas lelang/i }));
    expect(handoverPanel.compareDocumentPosition(finalNoteTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    fireEvent.click(screen.getByRole("button", { name: /cetak nota/i }));
    await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1), { timeout: 4000 });
    const receiptPrintRoot = document.getElementById("vickrey-receipt-print-root-trx-vickrey-completed");
    expect(receiptPrintRoot).not.toBeNull();
    expect(receiptPrintRoot!).toHaveClass("vickrey-receipt-print-document", "hidden", "print:block");
    expect(receiptPrintRoot!.closest(".print\\:hidden")).toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-header-grid")).not.toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-main-grid")).not.toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-summary-grid")).not.toBeNull();
    expect(receiptPrintRoot!).toHaveTextContent("Lelang");
    expect(receiptPrintRoot!).not.toHaveTextContent("Lelang Tertutup");
    expect(receiptPrintRoot!).not.toHaveClass("h-0", "w-0", "opacity-0");
    expect(receiptPrintRoot!.querySelector('img[src*="/uploads/bangle.jpg"]')).not.toBeNull();
    expect(screen.getByRole("link", { name: /tutup & arsipkan berkas lelang/i })).toHaveAttribute(
      "href",
      "/admin/pemasaran"
    );

    printSpy.mockRestore();
  });

  it("renders the failed vickrey archive when winner misses the 24 hour payment deadline", () => {
    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-vickrey-unpaid",
          lotId: "barang-unpaid",
          lot: "22K Gold Bangle",
          code: "BRG-42969709",
          category: "emas",
          condition: "sangat baik",
          unitName: "UPC Ranotana",
          unitAddress: "Jl. Sam Ratulangi",
          status: "GAGAL",
          mode: "VICKREY_AUCTION",
          ending: "1 Jun 2026",
          endingAt: "2026-06-01T13:57:00.000Z",
          participants: 3,
          basePrice: 78000000,
          finalPrice: 83500000,
          winner: "Budi Santos",
          visibility: "HASIL_DIBUKA",
          transactionId: "trx-vickrey-unpaid",
          transactionStatus: "GAGAL",
          buyerName: "Budi Santos",
          buyerEmail: "budi.santos@email.com",
          buyerPhone: "0812-3456-7890",
          paymentMethod: "BAYAR_LANGSUNG",
          reference: "PGD1029384",
          proofUrl: null,
          paymentDeadline: "2026-06-02T13:57:00.000Z",
          specifications: {
            kadarEmas: "22 Karat (91,6%)",
            berat: "25 gram"
          },
          media: [{ id: "asset-unpaid", type: "foto", url: "/uploads/bangle.jpg", fileName: "bangle.jpg" }],
          primaryMedia: { id: "asset-unpaid", type: "foto", url: "/uploads/bangle.jpg", fileName: "bangle.jpg" },
          note: "Pemenang Lelang Tertutup tidak menyelesaikan pembayaran dalam 24 jam sehingga sesi dinyatakan gagal.",
          bids: [
            {
              id: "bid-unpaid-1",
              bidderId: "PGD1029384",
              bidderName: "Budi Santos",
              submittedAtLabel: "1 Jun 2026, 21.56 WIB",
              amount: 85000000,
              rank: 1,
              isWinner: true,
              determinesFinalPrice: false
            },
            {
              id: "bid-unpaid-2",
              bidderId: "PGD5528761",
              bidderName: "Andi Pratama",
              submittedAtLabel: "1 Jun 2026, 21.54 WIB",
              amount: 83500000,
              rank: 2,
              isWinner: false,
              determinesFinalPrice: true
            }
          ]
        }}
      />
    );

    expect(screen.getByText(/lelang gagal .* pemenang dikenakan sanksi/i)).toBeInTheDocument();
    expect(screen.getByText(/pemenang tidak melakukan pelunasan dalam batas waktu 24 jam/i)).toBeInTheDocument();
    expect(screen.getByText(/manifes penyerahan & pemenang/i)).toBeInTheDocument();
    expect(screen.getByText(/gagal pelunasan/i)).toBeInTheDocument();
    expect(screen.getByText(/pelanggaran dicatat/i)).toBeInTheDocument();
    expect(screen.getByText(/mekanisme lelang \(arsip\)/i)).toBeInTheDocument();
    expect(screen.getByText(/batal \/ gagal/i)).toBeInTheDocument();
    expect(screen.getByText(/bidders ranking table \(arsip\)/i)).toBeInTheDocument();
    expect(screen.getByText(/gagal \/ pelanggaran/i)).toBeInTheDocument();
    expect(screen.getByText(/progress penyelesaian/i)).toBeInTheDocument();
    expect(screen.getAllByText(/gagal bayar/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/belum tercapai/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /jadwalkan pasarkan ulang/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /jadwalkan pasarkan ulang/i }));
    expect(screen.getByRole("heading", { name: /pasarkan barang/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lelang tertutup/i })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /^batal$/i }));
    expect(screen.queryByRole("heading", { name: /pasarkan barang/i })).not.toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /cetak berita acara gagal lelang/i })).not.toBeInTheDocument();
  });

  it("renders a clear failed vickrey archive when the session ends without bidders", () => {
    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-vickrey-no-bids",
          lotId: "barang-no-bids",
          lot: "Jam Tangan Tanpa Peserta",
          code: "BRG-005",
          category: "aksesoris",
          condition: "baik",
          status: "GAGAL",
          mode: "VICKREY_AUCTION",
          ending: "1 Jun 2026",
          endingAt: "2026-06-01T13:57:00.000Z",
          participants: 0,
          basePrice: 8000000,
          finalPrice: null,
          winner: null,
          visibility: "HASIL_DIBUKA",
          transactionId: null,
          transactionStatus: null,
          paymentDeadline: null,
          specifications: {
            merek: "Seiko",
            model: "Presage"
          },
          media: [{ id: "asset-no-bids", type: "foto", url: "/uploads/watch.jpg", fileName: "watch.jpg" }],
          primaryMedia: { id: "asset-no-bids", type: "foto", url: "/uploads/watch.jpg", fileName: "watch.jpg" },
          note: "Sesi Lelang Tertutup berakhir tanpa penawar sehingga barang masuk status gagal.",
          bids: []
        }}
      />
    );

    expect(screen.getByText(/^gagal$/i)).toHaveClass("bg-[#fdeeee]", "text-[#b42318]");
    expect(screen.getByText(/lelang gagal .* tidak ada peserta/i)).toBeInTheDocument();
    expect(screen.getByText(/sesi berakhir tanpa peserta yang mengirim bid/i)).toBeInTheDocument();
    expect(screen.getByText(/manifes kegagalan sesi/i)).toBeInTheDocument();
    expect(screen.getByText(/tidak ada pemenang/i)).toBeInTheDocument();
    expect(screen.getAllByText(/tanpa peserta/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/tidak ada bid masuk/i)).toBeInTheDocument();
    expect(screen.getByText(/belum ada peserta yang mengirim penawaran/i)).toBeInTheDocument();
    const basePriceText = screen.getByText("Rp 8.000.000");
    expect(basePriceText).toBeInTheDocument();
    expect(basePriceText.className).not.toContain("text-ellipsis");
    expect(screen.queryByRole("link", { name: /jadwalkan pasarkan ulang/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /jadwalkan pasarkan ulang/i }));
    expect(screen.getByRole("heading", { name: /pasarkan barang/i })).toBeInTheDocument();
  });

  it("keeps failed vickrey archive prices on one line without ellipsis for large nominal values", () => {
    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-vickrey-large-archive",
          lotId: "barang-large-archive",
          lot: "Kalung Berlian Arsip",
          code: "BRG-88001",
          category: "perhiasan",
          condition: "baik",
          status: "GAGAL",
          mode: "VICKREY_AUCTION",
          ending: "4 Jun 2026",
          endingAt: "2026-06-04T11:25:00.000Z",
          participants: 0,
          basePrice: 200000000,
          finalPrice: null,
          winner: null,
          visibility: "HASIL_DIBUKA",
          transactionId: null,
          transactionStatus: null,
          paymentDeadline: null,
          specifications: {
            bahan: "Emas putih",
            sertifikat: "Ada"
          },
          media: [{ id: "asset-large", type: "foto", url: "/uploads/kalung-large.jpg", fileName: "kalung-large.jpg" }],
          primaryMedia: { id: "asset-large", type: "foto", url: "/uploads/kalung-large.jpg", fileName: "kalung-large.jpg" },
          note: "Sesi berakhir tanpa bid dengan harga dasar besar.",
          bids: []
        }}
      />
    );

    const archivePrice = screen.getByText("Rp 200.000.000");
    expect(archivePrice).toBeInTheDocument();
    expect(archivePrice.className).toContain("whitespace-nowrap");
    expect(archivePrice.className).not.toContain("text-ellipsis");
  });

  it("renders a red failed header badge when the winner misses the 24 hour payment window", () => {
    render(
      <AdminVickreyAuctionDetailPage
        auction={{
          id: "pm-vickrey-late-winner",
          lotId: "barang-late-winner",
          lot: "Cincin Emas Terlambat Bayar",
          code: "BRG-55291335",
          category: "perhiasan",
          condition: "baik",
          status: "GAGAL",
          mode: "VICKREY_AUCTION",
          ending: "28 Mei 2026",
          endingAt: "2026-05-28T11:20:00.000Z",
          participants: 4,
          basePrice: 10000000,
          finalPrice: 15250000,
          winner: "Buyer Dua",
          visibility: "HASIL_DIBUKA",
          transactionId: "trx-vickrey-late",
          transactionStatus: "GAGAL",
          paymentMethod: "TRANSFER_BANK",
          paymentDeadline: "2026-05-29T11:20:00.000Z",
          note: "Pemenang tidak melunasi dalam 24 jam.",
          bids: [
            {
              id: "bid-late-1",
              bidderId: "seed-buyer-simple-2",
              bidderName: "Buyer Dua",
              submittedAtLabel: "28 Mei 2026, 19.10 WIB",
              amount: 16000000,
              rank: 1,
              isWinner: true,
              determinesFinalPrice: false
            }
          ]
        }}
      />
    );

    expect(screen.getByText(/^gagal$/i)).toHaveClass("bg-[#fdeeee]", "text-[#b42318]");
    expect(screen.getByText(/lelang gagal .* pemenang dikenakan sanksi/i)).toBeInTheDocument();
    expect(screen.getByText(/batas 24 jam terlewati/i)).toBeInTheDocument();
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
