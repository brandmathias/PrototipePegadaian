import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

import { UserDashboardPage } from "@/components/pages/user-pages";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import type { BuyerBid, BuyerTransaction } from "@/lib/contracts/buyer";

const buyer: BuyerSessionUser = {
  id: "buyer-1",
  name: "Raras Maheswari",
  email: "raras@example.com",
  phoneNumber: "081200009999",
  role: "buyer",
  isActive: true
};

const summary = {
  name: "Raras Maheswari",
  unit: "Pembeli terverifikasi",
  accountId: "USR-BUYER1",
  email: "raras@example.com",
  phone: "081200009999",
  nationalId: "7371000000000001",
  nikMasked: "7371********0001",
  address: "Belum dilengkapi",
  memberSince: "4 Mei 2026",
  verificationStatus: "Terverifikasi",
  security: {
    passwordUpdatedAt: "13 Mei 2026",
    activeSessionCount: 1,
    sessionHistory: ["24 Mei 2026, 09.10 WIB"]
  },
  blacklist: {
    active: false,
    until: "-",
    reason: "Tidak ada pembatasan aktif.",
    violations: 0
  },
  highlights: [
    "Unggah bukti transfer maksimal 24 jam setelah transaksi dibuat.",
    "Bid Lelang Tertutup tersimpan tertutup.",
    "Pembatasan akun berlaku bertingkat."
  ],
  metrics: [
    { label: "Transaksi aktif", value: "1", accent: "primary" },
    { label: "Perlu ditindaklanjuti", value: "1", accent: "secondary" },
    { label: "Lelang yang diikuti", value: "1", accent: "neutral" },
    { label: "Nota siap diunduh", value: "0", accent: "primary" }
  ]
};

const activeTransaction: BuyerTransaction = {
  id: "trx-fixed-1",
  lotId: "barang-1",
  kind: "FIXED_PRICE",
  title: "Kalung Emas",
  amount: 100000000,
  status: "MENUNGGU_PEMBAYARAN",
  method: "TRANSFER_BANK",
  unit: "UPC Ranotana",
  unitAddress: "Jl. Sam Ratulangi, Manado",
  createdAt: "4 Mei 2026, 22.07",
  deadline: "5 Mei 2026, 22.07",
  deadlineAt: "2099-05-05T14:07:00.000Z",
  reference: "REF-2D561B",
  applicationNumber: "PGJ-FP-1",
  paymentLabel: "Transfer Bank",
  paymentNotes: ["Transfer sesuai nominal transaksi."]
};

const rejectedTransaction: BuyerTransaction = {
  ...activeTransaction,
  id: "trx-fixed-rejected",
  status: "DITOLAK_BUKTI",
  rejectionReason: "Nominal transfer tidak sesuai harga barang.",
  verifiedAt: "5 Mei 2026, 08.10 WIB"
};

const latestBid: BuyerBid = {
  lotId: "pm-vickrey-1",
  lot: "Motor Racing",
  imageUrl: "/uploads/barang/motor-racing.jpg",
  unit: "UPC Ranotana",
  status: "MENUNGGU_HASIL",
  closing: "19 Mei 2026, 02.40",
  closingAt: "2099-05-19T02:40:00.000Z",
  basePrice: 200000000,
  note: "Bid tertutup tersimpan."
};

const winningAuctionTransaction: BuyerTransaction = {
  id: "trx-vickrey-1",
  lotId: "pm-vickrey-1",
  kind: "VICKREY_WIN",
  title: "Motor Racing",
  amount: 200000000,
  status: "MENUNGGU_PEMBAYARAN",
  method: "BAYAR_LANGSUNG",
  unit: "UPC Ranotana",
  unitAddress: "Jl. Sam Ratulangi, Manado",
  createdAt: "4 Mei 2026, 22.07",
  deadline: "5 Mei 2026, 22.07",
  deadlineAt: "2099-05-05T14:07:00.000Z",
  reference: "-",
  applicationNumber: "PGJ-VIC-MOTOR",
  paymentLabel: "Bayar langsung di unit",
  paymentNotes: ["Datang ke unit untuk menyelesaikan pembayaran pemenang lelang."],
  winnerContext: "Harga akhir mengikuti mekanisme lelang dan dihitung otomatis oleh sistem."
};

describe("buyer dashboard page", () => {
  it("renders the focused buyer home without an urgent banner for fixed price proof upload", () => {
    render(
      <UserDashboardPage
        buyer={buyer}
        data={{
          summary,
          transactions: [activeTransaction],
          bids: [latestBid]
        }}
      />
    );

    expect(screen.getByRole("heading", { name: /halo, raras maheswari/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /ilustrasi beranda pembeli/i })).toBeInTheDocument();
    expect(screen.getByText(/akun terverifikasi/i)).toBeInTheDocument();
    expect(screen.getByText(/member sejak 4 mei 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/raras@example\.com/i)).toBeInTheDocument();
    expect(screen.queryByText(/pembayaran menunggu/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /bayar sekarang/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^status akun$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /riwayat pelanggaran/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /catatan penting/i })).toBeInTheDocument();
    expect(screen.getByText(/ringkasan hal yang perlu anda ingat/i)).toBeInTheDocument();
    expect(screen.queryByText(/menunggu bayar:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bid aktif:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nota tersedia:/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /jelajahi katalog/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /transaksi aktif/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /lelang tertutup yang diikuti/i })).not.toBeInTheDocument();
  });

  it("hides the urgent banner and shows a calm empty state when nothing requires action", () => {
    render(
      <UserDashboardPage
        buyer={buyer}
        data={{
          summary: {
            ...summary,
            metrics: summary.metrics.map((metric) =>
              metric.label === "Perlu ditindaklanjuti" ? { ...metric, value: "0" } : metric
            )
          },
          transactions: [],
          bids: []
        }}
      />
    );

    expect(screen.queryByText(/pembayaran menunggu/i)).not.toBeInTheDocument();
    expect(screen.getByText(/belum ada aktivitas yang perlu ditindaklanjuti/i)).toBeInTheDocument();
    expect(screen.getByText(/tidak ada pelanggaran aktif/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /jelajahi katalog/i })).not.toBeInTheDocument();
  });

  it("does not treat rejected harga tetap proof as an urgent payment action", () => {
    render(
      <UserDashboardPage
        buyer={buyer}
        data={{
          summary,
          transactions: [rejectedTransaction],
          bids: []
        }}
      />
    );

    expect(screen.queryByText(/bukti transfer ditolak/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /upload ulang/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /bayar sekarang/i })).not.toBeInTheDocument();
    expect(screen.getByText(/belum ada aktivitas yang perlu ditindaklanjuti/i)).toBeInTheDocument();
  });

  it("opens active Lelang Tertutup winners from the dashboard into the winner announcement page first", () => {
    render(
      <UserDashboardPage
        buyer={buyer}
        data={{
          summary,
          transactions: [winningAuctionTransaction],
          bids: []
        }}
      />
    );

    expect(screen.getByText(/pemenang lelang tertutup/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lihat detail/i })).toHaveAttribute(
      "href",
      "/transaksi/trx-vickrey-1/pemenang"
    );
  });
});
