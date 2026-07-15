import { describe, expect, it } from "vitest";

import {
  RENEWED_CROSS_UNIT_IDENTITIES,
  RENEWED_CROSS_UNIT_VIOLATION_SCENARIO,
  getRenewedExpectedFinalRestrictions,
  validateRenewedCrossUnitViolationScenario
} from "@/lib/blacklist/renewed-cross-unit-violation-scenario";

describe("renewed cross-unit violation production scenario", () => {
  it("pins the five provided buyer identities", () => {
    expect(RENEWED_CROSS_UNIT_IDENTITIES).toEqual({
      "bagus@gmail.com": { name: "Bagus Santoso", nationalId: "3174151103960006" },
      "kirana@gmail.com": { name: "Kirana Dewanti", nationalId: "3174162807010007" },
      "adrian@gmail.com": { name: "Adrian Maulana", nationalId: "3174171905940008" },
      "viona@gmail.com": { name: "Viona Kartika", nationalId: "3174180308020009" },
      "rangga@gmail.com": { name: "Rangga Saputra", nationalId: "3174192501970010" }
    });
  });

  it("creates the requested Sarinah and Ranotana escalation paths", () => {
    expect(
      RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.map(({ buyerEmail, level, unitName }) => ({
        buyerEmail,
        level,
        unitName
      }))
    ).toEqual([
      { buyerEmail: "bagus@gmail.com", level: 1, unitName: "UPC Sarinah" },
      { buyerEmail: "kirana@gmail.com", level: 1, unitName: "UPC Ranotana" },
      { buyerEmail: "kirana@gmail.com", level: 2, unitName: "UPC Ranotana" },
      { buyerEmail: "bagus@gmail.com", level: 2, unitName: "UPC Sarinah" },
      { buyerEmail: "kirana@gmail.com", level: 3, unitName: "UPC Ranotana" }
    ]);
  });

  it("keeps H-10 entry, 24-hour payment deadlines, and participant eligibility valid", () => {
    expect(() => validateRenewedCrossUnitViolationScenario()).not.toThrow();

    for (const incident of RENEWED_CROSS_UNIT_VIOLATION_SCENARIO) {
      expect(incident.auctionStartsAt.getTime() - incident.itemEnteredAt.getTime()).toBe(
        10 * 24 * 60 * 60 * 1000
      );
      expect(incident.violationOccurredAt.getTime() - incident.auctionEndsAt.getTime()).toBe(
        24 * 60 * 60 * 1000
      );
      expect(incident.bidderEmails).toContain(incident.buyerEmail);
    }
  });

  it("finishes with one active Level 2 and one active Level 3 restriction", () => {
    expect(getRenewedExpectedFinalRestrictions()).toEqual([
      {
        buyerEmail: "bagus@gmail.com",
        level: 2,
        unitName: "UPC Sarinah",
        blockedUntil: new Date("2026-08-14T23:45:00+07:00")
      },
      {
        buyerEmail: "kirana@gmail.com",
        level: 3,
        unitName: "UPC Ranotana",
        blockedUntil: new Date("2027-07-16T00:05:00+07:00")
      }
    ]);
  });
});
