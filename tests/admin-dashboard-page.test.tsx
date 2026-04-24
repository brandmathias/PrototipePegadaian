import React from "react";
import { render, screen } from "@testing-library/react";

import { AdminDashboardPage } from "@/components/pages/admin-dashboard-page";

describe("AdminDashboardPage", () => {
  it("renders operational summary and latest transaction table", () => {
    render(<AdminDashboardPage />);

    expect(screen.getByText(/ringkasan hari ini/i)).toBeInTheDocument();
    expect(screen.getByText(/barang gadai aktif/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /pembayaran yang perlu ditangani/i })).toBeInTheDocument();
  });
});
