import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  requireBuyerApiSession: vi.fn().mockResolvedValue({ ok: true, userId: "buyer-1" })
}));

import { GET } from "@/app/api/payments/midtrans/config/route";

describe("Midtrans public config route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the client configuration from the server runtime", async () => {
    vi.stubEnv("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY", "SB-Mid-client-runtime");
    vi.stubEnv("NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION", "false");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { clientKey: "SB-Mid-client-runtime", isProduction: false }
    });
  });

  it("reports a missing client key without exposing server credentials", async () => {
    vi.stubEnv("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY", "");

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      message: "Client Key Midtrans belum dikonfigurasi."
    });
  });
});
