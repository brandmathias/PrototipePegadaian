import { fireEvent, render, screen, within } from "@testing-library/react";
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
  {
    id: "TRX-250519-0013",
    lotId: "lot-5",
    kind: "VICKREY_WIN",
    title: "Iphone 14 Pro Max",
    imageUrl: "/uploads/barang/iphone.jpg",
    amount: 20000000,
    status: "MENUNGGU_PEMBAYARAN",
    method: "BAYAR_LANGSUNG",
    unit: "UPC Ranotana",
    unitAddress: "Jl. Sam Ratulangi No. 7",
    createdAt: "19 Mei 2026, 11.00 WIB",
    deadline: "20 Mei 2026, 11.00 WIB",
    deadlineAt: "2026-05-20T04:00:00.000Z",
    reference: "REF-005",
    applicationNumber: "PGJ-VIC-004",
    paymentLabel: "Bayar langsung di unit",
    paymentNotes: [],
  },
  {
    id: "TRX-250519-0014",
    lotId: "lot-6",
    kind: "VICKREY_WIN",
    title: "Ipad",
    imageUrl: "/uploads/barang/ipad.jpg",
    amount: 10000000,
    status: "LUNAS",
    method: "BAYAR_LANGSUNG",
    unit: "UPC Ranotana",
    unitAddress: "Jl. Sam Ratulangi No. 7",
    createdAt: "3 Jun 2026, 07.39 WIB",
    deadline: "4 Jun 2026, 07.39 WIB",
    deadlineAt: "2026-06-04T07:39:00.000Z",
    reference: "CASH-OCE8A1",
    applicationNumber: "PGJ-VIC-OCE8A125",
    paymentLabel: "Bayar langsung di unit",
    paymentNotes: ["Pembayaran hasil lelang sudah diverifikasi admin unit."],
    verifiedAt: "3 Jun 2026, 07.39 WIB",
    receiptNumber: "CASH-OCE8A1",
  },
  {
    id: "TRX-250520-0012",
    lotId: "lot-4",
    kind: "FIXED_PRICE",
    title: "Cincin Emas Berlian",
    imageUrl: "/uploads/barang/cincin-emas.jpg",
    amount: 15000000,
    status: "DITOLAK_BUKTI",
    method: "TRANSFER_BANK",
    unit: "UPC Ranotana",
    unitAddress: "Jl. Ranotana No. 1",
    createdAt: "20 Mei 2026, 09.00 WIB",
    deadline: "21 Mei 2026, 09.00 WIB",
    deadlineAt: "2026-05-21T01:00:00.000Z",
    reference: "REF-004",
    applicationNumber: "PGJ-FP-004",
    paymentLabel: "Transfer bank ke rekening unit",
    paymentNotes: [],
    rejectionReason: "Nominal uang yang dikirim tidak sesuai harga barang",
    verifiedAt: "20 Mei 2026, 10.15 WIB",
  },
  {
    id: "TRX-250520-FAIL",
    lotId: "lot-fail",
    kind: "VICKREY_WIN",
    title: "Jam Tangan Lelang Gagal",
    imageUrl: "/uploads/barang/jam-tangan.jpg",
    amount: 18500000,
    status: "GAGAL",
    method: "BAYAR_LANGSUNG",
    unit: "UPC Ranotana",
    unitAddress: "Jl. Ranotana No. 1",
    createdAt: "21 Mei 2026, 12.00 WIB",
    deadline: "22 Mei 2026, 12.00 WIB",
    deadlineAt: "2026-05-22T04:00:00.000Z",
    reference: "REF-FAIL",
    applicationNumber: "PGJ-VIC-FAIL",
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
    finalPrice: 16250000,
    note: "Bid tidak menjadi pemenang sesi ini.",
  },
  {
    lotId: "lot-fail",
    lot: "Jam Tangan Lelang Gagal",
    imageUrl: "/uploads/barang/jam-tangan.jpg",
    unit: "UPC Ranotana",
    status: "GAGAL",
    closing: "21 Mei 2026, 12.00 WIB",
    closingAt: "2026-05-21T04:00:00.000Z",
    basePrice: 17000000,
    paymentAmount: 18500000,
    note: "Pembayaran Lelang Tertutup gagal karena melewati batas waktu.",
    linkedTransactionId: "TRX-250520-FAIL",
  },
];

