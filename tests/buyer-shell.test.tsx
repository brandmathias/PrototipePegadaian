import React from "react";
import { render, screen } from "@testing-library/react";

import { BuyerShell } from "@/components/layout/buyer-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn()
  })
}));

describe("BuyerShell", () => {
  it("renders buyer summary details from provided database-backed summary", () => {
    render(
      <BuyerShell
        buyer={{
          id: "buyer-001",
          name: "Raras Maheswari",
          email: "raras@example.com",
          role: "buyer",
          phoneNumber: null
        }}
        description="Ringkasan akun pembeli."
        summary={{
          memberSince: "29 April 2026",
          blacklist: {
            active: true,
            until: "5 Mei 2026",
            reason: "Akun dibatasi sementara.",
            violations: 2
          }
        }}
        title="Akun Pembeli"
      >
        <div>Konten akun</div>
      </BuyerShell>
    );

    expect(screen.getByText(/member sejak 29 april 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/blacklist aktif sampai 5 mei 2026/i)).toBeInTheDocument();
    expect(screen.getByText("Konten akun")).toBeInTheDocument();
  });
});
