import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireBuyerApiSession: vi.fn(),
  requireAdminApiSession: vi.fn(),
  requireSuperAdminApiSession: vi.fn(),
  listBuyerBlacklistReviewCases: vi.fn(),
  createBuyerBlacklistReviewCase: vi.fn(),
  lookupPublicBlacklistHelp: vi.fn(),
  createPublicBlacklistReviewCase: vi.fn(),
  submitAdminBlacklistReviewRecommendation: vi.fn(),
  decideSuperadminBlacklistReviewCase: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  requireBuyerApiSession: mocks.requireBuyerApiSession,
  requireAdminApiSession: mocks.requireAdminApiSession,
  requireSuperAdminApiSession: mocks.requireSuperAdminApiSession
}));

vi.mock("@/lib/services/blacklist-review.service", () => ({
  listBuyerBlacklistReviewCases: mocks.listBuyerBlacklistReviewCases,
  createBuyerBlacklistReviewCase: mocks.createBuyerBlacklistReviewCase,
  lookupPublicBlacklistHelp: mocks.lookupPublicBlacklistHelp,
  createPublicBlacklistReviewCase: mocks.createPublicBlacklistReviewCase,
  submitAdminBlacklistReviewRecommendation: mocks.submitAdminBlacklistReviewRecommendation,
  decideSuperadminBlacklistReviewCase: mocks.decideSuperadminBlacklistReviewCase
}));

const buyerAccess = {
  ok: true as const,
  userId: "buyer-1",
  session: { user: { id: "buyer-1" } }
};

const adminAccess = {
  ok: true as const,
  unitId: "unit-1",
  session: { user: { id: "admin-1" } }
};

const superadminAccess = {
  ok: true as const,
  session: { user: { id: "super-1" } }
};

describe("blacklist review routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireBuyerApiSession.mockResolvedValue(buyerAccess);
    mocks.requireAdminApiSession.mockResolvedValue(adminAccess);
    mocks.requireSuperAdminApiSession.mockResolvedValue(superadminAccess);
  });

  it("creates an authenticated buyer blacklist review case", async () => {
    mocks.createBuyerBlacklistReviewCase.mockResolvedValueOnce({ id: "case-1" });

    const { POST } = await import("@/app/api/user/blacklist-review/route");
    const response = await POST(
      new Request("http://localhost:3000/api/user/blacklist-review", {
        method: "POST",
        body: JSON.stringify({ incidentId: "incident-1" })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { id: "case-1" } });
    expect(mocks.createBuyerBlacklistReviewCase).toHaveBeenCalledWith("buyer-1", {
      incidentId: "incident-1"
    });
  });

  it("returns public lookup status without OTP", async () => {
    mocks.lookupPublicBlacklistHelp.mockResolvedValueOnce({ incidentId: "incident-1", existingCase: null });

    const { POST } = await import("@/app/api/public/blacklist-help/route");
    const response = await POST(
      new Request("http://localhost:3000/api/public/blacklist-help", {
        method: "POST",
        body: JSON.stringify({ nationalId: "7171000000000001", contact: "buyer@example.com" })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { incidentId: "incident-1", existingCase: null }
    });
    expect(mocks.lookupPublicBlacklistHelp).toHaveBeenCalledWith({
      nationalId: "7171000000000001",
      contact: "buyer@example.com"
    });
  });

  it("stores admin-unit recommendation in the unit scope", async () => {
    mocks.submitAdminBlacklistReviewRecommendation.mockResolvedValueOnce({ id: "case-1" });

    const { POST } = await import("@/app/api/admin/blacklist-review/[caseId]/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/blacklist-review/case-1", {
        method: "POST",
        body: JSON.stringify({ recommendation: "LANJUTKAN_REVIEW" })
      }),
      { params: Promise.resolve({ caseId: "case-1" }) }
    );

    expect(response.status).toBe(200);
    expect(mocks.submitAdminBlacklistReviewRecommendation).toHaveBeenCalledWith(
      "unit-1",
      "admin-1",
      "case-1",
      { recommendation: "LANJUTKAN_REVIEW" }
    );
  });

  it("stores superadmin final decision", async () => {
    mocks.decideSuperadminBlacklistReviewCase.mockResolvedValueOnce({ id: "case-1", status: "DISETUJUI" });

    const { POST } = await import("@/app/api/superadmin/blacklist-review/[caseId]/route");
    const response = await POST(
      new Request("http://localhost:3000/api/superadmin/blacklist-review/case-1", {
        method: "POST",
        body: JSON.stringify({ decision: "DISETUJUI", reasonCode: "PAYMENT_PROOF_VALID" })
      }),
      { params: Promise.resolve({ caseId: "case-1" }) }
    );

    expect(response.status).toBe(200);
    expect(mocks.decideSuperadminBlacklistReviewCase).toHaveBeenCalledWith("case-1", "super-1", {
      decision: "DISETUJUI",
      reasonCode: "PAYMENT_PROOF_VALID"
    });
  });
});
