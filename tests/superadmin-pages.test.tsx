import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SuperAdminBlacklistPage,
  SuperAdminDashboardPage,
  SuperAdminMonitoringPage
} from "@/components/pages/superadmin-pages";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
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
    render(
      <SuperAdminDashboardPage
        summary={{
          headline: "Pantau seluruh unit dari satu control center.",
          metrics: [{ label: "Total Unit", value: "2", detail: "2 aktif" }],
          spotlight: [],
          priorities: []
        }}
        unitsNeedAttention={[]}
        pendingMonitoring={[]}
      />
    );

    expect(screen.getByText("Pantau seluruh unit dari satu control center.")).toBeInTheDocument();
    expect(screen.getByText("Total Unit")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("updates superadmin countdown on dashboard monitoring cards", () => {
    render(
      <SuperAdminDashboardPage
        summary={{
          headline: "Pantau seluruh unit dari satu control center.",
          metrics: [{ label: "Total Unit", value: "2", detail: "2 aktif" }],
          spotlight: [],
          priorities: []
        }}
        unitsNeedAttention={[]}
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
              expiredLabel: "SLA terlewati"
            }
          ] as any
        }
      />
    );

    expect(
      screen.getByText((content) => content.includes("Sisa waktu 1 menit 5 detik"))
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      screen.getByText((content) => content.includes("Sisa waktu 1 menit 4 detik"))
    ).toBeInTheDocument();
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
              priorities: []
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
                countdownAt: new Date("2026-04-29T10:00:45+08:00").toISOString(),
                expiredLabel: "Sesi berakhir"
              }
            ]
          } as any
        }
      />
    );

    expect(
      screen.getByText((content) => content.includes("Sisa waktu 45 detik"))
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      screen.getByText((content) => content.includes("Sisa waktu 44 detik"))
    ).toBeInTheDocument();
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
              expiredLabel: "Masa blokir selesai"
            }
          ] as any
        }
      />
    );

    expect(
      screen.getAllByText((content) => content.includes("Sisa waktu 1 menit 5 detik"))
    ).toHaveLength(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      screen.getAllByText((content) => content.includes("Sisa waktu 1 menit 4 detik"))
    ).toHaveLength(2);
  });
});