const bidFilterFixtures: BuyerBid[] = [
  {
    lotId: "bid-active",
    lot: "Bid Aktif Tercatat",
    unit: "UPC Wanea",
    status: "BID_TERCATAT",
    closing: "18 Agu 2026, 13.11 WIB",
    closingAt: "2026-08-18T05:11:00.000Z",
    basePrice: 26000000,
    bidAmount: 3881250,
    note: "Sesi lelang sedang berlangsung. Nominal dan identitas penawar disensor hingga waktu penutupan."
  },
  {
    lotId: "bid-awaiting",
    lot: "Hasil Lelang Sedang Diproses",
    unit: "UPC Wanea",
    status: "MENUNGGU_HASIL",
    closing: "18 Agu 2026, 10.52 WIB",
    closingAt: "2026-08-18T02:52:00.000Z",
    basePrice: 26000000,
    bidAmount: 27500000,
    note: "Deadline telah berakhir. Sistem sedang menentukan hasil Lelang Tertutup."
  },
  {
    lotId: "bid-won",
    lot: "Bid Pemenang",
    unit: "UPC Wanea",
    status: "MENANG",
    closing: "17 Agu 2026, 13.34 WIB",
    closingAt: "2026-08-17T05:34:00.000Z",
    basePrice: 26000000,
    paymentAmount: 31000000,
    note: "Anda memenangkan Lelang Tertutup."
  },
  {
    lotId: "bid-lost",
    lot: "Bid Tidak Menang",
    unit: "UPC Wanea",
    status: "TIDAK_MENANG",
    closing: "17 Agu 2026, 13.34 WIB",
    closingAt: "2026-08-17T05:34:00.000Z",
    basePrice: 26000000,
    bidAmount: 29000000,
    note: "Bid tidak menjadi pemenang sesi ini."
  },
  {
    lotId: "bid-failed",
    lot: "Bid Gagal",
    unit: "UPC Wanea",
    status: "GAGAL",
    closing: "17 Agu 2026, 13.34 WIB",
    closingAt: "2026-08-17T05:34:00.000Z",
    basePrice: 26000000,
    paymentAmount: 31000000,
    note: "Pembayaran Lelang Tertutup gagal karena melewati batas waktu."
  }
];

