import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

import { UserDashboardPage } from "@/components/pages/user-dashboard-page";
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
    const heroImage = screen.getByRole("img", { name: /ilustrasi beranda pembeli/i });
    const heroSection = heroImage.closest("section");
    expect(heroImage).toBeInTheDocument();
    expect(heroSection).toBeTruthy();
    expect(within(heroSection as HTMLElement).queryByText(/akun terverifikasi/i)).not.toBeInTheDocument();
    expect(within(heroSection as HTMLElement).queryByText(/akun dibatasi/i)).not.toBeInTheDocument();
    expect(screen.getByText(/member sejak 4 mei 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/raras@example\.com/i)).toBeInTheDocument();
    expect(screen.queryByText(/pembayaran menunggu/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /bayar sekarang/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /indeks kesehatan akun/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /riwayat pelanggaran/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lihat detail riwayat/i })).toHaveAttribute(
      "href",
      "/pelanggaran"
    );
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
    expect(screen.getByText(/tidak ada pelanggaran tercatat/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /jelajahi katalog/i })).not.toBeInTheDocument();
  });

  it("counts historical violations even after the active restriction has ended", () => {
    render(
      <UserDashboardPage
        buyer={buyer}
        data={{
          summary,
          transactions: [],
          bids: [],
          violations: [
            {
              id: "violation-history-1",
              imageUrl: "/uploads/barang/kalung-emas.jpg",
              itemName: "Kalung Emas",
              note: "Pemenang tidak menyelesaikan pembayaran dalam batas waktu.",
              occurredAtLabel: "19 Juni 2026, 04.03 WIB",
              unitName: "UPC Ranotana",
              violationLevel: 1
            }
          ]
        }}
      />
    );

    const historyPanel = screen.getByRole("heading", { name: /riwayat pelanggaran/i }).closest("article");
    expect(historyPanel).not.toBeNull();
    expect(within(historyPanel as HTMLElement).getByText("1", { selector: "span" })).toBeInTheDocument();
    expect(within(historyPanel as HTMLElement).getByText("Level 1")).toBeInTheDocument();
  });

  it.each([
    [1, "bg-[#c97900]"],
    [2, "bg-[#dc4c18]"],
    [3, "bg-[#b91c1c]"]
  ])("renders real violation details with the matching level %s tone", (level, expectedTone) => {
    render(
      <UserDashboardPage
        buyer={buyer}
        data={{
          summary: {
            ...summary,
            blacklist: {
              active: true,
              until: level === 1 ? "11 Juni 2026" : level === 2 ? "12 Juli 2026" : "12 Juni 2027",
              reason: "Akun sedang dibatasi sesuai kebijakan pelanggaran pembayaran.",
              violations: level
            }
          },
          transactions: [],
          bids: [],
          violations: [
            {
              id: `violation-${level}`,
              imageUrl: "/uploads/barang/kalung-emas.jpg",
              itemName: "Kalung Emas 2",
              note: "Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam.",
              occurredAtLabel: "12 Juni 2026, 13.33 WITA",
              unitName: "UPC Ranotana",
              violationLevel: level
            }
          ]
        }}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: new RegExp(`hak akses: terbatas sementara \\(level ${level}\\)`, "i")
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /foto kalung emas 2/i })).toBeInTheDocument();
    expect(screen.getByText("Kalung Emas 2")).toBeInTheDocument();
    expect(screen.getByText("12 Juni 2026")).toBeInTheDocument();
    expect(screen.getByText("13.33 WITA")).toBeInTheDocument();
    expect(screen.getByText("UPC Ranotana")).toBeInTheDocument();

    const historyPanel = screen.getByRole("heading", { name: /riwayat pelanggaran/i }).closest("article");
    expect(historyPanel).not.toBeNull();
    expect(within(historyPanel as HTMLElement).getByText(String(level), { selector: "span" })).toBeInTheDocument();
    expect(within(historyPanel as HTMLElement).getByText(`Level ${level}`)).toHaveClass(expectedTone);
  });

  it("keeps the restricted-access countdown synchronized and moving", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T06:02:00.000Z"));

    try {
      render(
        <UserDashboardPage
          buyer={buyer}
          data={{
            summary: {
              ...summary,
              blacklist: {
                active: true,
                until: "17 Juni 2026",
                reason: "Akun sedang dibatasi sesuai kebijakan pelanggaran pembayaran.",
                violations: 2
              }
            },
            transactions: [],
            bids: [],
            blacklistUntilAt: "2026-06-17T06:02:03.000Z",
            violations: []
          }}
          serverNow="2026-06-17T06:02:00.000Z"
        />
      );

      const restrictionPanel = screen
        .getByRole("heading", { name: /hak akses: terbatas sementara \(level 2\)/i })
        .closest("[data-restriction-panel='true']");

      expect(restrictionPanel).not.toBeNull();
      expect(within(restrictionPanel as HTMLElement).getByText("Hari")).toBeInTheDocument();
      expect(within(restrictionPanel as HTMLElement).getByText("Jam")).toBeInTheDocument();
      expect(within(restrictionPanel as HTMLElement).getByText("Menit")).toBeInTheDocument();
      expect(within(restrictionPanel as HTMLElement).getByText("Detik")).toBeInTheDocument();
      expect(within(restrictionPanel as HTMLElement).getByTestId("restriction-countdown-seconds")).toHaveTextContent(
        "03"
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(within(restrictionPanel as HTMLElement).getByTestId("restriction-countdown-seconds")).toHaveTextContent(
        "02"
      );
    } finally {
      vi.useRealTimers();
    }
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
    expect(screen.getByRole("link", { name: /^lihat detail$/i })).toHaveAttribute(
      "href",
      "/transaksi/trx-vickrey-1/pemenang"
    );
  });
});
