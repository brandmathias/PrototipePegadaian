import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TransactionReceiptPage } from "@/components/pages/user-pages";
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
  createdAt: "5 Mei 2026 10.30 WITA",
  deadline: "Selesai",
  reference: "BRI-8888",
  applicationNumber: "PGJ-FP-TRXFIXED",
  paymentLabel: "Transfer Bank",
  paymentNotes: ["Transfer sesuai nominal transaksi."],
  bankName: "Bank Rakyat Indonesia (BRI)",
  bankAccountNumber: "0123-4567-8901-234",
  bankAccountHolder: "PT Pegadaian (Persero)",
  bankBranch: "Serpong",
  verifiedAt: "5 Mei 2026 11.00 WITA",
  receiptNumber: "PEG-20260518-001"
};

describe("transaction receipt page", () => {
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
    expect(screen.getByRole("img", { name: /foto barang jam tangan rolex submariner/i })).toBeInTheDocument();
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
});
