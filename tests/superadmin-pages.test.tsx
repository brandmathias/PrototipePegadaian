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

    const vickreyToggle = screen
      .getAllByRole("button", { name: /Lelang Tertutup/i })
      .find((button) => button.getAttribute("aria-pressed") === "true");
    expect(vickreyToggle).toBeDefined();
    expect(vickreyToggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(vickreyToggle!);

    expect(vickreyToggle).toHaveAttribute("aria-pressed", "false");

    const aprilHotspot = screen.getByRole("button", {
      name: /Apr: Lelang Tertutup Rp 36.000.000/i,
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
    expect(screen.queryByText("Monitoring sedang tenang")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Grafik barang pada tiap unit" }),
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
      screen.getByRole("columnheader", { name: "Perlu Tindak Lanjut" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Status Unit" }),
    ).not.toBeInTheDocument();
    const metricCard = screen.getByLabelText("Ringkasan Barang Jaminan");
    fireEvent.mouseEnter(metricCard);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Unit tercatat");
    fireEvent.mouseLeave(metricCard);

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
    expect(screen.getAllByRole("link", { name: "Detail" })[0]).toHaveAttribute(
      "href",
      "/superadmin/unit/unit-1",
    );
    expect(screen.queryByText("Kelola Rekening")).not.toBeInTheDocument();
    expect(screen.queryByText(/risk heat indicator/i)).not.toBeInTheDocument();
  }, 10000);

  it("renders superadmin unit detail as an edit setup page without inventory canvas", () => {
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
          itemNumber === 3 ? "Lelang Tertutup" : itemNumber === 4 ? "Harga Tetap" : "Belum dipasarkan",
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

    expect(screen.getByRole("heading", { name: "Detail & Edit Unit Pelaksana" })).toBeInTheDocument();
    expect(screen.getByText("UPC Ranotana (CP-MND-13)")).toBeInTheDocument();
    expect(screen.getByText("Unit Pelayanan Cabang")).toBeInTheDocument();
    expect(screen.getByText("Profil & Lokasi Unit")).toBeInTheDocument();
    expect(screen.getByText("Rekening Operasional Cabang")).toBeInTheDocument();
    expect(screen.getByText("Otoritas Admin Penanggung Jawab")).toBeInTheDocument();
    expect(screen.getByDisplayValue("CP-MND-13")).toBeInTheDocument();
    expect(screen.getByDisplayValue("UPC Ranotana")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jl. Sam Ratulangi")).toBeInTheDocument();
    expect(screen.getByText("Daftar Rekening Terdaftar (1)")).toBeInTheDocument();
    expect(screen.getAllByText("Bank Mandiri").length).toBeGreaterThan(0);
    expect(screen.queryByText(/^1 rekening$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^1 admin$/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lihat detail rekening bank mandiri/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hapus rekening bank mandiri/i })).toBeInTheDocument();
    expect(screen.getByText("Daftar Admin Unit Terdaftar (1)")).toBeInTheDocument();
    expect(screen.getByText("Admin Ranotana")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lihat detail admin admin ranotana/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hapus admin admin ranotana/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/cabang bank/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tambah rekening/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tambah admin/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /simpan rekening/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /simpan admin unit/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/unit penugasan/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/nik admin/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /simpan perubahan/i })).toHaveAttribute(
      "form",
      "superadmin-unit-profile-unit-1",
    );
    expect(screen.getByRole("link", { name: /^kembali$/i })).toHaveAttribute(
      "href",
      "/superadmin/manajemen-unit",
    );
    expect(screen.queryByText("Inventori Barang Unit")).not.toBeInTheDocument();
    expect(screen.queryByText("Guci Antik 01")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Kategori Barang" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Menampilkan 1-10 dari 12 barang/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /lihat detail rekening bank mandiri/i }));
    const accountDialog = screen.getByRole("dialog", { name: "Detail Rekening Unit" });
    expect(within(accountDialog).getByText("Bank Mandiri")).toBeInTheDocument();
    expect(within(accountDialog).getByText("1230098765432")).toBeInTheDocument();
    expect(within(accountDialog).getByText("PT Pegadaian UPC Ranotana")).toBeInTheDocument();
    expect(within(accountDialog).getByText("Manado")).toBeInTheDocument();
    fireEvent.click(within(accountDialog).getByRole("button", { name: /tutup panel detail/i }));

    fireEvent.click(screen.getByRole("button", { name: /lihat detail admin admin ranotana/i }));
    const adminDialog = screen.getByRole("dialog", { name: "Detail Admin Unit" });
    expect(within(adminDialog).getByText("Admin Ranotana")).toBeInTheDocument();
    expect(within(adminDialog).getByText("admin.ranotana@pegadaian.co.id")).toBeInTheDocument();
    expect(within(adminDialog).getByText("081245678901")).toBeInTheDocument();
  });

  it("returns to management after saving unit profile changes", async () => {
    vi.useRealTimers();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            id: "unit-1",
            code: "CP-MND-13",
            name: "UPC Ranotana",
            address: "Jl. Sam Ratulangi",
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <UnitForm
        initialValue={{
          code: "CP-MND-13",
          name: "UPC Ranotana",
          address: "Jl. Sam Ratulangi",
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
  });

  it("keeps superadmin item status helper synchronized with due date", async () => {
    process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/prototipe_pegadaian";

    const { getUnitItemOperationalState, resolveUnitMarketingModeLabel } = await import("@/lib/services/unit.service");
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
      }).operationalStatus,
    ).toBe("Sedang Dipasarkan");

    expect(
      getUnitItemOperationalState({
        activeMarketingMode: "fixed_price",
        activeMarketingStatus: "aktif",
        itemStatus: "dipasarkan",
        dueDate: new Date("2026-07-01T00:00:00.000Z"),
        now,
        transactionStatus: "bukti_diunggah",
      }).operationalStatus,
    ).toBe("Bukti Diunggah");

    expect(
      getUnitItemOperationalState({
        itemStatus: "menunggu_pembayaran",
        dueDate: new Date("2026-05-01T00:00:00.000Z"),
        now,
      }).operationalStatus,
    ).toBe("Menunggu Pembayaran");
  }, 10000);

  it("keeps inventory rows hidden on superadmin unit detail even when item data exists", () => {
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
          itemNumber === 3 ? "Lelang Tertutup" : itemNumber === 4 ? "Harga Tetap" : "Belum dipasarkan",
        operationalStatus:
          itemNumber === 3
            ? "Sedang Dipasarkan"
            : itemNumber === 4
              ? "Ada Tindak Lanjut"
              : itemNumber === 5
                ? "Terjual"
                : "Siap Dipasarkan",
        operationalTone:
          itemNumber === 3
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
            activeAccount: null,
            accounts: [],
            admins: [],
            items: unitItems,
          } as any
        }
      />,
    );

    expect(screen.getByText("UPC Ranotana (CP-MND-13)")).toBeInTheDocument();
    expect(screen.getByText("Profil & Lokasi Unit")).toBeInTheDocument();
    expect(screen.queryByText("Inventori Barang Unit")).not.toBeInTheDocument();
    expect(screen.queryByText("Guci Antik 01")).not.toBeInTheDocument();
    expect(screen.queryByText("Guci Antik 12")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Kategori Barang" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Mode Pemasaran" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Jumlah barang per halaman" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Menampilkan 1-10 dari 12 barang/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Detail" })).not.toBeInTheDocument();
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
              loanValue: 17_000_000,
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
    expect(screen.getByText("Bidders Ranking Table (Arsip)")).toBeInTheDocument();
    expect(screen.getByText("Harga Bayar")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 21.000.000").length).toBeGreaterThan(0);
    expect(screen.getByText("Lelang Selesai Sempurna - Aset Telah Diserahkan")).toBeInTheDocument();
    expect(screen.getByText("Manifes Penyerahan & Pemenang")).toBeInTheDocument();
    expect(screen.getByText("Mekanisme Lelang (Arsip)")).toBeInTheDocument();
    expect(screen.getByText("Progress Penyelesaian")).toBeInTheDocument();
    expect(screen.getByText("Nota Dokumen Final")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cetak Nota" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tutup & Arsipkan Berkas Lelang" })).toBeInTheDocument();
    expect(screen.getAllByText("Iterasi 2 (Terkini)").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Iterasi 2 \(Terkini\)/i }));
    fireEvent.click(screen.getAllByRole("option", { name: "Iterasi 1" })[1]);
    expect(screen.getByText("Sesi Harga Tetap Diarsipkan")).toBeInTheDocument();
    expect(screen.getByText("Ringkasan Sesi Harga Tetap")).toBeInTheDocument();
    expect(screen.getByText("Harga Tetap")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 20.000.000").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ranking Bid")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cetak Nota" })).not.toBeInTheDocument();
    expect(screen.getByText("Riwayat Kronologi Aset")).toBeInTheDocument();
    expect(screen.queryByText("Edit Data Barang")).not.toBeInTheDocument();
    expect(screen.queryByText("Pasarkan Barang")).not.toBeInTheDocument();
    expect(screen.queryByText("Catat Penebusan")).not.toBeInTheDocument();
    expect(screen.queryByText("Catat Perpanjangan")).not.toBeInTheDocument();
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

  it("renders superadmin violation dossier detail with timeline and countdown", () => {
    render(
      <SuperadminBlacklistDetailWorkspace
        entry={{
          activeAuctionRestriction: "Pembatasan akun masih aktif secara nasional.",
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
          reason: "User memenangkan lelang tetapi gagal melakukan pelunasan hingga batas waktu berakhir.",
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
              occurredAt: "2026-05-28T06:00:00.000Z",
              occurredAtLabel: "28 Mei 2026, 14.00 WIB",
              paymentDeadlineLabel: "29 Mei 2026, 14.00 WIB",
              transactionStatus: "menunggu_pembayaran",
              unitName: "UPC Ranotana",
            },
            {
              amount: 2500000,
              auctionMode: "FIXED_PRICE",
              id: "violation-13b-old",
              itemName: "Gelang Emas",
              note: "Pelanggaran sebelumnya sudah selesai.",
              occurredAt: "2026-01-10T14:00:00.000Z",
              occurredAtLabel: "10 Januari 2026, 14.00 WIB",
              paymentDeadlineLabel: "11 Januari 2026, 14.00 WIB",
              transactionStatus: "gagal_bayar",
              unitName: "UPC Ranotana",
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
    expect(screen.getAllByText(/Pelanggaran Level 2/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Kasus Pemicu Utama")).toBeInTheDocument();
    expect(screen.getByText("Riwayat Pelanggaran (Timeline)")).toBeInTheDocument();
    expect(screen.getByText("Masa Berlaku Hukuman")).toBeInTheDocument();
    expect(screen.getByText("Dtk")).toBeInTheDocument();
    expect(screen.getByText("Log Keputusan Sistem")).toBeInTheDocument();
    expect(screen.getByText("Masa hukuman selesai")).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Tidak Bayar Dalam 1x24 Jam/i,
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/29 Mei 2026.*14.00/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Rp 4.500.000/i).length).toBeGreaterThan(0);
  });

  it("derives superadmin violation levels from accumulated traces when stored totals are stale", () => {
    render(
      <SuperadminBlacklistDetailWorkspace
        entry={{
          activeAuctionRestriction: "Pembatasan akun masih aktif secara nasional.",
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

    expect(screen.getAllByText(/Status: Level 2 \(30 Hari\)/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Pelanggaran Level 3/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Pelanggaran Level 2/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /Pelanggaran Level 1/i })).toHaveLength(1);
    expect(screen.getAllByText(/Kasus #2: Mobil/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Kasus #1: Iphone/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Masa hukuman aktif/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Masa hukuman selesai/i)).toHaveLength(1);
    expect(screen.getByText(/Transaksi baru dibatasi/i)).toBeInTheDocument();
    expect(screen.getByText(/12 Juni 2026 - 12 Juli 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Pelanggaran Level 1/i }));

    expect(screen.getByText(/12 Juni 2026 - 12 Juli 2026/i)).toBeInTheDocument();
    expect(screen.queryByText(/12 Juni 2026 - 12 Juni 2027/i)).not.toBeInTheDocument();
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

    expect(screen.getByRole("link", { name: /tambah unit/i })).toHaveAttribute(
      "href",
      "/superadmin/manajemen-unit/tambah",
    );

    expect(screen.queryByRole("button", { name: /tambah admin/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /direktori admin/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lihat detail/i })).toHaveAttribute(
      "href",
      "/superadmin/unit/unit-1",
    );
    expect(screen.queryByRole("link", { name: /^rekening$/i })).not.toBeInTheDocument();
  });

  it("submits integrated unit setup without using admin NIK as buyer identity", async () => {
    const fetchMock = vi.fn(async (path: string | URL | Request, init?: RequestInit) => {
      const url = String(path);

      if (url === "/api/superadmin/unit") {
        return new Response(
          JSON.stringify({
            data: {
              id: "unit-created",
              code: "UPB-2026-0123",
              name: "UPB Pondok Indah",
              address: "Jl. Sultan Iskandar Muda",
            },
          }),
          { status: 201 },
        );
      }

      return new Response(JSON.stringify({ data: [] }), { status: 201 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SuperAdminCreateUnitPage />);

    fireEvent.change(screen.getByLabelText(/kode unit/i), {
      target: { value: "UPB-2026-0123" },
    });
    fireEvent.change(screen.getByLabelText(/nama unit/i), {
      target: { value: "UPB Pondok Indah" },
    });
    fireEvent.change(screen.getByLabelText(/alamat lengkap unit/i), {
      target: { value: "Jl. Sultan Iskandar Muda No.18" },
    });

    fireEvent.change(screen.getByLabelText(/nama bank/i), {
      target: { value: "Bank Mandiri" },
    });
    fireEvent.change(screen.getByLabelText(/nomor rekening/i), {
      target: { value: "1230098765432" },
    });
    fireEvent.change(screen.getByLabelText(/nama pemilik rekening/i), {
      target: { value: "PT Pegadaian UPB Pondok Indah" },
    });
    expect(screen.queryByLabelText(/cabang bank/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /tambah rekening/i }));

    expect(screen.getByText("mandiri")).toBeInTheDocument();
    expect(screen.getByText("Utama")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/nama lengkap/i), {
      target: { value: "Andi Setiawan" },
    });
    const adminEmailInput = screen.getByLabelText(/^email/i, { selector: "input" });
    const adminPasswordInput = screen.getByPlaceholderText("Minimal 8 karakter");

    expect(adminEmailInput).toHaveAttribute("autocomplete", "off");
    expect(adminEmailInput).toHaveAttribute("name", "new-admin-contact-email");
    expect(adminEmailInput).toHaveAttribute("readonly");
    expect(adminPasswordInput).toHaveAttribute("autocomplete", "new-password");
    expect(adminPasswordInput).toHaveAttribute("name", "new-admin-temporary-password");
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

    fireEvent.click(screen.getByRole("button", { name: /tampilkan password andi setiawan/i }));
    expect(screen.getByText("SandiRahasia1")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /simpan & aktivasi unit pelaksana/i }));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/superadmin/unit",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/superadmin/admin",
      expect.anything(),
    );

    const unitRequest = fetchMock.mock.calls.find(([path]) => String(path) === "/api/superadmin/unit")?.[1] as
      | RequestInit
      | undefined;
    const unitBody = JSON.parse(String(unitRequest?.body ?? "{}"));
    const adminBody = unitBody.admins[0];

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
        status: number === 1 ? "Nonaktif" : number === 2 ? "Perlu Review" : "Aktif",
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
    expect(screen.getByText(/Menampilkan/).textContent).toContain("1 sampai 10 dari 82 unit");
    expect(screen.queryByText("...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "9" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "10" }));
    const listbox = screen.getByRole("listbox");

    expect(within(listbox).getByRole("option", { name: "10" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "20" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "50" })).toBeInTheDocument();

    fireEvent.click(within(listbox).getByRole("option", { name: "20" }));

    expect(screen.getByText("Pegadaian CP Unit 20")).toBeInTheDocument();
    expect(screen.queryByText("Pegadaian CP Unit 21")).not.toBeInTheDocument();
    expect(screen.getByText(/Menampilkan/).textContent).toContain("1 sampai 20 dari 82 unit");
  });

  it("renders read-only violation policy page", () => {
    render(<SuperAdminPolicyPage />);

    expect(screen.getByText("Kebijakan Pelanggaran")).toBeInTheDocument();
    expect(
      screen.getByText(/no payment within 24 hours/i),
    ).toBeInTheDocument();
    expect(screen.getByText("TIER 1 - STRIKE ONE")).toBeInTheDocument();
    expect(screen.getByText("TIER 2 - STRIKE TWO")).toBeInTheDocument();
    expect(screen.getByText("TIER 3 - SYSTEM REJECTION")).toBeInTheDocument();
    expect(
      screen.getByText(/bid lelang: ban 7 hari/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/harga tetap: aktif/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ban total 360 hari/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/evaluasi manual oleh superadmin/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Aturan Aktif Sistem")).not.toBeInTheDocument();
    expect(screen.queryByText("Masuk Perlu Tindak Lanjut")).not.toBeInTheDocument();
  });
});
