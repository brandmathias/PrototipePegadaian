import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { AdminDashboardPage } from "@/components/pages/admin-dashboard-page";

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T10:00:00+08:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders operational summary and latest transaction table", () => {
    render(<AdminDashboardPage />);

    expect(screen.getByText(/ringkasan hari ini/i)).toBeInTheDocument();
    expect(screen.getByText(/barang gadai aktif/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /pembayaran yang perlu ditangani/i })).toBeInTheDocument();
  });

  it("updates admin transaction countdowns in real time", () => {
    render(
      <AdminDashboardPage
        data={{
          summary: {
            unitName: "Admin Unit Demo",
            activeBank: "BRI 0123",
            subtitle: "Demo"
          },
          inventory: [],
          blacklist: [],
          transactions: [
            {
              id: "TRX-1",
              lot: "Laptop Demo",
              buyer: "Raras",
              status: "MENUNGGU_PEMBAYARAN",
              method: "TRANSFER_BANK",
              deadline: "1 menit 5 detik",
              deadlineAt: new Date("2026-04-29T10:01:05+08:00").toISOString()
            }
          ]
        }}
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
});
