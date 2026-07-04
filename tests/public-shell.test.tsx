import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { PublicShell } from "@/components/layout/public-shell";
import { LoginPage } from "@/components/pages/login-page";
import { RegisterPage } from "@/components/pages/public-pages";
import { ToastProvider } from "@/components/ui/toast";

vi.mock("next/navigation", () => ({
  usePathname: () => "/katalog",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams("")
}));

function expectOptimizedBrandImages(container: Element, large = false, markPriority: "high" | "low" = "low") {
  const images = container.querySelectorAll("img");

  expect(images).toHaveLength(2);
  images.forEach((image) => {
    expect(image).toHaveAttribute("loading", "eager");
    expect(image).not.toHaveAttribute("sizes");
  });
  expect(images[0]).toHaveAttribute("fetchpriority", markPriority);
  expect(images[1]).toHaveAttribute("fetchpriority", "high");
  expect(images[0]).toHaveAttribute("width", large ? "60" : "40");
  expect(images[0]).toHaveAttribute("height", large ? "60" : "40");
  expect(images[1]).toHaveAttribute("width", large ? "207" : "118");
  expect(images[1]).toHaveAttribute("height", large ? "49" : "28");
}

describe("PublicShell", () => {
  it("provides catalog and help navigation for guests", () => {
    render(
      <ToastProvider>
        <PublicShell>
          <div>Konten katalog guest</div>
        </PublicShell>
      </ToastProvider>
    );

    const guestBrand = screen.getByRole("link", { name: /ruang agunan/i });
    expect(guestBrand).toHaveAttribute("href", "/katalog");
    expect(guestBrand.querySelector("span:last-child")).not.toHaveClass("hidden");
    expectOptimizedBrandImages(guestBrand);
    expect(screen.queryByRole("link", { name: "Beranda" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Katalog" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Pusat Bantuan" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Pusat Bantuan" })[0]).toHaveAttribute("href", "/bantuan");
    expect(screen.getByRole("link", { name: "Masuk" })).toHaveAttribute("href", "/login");
  });

  it("keeps buyer navigation when an authenticated buyer opens the public catalog", () => {
    const { container } = render(
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

    expect(container.querySelector(".buyer-experience-root")).toBeInTheDocument();
    expect(container.querySelector("main.buyer-motion-main")).toBeInTheDocument();
    const buyerBrand = screen.getByRole("link", { name: /ruang agunan/i });
    expect(buyerBrand).toHaveAttribute("href", "/dashboard");
    expect(buyerBrand.querySelector("span:last-child")).not.toHaveClass("hidden");
    expectOptimizedBrandImages(buyerBrand);
    expect(screen.getByRole("link", { name: "Beranda" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Katalog" })).toHaveAttribute("href", "/katalog");
    expect(screen.getByRole("link", { name: "Transaksi" })).toHaveAttribute("href", "/transaksi");
    expect(screen.queryByRole("link", { name: "Raras Maheswari" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^keluar$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /raras maheswari/i }));

    expect(screen.getByRole("menuitem", { name: /profil/i })).toHaveAttribute("href", "/profil");
    expect(screen.getByRole("menuitem", { name: /keluar/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Masuk" })).not.toBeInTheDocument();
  });

  it.each([
    ["login", <LoginPage key="login" />, "high" as const],
    ["register", <RegisterPage key="register" />, "low" as const]
  ])("uses optimized brand delivery on the %s page", (_page, page, markPriority) => {
    render(<ToastProvider>{page}</ToastProvider>);

    expectOptimizedBrandImages(screen.getByRole("img", { name: /ruang agunan/i }), true, markPriority);
  });
});
