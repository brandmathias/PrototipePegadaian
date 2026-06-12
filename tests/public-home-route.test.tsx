import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  })
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect
}));

vi.mock("@/lib/auth/session", () => ({
  getServerSession: mocks.getServerSession
}));

import Page from "@/app/(public)/page";

describe("public home route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["buyer", "/dashboard"],
    ["admin_unit", "/admin"],
    ["super_admin", "/superadmin"]
  ])("redirects an authenticated %s session away from the guest home", async (role, expectedPath) => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Authenticated User",
        email: "user@example.com",
        role,
        isActive: true
      }
    });

    await expect(Page()).rejects.toThrow(`NEXT_REDIRECT:${expectedPath}`);

    expect(mocks.redirect).toHaveBeenCalledWith(expectedPath);
  });

  it("redirects guests from the root page to the catalog", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(Page()).rejects.toThrow("NEXT_REDIRECT:/katalog");

    expect(mocks.redirect).toHaveBeenCalledWith("/katalog");
  });
});
