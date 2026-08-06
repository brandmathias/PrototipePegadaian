import { describe, expect, it } from "vitest";

import {
  FOUR_BUYER_ACTIVE_IDENTITIES,
  FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO,
  getFourBuyerActiveRestrictions,
  validateFourBuyerActiveViolationScenario
} from "@/lib/blacklist/four-buyer-active-violation-scenario";
import { buildFourBuyerActiveViolationSeedRows } from "@/lib/blacklist/four-buyer-active-violation-seed";

describe("four buyer active cross-unit violation scenario", () => {
  it("creates the three requested Level 1 violations in their intended units", () => {
    expect(
      FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.map(({ buyerEmail, level, unitName }) => ({
        buyerEmail,
        level,
        unitName
      }))
    ).toEqual([
      { buyerEmail: "mahesa@gmail.com", level: 1, unitName: "UPC Wanea" },
      { buyerEmail: "ilham@gmail.com", level: 1, unitName: "UPC Ranotana" },
      { buyerEmail: "lazuardi@gmail.com", level: 1, unitName: "UPC Sarinah" }
    ]);
  });

  it("keeps H-10, H+1, and active restrictions valid at the production assessment time", () => {
    expect(() => validateFourBuyerActiveViolationScenario()).not.toThrow();

    for (const incident of FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO) {
      expect(incident.auctionStartsAt.getTime() - incident.itemEnteredAt.getTime()).toBe(
        10 * 24 * 60 * 60 * 1000
      );
      expect(incident.violationOccurredAt.getTime() - incident.auctionEndsAt.getTime()).toBe(
        24 * 60 * 60 * 1000
      );
      expect(incident.iteration).toBe(1);
    }

    const assessedAt = new Date("2026-08-07T12:00:00+07:00");
    expect(getFourBuyerActiveRestrictions().every(({ blockedUntil }) => blockedUntil > assessedAt)).toBe(true);
  });

  it("never reuses a restricted buyer in a later auction while all four buyers participate safely", () => {
    const allParticipants = new Set(
      FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.flatMap((incident) => incident.bidderEmails)
    );
    expect([...allParticipants].sort()).toEqual([
      "ilham@gmail.com",
      "lazuardi@gmail.com",
      "mahesa@gmail.com",
      "savera@gmail.com"
    ]);

    expect(FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO[1]!.bidderEmails).not.toContain("mahesa@gmail.com");
    expect(FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO[2]!.bidderEmails).not.toContain("mahesa@gmail.com");
    expect(FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO[2]!.bidderEmails).not.toContain("ilham@gmail.com");
  });

  it("builds complete non-demo item, marketing, bid, history, and restriction rows", () => {
    const usersByEmail = new Map(
      Object.entries(FOUR_BUYER_ACTIVE_IDENTITIES).map(([email]) => [email, {
        id: `user-${email}`,
        nationalId: `NIK-${email}`
      }])
    );
    const rows = buildFourBuyerActiveViolationSeedRows({
      usersByEmail,
      unitsByName: new Map([
        ["UPC Wanea", { id: "unit-wanea" }],
        ["UPC Ranotana", { id: "unit-ranotana" }],
        ["UPC Sarinah", { id: "unit-sarinah" }]
      ]),
      adminsByUnitName: new Map([
        ["UPC Wanea", { id: "admin-wanea" }],
        ["UPC Ranotana", { id: "admin-ranotana" }],
        ["UPC Sarinah", { id: "admin-sarinah" }]
      ])
    });

    expect(rows.barang).toHaveLength(3);
    expect(rows.mediaBarang).toHaveLength(3);
    expect(rows.pemasaran).toHaveLength(3);
    expect(rows.bids).toHaveLength(9);
    expect(rows.transaksi).toHaveLength(3);
    expect(rows.pelanggaranUser).toHaveLength(3);
    expect(rows.riwayatStatusBarang).toHaveLength(12);
    expect(rows.blacklists).toHaveLength(3);
    expect(rows.barang.every((item) => !/\b(dummy|demo|test)\b/i.test(item.name))).toBe(true);
    expect(rows.mediaBarang.every((media) => media.url.startsWith("/media/violation-items/"))).toBe(true);
  });
});
