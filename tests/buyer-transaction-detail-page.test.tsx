import { render, screen } from "@testing-library/react";
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
  createdAt: "4 Mei 2026 10.30 WITA",
  deadline: "5 Mei 2026 10.30 WITA",
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
  it("renders the fixed price payment flow as transaction details, destination account, and proof upload", () => {
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
    expect(screen.getByRole("button", { name: /kirim bukti pembayaran/i })).toBeDisabled();
  });

  it("asks buyer to finish the purchase after admin verification", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "LUNAS",
          verifiedAt: "4 Mei 2026 22.11 WITA",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByText(/menunggu konfirmasi selesai dari buyer/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pembelian selesai/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buka nota/i })).toHaveAttribute(
      "href",
      `/transaksi/${transaction.id}/nota`
    );
  });
});
