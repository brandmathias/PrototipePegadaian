import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { LoginHistoryDialog } from "@/components/buyer/login-history-dialog";

describe("LoginHistoryDialog", () => {
  it("keeps the dialog header visible while the content area owns scrolling", () => {
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
    expect(dialog.firstElementChild).toHaveClass("modal-viewport");
    expect(dialog.firstElementChild).toHaveClass("flex-col");

    expect(screen.getByText("Riwayat Sesi Login")).toBeInTheDocument();
    expect(screen.getByText("Sesi aktif saat ini")).toBeInTheDocument();

    const contentScroller = screen.getByTestId("login-history-dialog-scroll");
    expect(contentScroller).toHaveClass("overflow-y-auto");
    expect(contentScroller).toHaveClass("overscroll-contain");
  });
});
