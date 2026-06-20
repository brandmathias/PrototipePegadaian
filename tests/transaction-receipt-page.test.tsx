import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TransactionReceiptPage } from "@/components/pages/user-pages";
import { TransactionReceiptAutoPrint } from "@/components/shared/transaction-receipt-auto-print";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import type { BuyerTransaction } from "@/lib/contracts/buyer";

const buyer: BuyerSessionUser = {
  id: "buyer-1",
  name: "Budi Santoso",
  email: "budi@example.com",
  phoneNumber: "081234567890",
  role: "buyer",
  isActive: true
};

const transaction: BuyerTransaction = {
  id: "trx-fixed-1",
  lotId: "barang-1",
  kind: "FIXED_PRICE",
  title: "Jam Tangan Rolex Submariner",
  imageUrl: "/uploads/barang/rolex.jpg",
  amount: 150000000,
  status: "SELESAI",
  method: "TRANSFER_BANK",
  unit: "Pegadaian UPC Gading Serpong",
  unitAddress: "Ruko Dalton, Gading Serpong",
  createdAt: "5 Mei 2026 10.30 WIB",
  deadline: "Selesai",
  reference: "BRI-8888",
  applicationNumber: "PGJ-FP-TRXFIXED",
  paymentLabel: "Transfer Bank",
  paymentNotes: ["Transfer sesuai nominal transaksi."],
  bankName: "Bank Rakyat Indonesia (BRI)",
  bankAccountNumber: "0123-4567-8901-234",
  bankAccountHolder: "PT Pegadaian (Persero)",
  bankBranch: "Serpong",
  verifiedAt: "5 Mei 2026 11.00 WIB",
  receiptNumber: "PEG-20260518-001"
};

const vickreyTransaction: BuyerTransaction = {
  ...transaction,
  id: "trx-vickrey-paid",
  lotId: "pm-vickrey-1",
  kind: "VICKREY_WIN",
  title: "Cincin Emas Berlian",
  imageUrl: "/uploads/barang/cincin-lelang.jpg",
  amount: 10000000,
  status: "LUNAS",
  method: "BAYAR_LANGSUNG",
  unit: "UPC Ranotana",
  unitAddress: "Jl. Sam Ratulangi, Manado",
  reference: "CASH-OCE8A1",
  applicationNumber: "PGJ-VIC-TRXVICK",
  paymentLabel: "Bayar langsung di unit",
  paymentNotes: ["Pembayaran hasil lelang sudah diverifikasi admin unit."],
  verifiedAt: "3 Jun 2026, 07.39 WIB",
  receiptNumber: "CASH-OCE8A1"
};

