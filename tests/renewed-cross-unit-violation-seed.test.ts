import { describe, expect, it } from "vitest";

import {
  buildRenewedCrossUnitViolationSeedRows,
  type RenewedCrossUnitViolationSeedContext
} from "@/lib/blacklist/renewed-cross-unit-violation-seed";

const context: RenewedCrossUnitViolationSeedContext = {
  usersByEmail: new Map([
    ["bagus@gmail.com", { id: "buyer-bagus", nationalId: "3174151103960006" }],
    ["kirana@gmail.com", { id: "buyer-kirana", nationalId: "3174162807010007" }],
    ["adrian@gmail.com", { id: "buyer-adrian", nationalId: "3174171905940008" }],
    ["viona@gmail.com", { id: "buyer-viona", nationalId: "3174180308020009" }],
    ["rangga@gmail.com", { id: "buyer-rangga", nationalId: "3174192501970010" }]
  ]),
  unitsByName: new Map([["UPC Sarinah", { id: "unit-sarinah" }], ["UPC Ranotana", { id: "unit-ranotana" }]]),
  adminsByEmail: new Map([["bagas.prakoso@pegadaian.co.id", { id: "admin-sarinah" }], ["andika.pratama@pegadaian.co.id", { id: "admin-ranotana" }]])
};

describe("renewed cross-unit violation seed rows", () => {
  it("builds complete rows while suspending only the active Level 3 account", () => {
    const rows = buildRenewedCrossUnitViolationSeedRows(context);
    expect(rows.barang).toHaveLength(5);
    expect(rows.mediaBarang).toHaveLength(5);
    expect(rows.pemasaran).toHaveLength(5);
    expect(rows.transaksi).toHaveLength(5);
    expect(rows.pelanggaranUser).toHaveLength(5);
    expect(rows.riwayatStatusBarang).toHaveLength(20);
    expect(rows.blacklists).toHaveLength(2);
    expect(rows.blacklistActionLogs).toHaveLength(5);
    expect(rows.suspendedUserIds).toEqual(["buyer-kirana"]);
  });
});
