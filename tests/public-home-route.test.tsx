import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  getServerSession: mocks.getServerSession
}));

import { GET } from "@/app/route";

const rootRequest = () => new Request("https://app.example.test/");

describe("public home route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles the root redirect before the public React layout can render", () => {
    expect(existsSync(resolve(process.cwd(), "app/route.ts"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "app/(public)/page.tsx"))).toBe(false);
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

    const response = await GET(rootRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`https://app.example.test${expectedPath}`);
  });

  it("redirects guests from the root page to the catalog", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    const response = await GET(rootRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example.test/katalog");
  });
});
