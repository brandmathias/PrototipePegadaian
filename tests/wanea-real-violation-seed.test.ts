import { describe, expect, it } from "vitest";

import {
  buildWaneaRealViolationSeedRows,
  type WaneaRealViolationSeedContext
} from "@/lib/blacklist/wanea-real-violation-seed";

const context: WaneaRealViolationSeedContext = {
  usersByEmail: new Map([
    ["lazuardi@gmail.com", { id: "buyer-lazuardi", nationalId: "3174201703980011" }],
    ["anindita@gmail.com", { id: "buyer-anindita", nationalId: "3174212907010012" }],
    ["rendra@gmail.com", { id: "buyer-rendra", nationalId: "3174222105940013" }],
    ["savera@gmail.com", { id: "buyer-savera", nationalId: "3174230508020014" }],
    ["mahesa@gmail.com", { id: "buyer-mahesa", nationalId: "3174242601970015" }]
  ]),
  unit: { id: "unit-wanea" },
  admin: { id: "admin-wanea" }
};

describe("UPC Wanea real buyer violation seed rows", () => {
  it("builds complete records without suspending a buyer", () => {
    const rows = buildWaneaRealViolationSeedRows(context);

    expect(rows.barang).toHaveLength(3);
    expect(rows.mediaBarang).toHaveLength(3);
    expect(rows.pemasaran).toHaveLength(3);
    expect(rows.bids).toHaveLength(14);
    expect(rows.transaksi).toHaveLength(3);
    expect(rows.pelanggaranUser).toHaveLength(3);
    expect(rows.riwayatStatusBarang).toHaveLength(12);
    expect(rows.blacklists).toHaveLength(2);
    expect(rows.blacklistActionLogs).toHaveLength(3);
    expect(rows.suspendedUserIds).toEqual([]);
  });

  it("records a valid second-price Vickrey result and four item-status transitions per auction", () => {
    const rows = buildWaneaRealViolationSeedRows(context);

    for (const marketing of rows.pemasaran) {
      const ranking = rows.bids
        .filter((bid) => bid.pemasaranId === marketing.id)
        .sort((left, right) => Number(right.nominal) - Number(left.nominal));
      expect(marketing.winnerId).toBe(ranking[0]?.userId);
      expect(marketing.finalPrice).toBe(ranking[1]?.nominal);
      expect(marketing.iteration).toBe(1);
    }

    for (const item of rows.barang) {
      expect(rows.riwayatStatusBarang.filter((history) => history.barangId === item.id)).toHaveLength(4);
    }
  });
});