describe("TransactionsPage", () => {
  it("groups active and closed unresolved bids in Menunggu Hasil while keeping the other bid filters exact", async () => {
    const user = userEvent.setup();

    render(
      <TransactionsPage
        buyer={buyer}
        data={{ summary, transactions: [], bids: bidFilterFixtures }}
        initialTab="bids"
      />
    );

    await user.click(screen.getByRole("button", { name: "Menunggu Hasil" }));

    expect(screen.getByText("Bid Aktif Tercatat")).toBeInTheDocument();
    expect(screen.getByText("Hasil Lelang Sedang Diproses")).toBeInTheDocument();
    expect(
      within(screen.getByText("Bid Aktif Tercatat").closest("article") as HTMLElement).getByText("Rp 3.881.250")
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Hasil Lelang Sedang Diproses").closest("article") as HTMLElement).getByText("Rp 27.500.000")
    ).toBeInTheDocument();
    expect(screen.queryByText("Bid Pemenang")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Menang" }));
    expect(screen.getByText("Bid Pemenang")).toBeInTheDocument();
    expect(screen.queryByText("Bid Aktif Tercatat")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tidak Menang" }));
    expect(screen.getByText("Bid Tidak Menang")).toBeInTheDocument();
    expect(screen.queryByText("Bid Pemenang")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Gagal" }));
    expect(screen.getByText("Bid Gagal")).toBeInTheDocument();
    expect(screen.queryByText("Bid Tidak Menang")).not.toBeInTheDocument();
  });

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
    expect(screen.queryByText("Honda Vario 160 CBS 2023")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /bayar sekarang/i })).not.toBeInTheDocument();
    expect(screen.getByText("Cincin Emas Berlian")).toBeInTheDocument();
    expect(screen.queryByText("TRX-250520-0012")).not.toBeInTheDocument();
    expect(screen.getByText(/transaksi dibatalkan dan barang kembali tersedia di katalog/i)).toBeInTheDocument();
    expect(screen.getByText("Kalung Mutiara Laut Selatan")).toBeInTheDocument();
    expect(screen.getByText("Iphone 14 Pro Max")).toBeInTheDocument();
    expect(screen.getByText("Ipad")).toBeInTheDocument();
    expect(screen.getAllByText("Jam Tangan Lelang Gagal")).toHaveLength(1);
    expect(screen.getAllByText("UPC Ranotana").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Unit UPC Ranotana/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Pembayaran Lelang Tertutup gagal karena melewati batas 24 jam/i)).toBeInTheDocument();
    expect(screen.getByText(/Batas pembayaran 24 jam telah lewat/i)).toBeInTheDocument();
    expect(screen.getByText("Gelang Emas 24K - 10 Gram")).toBeInTheDocument();
    expect(screen.getAllByTestId("buyer-transaction-unit-icon")[0]).toHaveClass("lucide-building-2");
    expect(screen.getByTestId("buyer-bid-status-MENANG-icon")).toHaveClass("lucide-trophy");
    expect(screen.getByTestId("buyer-bid-status-TIDAK_MENANG-icon")).toHaveClass("lucide-circle-x");
    expect(screen.getByAltText("Foto transaksi Gelang Emas 24K - 10 Gram")).toHaveAttribute(
      "src",
      expect.stringContaining(encodeURIComponent("/uploads/barang/gelang.jpg"))
    );
    expect(screen.getByText(/bayar langsung di unit/i)).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /lihat detail/i })
        .some((link) => link.getAttribute("href") === "/transaksi/TRX-250519-0010/pemenang")
    ).toBe(true);
    expect(
      screen
        .getAllByRole("link", { name: /lihat detail/i })
        .some((link) => link.getAttribute("href") === "/transaksi/TRX-250519-0013/pemenang")
    ).toBe(true);
    expect(
      screen
        .getAllByRole("link", { name: /lihat detail/i })
        .some((link) => link.getAttribute("href") === "/transaksi/TRX-250519-0014/pemenang")
    ).toBe(true);

    await user.click(screen.getByRole("button", { name: /riwayat lelang/i }));

    expect(screen.getByText("Gelang Emas 24K - 10 Gram")).toBeInTheDocument();
    expect(screen.getByText("Kamera Mirrorless Full Frame")).toBeInTheDocument();
    const losingBidCard = screen.getByText("Kamera Mirrorless Full Frame").closest("article") as HTMLElement;
    expect(within(losingBidCard).getByText("Nominal bid")).toBeInTheDocument();
    expect(within(losingBidCard).getByText("Rp 14.800.000")).toBeInTheDocument();
    expect(within(losingBidCard).queryByText("Rp 16.250.000")).not.toBeInTheDocument();
    expect(screen.getByTestId("buyer-bid-filter-won-icon")).toHaveClass("lucide-trophy");
    expect(screen.getByTestId("buyer-bid-filter-lost-icon")).toHaveClass("lucide-circle-x");
    expect(
      screen
        .getAllByRole("link", { name: /lihat hasil/i })
        .some((link) => link.getAttribute("href") === "/riwayat-bid/bid-2/bukan-pemenang")
    ).toBe(true);
    expect(screen.getAllByText(/riwayat lelang tersimpan/i).length).toBeGreaterThan(0);
  });

  it("keeps a verified payment waiting for admin handover proof in the transaction list", () => {
    render(
      <TransactionsPage
        buyer={buyer}
        data={{ summary, transactions, bids }}
      />
    );

    const verifiedPaymentCard = screen.getByText("Ipad").closest("article") as HTMLElement;

    expect(within(verifiedPaymentCard).getByText("Menunggu Bukti Serah-Terima")).toBeInTheDocument();
    expect(within(verifiedPaymentCard).getByText("Bukti serah-terima belum tersedia")).toBeInTheDocument();
    expect(within(verifiedPaymentCard).getByText("Pembayaran diverifikasi pada")).toBeInTheDocument();
    expect(
      within(verifiedPaymentCard).getByText("Menunggu admin unit mengunggah bukti serah-terima barang.")
    ).toBeInTheDocument();
    expect(within(verifiedPaymentCard).queryByText("Menunggu Konfirmasi Buyer")).not.toBeInTheDocument();
    expect(within(verifiedPaymentCard).queryByText("Selesai")).not.toBeInTheDocument();
    expect(within(verifiedPaymentCard).queryByText("Transaksi selesai")).not.toBeInTheDocument();
  });

  it("places rejected harga tetap proof transactions in Dibatalkan instead of Perlu Tindakan", async () => {
    const user = userEvent.setup();

    render(
      <TransactionsPage
        buyer={buyer}
        data={{ summary, transactions, bids: [] }}
      />
    );

    await user.click(screen.getByRole("button", { name: /perlu tindakan/i }));

    expect(screen.getByText("Kalung Mutiara Laut Selatan")).toBeInTheDocument();
    expect(screen.queryByText("Honda Vario 160 CBS 2023")).not.toBeInTheDocument();
    expect(screen.queryByText("Cincin Emas Berlian")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /gagal/i }));

    expect(screen.getByText("Cincin Emas Berlian")).toBeInTheDocument();
    expect(screen.getByText("Jam Tangan Lelang Gagal")).toBeInTheDocument();
    expect(screen.queryByText("Honda Vario 160 CBS 2023")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /bayar sekarang/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Dibatalkan").length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole("link", { name: /lihat detail/i })
        .some((link) => link.getAttribute("href") === "/transaksi/TRX-250520-0012")
    ).toBe(true);
    expect(
      screen
        .getAllByRole("link", { name: /lihat detail/i })
        .some((link) => link.getAttribute("href") === "/transaksi/TRX-250520-FAIL/pemenang")
    ).toBe(true);
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
