import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SuperAdminDashboardPage } from "@/components/pages/superadmin-pages";

describe("superadmin pages", () => {
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
});
