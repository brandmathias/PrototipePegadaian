import React from "react";
import { render, screen } from "@testing-library/react";

import { PublicShell } from "@/components/layout/public-shell";
import { ToastProvider } from "@/components/ui/toast";

vi.mock("next/navigation", () => ({
  usePathname: () => "/katalog",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams("")
}));

describe("PublicShell", () => {
  it("keeps buyer navigation when an authenticated buyer opens the public catalog", () => {
    render(
      <ToastProvider>
        <PublicShell
          viewer={{
            name: "Raras Maheswari",
            role: "buyer",
            homeHref: "/dashboard"
          }}
        >
          <div>Konten katalog</div>
        </PublicShell>
      </ToastProvider>
    );

    expect(screen.getByRole("link", { name: "Beranda" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Katalog" })).toHaveAttribute("href", "/katalog");
    expect(screen.getByRole("link", { name: "Transaksi" })).toHaveAttribute("href", "/transaksi");
    expect(screen.getByRole("link", { name: "Raras Maheswari" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("button", { name: /keluar/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Masuk" })).not.toBeInTheDocument();
  });
});
