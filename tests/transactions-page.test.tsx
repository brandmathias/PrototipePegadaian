import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import { TransactionsPage } from "@/components/pages/user-pages";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import type { BuyerBid, BuyerTransaction } from "@/lib/contracts/buyer";

const buyer: BuyerSessionUser = {
  id: "buyer-001",
  name: "Buyer Demo 13 B",
  email: "buyer@example.com",
  phoneNumber: "08123456789",
  role: "buyer",
  isActive: true,
};

const summary = {
  phone: "08123456789",
  memberSince: "4 Mei 2026",
  verificationStatus: "Terverifikasi",
  security: {
    passwordUpdatedAt: "13 Mei 2026",
    activeSessionCount: 1,
    sessionHistory: ["24 Mei 2026, 09.10 WIB"],
  },
  blacklist: {
    active: false,
    until: "-",
    reason: "Tidak ada pembatasan aktif.",
    violations: 0,
  },
  highlights: [],
  metrics: [],
};

const transactions: BuyerTransaction[] = [
  {
    id: "TRX-250520-0011",
    lotId: "lot-1",
    kind: "FIXED_PRICE",
    title: "Honda Vario 160 CBS 2023",
    imageUrl: "/uploads/barang/vario.jpg",
    amount: 16000000,
    status: "MENUNGGU_PEMBAYARAN",
    method: "TRANSFER_BANK",
    unit: "Jakarta Selatan",
    unitAddress: "Jl. Sudirman No. 10",
    createdAt: "18 Mei 2026, 20.35 WIB",
    deadline: "19 Mei 2026, 01.35 WIB",
    deadlineAt: "2026-05-18T18:35:00.000Z",
    reference: "REF-001",
    applicationNumber: "PGJ-FP-001",
    paymentLabel: "Transfer bank ke rekening unit",
    paymentNotes: [],
  },
  {
    id: "TRX-250518-0007",
    lotId: "lot-2",
    kind: "VICKREY_WIN",
    title: "Cincin Berlian Solitaire 0.50 CT",
    imageUrl: "/uploads/barang/cincin.jpg",
    amount: 8600000,
    status: "SELESAI",
    method: "BAYAR_LANGSUNG",
    unit: "Bandung",
    unitAddress: "Jl. Asia Afrika No. 8",
    createdAt: "18 Mei 2026, 16.22 WIB",
    deadline: "Selesai",
    reference: "REF-002",
    applicationNumber: "PGJ-VIC-002",
    paymentLabel: "Bayar langsung di unit",
    paymentNotes: [],
    verifiedAt: "18 Mei 2026, 16.22 WIB",
  },
  {
    id: "TRX-250519-0010",
    lotId: "lot-3",
    kind: "VICKREY_WIN",
    title: "Kalung Mutiara Laut Selatan",
    imageUrl: "/uploads/barang/kalung-mutiara.jpg",
    amount: 12750000,
    status: "MENUNGGU_KONFIRMASI_LANGSUNG",
    method: "BAYAR_LANGSUNG",
    unit: "Surabaya",
    unitAddress: "Jl. Tunjungan No. 14",
    createdAt: "19 Mei 2026, 10.14 WIB",
    deadline: "20 Mei 2026, 10.14 WIB",
    deadlineAt: "2026-05-20T03:14:00.000Z",
    reference: "REF-003",
    applicationNumber: "PGJ-VIC-003",
    paymentLabel: "Bayar langsung di unit",
    paymentNotes: [],
  },
];

const bids: BuyerBid[] = [
  {
    lotId: "bid-1",
    lot: "Gelang Emas 24K - 10 Gram",
    imageUrl: "/uploads/barang/gelang.jpg",
    unit: "Surabaya",
    status: "MENANG",
    closing: "19 Mei 2026, 10.14 WIB",
    closingAt: "2026-05-19T03:14:00.000Z",
    basePrice: 12000000,
    paymentAmount: 12750000,
    note: "Pembayaran diterima. Transaksi sedang diverifikasi oleh tim Pegadaian.",
    linkedTransactionId: "trx-linked-1",
  },
  {
    lotId: "bid-2",
    lot: "Kamera Mirrorless Full Frame",
    imageUrl: "/uploads/barang/kamera.jpg",
    unit: "Makassar",
    status: "TIDAK_MENANG",
    closing: "19 Mei 2026, 12.20 WIB",
    closingAt: "2026-05-19T05:20:00.000Z",
    bidAmount: 14800000,
    basePrice: 13500000,
    note: "Bid tidak menjadi pemenang sesi ini.",
  },
];

describe("TransactionsPage", () => {
  it("renders the redesigned buyer transaction workspace with tabs, filters, and CTA states", async () => {
    const user = userEvent.setup();

    render(
      <TransactionsPage
        buyer={buyer}
        data={{ summary, transactions, bids }}
      />
    );

    expect(screen.getByRole("button", { name: /semua transaksi/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /riwayat lelang/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /perlu tindakan/i })).toBeInTheDocument();
    expect(screen.getByText("Honda Vario 160 CBS 2023")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /bayar sekarang/i })).toHaveLength(1);
    expect(screen.getByText("Kalung Mutiara Laut Selatan")).toBeInTheDocument();
    expect(screen.getByText("Gelang Emas 24K - 10 Gram")).toBeInTheDocument();
    expect(screen.getByAltText("Foto transaksi Gelang Emas 24K - 10 Gram")).toHaveAttribute(
      "src",
      expect.stringContaining("/uploads/barang/gelang.jpg")
    );
    expect(screen.getByText(/bayar langsung di unit/i)).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /lihat detail/i })
        .some((link) => link.getAttribute("href") === "/transaksi/TRX-250519-0010/pemenang")
    ).toBe(true);

    await user.click(screen.getByRole("button", { name: /riwayat lelang/i }));

    expect(screen.getByText("Gelang Emas 24K - 10 Gram")).toBeInTheDocument();
    expect(screen.getByText("Kamera Mirrorless Full Frame")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /lihat hasil/i })
        .some((link) => link.getAttribute("href") === "/riwayat-bid/bid-2/bukan-pemenang")
    ).toBe(true);
    expect(screen.getAllByText(/riwayat lelang tersimpan/i).length).toBeGreaterThan(0);
  });

  it("falls back to the bid visual treatment when a product image fails to load", () => {
    render(
      <TransactionsPage
        buyer={buyer}
        data={{ summary, transactions: [], bids: [bids[1]] }}
      />
    );

    const image = screen.getByAltText("Foto transaksi Kamera Mirrorless Full Frame");
    fireEvent.error(image);

    expect(screen.queryByAltText("Foto transaksi Kamera Mirrorless Full Frame")).not.toBeInTheDocument();
    expect(screen.getByText("Kamera Mirrorless Full Frame")).toBeInTheDocument();
  });

  it("can open directly on the riwayat lelang tab from the transactions hub", () => {
    render(
      <TransactionsPage
        buyer={buyer}
        data={{ summary, transactions, bids }}
        highlightedBidLotId="bid-1"
        initialTab="bids"
      />
    );

    expect(screen.getByText("Gelang Emas 24K - 10 Gram")).toBeInTheDocument();
    expect(screen.queryByText("Honda Vario 160 CBS 2023")).not.toBeInTheDocument();
  });
});
