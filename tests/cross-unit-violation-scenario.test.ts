import { describe, expect, it } from "vitest";

import {
  getBarangSpecificationFields,
  getBarangSpecificationRows
} from "@/lib/admin-unit/specifications";
import {
  CROSS_UNIT_SCENARIO_IDENTITIES,
  CROSS_UNIT_VIOLATION_SCENARIO,
  getExpectedFinalRestrictions,
  validateCrossUnitViolationScenario
} from "@/lib/blacklist/cross-unit-violation-scenario";

describe("cross-unit violation production scenario", () => {
  it("pins the exact buyer identities before any account can be restricted", () => {
    expect(CROSS_UNIT_SCENARIO_IDENTITIES).toEqual({
      "yoga@gmail.com": {
        name: "Yoga Firmansyah",
        nationalId: "3174101801990001"
      },
      "tiara@gmail.com": {
        name: "Tiara Oktaviani",
        nationalId: "3174112308020002"
      },
      "reza@gmail.com": {
        name: "Reza Anugrah",
        nationalId: "3174142712950005"
      },
      "ilham@gmail.com": {
        name: "Ilham Ramadhan",
        nationalId: "3174120905970003"
      }
    });
  });

  it("uses the sequential milestones required for the three target buyers", () => {
    expect(
      CROSS_UNIT_VIOLATION_SCENARIO.map(({ buyerEmail, level, unitName }) => ({
        buyerEmail,
        level,
        unitName
      }))
    ).toEqual([
      { buyerEmail: "yoga@gmail.com", level: 1, unitName: "UPC Wanea" },
      { buyerEmail: "tiara@gmail.com", level: 1, unitName: "UPC Wanea" },
      { buyerEmail: "yoga@gmail.com", level: 2, unitName: "UPC Sarinah" },
      { buyerEmail: "tiara@gmail.com", level: 2, unitName: "UPC Sarinah" },
      { buyerEmail: "yoga@gmail.com", level: 3, unitName: "UPC Sarinah" },
      { buyerEmail: "tiara@gmail.com", level: 3, unitName: "UPC Wanea" },
      { buyerEmail: "reza@gmail.com", level: 1, unitName: "UPC Wanea" }
    ]);
  });

  it("keeps every auction and sanction window chronologically valid", () => {
    expect(() => validateCrossUnitViolationScenario()).not.toThrow();

    for (const incident of CROSS_UNIT_VIOLATION_SCENARIO) {
      const enteredAt = incident.itemEnteredAt.getTime();
      const startsAt = incident.auctionStartsAt.getTime();
      const endsAt = incident.auctionEndsAt.getTime();
      const occurredAt = incident.violationOccurredAt.getTime();

      expect(startsAt - enteredAt).toBe(10 * 24 * 60 * 60 * 1000);
      expect(endsAt).toBeGreaterThan(startsAt);
      expect(occurredAt - endsAt).toBe(24 * 60 * 60 * 1000);
      expect(incident.bidderEmails).toContain(incident.buyerEmail);
      expect(new Set(incident.bidderEmails).size).toBe(incident.bidderEmails.length);
    }
  });

  it("never lets a restricted buyer or unresolved winner enter the next auction", () => {
    const previousByBuyer = new Map<
      string,
      { auctionEndsAt: Date; blockedUntil: Date; violationOccurredAt: Date }
    >();

    for (const incident of CROSS_UNIT_VIOLATION_SCENARIO) {
      for (const bidderEmail of incident.bidderEmails) {
        const previous = previousByBuyer.get(bidderEmail);
        if (!previous) continue;

        expect(incident.auctionStartsAt.getTime()).toBeGreaterThanOrEqual(
          previous.blockedUntil.getTime()
        );
        expect(incident.auctionStartsAt.getTime()).toBeGreaterThanOrEqual(
          previous.violationOccurredAt.getTime()
        );
      }

      previousByBuyer.set(incident.buyerEmail, {
        auctionEndsAt: incident.auctionEndsAt,
        blockedUntil: incident.blockedUntil,
        violationOccurredAt: incident.violationOccurredAt
      });
    }
  });

  it("finishes with the requested active levels and units", () => {
    expect(getExpectedFinalRestrictions()).toEqual([
      {
        buyerEmail: "yoga@gmail.com",
        level: 3,
        unitName: "UPC Sarinah",
        blockedUntil: new Date("2027-07-16T00:00:00+07:00")
      },
      {
        buyerEmail: "tiara@gmail.com",
        level: 3,
        unitName: "UPC Wanea",
        blockedUntil: new Date("2027-07-16T00:05:00+07:00")
      },
      {
        buyerEmail: "reza@gmail.com",
        level: 1,
        unitName: "UPC Wanea",
        blockedUntil: new Date("2026-07-23T00:10:00+07:00")
      }
    ]);
  });

  it("uses real-facing item copy and traceable local media", () => {
    for (const incident of CROSS_UNIT_VIOLATION_SCENARIO) {
      const visibleCopy = [
        incident.itemName,
        incident.description,
        incident.ownerName,
        ...Object.keys(incident.specifications),
        ...Object.values(incident.specifications)
      ].join(" ");

      expect(visibleCopy).not.toMatch(/\b(?:dummy|demo|test|uji coba)\b/i);
      expect(incident.media.publicPath).toMatch(
        /^\/media\/violation-items\/[a-z0-9-]+\.webp$/
      );
      expect(incident.media.sourceUrl).toMatch(/^https:\/\//);
      expect(incident.media.credit.length).toBeGreaterThan(2);
      expect(incident.media.license.length).toBeGreaterThan(2);
    }
  });

  it("provides every required category specification on each detail page", () => {
    const categories = ["Perhiasan", "Perhiasan", "Perhiasan", "Logam Mulia", "Elektronik", "Jam Tangan", "Perhiasan"];

    for (const [index, incident] of CROSS_UNIT_VIOLATION_SCENARIO.entries()) {
      const valuesByLabel = new Map(
        getBarangSpecificationRows(categories[index]!, incident.specifications, incident.itemName).map((row) => [row.label, row.value])
      );
      for (const field of getBarangSpecificationFields(categories[index]!, incident.specifications, incident.itemName).filter((field) => field.required !== false)) {
        expect(valuesByLabel.get(field.label), `${incident.itemName}: ${field.label}`).toBeTruthy();
      }
    }
  });
});