describe("transaction receipt page", () => {
  it("prepares a sterile mobile auto-output stage before opening the print preview", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(
      <>
        <div id="transaction-receipt-document">Nota siap cetak</div>
        <TransactionReceiptAutoPrint fileName="CASH-OCE8A1" mode="print" />
      </>
    );

    const marker = document.getElementById("transaction-receipt-auto-output");
    const style = document.getElementById("transaction-receipt-auto-output-style");

    expect(marker).toBeInTheDocument();
    expect(marker).toHaveTextContent(/menyiapkan nota/i);
    expect(style).toBeInTheDocument();
    expect(style).toHaveTextContent("body:has(#transaction-receipt-auto-output)");
    expect(style).toHaveTextContent(".receipt-auto-output-stage");
    expect(style).toHaveTextContent(".buyer-experience-root");
    expect(style).toHaveTextContent("[data-admin-shell=\"true\"] > div > header");
    const cover = document.querySelector(".transaction-receipt-output-cover");
    expect(cover).toBeInTheDocument();
    expect(cover).toHaveClass("fixed", "inset-0", "print:hidden");
    expect(cover).toHaveTextContent(/menyiapkan nota/i);

    return waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1)).finally(() => {
      printSpy.mockRestore();
    });
  });

  it("renders an informative pickup note with buyer, unit, totals, and terms", () => {
    render(
      <TransactionReceiptPage
        buyer={buyer}
        transaction={transaction}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: /nota pengambilan barang/i })).toBeInTheDocument();
    expect(screen.getByText(/nota transaksi resmi/i)).toBeInTheDocument();
    expect(screen.getByText(/rincian barang/i)).toBeInTheDocument();
    expect(screen.getByText(/informasi pembeli/i)).toBeInTheDocument();
    expect(screen.getByText(/total pembayaran/i)).toBeInTheDocument();
    expect(screen.getByText(/metode pembayaran/i)).toBeInTheDocument();
    expect(screen.getByText(/syarat & ketentuan/i)).toBeInTheDocument();
    const receiptImage = screen.getByRole("img", { name: /foto barang jam tangan rolex submariner/i });
    expect(receiptImage).toBeInTheDocument();
    expect(receiptImage).toHaveAttribute("loading", "eager");
    expect(receiptImage).toHaveAttribute("decoding", "sync");
    expect(screen.getByText(/peg-20260518-001/i)).toBeInTheDocument();
  });

  it("provides dedicated links for pdf download and print view", () => {
    render(
      <TransactionReceiptPage
        buyer={buyer}
        transaction={transaction}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByRole("link", { name: /unduh pdf/i })).toHaveAttribute(
      "href",
      `/transaksi/${transaction.id}/nota?output=download`
    );
    expect(screen.getByRole("link", { name: /cetak nota/i })).toHaveAttribute(
      "href",
      `/transaksi/${transaction.id}/nota?output=print`
    );
  });

  it("uses the official admin-style receipt layout for a paid auction winner", () => {
    render(
      <TransactionReceiptPage
        buyer={buyer}
        transaction={vickreyTransaction}
        transactionId={vickreyTransaction.id}
      />
    );

    const receipt = document.getElementById("transaction-receipt-document");

    expect(receipt).not.toBeNull();
    expect(receipt).toHaveStyle({ width: "210mm", minHeight: "297mm" });
    const headerGrid = receipt!.querySelector(".receipt-output-header-grid");
    const mainGrid = receipt!.querySelector(".receipt-output-main-grid");
    const itemGrid = receipt!.querySelector(".receipt-output-item-grid");
    const buyerGrid = receipt!.querySelector(".receipt-output-buyer-grid");
    const summaryGrid = receipt!.querySelector(".receipt-output-summary-grid");
    const statusPill = receipt!.querySelector(".receipt-status-pill");
    const statusLabel = receipt!.querySelector(".receipt-status-pill-label");

    expect(headerGrid).toHaveClass("flex-row", "items-center", "justify-between");
    expect(mainGrid).toHaveClass("grid-cols-[1.38fr_0.86fr]", "gap-3");
    expect(itemGrid).toHaveClass("grid-cols-[3.75rem_minmax(0,1fr)_7.2rem]", "items-center");
    expect(buyerGrid).toHaveClass("grid-cols-2");
    expect(summaryGrid).toHaveClass("grid-cols-[1.2fr_0.8fr]", "gap-3");
    expect(statusPill).toHaveClass("h-[1.45rem]", "overflow-hidden", "rounded-[0.72rem]", "text-[0.62rem]", "leading-none");
    expect(statusPill!.querySelector(".receipt-status-pill-icon")).not.toBeNull();
    expect(statusLabel).toHaveClass("flex-1", "truncate", "whitespace-nowrap", "font-bold", "leading-none");
    expect(receipt!).toHaveTextContent("Lelang");
    expect(receipt!).not.toHaveTextContent("Lelang Tertutup");
    expect(receipt!).toHaveTextContent("Langsung di unit");
    expect(receipt!).toHaveTextContent("Pembayaran hasil lelang sudah diverifikasi admin unit");
    expect(receipt!).toHaveTextContent("Dokumen ini diterbitkan oleh admin unit Ruang Agunan.");
    expect(receipt!.querySelector('img[src*="/uploads/barang/cincin-lelang.jpg"]')).not.toBeNull();
  });
});
