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

  it("creates the requested active restrictions while preserving sequential escalation", () => {
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
      { buyerEmail: "kirana@gmail.com", level: 3, unitName: "UPC Ranotana" },
      { buyerEmail: "rangga@gmail.com", level: 1, unitName: "UPC Ranotana" },
      { buyerEmail: "rangga@gmail.com", level: 2, unitName: "UPC Ranotana" },
      { buyerEmail: "adrian@gmail.com", level: 1, unitName: "UPC Sarinah" },
      { buyerEmail: "viona@gmail.com", level: 1, unitName: "UPC Ranotana" }
    ]);
  });

  it("keeps the original five incident IDs first so production can replace the prior seed safely", () => {
    expect(RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.slice(0, 5).map((incident) => incident.ids.violation)).toEqual([
      "74000000-0000-4000-8000-000000000061",
      "74000000-0000-4000-8000-000000000062",
      "74000000-0000-4000-8000-000000000063",
      "74000000-0000-4000-8000-000000000064",
      "74000000-0000-4000-8000-000000000065"
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

  it("excludes buyers from later auctions after their payment becomes unresolved", () => {
    const allBuyerEmails = ["bagus@gmail.com", "kirana@gmail.com", "adrian@gmail.com", "viona@gmail.com", "rangga@gmail.com"];
    for (const incident of RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.slice(0, 4)) {
      expect(incident.bidderEmails).toEqual(expect.arrayContaining(allBuyerEmails));
    }
    expect(RENEWED_CROSS_UNIT_VIOLATION_SCENARIO[1]?.bidderEmails).toContain("bagus@gmail.com");
    expect(RENEWED_CROSS_UNIT_VIOLATION_SCENARIO[4]?.bidderEmails).not.toContain("bagus@gmail.com");
    expect(RENEWED_CROSS_UNIT_VIOLATION_SCENARIO[6]?.bidderEmails).toEqual(["rangga@gmail.com", "adrian@gmail.com", "viona@gmail.com"]);
    expect(RENEWED_CROSS_UNIT_VIOLATION_SCENARIO[7]?.bidderEmails).toEqual(["adrian@gmail.com", "viona@gmail.com"]);
    expect(RENEWED_CROSS_UNIT_VIOLATION_SCENARIO[8]?.bidderEmails).toEqual(["viona@gmail.com"]);
  });

  it("finishes with active Level 1 and Level 2 restrictions in Sarinah plus active Level 1 to 3 restrictions in Ranotana", () => {
    expect(getRenewedExpectedFinalRestrictions()).toEqual([
      {
        buyerEmail: "adrian@gmail.com",
        level: 1,
        unitName: "UPC Sarinah",
        blockedUntil: new Date("2026-07-23T00:25:00+07:00")
      },
      {
        buyerEmail: "bagus@gmail.com",
        level: 2,
        unitName: "UPC Sarinah",
        blockedUntil: new Date("2026-08-14T23:45:00+07:00")
      },
      {
        buyerEmail: "viona@gmail.com",
        level: 1,
        unitName: "UPC Ranotana",
        blockedUntil: new Date("2026-07-23T00:35:00+07:00")
      },
      {
        buyerEmail: "rangga@gmail.com",
        level: 2,
        unitName: "UPC Ranotana",
        blockedUntil: new Date("2026-08-15T00:15:00+07:00")
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
