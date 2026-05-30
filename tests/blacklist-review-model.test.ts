import { describe, expect, it } from "vitest";

import {
  BLACKLIST_REVIEW_APPROVAL_REASONS,
  BLACKLIST_REVIEW_REJECTION_REASONS,
  isBlacklistReviewTerminalStatus,
  serializeBuyerSafeReviewCase,
  validateBlacklistReviewDecisionPayload
} from "@/lib/blacklist/review";

describe("blacklist review model helpers", () => {
  it("keeps only approved final statuses terminal", () => {
    expect(isBlacklistReviewTerminalStatus("TERKIRIM")).toBe(false);
    expect(isBlacklistReviewTerminalStatus("DITINJAU_ADMIN_UNIT")).toBe(false);
    expect(isBlacklistReviewTerminalStatus("DITINJAU_SUPERADMIN")).toBe(false);
    expect(isBlacklistReviewTerminalStatus("DISETUJUI")).toBe(true);
    expect(isBlacklistReviewTerminalStatus("DITOLAK")).toBe(true);
  });

  it("requires a reason code that matches the selected superadmin decision", () => {
    expect(
      validateBlacklistReviewDecisionPayload({
        decision: "DISETUJUI",
        reasonCode: BLACKLIST_REVIEW_APPROVAL_REASONS[0].code,
        note: " Bukti menunjukkan kendala sistem pembayaran. "
      })
    ).toEqual({
      decision: "DISETUJUI",
      reasonCode: BLACKLIST_REVIEW_APPROVAL_REASONS[0].code,
      note: "Bukti menunjukkan kendala sistem pembayaran."
    });

    expect(() =>
      validateBlacklistReviewDecisionPayload({
        decision: "DISETUJUI",
        reasonCode: BLACKLIST_REVIEW_REJECTION_REASONS[0].code
      })
    ).toThrow("Alasan keputusan tidak sesuai dengan hasil review.");

    expect(() =>
      validateBlacklistReviewDecisionPayload({
        decision: "DITOLAK",
        reasonCode: ""
      })
    ).toThrow("Alasan keputusan superadmin wajib dipilih.");
  });

  it("serializes only buyer-safe review case fields", () => {
    expect(
      serializeBuyerSafeReviewCase({
        id: "case-1",
        incidentId: "incident-1",
        status: "DITOLAK",
        submittedAt: new Date("2026-05-30T01:00:00.000Z"),
        safeSummaryForBuyer: "Review ditolak karena bukti belum mendukung pencabutan.",
        superadminNote: "Catatan internal tidak boleh bocor.",
        adminRecommendationNote: "Rekomendasi internal juga tidak boleh bocor."
      })
    ).toEqual({
      id: "case-1",
      incidentId: "incident-1",
      status: "DITOLAK",
      submittedAt: "2026-05-30T01:00:00.000Z",
      summary: "Review ditolak karena bukti belum mendukung pencabutan."
    });
  });
});
