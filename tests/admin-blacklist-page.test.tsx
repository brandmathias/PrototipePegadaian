import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { AdminBlacklistPage } from "@/components/pages/admin-pages";

function makeBlacklistEntry(index: number) {
  return {
    userId: `user-${index}`,
    name: `Pengguna ${index}`,
    violations: index,
    unit: "Ranotana",
    until: "25 Mei 2026",
    activeAuctionRestriction: "Tidak dapat mengikuti lelang aktif.",
    status: "AKTIF"
  };
}

describe("AdminBlacklistPage", () => {
  it("paginates blacklist entries with shared row options", () => {
    render(<AdminBlacklistPage entries={Array.from({ length: 11 }, (_, index) => makeBlacklistEntry(index + 1))} />);

    expect(screen.getByText("Pengguna 1")).toBeInTheDocument();
    expect(screen.queryByText("Pengguna 11")).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "50" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "100" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(screen.getByText("Pengguna 11")).toBeInTheDocument();
  });
});
