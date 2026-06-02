import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { AdminDashboardPage } from "@/components/pages/admin-dashboard-page";

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
    activeAuctions: 4,
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
      defaultRange: "week" as const,
      ranges: {
        day: {
          label: "Hari Ini",
          points: [
            { label: "00.00", value: 0, amount: 0 },
            { label: "04.00", value: 1, amount: 4_000_000 },
            { label: "08.00", value: 0, amount: 0 },
            { label: "12.00", value: 1, amount: 6_000_000 },
            { label: "16.00", value: 0, amount: 0 },
            { label: "20.00", value: 0, amount: 0 }
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
            { label: "23 Mei", value: 0, amount: 0 },
            { label: "24 Mei", value: 1, amount: 2_000_000 },
            { label: "25 Mei", value: 0, amount: 0 },
            { label: "26 Mei", value: 1, amount: 5_000_000 },
            { label: "27 Mei", value: 0, amount: 0 },
            { label: "28 Mei", value: 2, amount: 8_000_000 },
            { label: "29 Mei", value: 1, amount: 5_000_000 }
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
          label: "Bulan Ini",
          points: [
            { label: "1-7 Mei", value: 1, amount: 2_000_000 },
            { label: "8-14 Mei", value: 0, amount: 0 },
            { label: "15-21 Mei", value: 2, amount: 7_000_000 },
            { label: "22-28 Mei", value: 3, amount: 9_000_000 },
            { label: "29-31 Mei", value: 1, amount: 2_000_000 }
          ],
          summary: {
            totalRevenue: 20_000_000,
            verifiedTransactions: 7,
            averageRevenue: 4_000_000,
            peakRevenue: 9_000_000,
            peakLabel: "22-28 Mei"
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
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the executive KPI cards and trend section from the approved reference", () => {
    render(<AdminDashboardPage data={baseDashboardData} />);

    expect(screen.getByText(/selamat datang kembali/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /halo, admin unit/i })).toBeInTheDocument();
    expect(screen.getByText(/kami siap membantu anda memantau barang unit, pemasaran, pembayaran, dan prioritas operasional upc ranotana/i)).toBeInTheDocument();
    expect(screen.getAllByText(/unit aktif/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/rekening unit aktif/i)).toBeInTheDocument();
    expect(screen.getByAltText(/ilustrasi operasional dashboard admin unit/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /barang terjual/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /barang ditebus/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /transaksi perlu tindakan/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /laporan tren penjualan/i })).toBeInTheDocument();
    expect(screen.getByText("Rp 20 jt")).toBeInTheDocument();
    expect(screen.getByText(/rata-rata harian/i)).toBeInTheDocument();
    expect(screen.getByText(/^Puncak Penjualan$/i)).toBeInTheDocument();
    expect(screen.getByText(/5 transaksi lunas/i)).toBeInTheDocument();
    expect(screen.getByText(/total periode/i)).toBeInTheDocument();
    expect(screen.getByText(/^Transaksi Lunas$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hari ini/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /minggu ini/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bulan ini/i })).toBeInTheDocument();
  });

  it("renders the daily checklist and amber alert action", () => {
    render(<AdminDashboardPage data={baseDashboardData} />);

    expect(screen.getByRole("heading", { name: /checklist harian/i })).toBeInTheDocument();
    expect(screen.getByText(/pastikan barang baru sudah tercatat lengkap/i)).toBeInTheDocument();
    expect(screen.getByText(/dahulukan barang yang mendekati jatuh tempo/i)).toBeInTheDocument();
    expect(screen.getByText(/pantau pemenang yang belum menyelesaikan pembayaran/i)).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 5 selesai/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /perhatian diperlukan/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lihat pemasaran/i })).toHaveAttribute("href", "/admin/pemasaran");
  });

  it("allows toggling checklist items interactively", () => {
    render(<AdminDashboardPage data={baseDashboardData} />);

    const dueSoonTask = screen.getByRole("button", { name: /dahulukan barang yang mendekati jatuh tempo/i });
    expect(screen.getByText(/2 \/ 5 selesai/i)).toBeInTheDocument();

    fireEvent.click(dueSoonTask);
    expect(screen.getByText(/3 \/ 5 selesai/i)).toBeInTheDocument();
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

  it("switches the trend chart summary when timeframe buttons are pressed", () => {
    render(<AdminDashboardPage data={baseDashboardData} />);

    fireEvent.click(screen.getByRole("button", { name: /hari ini/i }));
    expect(screen.getByText(/rata-rata slot/i)).toBeInTheDocument();
    expect(screen.getByText(/2 transaksi lunas tercatat pada hari ini/i)).toBeInTheDocument();
    expect(screen.getByText("Rp 10 jt")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /bulan ini/i }));
    expect(screen.getByText(/rata-rata pekanan/i)).toBeInTheDocument();
    expect(screen.getByText(/7 transaksi lunas tercatat pada bulan ini/i)).toBeInTheDocument();
    expect(screen.getByText(/nilai penjualan tertinggi terjadi pada 22-28 Mei/i)).toBeInTheDocument();
  });

  it("shows the completed transaction count when a trend point is hovered", () => {
    render(<AdminDashboardPage data={baseDashboardData} />);

    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);

    const trendPoint = screen.getByRole("button", { name: /28 Mei: 2 transaksi lunas, Rp 8 jt/i });
    expect(trendPoint).toHaveStyle({ top: "77.06666666666666%" });

    fireEvent.mouseEnter(trendPoint);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveClass("-translate-x-1/2");
    expect(within(tooltip).getByText(/^28 Mei$/i)).toBeInTheDocument();
    expect(within(tooltip).getByText(/^2 transaksi lunas$/i)).toBeInTheDocument();
    expect(within(tooltip).getByText(/^Nilai penjualan Rp 8 jt$/i)).toBeInTheDocument();
  });

  it("falls back to live transaction data when precomputed metrics are unavailable", () => {
    render(
      <AdminDashboardPage
        data={{
          summary: baseDashboardData.summary,
          inventory: [
            { id: "B-1", status: "DITEBUS" },
            { id: "B-2", status: "JAMINAN" }
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
