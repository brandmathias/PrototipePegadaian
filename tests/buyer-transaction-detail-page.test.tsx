import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

import { TransactionDetailPage } from "@/components/pages/user-pages";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import type { BuyerTransaction } from "@/lib/contracts/buyer";

const buyer: BuyerSessionUser = {
  id: "buyer-1",
  name: "Budi Santoso",
  email: "budi@example.com",
  phoneNumber: "+62 812 3456 7890",
  role: "buyer",
  isActive: true
};

const transaction: BuyerTransaction = {
  id: "trx-fixed-1",
  lotId: "barang-1",
  kind: "FIXED_PRICE",
  title: "Kalung Emas 18K",
  amount: 12450000,
  status: "MENUNGGU_PEMBAYARAN",
  method: "TRANSFER_BANK",
  unit: "UPC Ranotana",
  unitAddress: "Jl. Sam Ratulangi, Manado",
  createdAt: "4 Mei 2026 10.30 WIB",
  deadline: "5 Mei 2026 10.30 WIB",
  deadlineAt: "2026-05-05T02:30:00.000Z",
  reference: "-",
  applicationNumber: "ORD-2026-0001",
  paymentLabel: "Transfer Bank",
  paymentNotes: ["Transfer sesuai nominal transaksi.", "Unggah bukti pembayaran setelah transfer."],
  imageUrl: "/uploads/barang/kalung-emas.jpg",
  bankName: "Bank Rakyat Indonesia (BRI)",
  bankAccountNumber: "0123-4567-8901-234",
  bankAccountHolder: "PT Pegadaian (Persero)",
  bankBranch: "Manado"
};

