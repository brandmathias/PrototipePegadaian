import { describe, expect, it } from "vitest";

import {
  buildCrossUnitViolationSeedRows,
  type CrossUnitViolationSeedContext
} from "@/lib/blacklist/cross-unit-violation-seed";

const context: CrossUnitViolationSeedContext = {
  usersByEmail: new Map([
    ["yoga@gmail.com", { id: "buyer-yoga", nationalId: "3174101801990001" }],
    ["tiara@gmail.com", { id: "buyer-tiara", nationalId: "3174112308020002" }],
    ["reza@gmail.com", { id: "buyer-reza", nationalId: "3174142712950005" }],
    ["ilham@gmail.com", { id: "buyer-ilham", nationalId: "3174120905970003" }]
  ]),
  unitsByName: new Map([
    ["UPC Wanea", { id: "unit-wanea" }],
    ["UPC Sarinah", { id: "unit-sarinah" }]
  ]),
  adminsByEmail: new Map([
    ["hendra.wijaya@pegadaian.co.id", { id: "admin-wanea" }],
    ["bagas.prakoso@pegadaian.co.id", { id: "admin-sarinah" }]
  ])
};

describe("cross-unit violation seed rows", () => {
  it("builds one complete auditable row set for every incident", () => {
    const rows = buildCrossUnitViolationSeedRows(context);

    expect(rows.barang).toHaveLength(7);
    expect(rows.mediaBarang).toHaveLength(7);
    expect(rows.pemasaran).toHaveLength(7);
    expect(rows.bids).toHaveLength(22);
    expect(rows.transaksi).toHaveLength(7);
    expect(rows.pelanggaranUser).toHaveLength(7);
    expect(rows.riwayatStatusBarang).toHaveLength(28);
    expect(rows.blacklists).toHaveLength(3);
    expect(rows.blacklistActionLogs).toHaveLength(7);
    expect(rows.mediaBarang.every((media) => Number(media.sizeBytes) > 0)).toBe(true);
  });

  it("stores valid Vickrey ranking data with the target first and second bid as final price", () => {
    const rows = buildCrossUnitViolationSeedRows(context);

    for (const marketing of rows.pemasaran) {
      const ranking = rows.bids
        .filter((bid) => bid.pemasaranId === marketing.id)
        .sort((left, right) => right.nominal - left.nominal);

      expect(ranking[0]?.userId).toBe(marketing.winnerId);
      expect(marketing.finalPrice).toBe(ranking[1]?.nominal ?? marketing.basePrice);
      expect(ranking.every((bid) => /^[a-f0-9]{64}$/.test(bid.bidHash))).toBe(true);
      expect(new Set(ranking.map((bid) => bid.id)).size).toBe(ranking.length);
    }
  });

  it("creates the requested final restrictions and only suspends Level 3 accounts", () => {
    const rows = buildCrossUnitViolationSeedRows(context);

    expect(rows.blacklists).toEqual([
      expect.objectContaining({
        userId: "buyer-yoga",
        unitId: "unit-sarinah",
        totalViolations: 3,
        blockedUntil: new Date("2027-07-16T00:00:00+07:00")
      }),
      expect.objectContaining({
        userId: "buyer-tiara",
        unitId: "unit-wanea",
        totalViolations: 3,
        blockedUntil: new Date("2027-07-16T00:05:00+07:00")
      }),
      expect.objectContaining({
        userId: "buyer-reza",
        unitId: "unit-wanea",
        totalViolations: 1,
        blockedUntil: new Date("2026-07-23T00:10:00+07:00")
      })
    ]);
    expect(rows.suspendedUserIds).toEqual(["buyer-yoga", "buyer-tiara"]);
  });

  it("preserves the exact four-step item and marketing chronology", () => {
    const rows = buildCrossUnitViolationSeedRows(context);

    for (const item of rows.barang) {
      const history = rows.riwayatStatusBarang
        .filter((entry) => entry.barangId === item.id)
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());

      expect(history.map((entry) => entry.newStatus)).toEqual([
        "jaminan",
        "dipasarkan",
        "menunggu_pembayaran",
        "gagal"
      ]);
      expect(history[0]?.createdAt).toEqual(item.createdAt);
      expect(history[3]?.createdAt.getTime() - history[2]?.createdAt.getTime()).toBe(
        24 * 60 * 60 * 1000
      );
    }
  });
});
