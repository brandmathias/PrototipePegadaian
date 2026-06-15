import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { LoginHistoryDialog } from "@/components/buyer/login-history-dialog";

describe("LoginHistoryDialog", () => {
  it("renders through the same viewport-safe portal pattern as other popups", () => {
    render(
      <LoginHistoryDialog
        activeSessionCount={2}
        entries={[
          "15 Jun 2026, 13.48 WIB",
          "12 Jun 2026, 12.29 WIB",
          "4 Mei 2026, 16.33 WIB",
          "1 Mei 2026, 21.45 WIB",
          "1 Mei 2026, 21.14 WIB",
          "28 Apr 2026, 09.10 WIB"
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /sesi login/i }));

    const dialog = screen.getByRole("dialog", { name: /riwayat sesi login/i });
    const panel = screen.getByTestId("login-history-dialog-panel");

    expect(dialog.parentElement).toBe(document.body);
    expect(dialog).toHaveClass("fixed");
    expect(dialog).toHaveClass("inset-0");
    expect(dialog).toHaveClass("z-[140]");
    expect(dialog).toHaveClass("overflow-y-auto");
    expect(panel).toHaveClass("modal-viewport");
    expect(panel).toHaveClass("z-[141]");
    expect(screen.getByText("Riwayat Sesi Login")).toBeInTheDocument();
    expect(screen.getByText("Sesi aktif saat ini")).toBeInTheDocument();
  });
});
