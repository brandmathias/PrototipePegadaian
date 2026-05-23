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
  blacklist: {
    active: false,
    until: "-",
    reason: "Tidak ada pembatasan aktif.",
    violations: 0
  },
  highlights: [
    "Unggah bukti transfer maksimal 24 jam setelah transaksi dibuat.",
    "Bid Vickrey tersimpan tertutup.",
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

describe("buyer dashboard page", () => {
  it("renders the ideal buyer dashboard zones without dense account panels", () => {
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

    expect(screen.getByRole("heading", { name: /selamat datang, raras/i })).toBeInTheDocument();
    expect(screen.getByText(/akun terverifikasi/i)).toBeInTheDocument();
    expect(screen.getByText(/raras@example\.com \| member sejak 4 mei 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/pembayaran menunggu/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /bayar sekarang/i })).toHaveAttribute(
      "href",
      "/transaksi/trx-fixed-1"
    );
    expect(screen.getByText(/menunggu bayar/i)).toBeInTheDocument();
    expect(screen.getByText(/bid aktif/i)).toBeInTheDocument();
    expect(screen.getByText(/nota tersedia/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /transaksi aktif/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /lelang vickrey yang diikuti/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /foto barang motor racing/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /jelajahi katalog/i })).toHaveAttribute("href", "/katalog");
    expect(screen.queryByText(/status akun pembeli/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aktivitas bid terbaru/i)).not.toBeInTheDocument();
  });

  it("hides the urgent banner and shows calm empty lists when nothing requires action", () => {
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
    expect(screen.getByText(/belum ada transaksi aktif/i)).toBeInTheDocument();
    expect(screen.getByText(/belum ada lelang yang diikuti/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /jelajahi katalog/i })).toHaveAttribute("href", "/katalog");
  });
});
