import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReportRangeDropdown } from "@/components/shared/report-range-dropdown";

describe("ReportRangeDropdown", () => {
  it("keeps a long selected range label readable", () => {
    render(
      <ReportRangeDropdown
        onChange={vi.fn()}
        options={[
          {
            value: "long",
            label: "Rentang Penjualan Nasional Berjalan",
          },
        ]}
        value="long"
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Filter rentang waktu: Rentang Penjualan Nasional Berjalan",
    });

    expect(trigger).toHaveClass("max-w-full", "h-auto");
    expect(trigger).toHaveAttribute("data-allow-wrap", "true");
    expect(trigger.querySelector(".whitespace-normal")).toHaveTextContent(
      "Rentang Penjualan Nasional Berjalan",
    );
  });
});
