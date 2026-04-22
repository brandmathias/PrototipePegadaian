import React from "react";
import { render, screen } from "@testing-library/react";

import { AdminDashboardPage } from "@/components/pages/admin-dashboard-page";

describe("AdminDashboardPage", () => {
  it("renders operational summary and latest transaction table", () => {
    render(<AdminDashboardPage />);

    expect(screen.getByText(/ringkasan operasional unit/i)).toBeInTheDocument();
    expect(screen.getByText(/barang aktif/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /transaksi terbaru/i })).toBeInTheDocument();
  });
});
