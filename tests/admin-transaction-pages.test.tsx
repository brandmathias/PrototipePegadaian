import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/admin-unit/admin-unit-action-button", () => ({
  AdminUnitActionButton: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>
}));

import {
  AdminTransactionDetailWorkspacePage,
  AdminTransactionHistoryPage,
  AdminTransactionHubPage,
  AdminTransactionVerificationPage
} from "@/components/pages/admin-transaction-pages";

const transactions = [
  {
    id: "trx-verify",
    buyer: "Raras Mahendra",
    lot: "Kalung Emas",
    status: "BUKTI_DIUNGGAH",
    method: "TRANSFER_BANK",
    total: 12500000,
    reference: "REF-8888",
    deadline: "5 Mei 2026 11.00",
    deadlineAt: "2026-05-05T03:00:00.000Z",
    proofFile: "/uploads/bukti-kalung.jpg",
    pemasaranMode: "Fixed Price",
    buyerEmail: "raras@example.com",
    buyerPhone: "+62 812 1111 2222",
    buyerNationalId: "7171010101010001",
    createdAt: "4 Mei 2026 10.00",
    verifiedAt: "-",
    printableReceipt: false
  },
  {
    id: "trx-history",
    buyer: "Sinta Pramesti",
    lot: "Cincin Emas",
    status: "LUNAS",
    method: "BAYAR_LANGSUNG",
    total: 9800000,
    reference: "CASH-4455",
    deadline: "2 Mei 2026 16.00",
    deadlineAt: "2026-05-02T08:00:00.000Z",
    proofFile: "",
    pemasaranMode: "Fixed Price",
    buyerEmail: "sinta@example.com",
    buyerPhone: "+62 812 3333 4444",
    buyerNationalId: "7171010101010002",
    createdAt: "2 Mei 2026 12.00",
    verifiedAt: "2 Mei 2026 15.30",
    printableReceipt: true
  },
  {
    id: "trx-complete",
    buyer: "Raras Maheswari",
    lot: "Kalung Emas Selesai",
    status: "SELESAI",
    method: "TRANSFER_BANK",
    total: 100000000,
    reference: "BRI-7777",
    deadline: "4 Mei 2026 22.07",
    deadlineAt: null,
    proofFile: "/uploads/bukti-selesai.jpg",
    pemasaranMode: "Fixed Price",
    buyerEmail: "raras.maheswari@example.com",
    buyerPhone: "081200009999",
    buyerNationalId: "7371000000000001",
    createdAt: "4 Mei 2026 22.07",
    verifiedAt: "4 Mei 2026 22.11",
    printableReceipt: true
  },
  {
    id: "trx-direct",
    buyer: "Arta Kusuma",
    lot: "Anting Berlian",
    status: "MENUNGGU_KONFIRMASI_LANGSUNG",
    method: "BAYAR_LANGSUNG",
    total: 15800000,
    reference: "-",
    deadline: "5 Mei 2026 14.00",
    deadlineAt: "2026-05-05T06:00:00.000Z",
    proofFile: "",
    pemasaranMode: "Fixed Price",
    buyerEmail: "arta@example.com",
    buyerPhone: "+62 812 5555 6666",
    buyerNationalId: "7171010101010003",
    createdAt: "4 Mei 2026 12.00",
    verifiedAt: "-",
    printableReceipt: false
  },
  {
    id: "trx-waiting",
    buyer: "Dian Larasati",
    lot: "Liontin Emas",
    status: "MENUNGGU_PEMBAYARAN",
    method: "TRANSFER_BANK",
    total: 7700000,
    reference: "-",
    deadline: "6 Mei 2026 10.00",
    deadlineAt: "2026-05-06T02:00:00.000Z",
    proofFile: "",
    pemasaranMode: "Fixed Price",
    buyerEmail: "dian@example.com",
    buyerPhone: "+62 812 7777 8888",
    buyerNationalId: "7171010101010004",
    createdAt: "4 Mei 2026 13.00",
    verifiedAt: "-",
    printableReceipt: false
  }
];

describe("admin transaction pages", () => {
  it("renders a hub with verification and history entry points", () => {
    render(<AdminTransactionHubPage transactions={transactions} />);

    expect(screen.getByRole("link", { name: /verifikasi pembayaran/i })).toHaveAttribute(
      "href",
      "/admin/pemasaran"
    );
    expect(screen.getByRole("link", { name: /riwayat/i })).toHaveAttribute(
      "href",
      "/admin/transaksi/riwayat"
    );
  });

  it("renders verification records as compact rows that open detail pages", () => {
    render(<AdminTransactionVerificationPage transactions={transactions} />);

    expect(screen.getAllByText(/kalung emas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cincin emas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/liontin emas/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/status kerja/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /lihat detail/i })[0]).toHaveAttribute(
      "href",
      "/admin/pemasaran"
    );
    expect(screen.queryByText(/nota & selesai/i)).not.toBeInTheDocument();

    expect(screen.queryByText(/raras@example.com/i)).not.toBeInTheDocument();
  });

  it("filters fixed price verification records by payment status", async () => {
    const user = userEvent.setup();
    render(<AdminTransactionVerificationPage transactions={transactions} />);

    await user.click(screen.getByRole("button", { name: /menunggu pembayaran/i }));

    expect(screen.getAllByText(/liontin emas/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^kalung emas$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/anting berlian/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lihat detail/i })).toHaveAttribute(
      "href",
      "/admin/pemasaran"
    );
  });

  it("separates verified transactions from buyer-completed transactions", async () => {
    const user = userEvent.setup();
    render(<AdminTransactionVerificationPage transactions={transactions} />);

    await user.click(screen.getByRole("button", { name: /terverifikasi/i }));
    expect(screen.getAllByText(/cincin emas/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/kalung emas selesai/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^selesai/i }));
    expect(screen.getAllByText(/kalung emas selesai/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/cincin emas/i)).not.toBeInTheDocument();
  });

  it("shows only archived transactions in history", () => {
    render(<AdminTransactionHistoryPage transactions={transactions} />);

    expect(screen.getByText(/cincin emas/i)).toBeInTheDocument();
    expect(screen.getByText(/kalung emas selesai/i)).toBeInTheDocument();
    expect(screen.getByText(/terverifikasi admin/i)).toBeInTheDocument();
    expect(screen.getByText(/diverifikasi 2 mei 2026 15.30/i)).toBeInTheDocument();
    expect(screen.queryByText(/batas waktu terlewati/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^kalung emas$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/liontin emas/i)).not.toBeInTheDocument();
  });

  it("renders transaction detail workspace with proof preview access", () => {
    render(
      <AdminTransactionDetailWorkspacePage
        backHref="/admin/pemasaran"
        backLabel="Kembali ke pemasaran"
        transaction={transactions[0]}
      />
    );

    expect(screen.getByText(/panel verifikasi/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buka file asli/i })).toHaveAttribute(
      "href",
      "/uploads/bukti-kalung.jpg"
    );
  });

  it("opens a dedicated admin receipt page instead of printing the workspace directly", () => {
    render(
      <AdminTransactionDetailWorkspacePage
        backHref="/admin/transaksi/riwayat"
        backLabel="Kembali ke riwayat"
        transaction={transactions[1]}
      />
    );

    expect(screen.getByRole("link", { name: /cetak nota/i })).toHaveAttribute(
      "href",
      `/admin/transaksi/${transactions[1].id}/nota?output=print`
    );
  });
});
