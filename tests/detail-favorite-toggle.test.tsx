import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DetailFavoriteToggle } from "@/components/shared/detail-favorite-toggle";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/katalog/lot-fixed-1",
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams("")
}));

describe("DetailFavoriteToggle", () => {
  beforeEach(() => {
    router.push.mockClear();
    router.refresh.mockClear();
  });

  it("redirects guest users to login before toggling wishlist from lot detail", () => {
    render(<DetailFavoriteToggle itemName="Cincin Emas" lotId="lot-fixed-1" wishlistSyncEnabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /sukai cincin emas/i }));

    expect(router.push).toHaveBeenCalledWith("/login?next=%2Fkatalog%2Flot-fixed-1");
  });
});
