import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CatalogSearchInput } from "@/components/shared/catalog-search-input";

const router = vi.hoisted(() => ({
  push: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams("")
}));

describe("CatalogSearchInput", () => {
  beforeEach(() => {
    router.push.mockClear();
  });

  it("redirects buyer search submissions to the catalog query page", async () => {
    const user = userEvent.setup();

    render(<CatalogSearchInput />);

    await user.type(screen.getByRole("searchbox", { name: /cari katalog buyer/i }), "kalung emas");
    await user.click(screen.getByRole("button", { name: /cari/i }));

    expect(router.push).toHaveBeenCalledWith("/katalog?q=kalung+emas");
  });
});
