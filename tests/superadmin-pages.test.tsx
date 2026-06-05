import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SuperAdminBlacklistPage,
  SuperAdminDashboardPage,
  SuperAdminManagementPage,
  SuperAdminPolicyPage,
  SuperAdminMonitoringPage,
} from "@/components/pages/superadmin-pages";

const dashboardMonthFixture = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function makeDashboardTrendPoint(
  label: string,
  values: {
    amount?: number;
    fixedPriceAmount?: number;
    vickreyAmount?: number;
    volume?: number;
  } = {},
) {
  const amount = values.amount ?? 0;
  const vickreyAmount = values.vickreyAmount ?? amount;
  const fixedPriceAmount = values.fixedPriceAmount ?? 0;
  const volume = values.volume ?? (amount > 0 ? 1 : 0);

  return {
    label,
    amount,
    count: volume,
    fixedPriceAmount,
    vickreyAmount,
    volume,
  };
}

function makeDashboardTrendRange(label: string, points: ReturnType<typeof makeDashboardTrendPoint>[]) {
  const totalAmount = points.reduce((sum, point) => sum + point.amount, 0);
  const transactionCount = points.reduce((sum, point) => sum + point.volume, 0);
  const vickreyAmount = points.reduce(
    (sum, point) => sum + point.vickreyAmount,
    0,
  );
  const fixedPriceAmount = points.reduce(
    (sum, point) => sum + point.fixedPriceAmount,
    0,
  );
  const dominantMode =
    vickreyAmount >= fixedPriceAmount ? "Vickrey Auction" : "Fixed Price";
  const dominantAmount = Math.max(vickreyAmount, fixedPriceAmount);
  const modeTotal = vickreyAmount + fixedPriceAmount;

  return {
    label,
    points,
    summary: {
      averageAmount: transactionCount > 0 ? totalAmount / transactionCount : 0,
      dominantMode,
      dominantPercent:
        modeTotal > 0 ? Math.round((dominantAmount / modeTotal) * 100) : 0,
      fixedPriceAmount,
      totalAmount,
      transactionCount,
      vickreyAmount,
    },
  };
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("superadmin pages", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T10:00:00+08:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders monitoring metrics from backend payload", () => {
    const { container } = render(
      <SuperAdminDashboardPage
        summary={{
          headline: "Pantau seluruh unit dari satu control center.",
          metrics: [
            { label: "Total Unit", value: "2", detail: "2 aktif" },
            {
              label: "Unit Aktif",
              value: "2",
              detail: "2 unit aktif nasional",
            },
          ],
          spotlight: [],
          priorities: [],
        }}
        unitsNeedAttention={[]}
        pendingMonitoring={[]}
      />,
    );

    expect(screen.getByText("Dashboard Nasional")).toBeInTheDocument();
    expect(screen.getByText("Unit Aktif Nasional")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("renders governance compact dashboard sections", () => {
    render(
      <SuperAdminDashboardPage
        governance={{
          lifecycle: [
            { label: "Barang Jaminan", value: 8 },
            { label: "Sedang Dipasarkan", value: 5 },
            { label: "Terjual", value: 3 },
            { label: "Perlu Tindak Lanjut", value: 2 },
          ],
          snapshot: [
            {
              label: "Barang Jaminan",
              value: "8",
              detail: "Siap dikelola unit",
            },
            {
              label: "Sedang Dipasarkan",
              value: "5",
              detail: "Lot aktif nasional",
            },
            { label: "Terjual", value: "3", detail: "Transaksi sah" },
            {
              label: "Perlu Tindak Lanjut",
              value: "2",
              detail: "Bukan pelanggaran aktif otomatis",
            },
            {
              label: "Nilai Transaksi Tervalidasi",
              value: "Rp 72,5 jt",
              detail: "Lunas atau selesai",
            },
          ],
          validatedTrend: [
            {
              label: "Minggu 1",
              amount: 12000000,
              vickreyAmount: 9000000,
              fixedPriceAmount: 3000000,
              count: 2,
              volume: 2,
            },
            {
              label: "Minggu 2",
              amount: 60500000,
              vickreyAmount: 45000000,
              fixedPriceAmount: 15500000,
              count: 4,
              volume: 4,
            },
          ],
          complianceLevels: [
            {
              label: "Level 1 (Ringan)",
              description: "Buyer dengan 1 catatan pelanggaran aktif",
              count: 1,
              tone: "amber",
            },
            {
              label: "Level 2 (Sedang)",
              description: "Buyer dengan 2 catatan pelanggaran aktif",
              count: 0,
              tone: "orange",
            },
            {
              label: "Level 3 (Tinggi)",
              description: "Buyer dengan 3+ catatan pelanggaran aktif",
              count: 0,
              tone: "red",
            },
          ],
          validatedTransactionValueLabel: "Rp 72,5 jt",
        }}
        summary={{
          headline: "Pusat keputusan nasional yang ringkas dan siap ditindak.",
          metrics: [
            { label: "Total Unit", value: "4", detail: "4 aktif" },
            {
              label: "Unit Aktif",
              value: "4",
              detail: "4 unit aktif nasional",
            },
          ],
          spotlight: [{ label: "Pembatasan aktif", value: "1 buyer" }],
          priorities: [],
        }}
        unitRows={[
          {
            id: "unit-1",
            unitName: "Pegadaian CP Manado",
            unitCode: "CP-MND-01",
            collateralItems: 8,
            marketedItems: 5,
            soldItems: 3,
            validatedTransactionValue: 78400000,
            followUpItems: 0,
            heldTransactions: 0,
            activeViolations: 0,
            status: "Aktif",
          },
        ]}
        unitsNeedAttention={[]}
        pendingMonitoring={[]}
      />,
    );

    expect(screen.getByText("Dashboard Nasional")).toBeInTheDocument();
    expect(screen.getByText("Superadmin Nasional")).toBeInTheDocument();
    expect(screen.getByText("Snapshot Nasional")).toBeInTheDocument();
    expect(screen.getByText("Unit Aktif Nasional")).toBeInTheDocument();
    expect(screen.getByText("Pelanggaran Aktif")).toBeInTheDocument();
    expect(screen.getByText("Barang Terjual")).toBeInTheDocument();
    expect(screen.getByText("Total Tervalidasi")).toBeInTheDocument();
    expect(screen.getByText("Performa Tahun Ini")).toBeInTheDocument();
    expect(
      screen.getByText("Tren Nilai Transaksi Tervalidasi"),
    ).toBeInTheDocument();
    expect(screen.getByText("Status Kepatuhan Ekosistem")).toBeInTheDocument();
    expect(screen.getByText("Leaderboard Kinerja Unit")).toBeInTheDocument();
    expect(
      screen.getByText("Top 3 Cabang", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bottom 3 Cabang", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Rp 78,4 Jt")).toHaveLength(2);
    expect(screen.getAllByText("Pegadaian CP Manado")).toHaveLength(2);
    expect(
      screen.queryByText("Lifecycle Barang Nasional"),
    ).not.toBeInTheDocument();
  });

  it("keeps national dashboard focused away from operational follow-up queues", () => {
    render(
      <SuperAdminDashboardPage
        summary={{
          headline: "Pantau seluruh unit dari satu control center.",
          metrics: [{ label: "Total Unit", value: "2", detail: "2 aktif" }],
          spotlight: [],
          priorities: [
            {
              id: "priority-review",
              title: "Review buyer menunggu keputusan",
              detail: "1 case review perlu diputus superadmin.",
              href: "/superadmin/review-pelanggaran",
              action: "Tinjau pelanggaran",
            },
            {
              id: "priority-follow-up",
              title: "Pemasaran perlu tindak lanjut",
              detail:
                "Ada fixed price ditolak, lelang tanpa bid, atau pemasaran gagal.",
              href: "/superadmin/monitoring-unit",
              action: "Buka monitoring",
            },
            {
              id: "priority-sla",
              title: "SLA transaksi terlewati",
              detail: "3 transaksi tertahan sudah melewati tenggat.",
              href: "/superadmin/monitoring-unit",
              action: "Cek SLA",
            },
            {
              id: "priority-unit-admin",
              title: "Unit perlu kelengkapan operasional",
              detail: "3 unit perlu admin aktif atau rekening utama aktif.",
              href: "/superadmin/manajemen-unit",
              action: "Kelola unit",
            },
          ],
        }}
        unitsNeedAttention={
          [
            {
              id: "attention-unit-1",
              unitId: "unit-1",
              unit: "Pegadaian CP Manado",
              scope: "Unit",
              status: "Perlu Tindak Lanjut",
              activity: "Unit belum memiliki rekening aktif utama.",
              detail: "Admin aktif: 0 | Rekening aktif: 0",
            },
          ] as any
        }
        pendingMonitoring={
          [
            {
              id: "monitor-1",
              unitId: "unit-1",
              unit: "Pegadaian CP Manado",
              scope: "Transaksi",
              status: "Perlu Tindak Lanjut",
              activity: "1 transaksi menunggu verifikasi pembayaran.",
              detail: "SLA akan berakhir segera.",
              countdownLabel: "1 menit 5 detik",
              countdownAt: new Date("2026-04-29T10:01:05+08:00").toISOString(),
              expiredLabel: "SLA terlewati",
            },
          ] as any
        }
      />,
    );

    expect(
      screen.queryByText("Review buyer menunggu keputusan"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Pemasaran perlu tindak lanjut"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("SLA transaksi terlewati"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Unit perlu kelengkapan operasional"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Unit Perlu Tindak Lanjut"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Antrean Monitoring Nasional"),
    ).not.toBeInTheDocument();
  });

  it("does not render the removed dashboard priority area even when priorities are provided", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <SuperAdminDashboardPage
        summary={{
          headline: "Pantau seluruh unit dari satu control center.",
          metrics: [{ label: "Total Unit", value: "2", detail: "2 aktif" }],
          spotlight: [],
          priorities: [
            {
              id: "priority-1",
              title: "UPC Ranotana - Transaksi",
              detail: "2 transaksi menunggu tindak lanjut.",
              href: "/superadmin/unit/unit-1",
              action: "Buka unit",
            },
            {
              id: "priority-2",
              title: "UPC Ranotana - Transaksi",
              detail: "1 transaksi lain mendekati SLA.",
              href: "/superadmin/unit/unit-2",
              action: "Buka unit",
            },
          ],
        }}
        unitsNeedAttention={[]}
        pendingMonitoring={[]}
      />,
    );

    expect(screen.queryByText("Prioritas Superadmin")).not.toBeInTheDocument();
    expect(screen.queryByText(/UPC Ranotana/)).not.toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Encountered two children with the same key"),
    );

    consoleErrorSpy.mockRestore();
  });

  it("uses current-month trend data and keeps chart legends interactive", () => {
    const yearlyTrend = dashboardMonthFixture.map((label, index) =>
      makeDashboardTrendPoint(label, {
        amount: index === 3 ? 48000000 : index === 4 ? 82000000 : 0,
        fixedPriceAmount:
          index === 3 ? 12000000 : index === 4 ? 30000000 : 0,
        vickreyAmount: index === 3 ? 36000000 : index === 4 ? 52000000 : 0,
        volume: index === 3 ? 6 : index === 4 ? 4 : 0,
      }),
    );
    const monthlyTrend = ["Pekan 1", "Pekan 2", "Pekan 3", "Pekan 4", "Pekan 5"].map(
      (label, index) =>
        makeDashboardTrendPoint(label, {
          amount: index === 3 ? 48000000 : 0,
          fixedPriceAmount: index === 3 ? 12000000 : 0,
          vickreyAmount: index === 3 ? 36000000 : 0,
          volume: index === 3 ? 6 : 0,
        }),
    );
    const weeklyTrend = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map(
      (label) => makeDashboardTrendPoint(label),
    );

    const { container } = render(
      <SuperAdminDashboardPage
        governance={{
          lifecycle: [],
          snapshot: [
            {
              label: "Nilai Transaksi Tervalidasi",
              value: "Rp 130 jt",
              detail: "Lunas atau selesai",
            },
          ],
          validatedTrend: yearlyTrend,
          validatedTrendRanges: {
            month: makeDashboardTrendRange("Bulan Ini", monthlyTrend),
            week: makeDashboardTrendRange("Minggu Ini", weeklyTrend),
            year: makeDashboardTrendRange("Tahun Ini", yearlyTrend),
          },
          complianceLevels: [],
          validatedTransactionValueLabel: "Rp 130 jt",
        }}
        summary={{
          headline: "Pusat keputusan nasional yang ringkas dan siap ditindak.",
          metrics: [{ label: "Unit Aktif", value: "4", detail: "4 aktif" }],
          spotlight: [{ label: "Pembatasan aktif", value: "2 buyer" }],
          priorities: [],
        }}
        unitRows={[]}
        unitsNeedAttention={[]}
        pendingMonitoring={[]}
        serverNow="2026-04-29T10:00:00+08:00"
      />,
    );

    expect(screen.getByRole("button", { name: /minggu ini/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bulan ini/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tahun ini/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Rp 130.000.000")).toBeInTheDocument();
    expect(container.querySelector("path[fill='#005626']")).toBeInTheDocument();
    const chartTexts = Array.from(container.querySelectorAll("svg text")).map(
      (node) => node.textContent,
    );
    expect(chartTexts).toEqual(
      expect.arrayContaining([
        "Nilai (Rp Juta)",
        "25",
        "50",
        "75",
        "100",
      ]),
    );
    expect(chartTexts).not.toEqual(expect.arrayContaining(["Volume (Unit)"]));
    expect(chartTexts).not.toEqual(expect.arrayContaining(["55"]));

    const vickreyToggle = screen.getByRole("button", {
      name: /Vickrey Auction/i,
    });
    expect(vickreyToggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(vickreyToggle);

    expect(vickreyToggle).toHaveAttribute("aria-pressed", "false");

    const aprilHotspot = screen.getByRole("button", {
      name: /Apr: Vickrey Rp 36.000.000/i,
    });
    fireEvent.mouseEnter(aprilHotspot);

    expect(screen.getByRole("tooltip")).toHaveTextContent("Rp 48.000.000");
    expect(screen.getByRole("tooltip")).toHaveTextContent("Volume");
    expect(screen.getByRole("tooltip")).toHaveTextContent("6 transaksi");

    fireEvent.click(screen.getByRole("button", { name: /bulan ini/i }));

    expect(screen.getByRole("button", { name: /bulan ini/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Performa Bulan Ini")).toBeInTheDocument();
    expect(screen.getByText("Rp 48.000.000")).toBeInTheDocument();
  });

  it("updates superadmin countdown on monitoring page", () => {
    render(
      <SuperAdminMonitoringPage
        data={
          {
            summary: {
              headline: "Pantau seluruh unit dari satu control center.",
              metrics: [{ label: "Total Unit", value: "2", detail: "2 aktif" }],
              spotlight: [],
              priorities: [],
            },
            unitsNeedAttention: [],
            pendingMonitoring: [
              {
                id: "monitor-2",
                unitId: "unit-1",
                unit: "Pegadaian CP Manado",
                scope: "Lelang",
                status: "Perlu Review",
                activity: "1 sesi Vickrey akan ditutup.",
                detail: "Pantau hasil lelang lintas unit.",
                countdownLabel: "45 detik",
                countdownAt: new Date(
                  "2026-04-29T10:00:45+08:00",
                ).toISOString(),
                expiredLabel: "Sesi berakhir",
              },
            ],
          } as any
        }
      />,
    );

    expect(
      screen.getByText((content) => content.includes("Sisa waktu 45 detik")),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      screen.getByText((content) => content.includes("Sisa waktu 44 detik")),
    ).toBeInTheDocument();
  });

  it("renders monitoring unit as comparative table without risk heat indicator", () => {
    render(
      <SuperAdminMonitoringPage
        data={
          {
            summary: {
              headline: "Pantau seluruh unit dari satu control center.",
              metrics: [{ label: "Total Unit", value: "2", detail: "2 aktif" }],
              spotlight: [],
              priorities: [],
            },
            unitRows: [
              {
                id: "unit-1",
                unitName: "Pegadaian CP Manado",
                unitCode: "CP-MND-01",
                collateralItems: 8,
                marketedItems: 5,
                soldItems: 3,
                validatedTransactionValue: 78400000,
                followUpItems: 2,
                heldTransactions: 1,
                activeViolations: 1,
                status: "Aktif",
              },
            ],
            unitsNeedAttention: [],
            pendingMonitoring: [],
          } as any
        }
      />,
    );

    expect(screen.getByText("Monitoring Unit")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Unit" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Perlu Tindak Lanjut" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/risk heat indicator/i)).not.toBeInTheDocument();
  });

  it("updates blacklist countdown on superadmin blacklist page", () => {
    render(
      <SuperAdminBlacklistPage
        entries={
          [
            {
              id: "blk-1",
              userId: "buyer-1",
              name: "Raras",
              email: "raras@example.com",
              unit: "Pegadaian CP Manado",
              total: 2,
              until: "29 Apr 2026",
              reason: "Pemenang lelang tidak menyelesaikan pembayaran.",
              status: "Aktif",
              countdownLabel: "1 menit 5 detik",
              countdownAt: new Date("2026-04-29T10:01:05+08:00").toISOString(),
              expiredLabel: "Masa blokir selesai",
            },
          ] as any
        }
      />,
    );

    expect(
      screen.getAllByText((content) =>
        content.includes("Sisa waktu 1 menit 5 detik"),
      ),
    ).toHaveLength(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      screen.getAllByText((content) =>
        content.includes("Sisa waktu 1 menit 4 detik"),
      ),
    ).toHaveLength(2);
  });

  it("renders blacklist review queue with final decision reasons", () => {
    render(
      <SuperAdminBlacklistPage
        entries={[]}
        reviewCases={[
          {
            id: "case-1",
            buyerName: "Raras Mahesa",
            buyerEmail: "raras@example.com",
            itemName: "Kalung Emas",
            unitName: "Pegadaian CP Manado",
            status: "TERKIRIM",
            submittedAt: "2026-05-30T00:00:00.000Z",
            buyerStatement: "Saya sudah membayar sebelum batas waktu.",
            adminRecommendation: "PERTIMBANGKAN_CABUT",
            adminRecommendationNote:
              "Unit menerima konfirmasi pembayaran manual.",
            level: 3,
            lockedAccount: true,
            hasAdminRecommendation: true,
            priorityScore: 105,
            attachments: [
              {
                id: "att-1",
                fileUrl: "/uploads/blacklist-review/bukti.pdf",
                fileName: "bukti.pdf",
                mimeType: "application/pdf",
              },
            ],
          },
        ]}
      />,
    );

    expect(
      screen.getByText("Antrean keputusan superadmin"),
    ).toBeInTheDocument();
    expect(screen.getByText("Raras Mahesa")).toBeInTheDocument();
    expect(screen.getByText("bukti.pdf")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /putuskan case/i }));

    expect(
      screen.getByRole("option", { name: "Setujui pencabutan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Bukti pembayaran valid" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/catatan tambahan opsional/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: /putuskan review buyer/i }),
    ).toBeInTheDocument();
  });

  it("keeps management forms inside pop up panels until requested", () => {
    render(
      <SuperAdminManagementPage
        admins={[
          {
            id: "admin-1",
            name: "Admin Manado",
            unitId: "unit-1",
            unit: "Pegadaian CP Manado",
            email: "admin.manado@example.com",
            phone: "-",
            status: "Aktif",
            lastLogin: "-",
          },
        ]}
        units={[
          {
            id: "unit-1",
            code: "CP-MND-01",
            name: "Pegadaian CP Manado",
            address: "Jl. Sam Ratulangi",
            status: "Aktif",
            adminCount: 1,
            accountCount: 1,
            activeAccount: {
              id: "rek-1",
              bankName: "BRI",
              accountNumber: "1234567890",
              accountHolder: "PT Pegadaian Area Manado",
              branch: "Manado",
              status: "AKTIF",
            },
          },
        ]}
      />,
    );

    expect(screen.queryByText("Tambah unit baru")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /tambah unit/i }));

    expect(
      screen.getByRole("dialog", { name: /tambah unit baru/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tambah unit baru")).toBeInTheDocument();
  });

  it("renders read-only violation policy page", () => {
    render(<SuperAdminPolicyPage />);

    expect(screen.getByText("Kebijakan Pelanggaran")).toBeInTheDocument();
    expect(
      screen.getByText(
        /pemenang lelang tidak menyelesaikan pembayaran dalam 24 jam/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/fixed price yang bukti pembayarannya ditolak/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/bukan pelanggaran buyer/i).length,
    ).toBeGreaterThan(0);
  });
});
