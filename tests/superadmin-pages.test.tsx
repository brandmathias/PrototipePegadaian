import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SuperAdminBlacklistPage,
  SuperAdminCreateUnitPage,
  SuperAdminDashboardPage,
  SuperAdminManagementAdminDetailPage,
  SuperAdminManagementUnitDetailPage,
  SuperAdminManagementPage,
  SuperAdminPolicyPage,
  SuperAdminMonitoringPage,
  SuperAdminUnitDetailPage,
  SuperAdminUnitBarangDetailPage,
} from "@/components/pages/superadmin-pages";
import { SuperadminBlacklistDetailWorkspace } from "@/components/superadmin/superadmin-blacklist-detail-workspace";
import { UnitForm } from "@/components/superadmin/unit-form";

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

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

function makeDashboardTrendRange(
  label: string,
  points: ReturnType<typeof makeDashboardTrendPoint>[],
) {
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
    vickreyAmount >= fixedPriceAmount ? "Lelang Tertutup" : "Harga Tetap";
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

function makeDashboardDayLabel(date: Date) {
  return `${date.getDate()} ${dashboardMonthFixture[date.getMonth()]}`;
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: navigationMocks.push,
    refresh: navigationMocks.refresh,
  }),
}));

describe("superadmin pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T10:00:00+08:00"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
    expect(screen.queryByText(/akses superadmin/i)).not.toBeInTheDocument();
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
    expect(screen.getByText("Performa Bulan Berlangsung")).toBeInTheDocument();
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
              id: "priority-blacklist",
              title: "Evaluasi pembatasan buyer",
              detail: "1 akun blacklist perlu dievaluasi superadmin.",
              href: "/superadmin/blacklist",
              action: "Buka blacklist",
            },
            {
              id: "priority-follow-up",
              title: "Pemasaran perlu tindak lanjut",
              detail:
                "Ada harga tetap ditolak, lelang tanpa bid, atau pemasaran gagal.",
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
      screen.queryByText("Evaluasi pembatasan buyer"),
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
        fixedPriceAmount: index === 3 ? 12000000 : index === 4 ? 30000000 : 0,
        vickreyAmount: index === 3 ? 36000000 : index === 4 ? 52000000 : 0,
        volume: index === 3 ? 6 : index === 4 ? 4 : 0,
      }),
    );
    const monthlyTrend = ["1 Apr", "8 Apr", "15 Apr", "22 Apr", "29 Apr"].map(
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
    const last30Trend = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(2026, 2, 31 + index);
      const label = makeDashboardDayLabel(date);

      return makeDashboardTrendPoint(label, {
        amount: index === 29 ? 48000000 : 0,
        fixedPriceAmount: index === 29 ? 12000000 : 0,
        vickreyAmount: index === 29 ? 36000000 : 0,
        volume: index === 29 ? 6 : 0,
      });
    });

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
            month: makeDashboardTrendRange("Bulan Berlangsung", monthlyTrend),
            week: makeDashboardTrendRange("Minggu Ini", weeklyTrend),
            year: makeDashboardTrendRange("Tahun Ini", yearlyTrend),
            last30: makeDashboardTrendRange("30 Hari Terakhir", last30Trend),
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

    expect(
      screen.getByRole("button", {
        name: /filter tren transaksi tervalidasi: bulan berlangsung/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Rp 48.000.000")).toBeInTheDocument();
    expect(container.querySelector("path[fill='#005626']")).toBeInTheDocument();
    const chartTexts = Array.from(container.querySelectorAll("svg text")).map(
      (node) => node.textContent,
    );
    expect(chartTexts).toEqual(
      expect.arrayContaining(["Nilai (Rp Juta)", "5", "10", "15", "20", "25"]),
    );
    expect(chartTexts).not.toEqual(expect.arrayContaining(["30"]));
    expect(chartTexts).not.toEqual(expect.arrayContaining(["Volume (Unit)"]));
    expect(chartTexts).not.toEqual(expect.arrayContaining(["55"]));

    const vickreyToggle = screen
      .getAllByRole("button", { name: /Lelang Tertutup/i })
      .find((button) => button.getAttribute("aria-pressed") === "true");
    expect(vickreyToggle).toBeDefined();
    expect(vickreyToggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(vickreyToggle!);

    expect(vickreyToggle).toHaveAttribute("aria-pressed", "false");

    const aprilHotspot = screen.getByRole("button", {
      name: /22 Apr: Lelang Tertutup Rp 36.000.000/i,
    });
    fireEvent.mouseEnter(aprilHotspot);

    expect(screen.getByRole("tooltip")).toHaveTextContent("Rp 48.000.000");
    expect(screen.getByRole("tooltip")).toHaveTextContent("6 transaksi");
    expect(screen.getByRole("tooltip")).not.toHaveTextContent("Volume");

    fireEvent.click(
      screen.getByRole("button", {
        name: /filter tren transaksi tervalidasi: bulan berlangsung/i,
      }),
    );
    fireEvent.click(
      within(
        screen.getByRole("dialog", {
          name: /filter tren transaksi tervalidasi/i,
        }),
      ).getByRole("button", { name: /30 hari terakhir/i }),
    );

    expect(
      screen.getByRole("button", {
        name: /filter tren transaksi tervalidasi: 30 hari terakhir/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Performa 30 Hari Terakhir")).toBeInTheDocument();
    expect(screen.getByText("Rp 48.000.000")).toBeInTheDocument();

    const last30AxisTexts = Array.from(
      container.querySelectorAll("svg text"),
    ).map((node) => node.textContent);
    expect(last30AxisTexts).toEqual(
      expect.arrayContaining(["31 Mar", "29 Apr"]),
    );
    expect(last30AxisTexts).not.toEqual(expect.arrayContaining(["1 Apr"]));

    fireEvent.mouseEnter(
      screen.getByRole("button", {
        name: /^1 Apr: Lelang Tertutup Rp 0, Harga Tetap Rp 0, Volume 0 transaksi$/i,
      }),
    );
    expect(screen.getByRole("tooltip")).toHaveTextContent("1 Apr");
  });

  it("renders monitoring unit as comparative table without risk heat indicator", () => {
    const makeRect = (left: number, width: number) =>
      ({
        bottom: 1,
        height: 1,
        left,
        right: left + width,
        top: 0,
        width,
        x: left,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    const originalGetBoundingClientRect =
      Element.prototype.getBoundingClientRect;
    const rectSpy = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: Element) {
        const element = this as HTMLElement;

        if (element.style.minWidth === "920px") {
          return makeRect(96, 920);
        }

        if (
          element.getAttribute("aria-label") ===
          "Barang Jaminan Pegadaian CP Manado: 8 item"
        ) {
          return makeRect(442, 16);
        }

        return originalGetBoundingClientRect.call(this);
      });

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
              {
                id: "unit-2",
                unitName: "Pegadaian UPC Ranotana",
                unitCode: "UPC-RNT-02",
                collateralItems: 4,
                marketedItems: 2,
                soldItems: 1,
                validatedTransactionValue: 24000000,
                followUpItems: 1,
                heldTransactions: 2,
                activeViolations: 0,
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
    expect(screen.getAllByText("Barang Jaminan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sedang Dipasarkan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Terjual").length).toBeGreaterThan(0);
    expect(screen.getAllByText("12").length).toBeGreaterThan(0);
    expect(screen.queryByText("Perlu Penugasan Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("SLA Terlewati")).not.toBeInTheDocument();
    expect(screen.queryByText("Buka Unit Terkait")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Monitoring sedang tenang"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Grafik barang pada tiap unit" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /filter grafik barang tiap unit: bulan berlangsung/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Filter status unit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Cari unit atau kode cabang" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Unit / Cabang" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Perlu Tindak Lanjut" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Status Unit" }),
    ).not.toBeInTheDocument();
    const metricCard = screen.getByLabelText("Ringkasan Barang Jaminan");
    expect(metricCard).not.toHaveClass("group", "hover:-translate-y-0.5");
    fireEvent.focus(metricCard);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Unit tercatat");
    fireEvent.blur(metricCard);
    expect(
      screen.queryByLabelText("Ringkasan Perlu Tindak Lanjut"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/2 unit tercatat/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/2 unit aktif/i)).not.toBeInTheDocument();

    const chartBar = screen.getByRole("button", {
      name: "Barang Jaminan Pegadaian CP Manado: 8 item",
    });
    fireEvent.mouseEnter(chartBar);
    expect(screen.getByRole("tooltip")).toHaveTextContent("CP-MND-01");
    expect(screen.getByRole("tooltip")).toHaveStyle("left: 354px");
    expect(screen.getByRole("tooltip")).toHaveTextContent("8 item");
    expect(screen.getByRole("tooltip")).toHaveTextContent("Barang Jaminan");
    expect(screen.getByRole("tooltip")).toHaveTextContent("Sedang Dipasarkan");
    expect(screen.getByRole("tooltip")).toHaveTextContent("Terjual");
    expect(screen.queryByText(/dari filter/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dominan/i)).not.toBeInTheDocument();
    fireEvent.mouseLeave(chartBar);
    rectSpy.mockRestore();

    expect(
      screen.queryByRole("columnheader", { name: "Transaksi Tertahan" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Pelanggaran Aktif" }),
    ).not.toBeInTheDocument();
    const monitoringDetailLink = screen.getAllByRole("link", {
      name: /lihat detail/i,
    })[0];
    expect(monitoringDetailLink).toHaveAttribute(
      "href",
      "/superadmin/unit/unit-1",
    );
    expect(monitoringDetailLink).toHaveClass(
      "hover:bg-[#006747]",
      "hover:text-white",
    );
    expect(screen.queryByText("Kelola Rekening")).not.toBeInTheDocument();
    expect(screen.queryByText(/risk heat indicator/i)).not.toBeInTheDocument();
  }, 10000);

  it("aligns monitoring chart bars with the item-count y-axis", () => {
    render(
      <SuperAdminMonitoringPage
        data={
          {
            summary: {
              headline: "Pantau seluruh unit dari satu control center.",
              metrics: [{ label: "Total Unit", value: "3", detail: "3 aktif" }],
              spotlight: [],
              priorities: [],
            },
            unitRows: [
              {
                id: "unit-ranotana",
                unitName: "UPC Ranotana",
                unitCode: "CP-MND-11793",
                collateralItems: 5,
                marketedItems: 0,
                soldItems: 0,
                validatedTransactionValue: 0,
                followUpItems: 0,
                heldTransactions: 0,
                activeViolations: 0,
                status: "Aktif",
              },
              {
                id: "unit-sarinah",
                unitName: "UPC Sarinah",
                unitCode: "CP-JKT-11888",
                collateralItems: 5,
                marketedItems: 0,
                soldItems: 0,
                validatedTransactionValue: 0,
                followUpItems: 0,
                heldTransactions: 0,
                activeViolations: 0,
                status: "Aktif",
              },
              {
                id: "unit-wanea",
                unitName: "UPC Wanea",
                unitCode: "CP-MND-11787",
                collateralItems: 4,
                marketedItems: 5,
                soldItems: 5,
                validatedTransactionValue: 0,
                followUpItems: 0,
                heldTransactions: 0,
                activeViolations: 0,
                status: "Aktif",
              },
            ],
            unitsNeedAttention: [],
            pendingMonitoring: [],
          } as any
        }
      />,
    );

    expect(screen.getByText("Jumlah Barang")).toBeInTheDocument();
    const yAxis = screen.getByTestId("monitoring-chart-y-axis");
    const barPlot = screen.getByTestId("monitoring-chart-bar-plot");
    expect(yAxis).toHaveClass("top-5", "bottom-[4.6rem]");
    expect(barPlot).toHaveClass("top-5", "bottom-[4.6rem]");
    Array.from(barPlot.children).forEach((unitGroup) => {
      expect(unitGroup).toHaveClass("h-full");
    });
    expect(
      Array.from(
        yAxis.querySelectorAll("[data-monitoring-y-axis-tick]"),
      ).map((node) => node.textContent),
    ).toEqual(["8", "6", "4", "2", "0"]);
    expect(
      Array.from(
        yAxis.querySelectorAll<HTMLElement>(
          "[data-monitoring-y-axis-row]",
        ),
      ).map((row) => [row.dataset.monitoringYAxisRow, row.style.bottom]),
    ).toEqual([
      ["8", "100%"],
      ["6", "75%"],
      ["4", "50%"],
      ["2", "25%"],
      ["0", "0%"],
    ]);
  });

  it("renders superadmin unit detail as monitoring inventory without management forms", () => {
    const unitItems = Array.from({ length: 12 }, (_, index) => {
      const itemNumber = index + 1;

      return {
        id: `barang-${itemNumber}`,
        code: `BRG-${String(itemNumber).padStart(3, "0")}`,
        name: `Guci Antik ${String(itemNumber).padStart(2, "0")}`,
        category:
          itemNumber === 2
            ? "perhiasan"
            : itemNumber === 6
              ? "logam_mulia"
              : "elektronik",
        imageUrl: itemNumber === 1 ? "/uploads/barang/guci.png" : null,
        marketingModeLabel:
          itemNumber === 3
            ? "Lelang Tertutup"
            : itemNumber === 4
              ? "Harga Tetap"
              : "Belum dipasarkan",
        operationalStatus:
          itemNumber === 1 || itemNumber === 2
            ? "Barang Jaminan"
            : itemNumber === 3
              ? "Sedang Dipasarkan"
              : itemNumber === 4
                ? "Ada Tindak Lanjut"
                : itemNumber === 5
                  ? "Terjual"
                  : "Siap Dipasarkan",
        operationalTone:
          itemNumber === 1 || itemNumber === 2
            ? "amber"
            : itemNumber === 3
              ? "blue"
              : itemNumber === 4
                ? "red"
                : itemNumber === 5
                  ? "slate"
                  : "emerald",
        value: itemNumber * 1_000_000,
      };
    });

    render(
      <SuperAdminUnitDetailPage
        unit={
          {
            id: "unit-1",
            code: "CP-MND-13",
            name: "UPC Ranotana",
            address: "Jl. Sam Ratulangi",
            status: "Aktif",
            isActive: true,
            adminCount: 1,
            accountCount: 1,
            activeAccount: {
              id: "rek-1",
              bankName: "Bank Mandiri",
              accountNumber: "1230098765432",
              accountHolder: "PT Pegadaian UPC Ranotana",
              branch: "Manado",
              status: "AKTIF",
            },
            accounts: [
              {
                id: "rek-1",
                bankName: "Bank Mandiri",
                accountNumber: "1230098765432",
                accountHolder: "PT Pegadaian UPC Ranotana",
                branch: "Manado",
                status: "AKTIF",
              },
            ],
            admins: [
              {
                id: "admin-1",
                name: "Admin Ranotana",
                email: "admin.ranotana@pegadaian.co.id",
                phone: "081245678901",
                status: "Aktif",
              },
            ],
            items: unitItems,
          } as any
        }
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Detail Inventori Unit" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Superadmin / Monitoring Unit / Detail Unit"),
    ).toBeInTheDocument();
    expect(screen.getByText("CP-MND-13")).toBeInTheDocument();
    expect(screen.getByText("Aktif")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /kembali ke monitoring unit/i }),
    ).toHaveAttribute("href", "/superadmin/monitoring-unit");
    expect(
      screen.queryByText("Detail & Edit Unit Pelaksana"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Profil & Lokasi Unit")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Rekening Operasional Cabang"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Otoritas Admin Penanggung Jawab"),
    ).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("CP-MND-13")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /tambah rekening/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /tambah admin unit/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /simpan perubahan/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Daftar Barang Unit")).toBeInTheDocument();
    expect(screen.getByText("Guci Antik 01")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Kategori Barang" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("combobox", { name: "Status Operasional" }),
    );
    expect(
      screen.getByRole("option", { name: "Barang Jaminan" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ditebus" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Sedang Dipasarkan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Siap Dipasarkan" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Terjual" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Ada Tindak Lanjut" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Ringkasan Perlu Tindak Lanjut"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Ada Tindak Lanjut")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Menampilkan 1-10 dari 12 barang/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Lihat detail" })[0],
    ).toHaveAttribute("href", "/superadmin/unit/unit-1/barang/barang-1");
  });

  it("renders a separate management detail page with editable unit information", () => {
    render(
      <SuperAdminManagementUnitDetailPage
        unit={{
          id: "unit-1",
          code: "CP-MND-11793",
          name: "UPC Ranotana",
          address: "Jl. Sam Ratulangi",
          domicile: "Sulawesi Utara",
          status: "Aktif",
          isActive: true,
          adminCount: 1,
          accountCount: 1,
          activeAccount: {
            id: "rek-1",
            bankName: "Bank Mandiri",
            accountNumber: "1230098765432",
            accountHolder: "PT Pegadaian UPC Ranotana",
            branch: "Manado",
            status: "AKTIF",
          },
          accounts: [
            {
              id: "rek-1",
              bankName: "Bank Mandiri",
              accountNumber: "1230098765432",
              accountHolder: "PT Pegadaian UPC Ranotana",
              branch: "Manado",
              status: "AKTIF",
            },
          ],
          admins: [
            {
              id: "admin-1",
              name: "Admin Ranotana",
              email: "admin.ranotana@pegadaian.co.id",
              phone: "081245678901",
              status: "Aktif",
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Detail & Edit Unit Pelaksana" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Profil & Lokasi Unit")).toBeInTheDocument();
    expect(screen.getByText("Rekening Operasional Cabang")).toBeInTheDocument();
    expect(
      screen.getByText("Otoritas Admin Penanggung Jawab"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nomor unit/i)).toHaveValue("11793");
    expect(screen.getByText("CP-MND-11793")).toBeInTheDocument();
    expect(screen.queryByText("Daftar Barang Unit")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^kembali$/i })).toHaveAttribute(
      "href",
      "/superadmin/manajemen-unit",
    );
  });

  it("uses the centered floating header for account and admin detail popups", () => {
    render(
      <SuperAdminManagementUnitDetailPage
        unit={{
          id: "unit-1",
          code: "CP-MND-13",
          name: "UPC Ranotana",
          address: "Jl. Sam Ratulangi",
          domicile: "Sulawesi Utara",
          status: "Aktif",
          isActive: true,
          adminCount: 1,
          accountCount: 1,
          activeAccount: {
            id: "rek-1",
            bankName: "BRI",
            accountNumber: "170101027682501",
            accountHolder: "Brando Mathias Zusriadi",
            branch: "",
            status: "AKTIF",
          },
          accounts: [
            {
              id: "rek-1",
              bankName: "BRI",
              accountNumber: "170101027682501",
              accountHolder: "Brando Mathias Zusriadi",
              branch: "",
              status: "AKTIF",
            },
          ],
          admins: [
            {
              id: "admin-1",
              name: "Admin Unit Ranotana",
              email: "admin.unit.ranotana@pegadaian.co.id",
              phone: "081200001234",
              status: "Aktif",
            },
          ],
        }}
      />,
    );

    expect(
      decodeURIComponent(
        screen.getByRole("img", { name: /logo bri/i }).getAttribute("src") ??
          "",
      ),
    ).toContain("/uploads/bank-logos/bri.png");
    fireEvent.click(
      screen.getByRole("button", { name: /lihat detail rekening bri/i }),
    );

    const accountDialog = screen.getByRole("dialog", {
      name: "Detail Rekening Unit",
    });
    expect(accountDialog).toHaveAttribute(
      "data-header-layout",
      "floating-centered",
    );
    expect(accountDialog.parentElement).toHaveAttribute(
      "data-safe-floating-header-frame",
      "true",
    );
    expect(accountDialog.parentElement).toHaveClass("py-8", "sm:py-10");
    expect(
      within(accountDialog).getByRole("heading", {
        name: "Detail Rekening Unit",
      }),
    ).toHaveClass("text-center");

    fireEvent.click(
      within(accountDialog).getByRole("button", {
        name: /tutup panel detail/i,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /lihat detail admin admin unit ranotana/i,
      }),
    );

    const adminDialog = screen.getByRole("dialog", {
      name: "Detail Admin Unit",
    });
    expect(adminDialog).toHaveAttribute(
      "data-header-layout",
      "floating-centered",
    );
    expect(adminDialog.parentElement).toHaveAttribute(
      "data-safe-floating-header-frame",
      "true",
    );
    expect(adminDialog.parentElement).toHaveClass("py-8", "sm:py-10");
    expect(
      within(adminDialog).getByRole("heading", { name: "Detail Admin Unit" }),
    ).toHaveClass("text-center");
  });

  it("returns to management after saving unit profile changes", async () => {
    vi.useRealTimers();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            id: "unit-1",
            code: "CP-MND-11793",
            name: "UPC Ranotana",
            address: "Jl. Sam Ratulangi",
            domicile: "Sulawesi Utara",
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <UnitForm
        initialValue={{
          code: "CP-MND-11793",
          name: "UPC Ranotana",
          address: "Jl. Sam Ratulangi",
          domicile: "Sulawesi Utara",
          isActive: true,
        }}
        mode="update"
        showTitle={false}
        unitId="unit-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /perbarui unit/i }));

    await waitFor(() => {
      expect(navigationMocks.push).toHaveBeenCalledWith(
        "/superadmin/manajemen-unit",
      );
    });
    expect(navigationMocks.refresh).toHaveBeenCalled();
    const updateBody = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body ?? "{}"),
    );
    expect(updateBody).toMatchObject({
      unitNumber: "11793",
      name: "UPC Ranotana",
      domicile: "Sulawesi Utara",
    });
    expect(updateBody).not.toHaveProperty("code");
  });

  it("keeps superadmin item status helper synchronized with due date", async () => {
    process.env.DATABASE_URL ??=
      "postgresql://postgres:postgres@localhost:5432/prototipe_pegadaian";

    const {
      getUnitItemOperationalState,
      resolveUnitItemValue,
      resolveUnitMarketingModeLabel,
    } = await import("@/lib/services/unit.service");
    const now = new Date("2026-06-06T00:00:00.000Z");

    expect(
      resolveUnitMarketingModeLabel({
        activeMarketingMode: null,
        latestMarketingMode: "vickrey",
        transactionType: "vickrey",
      }),
    ).toBe("Lelang Tertutup");

    expect(
      resolveUnitMarketingModeLabel({
        activeMarketingMode: null,
        latestMarketingMode: "fixed_price",
        transactionType: "fixed_price",
      }),
    ).toBe("Harga Tetap");

    expect(
      resolveUnitMarketingModeLabel({
        activeMarketingMode: null,
        itemStatus: "terjual",
        latestMarketingMode: null,
        transactionStatus: null,
        transactionType: null,
      }),
    ).toBe("Mode tidak tercatat");

    expect(
      resolveUnitMarketingModeLabel({
        activeMarketingMode: null,
        itemStatus: "jaminan",
        latestMarketingMode: null,
        transactionStatus: null,
        transactionType: null,
      }),
    ).toBe("Belum dipasarkan");

    expect(
      resolveUnitItemValue({
        appraisalValue: "6500000",
        transactionAmount: "7500000",
        transactionStatus: "lunas",
      }),
    ).toBe(7_500_000);

    expect(
      resolveUnitItemValue({
        appraisalValue: "6500000",
        transactionAmount: "7500000",
        transactionStatus: "bukti_diunggah",
      }),
    ).toBe(6_500_000);

    expect(
      getUnitItemOperationalState({
        itemStatus: "jaminan",
        dueDate: new Date("2026-07-01T00:00:00.000Z"),
        now,
      }),
    ).toEqual({
      operationalStatus: "Barang Jaminan",
      operationalTone: "amber",
    });

    expect(
      getUnitItemOperationalState({
        itemStatus: "jaminan",
        dueDate: new Date("2026-05-01T00:00:00.000Z"),
        now,
      }),
    ).toEqual({
      operationalStatus: "Siap Dipasarkan",
      operationalTone: "emerald",
    });

    expect(
      getUnitItemOperationalState({
        activeMarketingStatus: "aktif",
        itemStatus: "dipasarkan",
        dueDate: new Date("2026-07-01T00:00:00.000Z"),
        now,
      }).operationalStatus,
    ).toBe("Sedang Dipasarkan");

    expect(
      getUnitItemOperationalState({
        activeMarketingMode: "fixed_price",
        activeMarketingStatus: "aktif",
        itemStatus: "dipasarkan",
        dueDate: new Date("2026-07-01T00:00:00.000Z"),
        now,
        transactionStatus: "ditolak_bukti",
      }),
    ).toEqual({
      operationalStatus: "Sedang Dipasarkan",
      operationalTone: "blue",
    });

    expect(
      getUnitItemOperationalState({
        activeMarketingMode: "fixed_price",
        itemStatus: "dipasarkan",
        dueDate: new Date("2026-07-01T00:00:00.000Z"),
        now,
        transactionStatus: "ditolak_bukti",
      }),
    ).toEqual({
      operationalStatus: "Gagal",
      operationalTone: "red",
    });

    expect(
      getUnitItemOperationalState({
        itemStatus: "gagal",
        latestMarketingStatus: "gagal",
        dueDate: new Date("2026-05-01T00:00:00.000Z"),
        now,
      }),
    ).toEqual({
      operationalStatus: "Gagal",
      operationalTone: "red",
    });

    expect(
      getUnitItemOperationalState({
        activeMarketingMode: "fixed_price",
        activeMarketingStatus: "aktif",
        itemStatus: "dipasarkan",
        dueDate: new Date("2026-07-01T00:00:00.000Z"),
        now,
        transactionStatus: "bukti_diunggah",
      }).operationalStatus,
    ).toBe("Sedang Dipasarkan");

    expect(
      getUnitItemOperationalState({
        itemStatus: "menunggu_pembayaran",
        dueDate: new Date("2026-05-01T00:00:00.000Z"),
        now,
      }).operationalStatus,
    ).toBe("Sedang Dipasarkan");

    expect(
      getUnitItemOperationalState({
        itemStatus: "dipasarkan",
        dueDate: new Date("2026-05-01T00:00:00.000Z"),
        now,
      }).operationalStatus,
    ).toBe("Sedang Dipasarkan");

    expect(
      getUnitItemOperationalState({
        itemStatus: "ditebus",
        now,
      }),
    ).toEqual({
      operationalStatus: "Ditebus",
      operationalTone: "slate",
    });
  }, 10000);

  it("keeps unit inventory visible and paginated on superadmin unit detail", () => {
    const unitItems = Array.from({ length: 12 }, (_, index) => {
      const itemNumber = index + 1;

      return {
        id: `barang-${itemNumber}`,
        code: `BRG-${String(itemNumber).padStart(3, "0")}`,
        name: `Guci Antik ${String(itemNumber).padStart(2, "0")}`,
        category:
          itemNumber === 2
            ? "perhiasan"
            : itemNumber === 6
              ? "logam_mulia"
              : "elektronik",
        imageUrl: itemNumber === 1 ? "/uploads/barang/guci.png" : null,
        marketingModeLabel:
          itemNumber === 3
            ? "Lelang Tertutup"
            : itemNumber === 4
              ? "Harga Tetap"
              : "Belum dipasarkan",
        operationalStatus:
          itemNumber === 3
            ? "Sedang Dipasarkan"
            : itemNumber === 4
              ? "Siap Dipasarkan"
              : itemNumber === 5
                ? "Terjual"
                : "Siap Dipasarkan",
        operationalTone:
          itemNumber === 3
            ? "blue"
            : itemNumber === 4
              ? "emerald"
              : itemNumber === 5
                ? "slate"
                : "emerald",
        value: itemNumber * 1_000_000,
      };
    });

    render(
      <SuperAdminUnitDetailPage
        unit={
          {
            id: "unit-1",
            code: "CP-MND-13",
            name: "UPC Ranotana",
            address: "Jl. Sam Ratulangi",
            status: "Aktif",
            isActive: true,
            adminCount: 1,
            accountCount: 1,
            activeAccount: null,
            accounts: [],
            admins: [],
            items: unitItems,
          } as any
        }
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Detail Inventori Unit" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Profil & Lokasi Unit")).not.toBeInTheDocument();
    expect(screen.getByText("Daftar Barang Unit")).toBeInTheDocument();
    expect(screen.getByText("Guci Antik 01")).toBeInTheDocument();
    expect(screen.queryByText("Guci Antik 12")).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Kategori Barang" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Mode Pemasaran" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Jumlah barang per halaman" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Menampilkan 1-10 dari 12 barang/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Lihat detail" })[0],
    ).toHaveAttribute("href", "/superadmin/unit/unit-1/barang/barang-1");
  });

  it("renders superadmin item detail as a full read-only marketing-aware page", () => {
    render(
      <SuperAdminUnitBarangDetailPage
        detail={
          {
            unit: {
              id: "unit-1",
              code: "CP-MND-13",
              name: "UPC Ranotana",
              address: "Jl. Sam Ratulangi",
              status: "Aktif",
            },
            item: {
              id: "barang-3",
              code: "BRG-003",
              name: "Cincin Emas Ranotana",
              category: "perhiasan",
              condition: "baik",
              status: "TERJUAL",
              pawnedAt: "29 Mei 2026",
              dueDate: "29 Juni 2026",
              appraisalValue: 22_000_000,
              ownerName: "Brando Mathias Zusriadi",
              customerNumber: "081200001234",
              description: "Cincin emas dengan dokumen appraisal lengkap.",
              specifications: {
                berat: "5 gram",
                kadar: "22K",
                sertifikat: "Ada",
              },
              media: [
                {
                  id: "media-1",
                  type: "foto",
                  url: "/uploads/barang/cincin-ranotana.png",
                  fileName: "cincin-ranotana.png",
                },
                {
                  id: "media-2",
                  type: "video",
                  url: "/uploads/barang/cincin-ranotana.mp4",
                  fileName: "cincin-ranotana.mp4",
                },
              ],
            },
            operationalStatus: "Terjual",
            operationalTone: "slate",
            marketing: {
              id: "pemasaran-2",
              lotId: "barang-3",
              lot: "Cincin Emas Ranotana",
              code: "BRG-003",
              category: "perhiasan",
              condition: "baik",
              status: "SELESAI",
              mode: "VICKREY_AUCTION",
              iteration: 2,
              totalIterations: 2,
              createdAt: "2026-05-30T02:00:00.000Z",
              ending: "30 Mei 2026, 10:00 WIB",
              endingAt: "2026-05-30T10:00:00+08:00",
              revealDeadline: "30 Mei 2026, 10:10 WIB",
              revealDeadlineAt: "2026-05-30T10:10:00+08:00",
              participants: 3,
              revealedBidCount: 3,
              pendingRevealCount: 0,
              insights: {
                views: 45,
                likes: 6,
                participants: 3,
              },
              basePrice: 18_000_000,
              finalPrice: 21_000_000,
              winner: "Buyer Ranotana",
              buyerName: "Buyer Ranotana",
              buyerEmail: "buyer.ranotana@example.com",
              buyerPhone: "081211112222",
              transactionId: "trx-1",
              transactionStatus: "SELESAI",
              paymentMethod: "Transfer Bank",
              reference: "PEG-20260530-003",
              soldAt: "2026-05-31T08:30:00+08:00",
              paymentDeadline: "2026-05-31T10:10:00+08:00",
              note: "Pembayaran pemenang sudah terverifikasi dari transaksi.",
              bids: [
                {
                  id: "bid-1",
                  bidderId: "buyer-1",
                  bidderName: "Buyer Ranotana",
                  bidderImage: "/uploads/buyers/buyer-ranotana.jpg",
                  submittedAtLabel: "30 Mei 2026, 09:40 WIB",
                  amount: 23_000_000,
                  isRevealed: true,
                  rank: 1,
                  isWinner: true,
                  determinesFinalPrice: false,
                },
                {
                  id: "bid-2",
                  bidderId: "buyer-2",
                  bidderName: "Andi Rahman",
                  bidderImage: "/uploads/buyers/andi-rahman.jpg",
                  submittedAtLabel: "30 Mei 2026, 09:25 WIB",
                  amount: 21_000_000,
                  isRevealed: true,
                  rank: 2,
                  isWinner: false,
                  determinesFinalPrice: true,
                },
              ],
              iterationHistory: [
                {
                  id: "pemasaran-2",
                  lotId: "barang-3",
                  lot: "Cincin Emas Ranotana",
                  code: "BRG-003",
                  status: "SELESAI",
                  mode: "VICKREY_AUCTION",
                  iteration: 2,
                  participants: 3,
                  insights: {
                    views: 45,
                    likes: 6,
                    participants: 3,
                  },
                  finalPrice: 21_000_000,
                  winner: "Buyer Ranotana",
                  note: "Iterasi kedua selesai dan menghasilkan pemenang.",
                  createdAt: "2026-05-30T02:00:00.000Z",
                  ending: "30 Mei 2026, 10:00 WIB",
                },
                {
                  id: "pemasaran-1",
                  lotId: "barang-3",
                  lot: "Cincin Emas Ranotana",
                  code: "BRG-003",
                  status: "GAGAL",
                  mode: "FIXED_PRICE",
                  iteration: 1,
                  participants: 0,
                  insights: {
                    views: 12,
                    likes: 1,
                    participants: 0,
                  },
                  price: 20_000_000,
                  note: "Iterasi pertama belum mendapatkan pembeli.",
                  createdAt: "2026-05-29T02:00:00.000Z",
                  ending: "29 Mei 2026, 10:00 WIB",
                },
              ],
            },
            history: [
              {
                id: "hist-1",
                barangId: "barang-3",
                actionLabel: "Terjual",
                actionKey: "terjual",
                note: "Barang selesai setelah pembayaran pemenang diverifikasi.",
                actorName: "Admin Unit",
                createdAtLabel: "31 Mei 2026, 08:30 WIB",
              },
              {
                id: "hist-2",
                barangId: "barang-3",
                actionLabel: "Dipasarkan",
                actionKey: "dipasarkan",
                note: "Barang masuk sesi Lelang Tertutup iterasi kedua.",
                actorName: "Admin Unit",
                createdAtLabel: "30 Mei 2026, 02:00 WIB",
              },
            ],
          } as any
        }
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Cincin Emas Ranotana" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Superadmin / Detail Barang")).toBeInTheDocument();
    expect(screen.getAllByText("UPC Ranotana").length).toBeGreaterThan(0);
    expect(screen.getByText("Status Terjual")).toBeInTheDocument();
    expect(screen.getByTestId("admin-detail-active-media")).toBeInTheDocument();
    expect(screen.getByText("Riwayat Iterasi Pemasaran")).toBeInTheDocument();
    expect(screen.getAllByText("Buyer Ranotana").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Bidders Ranking Table (Arsip)"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("superadmin-vickrey-ranking"),
    ).toBeInTheDocument();
    expect(screen.getByText("Harga yang Dibayarkan")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 21.000.000").length).toBeGreaterThan(0);
    expect(
      screen.getByAltText("Foto peserta Buyer Ranotana"),
    ).toBeInTheDocument();
    const heroPriceFrame = screen.getByTestId("superadmin-item-price-frame");
    expect(heroPriceFrame).toHaveTextContent("Harga akhir Lelang Tertutup");
    expect(heroPriceFrame).toHaveTextContent("Rp 21.000.000");
    expect(heroPriceFrame).toHaveClass("rounded-[0.72rem]", "px-4", "py-3");
    expect(heroPriceFrame.className).toContain("border-[#d8ab70]/80");
    expect(heroPriceFrame.className).toContain(
      "bg-[linear-gradient(180deg,#fffdf9_0%,#fffaf0_100%)]",
    );
    expect(
      heroPriceFrame.querySelectorAll("span.pointer-events-none").length,
    ).toBeGreaterThanOrEqual(11);
    expect(
      screen.getByText("Lelang Selesai Sempurna - Aset Telah Diserahkan"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Manifes Penyerahan & Pemenang"),
    ).toBeInTheDocument();
    expect(screen.getByText("Mekanisme Lelang (Arsip)")).toBeInTheDocument();
    expect(screen.getByText("Progress Penyelesaian")).toBeInTheDocument();
    expect(screen.getByText("Ringkasan Transaksi")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cetak Nota" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tutup & Arsipkan Berkas Lelang" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("superadmin-vickrey-settlement-layout"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("superadmin-vickrey-settlement-primary-grid"),
    ).toHaveClass("xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]");
    expect(
      screen.getByTestId("superadmin-vickrey-settlement-secondary-grid"),
    ).toHaveClass("xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]");
    const superAdminMechanismPanel = screen.getByTestId(
      "superadmin-vickrey-mechanism-panel",
    );
    const superAdminWinnerPanel = screen.getByTestId(
      "superadmin-vickrey-winner-profile",
    );
    const superAdminProgressPanel = screen
      .getByText("Progress Penyelesaian")
      .closest("section");
    const superAdminArchivePrice = within(superAdminMechanismPanel).getByText(
      "Rp 21.000.000",
    );
    const superAdminArchiveStatus = within(superAdminMechanismPanel).getByText(
      "Selesai & Diarsipkan",
    );
    const superAdminArchiveStatusPill =
      superAdminArchiveStatus.parentElement as HTMLElement;
    const superAdminExecutionTime = within(superAdminMechanismPanel).getByText(
      "30 Mei 2026, 09.00 WIB",
    );
    expect(superAdminWinnerPanel).toHaveClass("h-full");
    expect(superAdminWinnerPanel).toHaveTextContent("Member ID:");
    expect(superAdminMechanismPanel).toHaveTextContent("Selesai & Diarsipkan");
    expect(superAdminArchivePrice.className).toContain("whitespace-nowrap");
    expect(superAdminArchivePrice.className).not.toContain("text-ellipsis");
    expect(superAdminArchivePrice.className).not.toContain("truncate");
    expect(superAdminArchiveStatusPill.className).toContain(
      "whitespace-nowrap",
    );
    expect(superAdminArchiveStatusPill.className).not.toContain(
      "text-ellipsis",
    );
    expect(superAdminArchiveStatusPill.className).not.toContain("truncate");
    expect(superAdminArchiveStatusPill.querySelector("svg")).toHaveClass(
      "size-3",
      "shrink-0",
    );
    expect(superAdminExecutionTime.className).toContain("whitespace-nowrap");
    expect(superAdminExecutionTime.className).not.toContain("text-ellipsis");
    expect(superAdminExecutionTime.className).not.toContain("truncate");
    const vickreyPerformancePanel = screen.getByTestId(
      "superadmin-vickrey-settlement-performance-panel",
    );
    const vickreyHandover = screen.getByTestId(
      "superadmin-vickrey-settlement-handover",
    );
    const vickreySummaryPanel = screen.getByTestId(
      "superadmin-vickrey-final-summary-panel",
    );
    expect(vickreyPerformancePanel).toHaveTextContent(
      "Performa & Aktivitas Sesi Publik",
    );
    expect(vickreyPerformancePanel).toHaveTextContent("45x");
    expect(vickreyPerformancePanel).toHaveTextContent("6 Akun");
    expect(vickreyPerformancePanel).toHaveClass("h-full");
    expect(superAdminProgressPanel).toHaveClass("h-full");
    expect(
      superAdminWinnerPanel.compareDocumentPosition(superAdminMechanismPanel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      superAdminProgressPanel!.compareDocumentPosition(
        vickreyPerformancePanel,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      vickreyPerformancePanel.compareDocumentPosition(vickreyHandover) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      vickreyHandover.compareDocumentPosition(vickreySummaryPanel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByTestId("superadmin-ranking-row-1").className).toContain(
      "bg-[#fff7db]",
    );
    expect(screen.getByTestId("superadmin-ranking-row-2").className).toContain(
      "bg-[#f3f6f9]",
    );
    const rankingSection = screen
      .getByText("Bidders Ranking Table (Arsip)")
      .closest("section");
    const firstRankMarker = within(rankingSection as HTMLElement).getByTestId(
      "superadmin-ranking-marker-1",
    );
    const secondRankMarker = within(rankingSection as HTMLElement).getByTestId(
      "superadmin-ranking-marker-2",
    );
    expect(
      within(rankingSection as HTMLElement).getByText("Peringkat"),
    ).toBeInTheDocument();
    expect(
      within(firstRankMarker).getByRole("img", { name: "Peringkat 1" }),
    ).toBeInTheDocument();
    expect(
      within(secondRankMarker).getByRole("img", { name: "Peringkat 2" }),
    ).toBeInTheDocument();
    expect(vickreyHandover).toHaveTextContent(
      "Dokumentasi Serah Terima Barang Fisik",
    );
    expect(vickreySummaryPanel).toHaveTextContent("Total Pelunasan Kasir");
    expect(
      screen.getAllByText("30 Mei 2026, 09.00 WIB").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("30 Mei 2026, 10:00 WIB"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Iterasi 2 (Terkini)").length).toBeGreaterThan(
      0,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Iterasi 2 \(Terkini\)/i }),
    );
    const archivedIterationOption = screen.getAllByRole("option", {
      name: "Iterasi 1",
    })[1];
    expect(
      archivedIterationOption.querySelector(".lucide-file-text"),
    ).toBeNull();
    fireEvent.click(archivedIterationOption);
    expect(screen.getByText("Sesi Harga Tetap Diarsipkan")).toBeInTheDocument();
    expect(
      screen.queryByText("Ringkasan Sesi Harga Tetap"),
    ).not.toBeInTheDocument();
    const archivedPriceFrame = screen.getByTestId(
      "superadmin-item-price-frame",
    );
    expect(archivedPriceFrame).toHaveTextContent("Harga Tetap");
    expect(archivedPriceFrame).toHaveTextContent("Rp 20.000.000");
    const fixedPriceLayout = screen.getByTestId(
      "superadmin-fixed-price-settlement-layout",
    );
    const fixedPricePrimaryGrid = screen.getByTestId(
      "superadmin-fixed-price-settlement-primary-grid",
    );
    const fixedPricePerformancePanel = screen.getByTestId(
      "superadmin-fixed-price-performance-panel",
    );
    const fixedPriceHandover = screen.getByTestId(
      "superadmin-fixed-price-settlement-handover",
    );
    const fixedPriceHandoverPanel = within(fixedPriceHandover).getByLabelText(
      /panel bukti serah-terima barang/i,
    );
    expect(fixedPriceLayout).toContainElement(fixedPricePrimaryGrid);
    expect(fixedPriceLayout).toContainElement(fixedPricePerformancePanel);
    expect(fixedPriceLayout).toContainElement(fixedPriceHandover);
    expect(fixedPricePrimaryGrid).toContainElement(fixedPricePerformancePanel);
    expect(fixedPricePerformancePanel).toHaveTextContent(
      "Performa & Aktivitas Sesi Publik",
    );
    expect(fixedPricePerformancePanel).toHaveTextContent("12x");
    expect(fixedPricePerformancePanel).toHaveTextContent("1 Akun");
    expect(
      fixedPricePrimaryGrid.compareDocumentPosition(fixedPriceHandover) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      fixedPricePerformancePanel.compareDocumentPosition(fixedPriceHandover) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(fixedPriceHandover).toHaveTextContent(
      "Dokumentasi Serah Terima Barang Fisik",
    );
    expect(fixedPriceHandoverPanel).toHaveClass(
      "grid-cols-[repeat(auto-fit,minmax(min(100%,34rem),1fr))]",
    );
    expect(screen.queryByText("Ranking Bid")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cetak Nota" }),
    ).not.toBeInTheDocument();
    const itemAuditStack = screen.getByTestId("superadmin-item-audit-stack");
    const itemMainCard = screen.getByTestId("superadmin-item-detail-main-card");
    const timeline = screen.getByTestId("superadmin-asset-timeline");
    expect(itemAuditStack).toHaveClass("grid", "gap-4");
    expect(itemAuditStack).toContainElement(itemMainCard);
    expect(itemAuditStack).toContainElement(timeline);
    expect(
      itemMainCard.compareDocumentPosition(timeline) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(timeline).not.toBeNull();
    expect(timeline).toHaveTextContent("Riwayat Kronologi Aset");
    expect(timeline).toHaveTextContent("Aktor Internal: Admin Unit");
    expect(timeline?.querySelector(".overflow-y-auto")).not.toBeNull();
    const timelineText = timeline?.textContent ?? "";
    expect(timelineText.indexOf("Dipasarkan")).toBeLessThan(
      timelineText.indexOf("Terjual"),
    );
    expect(screen.queryByText("Edit Data Barang")).not.toBeInTheDocument();
    expect(screen.queryByText("Pasarkan Barang")).not.toBeInTheDocument();
    expect(screen.queryByText("Catat Penebusan")).not.toBeInTheDocument();
    expect(screen.queryByText("Catat Perpanjangan")).not.toBeInTheDocument();
  });

  it("shows rejected fixed-price verification details as read-only audit data", () => {
    render(
      <SuperAdminUnitBarangDetailPage
        detail={
          {
            unit: {
              id: "unit-wanea",
              code: "UPC-WANEA",
              name: "UPC Wanea",
              address: "Wanea",
              status: "Aktif",
            },
            item: {
              id: "barang-fixed-rejected",
              code: "SBG-117870000000024",
              name: "Kalung Salib Emas 17K",
              category: "perhiasan",
              condition: "baik",
              status: "dipasarkan",
              appraisalValue: 15_000_000,
              specifications: {},
              media: [],
            },
            operationalStatus: "Gagal",
            operationalTone: "red",
            marketing: {
              id: "pemasaran-fixed-rejected",
              lotId: "barang-fixed-rejected",
              lot: "Kalung Salib Emas 17K",
              status: "AKTIF",
              mode: "FIXED_PRICE",
              iteration: 5,
              price: 15_000_000,
              transactionId: "trx-fixed-rejected",
              transactionStatus: "DITOLAK_BUKTI",
              transactionCreatedAt: "2026-07-06T04:29:00.000Z",
              buyerName: "Cristiano Ronaldo",
              proofUrl: "/uploads/bukti-fixed-rejected.jpg",
              verifiedBy: "Maria Supit",
              verifiedAt: "2026-07-06T05:56:00.000Z",
              rejectionReason: "Uang dikirim bukan ke rekening tujuan.",
              reference: "FP-117870000000024",
              note: "Bukti pembayaran harga tetap ditolak admin unit.",
            },
            history: [],
          } as any
        }
      />,
    );

    expect(
      screen.getByText("Pembayaran Harga Tetap Ditolak"),
    ).toBeInTheDocument();
    const audit = screen.getByTestId("superadmin-payment-verification-audit");
    const fixedPriceGrid = screen.getByTestId(
      "superadmin-fixed-price-settlement-primary-grid",
    );
    const fixedPricePerformancePanel = screen.getByTestId(
      "superadmin-fixed-price-performance-panel",
    );
    expect(audit).toHaveTextContent("Uang dikirim bukan ke rekening tujuan.");
    expect(audit).toHaveClass("py-2.5", "rounded-lg");
    expect(fixedPriceGrid).toHaveClass(
      "items-stretch",
      "gap-2",
      "xl:grid-cols-2",
    );
    expect(fixedPriceGrid).toContainElement(fixedPricePerformancePanel);
    expect(fixedPricePerformancePanel).toHaveTextContent(
      "Performa & Aktivitas Sesi Publik",
    );
    expect(
      screen.queryByText("Ringkasan Sesi Harga Tetap"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("superadmin-item-price-frame")).toHaveTextContent(
      "Harga Tetap",
    );
    expect(screen.getByTestId("superadmin-item-price-frame")).toHaveTextContent(
      "Rp 15.000.000",
    );
    expect(screen.getByText(/maria supit/i)).toBeInTheDocument();
    expect(screen.getAllByText(/6 Jul 2026/).length).toBeGreaterThan(0);
    expect(
      screen.queryByText("Detail Verifikasi Admin Unit"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /lihat verifikasi pembayaran/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /lihat verifikasi pembayaran/i }),
    ).not.toBeInTheDocument();
    expect(within(audit).queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps the verified superadmin winner manifest compact inside the settlement grid", () => {
    render(
      <SuperAdminUnitBarangDetailPage
        detail={
          {
            unit: {
              id: "unit-cr",
              code: "UPC-RNT",
              name: "UPC Ranotana",
              address: "Ranotana",
              status: "Aktif",
            },
            item: {
              id: "barang-ipad",
              code: "BRG-CR7",
              name: "Ipad",
              category: "elektronik",
              condition: "baik",
              status: "terjual",
              media: [
                {
                  id: "ipad-1",
                  type: "foto",
                  url: "/uploads/ipad.jpg",
                  fileName: "ipad.jpg",
                },
              ],
              specifications: {},
            },
            operationalStatus: "Status Terjual",
            operationalTone: "emerald",
            marketing: {
              id: "pemasaran-ipad-vickrey",
              lotId: "barang-ipad",
              lot: "Ipad",
              code: "BRG-CR7",
              status: "SELESAI",
              mode: "VICKREY_AUCTION",
              unitName: "UPC Ranotana",
              unitAddress: "Ranotana",
              participants: 2,
              revealedBidCount: 2,
              pendingRevealCount: 0,
              basePrice: 7_500_000,
              finalPrice: 7_500_000,
              winner: "Cristiano Ronaldo",
              buyerName: "Cristiano Ronaldo",
              buyerEmail: "buyer1@mail.com",
              buyerPhone: "6281200001001",
              buyerNationalId: "seed-buyer-simple-1",
              transactionId: "trx-cr7-lunas",
              transactionStatus: "LUNAS",
              paymentMethod: "BAYAR_LANGSUNG",
              reference: "INV/CR7",
              soldAt: "2026-06-02T10:48:00+08:00",
              paymentDeadline: "2026-06-02T12:00:00+08:00",
              visibility: "HASIL_DIBUKA",
              media: [
                {
                  id: "ipad-1",
                  type: "foto",
                  url: "/uploads/ipad.jpg",
                  fileName: "ipad.jpg",
                },
              ],
              primaryMedia: {
                id: "ipad-1",
                type: "foto",
                url: "/uploads/ipad.jpg",
                fileName: "ipad.jpg",
              },
              bids: [
                {
                  id: "bid-cr7",
                  bidderId: "seed-buyer-simple-1",
                  bidderName: "Cristiano Ronaldo",
                  submittedAtLabel: "1 Jun 2026, 21.56 WIB",
                  amount: 8_500_000,
                  isRevealed: true,
                  rank: 1,
                  isWinner: true,
                  determinesFinalPrice: false,
                },
              ],
            },
            history: [],
          } as any
        }
      />,
    );

    const winnerPanel = screen.getByTestId("superadmin-vickrey-winner-profile");

    expect(winnerPanel).toHaveTextContent("Manifes Penyerahan & Pemenang");
    expect(winnerPanel).toHaveTextContent("Pemenang Terverifikasi");
    expect(winnerPanel).toHaveTextContent("Cristiano Ronaldo");
    expect(winnerPanel).toHaveTextContent("6281200001001");
    expect(winnerPanel).toHaveTextContent("buyer1@mail.com");
    expect(within(winnerPanel).getByText(/Member ID:/i)).toBeInTheDocument();
    const verifiedBadges = within(winnerPanel).getAllByText(
      "Pemenang Terverifikasi",
    );

    expect(within(winnerPanel).getByText("Cristiano Ronaldo")).toHaveClass(
      "truncate",
    );
    expect(
      within(winnerPanel).getByText("6281200001001").closest("p"),
    ).toHaveClass("min-w-0");
    expect(verifiedBadges[0].parentElement).toHaveClass("text-[0.56rem]");
    expect(
      within(winnerPanel).getByText("Menunggu Buyer Selesai").parentElement,
    ).toHaveClass("text-[0.56rem]");
  });

  it("keeps the failed vickrey progress panel compact without stretching the right rail", () => {
    render(
      <SuperAdminUnitBarangDetailPage
        detail={
          {
            unit: {
              id: "unit-erling",
              code: "UPC-ERL",
              name: "UPC Erling",
              address: "Manado",
              status: "Aktif",
            },
            item: {
              id: "barang-iphone",
              code: "SBG-117870000000028",
              name: "iPhone 17 Pro Max 512GB Cosmic Orange",
              category: "elektronik",
              condition: "baik",
              status: "GAGAL",
              appraisalValue: 12_000_000,
              specifications: {},
              media: [],
            },
            operationalStatus: "Gagal",
            operationalTone: "red",
            marketing: {
              id: "pemasaran-failure-archive",
              lotId: "barang-iphone",
              lot: "iPhone 17 Pro Max 512GB Cosmic Orange",
              code: "SBG-117870000000028",
              status: "GAGAL",
              mode: "VICKREY_AUCTION",
              iteration: 5,
              totalIterations: 5,
              createdAt: "2026-06-26T14:10:00+08:00",
              endingAt: "2026-06-26T23:10:00+08:00",
              paymentDeadline: "2026-06-27T23:59:00+08:00",
              participants: 3,
              revealedBidCount: 3,
              pendingRevealCount: 0,
              insights: {
                views: 26,
                likes: 3,
                participants: 2,
              },
              basePrice: 12_000_000,
              finalPrice: 12_000_000,
              winner: "Erling Haaland",
              buyerName: "Erling Haaland",
              buyerEmail: "haaland@mail.com",
              buyerPhone: "081200001004",
              transactionStatus: "GAGAL",
              note: "Pemenang tidak melakukan pelunasan dalam batas waktu 24 jam setelah lelang diumumkan.",
              bids: [
                {
                  id: "bid-haaland",
                  bidderId: "buyer-haaland",
                  bidderName: "Erling Haaland",
                  bidderImage: "/uploads/buyers/erling-haaland.jpg",
                  submittedAtLabel: "26 Jun 2026, 23.15 WIB",
                  amount: 15_000_000,
                  isRevealed: true,
                  rank: 1,
                  isWinner: true,
                  determinesFinalPrice: false,
                },
                {
                  id: "bid-messi",
                  bidderId: "buyer-messi",
                  bidderName: "Lionel Messi",
                  bidderImage: "/uploads/buyers/lionel-messi.jpg",
                  submittedAtLabel: "26 Jun 2026, 23.14 WIB",
                  amount: 12_000_000,
                  isRevealed: true,
                  rank: 2,
                  isWinner: false,
                  determinesFinalPrice: true,
                },
                {
                  id: "bid-mbappe",
                  bidderId: "buyer-mbappe",
                  bidderName: "Kylian Mbappe",
                  bidderImage: "/uploads/buyers/kylian-mbappe.jpg",
                  submittedAtLabel: "26 Jun 2026, 23.11 WIB",
                  amount: 7_500_000,
                  isRevealed: true,
                  rank: 3,
                  isWinner: false,
                  determinesFinalPrice: false,
                },
              ],
            },
            history: [],
          } as any
        }
      />,
    );

    const progressSection = screen
      .getByText("Progress Penyelesaian")
      .closest("section");
    const mechanismPanel = screen.getByTestId(
      "superadmin-vickrey-mechanism-panel",
    );
    const performancePanel = screen.getByTestId(
      "superadmin-vickrey-failure-performance-panel",
    );

    expect(progressSection).not.toBeNull();
    expect(progressSection).toHaveClass("h-full");
    expect(progressSection).toHaveClass("justify-between");
    expect(progressSection).toHaveTextContent("Gagal Bayar");
    expect(progressSection).toHaveTextContent("Belum tercapai");
    expect(mechanismPanel).toHaveClass("h-full");
    expect(performancePanel).toHaveTextContent(
      "Performa & Aktivitas Sesi Publik",
    );
    expect(performancePanel).toHaveTextContent("26x");
    expect(performancePanel).toHaveTextContent("3 Akun");
    expect(screen.getByText("Gagal / Pelanggaran")).toBeInTheDocument();
    expect(screen.getByText("Harga yang Dibayarkan")).toBeInTheDocument();
    expect(
      screen.getByAltText("Foto peserta Erling Haaland"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("superadmin-failure-ranking-row-1").className,
    ).toContain("bg-[#fff7db]");
    expect(
      screen.getByTestId("superadmin-failure-ranking-row-2").className,
    ).toContain("bg-[#f3f6f9]");
    for (const rank of [1, 2, 3]) {
      expect(
        within(
          screen.getByTestId(`superadmin-ranking-marker-${rank}`),
        ).getByRole("img", { name: `Peringkat ${rank}` }),
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByRole("button", { name: /jadwalkan pasarkan ulang/i }),
    ).not.toBeInTheDocument();
    expect(
      performancePanel.compareDocumentPosition(mechanismPanel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      performancePanel.compareDocumentPosition(progressSection!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("prints the prepared superadmin receipt in place on mobile without opening the receipt route", async () => {
    vi.useRealTimers();

    const originalUserAgent = window.navigator.userAgent;
    const openSpy = vi
      .spyOn(window, "open")
      .mockReturnValue({ focus: vi.fn() } as unknown as Window);
    const printSpy = vi
      .spyOn(window, "print")
      .mockImplementation(() => undefined);

    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
    });

    try {
      render(
        <SuperAdminUnitBarangDetailPage
          detail={
            {
              unit: {
                id: "unit-1",
                code: "CP-MND-13",
                name: "UPC Ranotana",
                address: "Jl. Sam Ratulangi",
                status: "Aktif",
              },
              item: {
                id: "barang-3",
                code: "BRG-003",
                name: "Cincin Emas Ranotana",
                category: "emas",
                condition: "baik",
                status: "terjual",
                media: [
                  {
                    id: "media-1",
                    type: "foto",
                    url: "/uploads/cincin.jpg",
                    fileName: "cincin.jpg",
                  },
                ],
                specifications: {},
              },
              operationalStatus: "Status Terjual",
              operationalTone: "emerald",
              marketing: {
                id: "pemasaran-superadmin-nota",
                lotId: "barang-3",
                lot: "Cincin Emas Ranotana",
                code: "BRG-003",
                status: "SELESAI",
                mode: "VICKREY_AUCTION",
                unitName: "UPC Ranotana",
                unitAddress: "Jl. Sam Ratulangi",
                participants: 3,
                revealedBidCount: 3,
                pendingRevealCount: 0,
                basePrice: 18_000_000,
                finalPrice: 21_000_000,
                winner: "Buyer Ranotana",
                buyerName: "Buyer Ranotana",
                buyerEmail: "buyer.ranotana@example.com",
                buyerPhone: "081211112222",
                transactionId: "trx-superadmin-nota",
                transactionStatus: "SELESAI",
                paymentMethod: "TRANSFER_BANK",
                verifiedBy: "Hendra Wijaya",
                handoverProofUrl:
                  "/uploads/serah-terima/trx-superadmin-nota.jpg",
                handoverProofUploadedAt: "2026-05-31T10:40:00+08:00",
                handoverProofUploadedBy: "Hendra Wijaya",
                reference: "PEG-20260530-003",
                soldAt: "2026-05-31T08:30:00+08:00",
                paymentDeadline: "2026-05-31T10:10:00+08:00",
                visibility: "HASIL_DIBUKA",
                media: [
                  {
                    id: "media-1",
                    type: "foto",
                    url: "/uploads/cincin.jpg",
                    fileName: "cincin.jpg",
                  },
                ],
                primaryMedia: {
                  id: "media-1",
                  type: "foto",
                  url: "/uploads/cincin.jpg",
                  fileName: "cincin.jpg",
                },
                bids: [],
              },
              history: [],
            } as any
          }
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Cetak Nota" }));

      const printFrame = await waitFor(() => {
        const frame = document.querySelector(
          'iframe[data-receipt-print-frame="true"][data-receipt-root-id="superadmin-vickrey-receipt-print-root-trx-superadmin-nota"]',
        ) as HTMLIFrameElement | null;
        expect(frame).not.toBeNull();
        expect(frame?.getAttribute("data-receipt-print-invoked")).toBe("true");
        return frame!;
      });

      expect(openSpy).not.toHaveBeenCalled();
      expect(printSpy).not.toHaveBeenCalled();
      const isolatedReceipt = printFrame.contentDocument?.getElementById(
        "superadmin-vickrey-receipt-print-root-trx-superadmin-nota",
      );
      expect(isolatedReceipt).not.toBeNull();
      expect(isolatedReceipt?.textContent).toContain("Nota Pengambilan Barang");
      expect(isolatedReceipt?.textContent).not.toContain(
        "Superadmin / Detail Barang",
      );
      expect(
        isolatedReceipt!.querySelector(".receipt-output-header-grid"),
      ).not.toBeNull();
      expect(
        isolatedReceipt!.querySelector(".receipt-output-main-grid"),
      ).not.toBeNull();
    } finally {
      Object.defineProperty(window.navigator, "userAgent", {
        configurable: true,
        value: originalUserAgent,
      });
      openSpy.mockRestore();
      printSpy.mockRestore();
    }
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
            {
              id: "blk-2",
              userId: "buyer-2",
              name: "Dian",
              email: "dian@example.com",
              unit: "UPC Wanea",
              total: 1,
              until: "10 Apr 2026",
              reason: "Masa pembatasan telah selesai.",
              status: "Nonaktif",
              countdownAt: new Date("2026-04-10T10:01:05+08:00").toISOString(),
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
    ).toHaveLength(1);
    expect(screen.queryByText(/^1 aktif$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/level 3:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/berakhir terdekat/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lihat detail/i })).toHaveClass(
      "hover:bg-[#006747]",
      "hover:text-white",
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      screen.getAllByText((content) =>
        content.includes("Sisa waktu 1 menit 4 detik"),
      ),
    ).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /berakhir/i }));

    expect(screen.getByText("Dian")).toBeInTheDocument();
    expect(screen.getByText("Masa blokir selesai")).toBeInTheDocument();
  });

  it("renders superadmin violation dossier detail with timeline and countdown", () => {
    render(
      <SuperadminBlacklistDetailWorkspace
        entry={{
          activeAuctionRestriction:
            "Pembatasan akun masih aktif secara nasional.",
          blockedUntilAt: "2026-06-28T14:00:00.000Z",
          email: "buyer.demo13b@email.com",
          history: [
            {
              action: "blokir_otomatis",
              actionLabel: "Blokir otomatis",
              actorLabel: "Sistem otomatis",
              date: "28 Mei 2026",
              note: "Sistem otomatis menerapkan pembatasan Level 2.",
            },
          ],
          lastIncident: "2026-05-28",
          lastIncidentAt: "2026-05-28T14:00:00.000Z",
          level: 2,
          name: "Buyer Demo 13 B",
          reason:
            "User memenangkan lelang tetapi gagal melakukan pelunasan hingga batas waktu berakhir.",
          status: "AKTIF",
          unit: "UPC Ranotana",
          unpaidAuctionTraces: [
            {
              amount: 4500000,
              auctionMode: "VICKREY_AUCTION",
              basePrice: 4000000,
              id: "violation-13b",
              imageUrl: "/uploads/barang/cincin-emas.jpg",
              itemAppraisalValue: 5000000,
              itemName: "Cincin Emas 5 Gram",
              lotLabel: "BRG-13B",
              note: "User memenangkan lelang tetapi gagal melakukan pelunasan hingga batas waktu berakhir.",
              occurredAt: "2026-05-29T06:00:00.000Z",
              occurredAtLabel: "29 Mei 2026, 14.00 WIB",
              paymentDeadline: "2026-05-29T06:00:00.000Z",
              paymentDeadlineLabel: "29 Mei 2026, 14.00 WIB",
              transactionStatus: "menunggu_pembayaran",
              unitName: "UPC Ranotana",
              wonAt: "2026-05-28T06:00:00.000Z",
              wonAtLabel: "28 Mei 2026, 14.00 WIB",
            },
            {
              amount: 2500000,
              auctionMode: "FIXED_PRICE",
              id: "violation-13b-old",
              itemName: "Gelang Emas",
              note: "Pelanggaran sebelumnya sudah selesai.",
              occurredAt: "2026-01-11T14:00:00.000Z",
              occurredAtLabel: "11 Januari 2026, 14.00 WIB",
              paymentDeadline: "2026-01-11T14:00:00.000Z",
              paymentDeadlineLabel: "11 Januari 2026, 14.00 WIB",
              transactionStatus: "gagal_bayar",
              unitName: "UPC Ranotana",
              wonAt: "2026-01-10T14:00:00.000Z",
              wonAtLabel: "10 Januari 2026, 14.00 WIB",
            },
          ],
          until: "2026-06-28",
          userId: "buyer-13b",
          violations: 2,
        }}
        serverNow="2026-06-16T05:15:00.000Z"
      />,
    );

    expect(screen.getByText("Detail Pelanggaran Pengguna")).toBeInTheDocument();
    expect(screen.getAllByText("Buyer Demo 13 B").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cincin Emas 5 Gram").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pelanggaran Level 2/i).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Kasus Terakhir")).toBeInTheDocument();
    expect(
      screen.getByText("Riwayat Pelanggaran (Timeline)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Pelanggaran Tercatat")).toBeInTheDocument();
    expect(screen.getByText("Di Unit Terkait")).toBeInTheDocument();
    expect(screen.getByText("Di Luar Unit")).toBeInTheDocument();
    expect(screen.getByText("Keterangan Level Pelanggaran")).toBeInTheDocument();
    expect(screen.getByText(/Selama 7 hari, buyer tidak bisa menawar pada Lelang Tertutup/i)).toBeInTheDocument();
    expect(screen.getByText(/Pembelian barang Harga Tetap tetap tersedia/i)).toBeInTheDocument();
    expect(screen.getByText(/Selama 30 hari, buyer tidak bisa menawar pada Lelang Tertutup/i)).toBeInTheDocument();
    expect(screen.getByText(/tidak bisa membeli barang Harga Tetap/i)).toBeInTheDocument();
    expect(screen.getByText(/Selama 365 hari, akun buyer ditangguhkan/i)).toBeInTheDocument();
    expect(screen.getByText(/tidak bisa login masuk ke sistem/i)).toBeInTheDocument();
    expect(screen.queryByText(/pembatasan lebih ketat/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/risiko pembatasan lanjutan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/penyelesaian transaksi/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tindak lanjut/i)).not.toBeInTheDocument();
    expect(screen.getByText("Masa Berlaku Hukuman")).toBeInTheDocument();
    expect(screen.getByText("Dtk")).toBeInTheDocument();
    expect(screen.queryByText("Log Keputusan Sistem")).not.toBeInTheDocument();
    expect(screen.queryByText("Ketetapan Level")).not.toBeInTheDocument();
    expect(screen.queryByText("Konteks Lintas Unit")).not.toBeInTheDocument();
    expect(screen.getByText("Masa hukuman selesai")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Tidak Bayar Dalam 1x24 Jam/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/29 Mei 2026.*14.00/i).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(/Rp 4.500.000/i).length).toBeGreaterThan(0);
  });

  it("derives superadmin violation levels from accumulated traces when stored totals are stale", () => {
    render(
      <SuperadminBlacklistDetailWorkspace
        entry={{
          activeAuctionRestriction:
            "Pembatasan akun masih aktif secara nasional.",
          blockedUntilAt: "2026-07-12T12:33:00.000Z",
          email: "buyer.demo13b@email.com",
          history: [],
          lastIncident: "2026-06-12",
          lastIncidentAt: "2026-06-12T12:33:00.000Z",
          level: 2,
          name: "Buyer Demo 13 B",
          reason: "Pemenang tidak membayar dalam 1x24 jam.",
          status: "AKTIF",
          unit: "UPC Ranotana",
          unpaidAuctionCount: 3,
          unpaidAuctionTraces: [
            {
              amount: 110000000,
              id: "violation-current",
              itemName: "Mobil",
              occurredAt: "2026-06-12T12:33:00.000Z",
              occurredAtLabel: "12 Juni 2026, 12.33 WIB",
              transactionId: "trx-current",
            },
            {
              amount: 20000000,
              id: "violation-old-1",
              itemName: "Iphone",
              occurredAt: "2026-05-29T21:36:00.000Z",
              occurredAtLabel: "29 Mei 2026, 21.36 WIB",
              transactionId: "trx-old-1",
            },
            {
              amount: 110000000,
              id: "violation-old-2",
              itemName: "Mobil",
              occurredAt: "2026-05-29T21:36:00.000Z",
              occurredAtLabel: "29 Mei 2026, 21.36 WIB",
              transactionId: "trx-old-2",
            },
          ],
          until: "2026-07-12",
          userId: "buyer-13b",
          violations: 2,
        }}
        serverNow="2026-06-16T11:29:00.000Z"
      />,
    );

    expect(
      screen.getAllByText(/Status: Level 2 \(30 Hari\)/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /Pelanggaran Level 3/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Pelanggaran Level 2/i }),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: /Pelanggaran Level 1/i }),
    ).toHaveLength(1);
    expect(screen.getAllByText(/Kasus #2: Mobil/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Kasus #1: Iphone/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Masa hukuman aktif/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Masa hukuman selesai/i)).toHaveLength(1);
    expect(screen.getByText("Keterangan Level Pelanggaran")).toBeInTheDocument();
    expect(
      screen.getByText(/12 Juni 2026 - 12 Juli 2026/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Pelanggaran Level 1/i }),
    );

    expect(
      screen.getByText(/12 Juni 2026 - 12 Juli 2026/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/12 Juni 2026 - 12 Juni 2027/i),
    ).not.toBeInTheDocument();
  });

  it("routes unit creation to a full page and keeps row actions focused on unit detail", () => {
    render(
      <SuperAdminManagementPage
        admins={[
          {
            id: "admin-1",
            name: "Admin Manado",
            unitId: "unit-1",
            unit: "Pegadaian CP Manado",
            unitCode: "CP-MND-01",
            email: "admin.manado@example.com",
            phone: "-",
            status: "Aktif",
            lastLogin: "-",
          },
          {
            id: "admin-2",
            name: "Admin Wanea",
            unitId: "unit-2",
            unit: "UPC Wanea",
            unitCode: "UPC-WNA-02",
            email: "admin.wanea@example.com",
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
            domicile: "Sulawesi Utara",
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

    expect(screen.getByRole("link", { name: /tambah unit/i })).toHaveAttribute(
      "href",
      "/superadmin/manajemen-unit/tambah",
    );

    expect(
      screen.getByRole("button", { name: /tambah admin unit/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /direktori admin/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/1 unit aktif/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1 rekening utama/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Admin Unit Aktif")).not.toBeInTheDocument();
    expect(screen.getAllByText("CP-MND-01").length).toBeGreaterThan(0);
    const detailLinks = screen.getAllByRole("link", { name: /lihat detail/i });
    const detailLink = detailLinks.find(
      (link) => link.getAttribute("href") === "/superadmin/manajemen-unit/unit-1",
    );

    expect(detailLink).toBeTruthy();
    expect(detailLink!).toHaveAttribute(
      "href",
      "/superadmin/manajemen-unit/unit-1",
    );
    expect(detailLink!).toHaveClass(
      "border-[#d8e4de]",
      "text-[#075b3f]",
      "hover:border-[#006747]",
      "hover:bg-[#006747]",
      "hover:text-white",
    );
    expect(
      detailLinks.find(
        (link) => link.getAttribute("href") === "/superadmin/manajemen-unit/admin/admin-1",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: /^rekening$/i }),
    ).not.toBeInTheDocument();

    const adminSearch = screen.getByRole("textbox", {
      name: /cari admin unit aktif/i,
    });
    fireEvent.change(adminSearch, { target: { value: "wanea" } });

    expect(screen.getByText("Admin Wanea")).toBeInTheDocument();
    expect(screen.queryByText("Admin Manado")).not.toBeInTheDocument();
  });

  it("submits integrated unit setup without using admin NIK as buyer identity", async () => {
    const fetchMock = vi.fn(
      async (path: string | URL | Request, init?: RequestInit) => {
        const url = String(path);

        if (url === "/api/superadmin/unit") {
          return new Response(
            JSON.stringify({
              data: {
                id: "unit-created",
                code: "CP-JKT-12345",
                name: "UPB Pondok Indah",
                address: "Jl. Sultan Iskandar Muda",
              },
            }),
            { status: 201 },
          );
        }

        return new Response(JSON.stringify({ data: [] }), { status: 201 });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<SuperAdminCreateUnitPage />);

    fireEvent.change(screen.getByLabelText(/nomor unit/i), {
      target: { value: "12345" },
    });
    fireEvent.change(screen.getByLabelText(/nama unit/i), {
      target: { value: "UPB Pondok Indah" },
    });
    fireEvent.change(screen.getByLabelText(/alamat lengkap unit/i), {
      target: { value: "Jl. Sultan Iskandar Muda No.18" },
    });
    fireEvent.change(screen.getByLabelText(/domisili/i), {
      target: { value: "DKI Jakarta" },
    });
    expect(screen.getByText("CP-JKT-12345")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/nama bank/i), {
      target: { value: "Mandiri" },
    });
    fireEvent.change(screen.getByLabelText(/nomor rekening/i), {
      target: { value: "1230098765432" },
    });
    fireEvent.change(screen.getByLabelText(/nama pemilik rekening/i), {
      target: { value: "PT Pegadaian UPB Pondok Indah" },
    });
    expect(screen.queryByLabelText(/cabang bank/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /tambah rekening/i }));

    expect(screen.getByText("Mandiri")).toBeInTheDocument();
    expect(
      decodeURIComponent(
        screen
          .getByRole("img", { name: /logo bank mandiri/i })
          .getAttribute("src") ?? "",
      ),
    ).toContain("/uploads/bank-logos/mandiri.png");
    expect(screen.getByText("Utama")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/nama lengkap/i), {
      target: { value: "Andi Setiawan" },
    });
    const adminEmailInput = screen.getByLabelText(/^email/i, {
      selector: "input",
    });
    const adminPasswordInput =
      screen.getByPlaceholderText("Minimal 8 karakter");

    expect(adminEmailInput).toHaveAttribute("autocomplete", "off");
    expect(adminEmailInput).toHaveAttribute("name", "new-admin-contact-email");
    expect(adminEmailInput).toHaveAttribute("readonly");
    expect(adminPasswordInput).toHaveAttribute("autocomplete", "new-password");
    expect(adminPasswordInput).toHaveAttribute(
      "name",
      "new-admin-temporary-password",
    );
    expect(adminPasswordInput).toHaveAttribute("readonly");

    fireEvent.focus(adminEmailInput);
    expect(adminEmailInput).not.toHaveAttribute("readonly");
    expect(adminPasswordInput).not.toHaveAttribute("readonly");

    fireEvent.change(adminEmailInput, {
      target: { value: "andi.setiawan@pegadaian.co.id" },
    });
    fireEvent.change(screen.getByLabelText(/nik admin/i), {
      target: { value: "7371122301990001" },
    });
    fireEvent.change(adminPasswordInput, {
      target: { value: "SandiRahasia1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /tambah admin/i }));

    expect(screen.getByText("7371********0001")).toBeInTheDocument();
    expect(screen.getByText("********")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /tampilkan password andi setiawan/i }),
    );
    expect(screen.getByText("SandiRahasia1")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: /simpan & aktivasi unit pelaksana/i,
        }),
      );
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/superadmin/unit",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/superadmin/admin",
      expect.anything(),
    );

    const unitRequest = fetchMock.mock.calls.find(
      ([path]) => String(path) === "/api/superadmin/unit",
    )?.[1] as RequestInit | undefined;
    const unitBody = JSON.parse(String(unitRequest?.body ?? "{}"));
    const adminBody = unitBody.admins[0];

    expect(unitBody.domicile).toBe("DKI Jakarta");
    expect(unitBody.unitNumber).toBe("12345");
    expect(unitBody).not.toHaveProperty("code");
    expect(unitBody.primaryAccount).not.toHaveProperty("branchName");
    expect(adminBody).toMatchObject({
      name: "Andi Setiawan",
      email: "andi.setiawan@pegadaian.co.id",
      temporaryPassword: "SandiRahasia1",
    });
    expect(adminBody).not.toHaveProperty("nationalId");
  });

  it("renders management units as a paginated compact ledger with full page numbers", () => {
    const units = Array.from({ length: 82 }, (_, index) => {
      const number = index + 1;

      return {
        id: `unit-${number}`,
        code: `CP-MND-${String(number).padStart(2, "0")}`,
        name: `Pegadaian CP Unit ${String(number).padStart(2, "0")}`,
        address: `Jl. Sam Ratulangi No. ${number}`,
        domicile: "Sulawesi Utara",
        status:
          number === 1 ? "Nonaktif" : number === 2 ? "Perlu Review" : "Aktif",
        adminCount: number % 3 === 0 ? 2 : 1,
        accountCount: 1,
        activeAccount: {
          id: `rek-${number}`,
          bankName: "BRI",
          accountNumber: `12345678${String(number).padStart(2, "0")}`,
          accountHolder: `PT Pegadaian Unit ${number}`,
          branch: "Manado",
          status: "AKTIF",
        },
      };
    });

    render(
      <SuperAdminManagementPage
        admins={[
          {
            id: "admin-1",
            name: "Admin Manado",
            unitId: "unit-1",
            unit: "Pegadaian CP Admin Feed",
            email: "admin.manado@example.com",
            phone: "-",
            status: "Aktif",
            lastLogin: "-",
          },
        ]}
        units={units}
      />,
    );

    expect(screen.getByText("Pegadaian CP Unit 01")).toBeInTheDocument();
    expect(screen.getByText("Pegadaian CP Unit 10")).toBeInTheDocument();
    expect(screen.queryByText("Nonaktif")).not.toBeInTheDocument();
    expect(screen.queryByText("Perlu Review")).not.toBeInTheDocument();
    expect(screen.queryByText("Pegadaian CP Unit 11")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Menampilkan/)[0]).toHaveTextContent(
      "1 sampai 10 dari 82 unit",
    );
    expect(screen.queryByText("...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "9" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "10" })[0]);
    const listbox = screen.getByRole("listbox");

    expect(
      within(listbox).getByRole("option", { name: "10" }),
    ).toBeInTheDocument();
    expect(
      within(listbox).getByRole("option", { name: "20" }),
    ).toBeInTheDocument();
    expect(
      within(listbox).getByRole("option", { name: "50" }),
    ).toBeInTheDocument();

    fireEvent.click(within(listbox).getByRole("option", { name: "20" }));

    expect(screen.getByText("Pegadaian CP Unit 20")).toBeInTheDocument();
    expect(screen.queryByText("Pegadaian CP Unit 21")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Menampilkan/)[0]).toHaveTextContent(
      "1 sampai 20 dari 82 unit",
    );
  });

  it("opens the add-admin modal with the animated unit selector", () => {
    render(
      <SuperAdminManagementPage
        admins={[
          {
            id: "admin-1",
            name: "Admin Manado",
            unitId: "unit-1",
            unit: "Pegadaian CP Manado",
            email: "admin.manado@example.com",
            phone: "081234567890",
            status: "Aktif",
            lastLogin: "15 Juli 2026, 10.00",
          },
        ]}
        units={[
          {
            id: "unit-1",
            code: "CP-MND-01",
            name: "Pegadaian CP Manado",
            address: "Jl. Sam Ratulangi",
            domicile: "Sulawesi Utara",
            status: "Aktif",
            adminCount: 1,
            accountCount: 1,
            activeAccount: null,
          },
          {
            id: "unit-2",
            code: "CP-JKT-02",
            name: "Pegadaian CP Jakarta",
            address: "Jl. Sudirman",
            domicile: "DKI Jakarta",
            status: "Aktif",
            adminCount: 0,
            accountCount: 1,
            activeAccount: null,
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /tambah admin unit/i }),
    );

    const dialog = screen.getByRole("dialog", { name: /tambah admin unit/i });
    expect(within(dialog).getByLabelText(/unit penugasan admin unit/i)).toBeInTheDocument();
    expect(within(dialog).getAllByText(/Pegadaian CP Manado/).length).toBeGreaterThan(0);

    fireEvent.click(within(dialog).getByRole("button", { name: /Pegadaian CP Manado/i }));

    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByRole("option", { name: /Pegadaian CP Jakarta/i })).toBeInTheDocument();
  });

  it("routes admin detail to a full account page without opening a popup", () => {
    render(
      <SuperAdminManagementPage
        admins={[
          {
            id: "admin-1",
            name: "Admin Manado",
            unitId: "unit-1",
            unit: "Pegadaian CP Manado",
            unitCode: "CP-MND-01",
            email: "admin.manado@example.com",
            phone: "081234567890",
            status: "Aktif",
            lastLogin: "15 Juli 2026, 10.00",
          },
        ]}
        units={[]}
      />,
    );

    const adminDetailLink = screen.getByRole("link", { name: /lihat detail/i });

    expect(adminDetailLink).toHaveAttribute(
      "href",
      "/superadmin/manajemen-unit/admin/admin-1",
    );
    expect(screen.queryByRole("dialog", { name: /detail admin unit/i })).not.toBeInTheDocument();
  });

  it("renders admin unit account detail as a full page without audit log", () => {
    render(
      <SuperAdminManagementAdminDetailPage
        admin={{
          id: "admin-1",
          name: "Admin Manado",
          unitId: "unit-1",
          unit: "Pegadaian CP Manado",
          unitCode: "CP-MND-01",
          email: "admin.manado@example.com",
          phone: "081234567890",
          status: "Aktif",
          lastLogin: "15 Juli 2026, 10.00",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: /detail akun admin unit/i })).toBeInTheDocument();
    expect(screen.getAllByText("Admin Manado").length).toBeGreaterThan(0);
    expect(screen.getByText(/CP-MND-01/)).toBeInTheDocument();
    expect(screen.getByText("15 Juli 2026, 10.00")).toBeInTheDocument();
    expect(screen.getByText("Login Terakhir").closest("div")).toHaveTextContent("15 Juli 2026, 10.00");
    expect(screen.queryByText("Unit Penugasan")).not.toBeInTheDocument();
    expect(screen.queryByText("Kode Unit")).not.toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.queryByText("Akses & Penugasan")).not.toBeInTheDocument();
    expect(screen.queryByTestId("superadmin-account-audit-list")).not.toBeInTheDocument();
  });

  it("renders read-only violation policy page", () => {
    render(<SuperAdminPolicyPage />);

    expect(screen.getByText("Kebijakan Pelanggaran")).toBeInTheDocument();
    expect(screen.getByText(/no payment within 24 hours/i)).toBeInTheDocument();
    expect(screen.getByText("TIER 1 - STRIKE ONE")).toBeInTheDocument();
    expect(screen.getByText("TIER 2 - STRIKE TWO")).toBeInTheDocument();
    expect(screen.getByText("TIER 3 - SYSTEM REJECTION")).toBeInTheDocument();
    expect(screen.getByText(/bid lelang: ban 7 hari/i)).toBeInTheDocument();
    expect(screen.getByText(/harga tetap: aktif/i)).toBeInTheDocument();
    expect(screen.getByText(/ban total 360 hari/i)).toBeInTheDocument();
    expect(screen.getByText(/pemulihan otomatis/i)).toBeInTheDocument();
    expect(screen.queryByText("Aturan Aktif Sistem")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Masuk Perlu Tindak Lanjut"),
    ).not.toBeInTheDocument();
  });
});
