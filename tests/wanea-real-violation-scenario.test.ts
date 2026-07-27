import { describe, expect, it } from "vitest";

import {
  WANEA_REAL_BUYER_IDENTITIES,
  WANEA_REAL_VIOLATION_SCENARIO,
  getWaneaRealExpectedRestrictions,
  validateWaneaRealViolationScenario
} from "@/lib/blacklist/wanea-real-violation-scenario";

describe("UPC Wanea real buyer violation scenario", () => {
  it("pins the five requested buyer identities", () => {
    expect(WANEA_REAL_BUYER_IDENTITIES).toEqual({
      "anindita@gmail.com": {
        name: "Anindita Niskala",
        nationalId: "3174212907010012",
        phoneNumber: "082174692853"
      },
      "lazuardi@gmail.com": {
        name: "Lazuardi Prabaswara",
        nationalId: "3174201703980011",
        phoneNumber: "081268354179"
      },
      "mahesa@gmail.com": {
        name: "Mahesa Dananjaya",
        nationalId: "3174242601970015",
        phoneNumber: "085742968137"
      },
      "rendra@gmail.com": {
        name: "Rendra Arkadipa",
        nationalId: "3174222105940013",
        phoneNumber: "085239176485"
      },
      "savera@gmail.com": {
        name: "Savera Kirandari",
        nationalId: "3174230508020014",
        phoneNumber: "081386425709"
      }
    });
  });

  it("creates Rendra Level 1 then Level 2 and Anindita Level 1 at UPC Wanea", () => {
    expect(
      WANEA_REAL_VIOLATION_SCENARIO.map(({ buyerEmail, level, unitName }) => ({
        buyerEmail,
        level,
        unitName
      }))
    ).toEqual([
      { buyerEmail: "rendra@gmail.com", level: 1, unitName: "UPC Wanea" },
      { buyerEmail: "rendra@gmail.com", level: 2, unitName: "UPC Wanea" },
      { buyerEmail: "anindita@gmail.com", level: 1, unitName: "UPC Wanea" }
    ]);
  });

  it("keeps H-10 intake, 24-hour payment deadline, and marketing iteration valid", () => {
    expect(() => validateWaneaRealViolationScenario()).not.toThrow();

    for (const incident of WANEA_REAL_VIOLATION_SCENARIO) {
      expect(incident.auctionStartsAt.getTime() - incident.itemEnteredAt.getTime()).toBe(
        10 * 24 * 60 * 60 * 1000
      );
      expect(incident.violationOccurredAt.getTime() - incident.auctionEndsAt.getTime()).toBe(
        24 * 60 * 60 * 1000
      );
      expect(incident.iteration).toBe(1);
      expect(incident.bidderEmails).toContain(incident.buyerEmail);
    }
  });

  it("keeps all five buyers in the two Rendra auctions and excludes Rendra after Level 2", () => {
    const allBuyers = [
      "lazuardi@gmail.com",
      "anindita@gmail.com",
      "rendra@gmail.com",
      "savera@gmail.com",
      "mahesa@gmail.com"
    ];

    expect(WANEA_REAL_VIOLATION_SCENARIO[0]?.bidderEmails).toEqual(expect.arrayContaining(allBuyers));
    expect(WANEA_REAL_VIOLATION_SCENARIO[1]?.bidderEmails).toEqual(expect.arrayContaining(allBuyers));
    expect(WANEA_REAL_VIOLATION_SCENARIO[2]?.bidderEmails).toEqual([
      "anindita@gmail.com",
      "lazuardi@gmail.com",
      "savera@gmail.com",
      "mahesa@gmail.com"
    ]);
  });

  it("finishes with Anindita Level 1 and Rendra Level 2 active in UPC Wanea", () => {
    expect(getWaneaRealExpectedRestrictions()).toEqual([
      {
        buyerEmail: "anindita@gmail.com",
        level: 1,
        unitName: "UPC Wanea",
        blockedUntil: new Date("2026-07-28T15:00:00+07:00")
      },
      {
        buyerEmail: "rendra@gmail.com",
        level: 2,
        unitName: "UPC Wanea",
        blockedUntil: new Date("2026-08-18T11:00:00+07:00")
      }
    ]);
  });
});