describe("buyer transaction detail page", () => {
  it("renders the harga tetap payment flow as transaction details, destination account, and proof upload", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={transaction}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByRole("heading", { name: /detail pembayaran/i })).toBeInTheDocument();
    expect(screen.getByText(/melakukan pembayaran/i)).toBeInTheDocument();
    expect(screen.getByText(/^verifikasi$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/selesai/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/bukti diunggah/i)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /foto barang kalung emas 18k/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /rincian transaksi/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /rekening tujuan/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /unggah bukti/i })).toBeInTheDocument();
    expect(screen.getByText(/0123-4567-8901-234/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kembali ke detail barang/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kirim bukti pembayaran/i })).toBeDisabled();
  });

  it("renders failed auction winner payment as a dedicated 24 hour failure detail", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          id: "trx-vickrey-failed",
          lotId: "pm-vickrey-failed",
          kind: "VICKREY_WIN",
          title: "Kalung Emas 2",
          amount: 16000000,
          status: "GAGAL",
          method: "BAYAR_LANGSUNG",
          unit: "UPC Ranotana",
          unitAddress: "Jl. Sam Ratulangi, Manado",
          createdAt: "28 Mei 2026, 19.20 WIB",
          deadline: "29 Mei 2026, 19.20 WIB",
          deadlineAt: "2026-05-29T11:20:00.000Z",
          reference: "CASH-FAILED",
          applicationNumber: "PGJ-VIC-FAILED",
          paymentLabel: "Bayar langsung di unit",
          paymentNotes: [],
          imageUrl: "/uploads/barang/kalung-lelang.jpg"
        }}
        transactionId="trx-vickrey-failed"
      />
    );

    expect(screen.getByRole("heading", { name: /pembayaran lelang gagal/i })).toBeInTheDocument();
    expect(screen.getByText(/batas pembayaran 24 jam/i)).toBeInTheDocument();
    expect(screen.getByText(/tenggat 24 jam terlewati/i)).toBeInTheDocument();
    expect(screen.getByText(/tidak ada unggah bukti atau proses review pembayaran/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ringkasan kegagalan pembayaran/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /foto barang kalung emas 2/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kembali ke transaksi/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /detail pembayaran/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/workflow pembayaran/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /status konfirmasi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /unggah bukti/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/dibatalkan/i)).not.toBeInTheDocument();
  });

  it("asks buyer to finish the purchase and prints the receipt inline after admin verification", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "LUNAS",
          paymentProof: "/uploads/bukti/transfer-lunas.jpg",
          verifiedAt: "4 Mei 2026 22.11 WIB",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByText(/menunggu konfirmasi selesai dari buyer/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /preview bukti transfer/i })).toBeInTheDocument();
    expect(screen.queryByText(/transfer-lunas.jpg/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tekan untuk membuka tampilan penuh/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^pilih file$/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pembelian selesai/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /buka nota/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /nota transaksi/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /cetak nota/i })[0]);
    await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1), { timeout: 3000 });

    const receiptPrintRoot = document.getElementById("buyer-receipt-print-root-trx-fixed-1-status");

    expect(receiptPrintRoot).not.toBeNull();
    expect(receiptPrintRoot!).toHaveClass("transaction-receipt-print-document", "hidden", "print:block");
    expect(receiptPrintRoot!.querySelector(".receipt-output-header-grid")).not.toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-main-grid")).not.toBeNull();
    expect(receiptPrintRoot!).toHaveTextContent("Harga Tetap");
    expect(receiptPrintRoot!.querySelector('img[src*="/uploads/barang/kalung-emas.jpg"]')).not.toBeNull();

    printSpy.mockRestore();
  });

  it("prints the paid auction winner receipt with the same official lelang layout as admin unit", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          id: "trx-vickrey-paid",
          lotId: "pm-vickrey-1",
          kind: "VICKREY_WIN",
          title: "Cincin Emas Berlian",
          amount: 10000000,
          status: "LUNAS",
          method: "BAYAR_LANGSUNG",
          unit: "UPC Ranotana",
          unitAddress: "Jl. Sam Ratulangi, Manado",
          reference: "CASH-OCE8A1",
          applicationNumber: "PGJ-VIC-TRXVICK",
          paymentLabel: "Bayar langsung di unit",
          paymentNotes: ["Pembayaran hasil lelang sudah diverifikasi admin unit."],
          imageUrl: "/uploads/barang/cincin-lelang.jpg",
          verifiedAt: "3 Jun 2026, 07.39 WIB",
          receiptNumber: "CASH-OCE8A1"
        }}
        transactionId="trx-vickrey-paid"
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: /cetak nota/i })[0]);
    await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1), { timeout: 3000 });

    const receiptPrintRoot = document.getElementById("buyer-receipt-print-root-trx-vickrey-paid-status");

    expect(screen.queryByRole("heading", { name: /nota transaksi/i })).not.toBeInTheDocument();
    expect(receiptPrintRoot).not.toBeNull();
    expect(receiptPrintRoot!).toHaveClass("vickrey-receipt-print-document", "hidden", "print:block");
    expect(receiptPrintRoot!.querySelector("style")?.textContent).toContain("width: 210mm");
    expect(receiptPrintRoot!.querySelector("style")?.textContent).toContain("min-height: 297mm");
    expect(receiptPrintRoot!.querySelector(".receipt-output-header-grid")).not.toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-main-grid")).not.toBeNull();
    expect(receiptPrintRoot!).toHaveTextContent("Lelang");
    expect(receiptPrintRoot!).not.toHaveTextContent("Lelang Tertutup");
    expect(receiptPrintRoot!).toHaveTextContent("Langsung di unit");
    expect(receiptPrintRoot!).toHaveTextContent("Pembayaran hasil lelang sudah diverifikasi admin unit");
    expect(receiptPrintRoot!).toHaveTextContent("Dokumen ini diterbitkan oleh admin unit Pegadaian Lelang.");
    expect(receiptPrintRoot!.querySelector('img[src*="/uploads/barang/cincin-lelang.jpg"]')).not.toBeNull();

    printSpy.mockRestore();
  });

  it("shows uploaded proof as read-only review state after the buyer sends payment proof", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "BUKTI_DIUNGGAH",
          paymentProof: "/uploads/bukti/transfer-budi.jpg",
          reference: "BRI-2026-001"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByRole("heading", { name: /review bukti/i })).toBeInTheDocument();
    expect(screen.queryByText(/bukti pembayaran sedang direview/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/terkirim dan terkunci sampai admin/i)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /preview bukti transfer/i })).toBeInTheDocument();
    expect(screen.queryByText(/transfer-budi.jpg/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tekan untuk membuka tampilan penuh/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/file bukti transfer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^pilih file$/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /bukti sedang direview admin/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^kirim bukti pembayaran$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kembali ke detail barang/i })).not.toBeInTheDocument();
  });

  it("keeps the uploaded proof preview visible after the transaction is completed", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "SELESAI",
          paymentProof: "/uploads/bukti/transfer-selesai.jpg",
          verifiedAt: "4 Mei 2026 22.11 WIB",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByText(/pembelian selesai setelah pembayaran diverifikasi/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /preview bukti transfer/i })).toBeInTheDocument();
    expect(screen.queryByText(/transfer-selesai.jpg/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/file bukti transfer/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kirim bukti pembayaran/i })).not.toBeInTheDocument();
  });

  it("surfaces rejection reason as a canceled transaction while keeping the submitted proof visible", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "DITOLAK_BUKTI",
          paymentProof: "/uploads/bukti/transfer-budi-buram.jpg",
          rejectionReason: "Nominal uang yang dikirim tidak sesuai harga barang."
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByText(/workflow verifikasi gagal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/bukti pembayaran ditolak/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/nominal uang yang dikirim tidak sesuai harga barang/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/transaksi dibatalkan dan barang kembali tersedia di katalog/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/barang dapat dibeli kembali dari katalog jika masih tersedia/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /review bukti/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /preview bukti transfer/i })).toBeInTheDocument();
    expect(screen.queryByText(/transfer-budi-buram\.jpg/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/upload kembali bukti pembayaran/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tekan untuk membuka tampilan penuh/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/file bukti transfer/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kirim ulang bukti pembayaran/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kirim bukti pembayaran/i })).not.toBeInTheDocument();
  });

  it("blocks settlement actions while the buyer has an active blacklist", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        buyerStatus={{ blacklist: { active: true, until: new Date("2026-05-28T00:00:00.000Z"), totalViolations: 1 } }}
        transaction={{
          ...transaction,
          status: "LUNAS",
          verifiedAt: "4 Mei 2026 22.11 WIB",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByText(/transaksi belum dapat diselesaikan/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pembelian selesai/i })).not.toBeInTheDocument();
  });

  it("blocks proof upload while the buyer has an active blacklist", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        buyerStatus={{ blacklist: { active: true, until: new Date("2026-05-28T00:00:00.000Z"), totalViolations: 1 } }}
        transaction={transaction}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByText(/transaksi belum dapat diselesaikan/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kirim bukti pembayaran/i })).not.toBeInTheDocument();
  });
});
