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

  it("uses a native GET form for buyer catalog search submissions", async () => {
    const user = userEvent.setup();

    render(<CatalogSearchInput />);

    const searchbox = screen.getByRole("searchbox", { name: /cari katalog buyer/i });
    await user.type(searchbox, "kalung emas");

    const form = searchbox.closest("form");

    expect(form).not.toBeNull();
    expect(form).toHaveAttribute("action", "/katalog");
    expect(form).toHaveAttribute("method", "get");
    expect(new FormData(form as HTMLFormElement).get("q")).toBe("kalung emas");
    expect(router.push).not.toHaveBeenCalled();
  });
});
