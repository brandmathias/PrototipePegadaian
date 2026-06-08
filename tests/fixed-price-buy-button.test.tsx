import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock
  })
}));

import { FixedPriceBuyButton } from "@/components/buyer/fixed-price-buy-button";

describe("FixedPriceBuyButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it("opens the harga tetap payment panel without creating a transaction", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<FixedPriceBuyButton lotId="lot-fixed-1" />);

    await user.click(screen.getByRole("button", { name: /beli sekarang/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/katalog/lot-fixed-1/beli");
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
