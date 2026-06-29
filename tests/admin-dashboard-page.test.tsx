import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { AdminDashboardPage } from "@/components/pages/admin-dashboard-page";

const dashboardChecklistTitles = [
  "Pastikan barang baru sudah tercatat lengkap, termasuk foto utama dan hasil appraisal.",
  "Dahulukan barang yang mendekati jatuh tempo agar keputusan perpanjangan, tebus, atau pindah ke aset unit tidak tertunda.",
  "Tinjau barang yang siap tayang, lalu pilih skema penjualan yang paling tepat.",
  "Selesaikan antrian transaksi yang masih menunggu pengecekan agar nota bisa segera diterbitkan.",
  "Pantau pemenang yang belum menyelesaikan pembayaran dan catat pelanggaran tepat waktu bila diperlukan."
];

const baseDashboardData = {
  summary: {
    unitName: "UPC Ranotana",
    activeBank: "BRI 0123",
    subtitle: "Demo"
  },
  metrics: {
    totalItems: 18,
    readyForMarketing: 8,
    dueSoon: 3,
    soldItems: 2,
    redeemedItems: 1,
    activeAuctions: 3,
    activeParticipants: 5,
    totalTransactions: 9,
    verifiedTransactions: 2,
    actionableTransactions: 3,
    uploadedProofTransactions: 1,
    directConfirmationTransactions: 1,
    waitingPaymentTransactions: 1,
    rejectedProofTransactions: 0,
    activeBlacklist: 1,
    totalRevenue: 20_000_000,
    averageTransaction: 10_000_000,
    salesTrend: {
      defaultRange: "month" as const,
      ranges: {
        day: {
          label: "Hari Ini",
          points: [
            { label: "00.00", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 },
            { label: "04.00", value: 1, amount: 4_000_000, fixedPriceAmount: 0, vickreyAmount: 4_000_000 },
            { label: "08.00", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 },
            { label: "12.00", value: 1, amount: 6_000_000, fixedPriceAmount: 6_000_000, vickreyAmount: 0 },
            { label: "16.00", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 },
            { label: "20.00", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 }
          ],
          summary: {
            totalRevenue: 10_000_000,
            verifiedTransactions: 2,
            averageRevenue: 1_666_667,
            peakRevenue: 6_000_000,
            peakLabel: "12.00"
          }
        },
        week: {
          label: "Minggu Ini",
          points: [
            { label: "23 Mei", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 },
            { label: "24 Mei", value: 1, amount: 2_000_000, fixedPriceAmount: 2_000_000, vickreyAmount: 0 },
            { label: "25 Mei", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 },
            { label: "26 Mei", value: 1, amount: 5_000_000, fixedPriceAmount: 0, vickreyAmount: 5_000_000 },
            { label: "27 Mei", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 },
            { label: "28 Mei", value: 2, amount: 8_000_000, fixedPriceAmount: 3_000_000, vickreyAmount: 5_000_000 },
            { label: "29 Mei", value: 1, amount: 5_000_000, fixedPriceAmount: 0, vickreyAmount: 5_000_000 }
          ],
          summary: {
            totalRevenue: 20_000_000,
            verifiedTransactions: 5,
            averageRevenue: 2_857_143,
            peakRevenue: 8_000_000,
            peakLabel: "28 Mei"
          }
        },
        month: {
          label: "Bulan Berlangsung",
          points: [
            { label: "1 Mei", value: 1, amount: 2_000_000, fixedPriceAmount: 0, vickreyAmount: 2_000_000 },
            { label: "8 Mei", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 },
            { label: "15 Mei", value: 2, amount: 7_000_000, fixedPriceAmount: 4_000_000, vickreyAmount: 3_000_000 },
            { label: "22 Mei", value: 3, amount: 9_000_000, fixedPriceAmount: 6_000_000, vickreyAmount: 3_000_000 },
            { label: "29 Mei", value: 1, amount: 2_000_000, fixedPriceAmount: 0, vickreyAmount: 2_000_000 }
          ],
          summary: {
            totalRevenue: 20_000_000,
            verifiedTransactions: 7,
            averageRevenue: 4_000_000,
            peakRevenue: 9_000_000,
            peakLabel: "22 Mei"
          }
        }
      }
    }
  },
  inventory: [],
  transactions: [],
  blacklist: []
};

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it("renders the executive KPI cards and trend section from the approved reference", () => {
    render(<AdminDashboardPage data={baseDashboardData} />);

    expect(screen.getByText(/selamat datang kembali/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /halo, admin unit/i })).toBeInTheDocument();
    expect(screen.getByText(/kami siap membantu anda memantau barang unit, pemasaran, pembayaran, dan prioritas operasional unit dari satu ruang admin/i)).toBeInTheDocument();
    expect(screen.queryByText(/^unit aktif$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rekening unit aktif/i)).not.toBeInTheDocument();
    expect(screen.getByAltText(/ilustrasi operasional dashboard admin unit/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /barang terjual/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /barang ditebus/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /barang dipasarkan/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /laporan tren penjualan/i })).toBeInTheDocument();
    expect(screen.getByText("Rp 20 jt")).toBeInTheDocument();
    expect(screen.getByText(/rata-rata harian/i)).toBeInTheDocument();
    expect(screen.getByText(/^Puncak Penjualan$/i)).toBeInTheDocument();
    expect(screen.getByText(/total nilai penjualan pada periode ini/i)).toBeInTheDocument();
    expect(screen.getByText(/total periode/i)).toBeInTheDocument();
    expect(screen.getByText(/^Transaksi Lunas$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /filter laporan tren penjualan: bulan berlangsung/i,
      }),
    ).toBeInTheDocument();

    const marketedMetric = screen.getByRole("heading", { name: /barang dipasarkan/i }).closest("article");
    expect(marketedMetric).not.toBeNull();
    expect(within(marketedMetric as HTMLElement).getByText("3")).toBeInTheDocument();
    expect(marketedMetric).not.toHaveClass("interactive-card", "group");
  });

  it("keeps the marketed-item card title tidy without showing the urgent badge", () => {
    render(<AdminDashboardPage data={baseDashboardData} />);

    expect(screen.getByRole("heading", { name: /barang dipasarkan/i })).toBeInTheDocument();
    expect(screen.queryByText(/^Urgent$/i)).not.toBeInTheDocument();
  });

  it("uses verified transactions instead of raw sold inventory status for fallback sales count", () => {
    const fallbackData = {
      ...baseDashboardData,
      metrics: undefined,
      inventory: [
        { id: "barang-1", status: "TERJUAL", dueDate: "2026-07-01" },
        { id: "barang-2", status: "TERJUAL", dueDate: "2026-07-01" },
        { id: "barang-3", status: "DIPASARKAN", marketingMode: "Harga Tetap", dueDate: "2026-07-01" },
      ],
      transactions: [
        { id: "trx-1", status: "LUNAS", total: 7_500_000, buyer: "Buyer A" },
        { id: "trx-2", status: "MENUNGGU_PEMBAYARAN", total: 6_500_000, buyer: "Buyer B" },
      ],
    } as any;

    render(<AdminDashboardPage data={fallbackData} />);

    const soldMetric = screen.getByRole("heading", { name: /barang terjual/i }).closest("article");

    expect(soldMetric).not.toBeNull();
    expect(within(soldMetric as HTMLElement).getByText("1")).toBeInTheDocument();
    expect(within(soldMetric as HTMLElement).queryByText("2")).not.toBeInTheDocument();
  });

  it("renders the daily checklist without a separate attention card", () => {
    render(<AdminDashboardPage data={baseDashboardData} />);

    expect(screen.getByRole("heading", { name: /checklist harian/i })).toBeInTheDocument();
    expect(screen.getByText(/pastikan barang baru sudah tercatat lengkap/i)).toBeInTheDocument();
    expect(screen.getByText(/dahulukan barang yang mendekati jatuh tempo/i)).toBeInTheDocument();
    expect(screen.getByText(/pantau pemenang yang belum menyelesaikan pembayaran/i)).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 5 selesai/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /perhatian diperlukan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /lihat pemasaran/i })).not.toBeInTheDocument();
  });

  it("allows toggling checklist items interactively", () => {
    render(<AdminDashboardPage data={baseDashboardData} />);

    const dueSoonTask = screen.getByRole("button", { name: /dahulukan barang yang mendekati jatuh tempo/i });
    expect(screen.getByText(/2 \/ 5 selesai/i)).toBeInTheDocument();

    fireEvent.click(dueSoonTask);
    expect(screen.getByText(/3 \/ 5 selesai/i)).toBeInTheDocument();
  });

  it("automatically resets the daily checklist when the 24 hour cycle expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T15:59:59.000Z"));
    window.localStorage.setItem(
      "pegadaian:admin-dashboard-checklist:v1",
      JSON.stringify({
        dateKey: "2026-06-03",
        taskTitles: dashboardChecklistTitles,
        checked: [true, true, true, false, false]
      })
    );

    render(<AdminDashboardPage data={baseDashboardData} />);

    expect(screen.getByText(/3 \/ 5 selesai/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/2 \/ 5 selesai/i)).toBeInTheDocument();
  });

  it("updates the checklist clock in real time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T04:13:00.000Z"));

    render(<AdminDashboardPage data={baseDashboardData} />);

    expect(screen.getByText("12:13 PM")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("12:14 PM")).toBeInTheDocument();
  });

  it("switches the trend chart summary when range options are chosen from the dropdown", () => {
    render(<AdminDashboardPage data={baseDashboardData} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /filter laporan tren penjualan: bulan berlangsung/i,
      }),
    );
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: /filter laporan tren penjualan/i }),
      ).getByRole("button", { name: /hari ini/i }),
    );
    expect(screen.getByText(/rata-rata slot/i)).toBeInTheDocument();
    expect(screen.getByText(/Rp 5 jt rata-rata per transaksi tervalidasi/i)).toBeInTheDocument();
    expect(screen.getByText("Rp 10 jt")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /filter laporan tren penjualan: hari ini/i,
      }),
    );
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: /filter laporan tren penjualan/i }),
      ).getByRole("button", { name: /bulan berlangsung/i }),
    );
    expect(screen.getByText(/rata-rata harian/i)).toBeInTheDocument();
    expect(screen.getByText(/Rp 2,86 jt rata-rata per transaksi tervalidasi/i)).toBeInTheDocument();
    expect(screen.getByText(/nilai penjualan tertinggi terjadi pada 22 Mei/i)).toBeInTheDocument();
  });

  it("shows the completed transaction count when a trend point is hovered", () => {
    const { container } = render(<AdminDashboardPage data={baseDashboardData} />);

    const chartTexts = Array.from(container.querySelectorAll("svg text")).map(
      (node) => node.textContent,
    );
    expect(chartTexts).toEqual(
      expect.arrayContaining(["Nilai (Rp Juta)", "25", "20", "15", "10", "5"]),
    );
    expect(chartTexts).not.toContain("30");

    const trendPoint = screen.getByRole("button", {
      name: /22 Mei: Lelang Tertutup Rp 3\.000\.000, Harga Tetap Rp 6\.000\.000, Volume 3 transaksi/i,
    });
    const emptyTrendPoint = screen.getByRole("button", {
      name: /8 Mei: Lelang Tertutup Rp 0, Harga Tetap Rp 0, Volume 0 transaksi/i,
    });

    fireEvent.mouseEnter(emptyTrendPoint);

    expect(screen.getByRole("tooltip")).toHaveTextContent("8 Mei");
    expect(screen.getByRole("tooltip")).toHaveTextContent("0 transaksi");

    fireEvent.mouseEnter(trendPoint);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveClass("-translate-x-1/2");
    expect(within(tooltip).getByText(/^22 Mei$/i)).toBeInTheDocument();
    expect(within(tooltip).getByText(/^Rp 9\.000\.000$/i)).toBeInTheDocument();
    expect(within(tooltip).getByText(/^Lelang Tertutup$/i)).toBeInTheDocument();
    expect(within(tooltip).getByText(/^Rp 3\.000\.000$/i)).toBeInTheDocument();
    expect(within(tooltip).getByText(/^Harga Tetap$/i)).toBeInTheDocument();
    expect(within(tooltip).getByText(/^Rp 6\.000\.000$/i)).toBeInTheDocument();
    expect(within(tooltip).getByText(/^Volume$/i)).toBeInTheDocument();
    expect(within(tooltip).getByText(/^3 transaksi$/i)).toBeInTheDocument();
  });

  it("falls back to live transaction data when precomputed metrics are unavailable", () => {
    render(
      <AdminDashboardPage
        data={{
          summary: baseDashboardData.summary,
          inventory: [
            { id: "B-1", status: "DITEBUS" },
            { id: "B-2", dueDate: "2020-01-01", status: "JAMINAN" }
          ],
          transactions: [
            { id: "T-1", status: "LUNAS", total: 7_500_000, buyer: "Raras" },
            { id: "T-2", status: "BUKTI_DIUNGGAH", total: 2_000_000, buyer: "Dimas" }
          ],
          blacklist: [{ id: "BL-1", status: "AKTIF" }]
        }}
      />
    );

    expect(screen.getByText(/Rp 7,5/i)).toBeInTheDocument();
    expect(screen.getByText(/^1 lunas$/i)).toBeInTheDocument();
    expect(screen.getByText(/1 barang siap dipasarkan di unit/i)).toBeInTheDocument();
  });
});
