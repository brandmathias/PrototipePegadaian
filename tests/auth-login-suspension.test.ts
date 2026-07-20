import { describe, expect, it } from "vitest";

import {
  buildLevelThreeLoginSuspensionMessage,
  getLevelThreeLoginSuspensionMessage,
  isLevelThreeLoginSuspensionMessage
} from "@/lib/auth/login-suspension";

describe("Level 3 login suspension message", () => {
  it("explains the accumulated unpaid-auction violations and exact recovery time", () => {
    const message = buildLevelThreeLoginSuspensionMessage(new Date("2027-07-15T00:00:00.000Z"));

    expect(message).toBe(
      "Akun Anda ditangguhkan karena akumulasi 3 pelanggaran tidak membayar lelang yang dimenangkan. Akses login dibuka kembali pada 15 Jul 2027, 07.00 WIB."
    );
    expect(isLevelThreeLoginSuspensionMessage(message)).toBe(true);
  });

  it("only returns the login suspension notice while an active Level 3 restriction is still running", () => {
    const blacklist = {
      blockedUntil: new Date("2027-07-15T00:00:00.000Z"),
      isActive: true,
      totalViolations: 3
    };

    expect(
      getLevelThreeLoginSuspensionMessage({
        blacklist,
        now: new Date("2026-07-15T00:00:00.000Z"),
        traces: []
      })
    ).toContain("Akses login dibuka kembali pada 15 Jul 2027, 07.00 WIB.");
    expect(
      getLevelThreeLoginSuspensionMessage({
        blacklist,
        now: new Date("2027-07-16T00:00:00.000Z"),
        traces: []
      })
    ).toBeNull();
    expect(
      getLevelThreeLoginSuspensionMessage({
        blacklist: { ...blacklist, totalViolations: 2 },
        now: new Date("2026-07-15T00:00:00.000Z"),
        traces: []
      })
    ).toBeNull();
  });

  it("uses derived milestone history when violation traces are available", () => {
    const message = getLevelThreeLoginSuspensionMessage({
      blacklist: {
        blockedUntil: new Date("2030-01-01T00:00:00.000Z"),
        isActive: true,
        totalViolations: 9
      },
      now: new Date("2026-07-15T00:00:00.000Z"),
      traces: [
        { occurredAt: "2026-01-01T00:00:00.000Z", escalationEligible: true },
        { occurredAt: "2026-01-08T00:00:00.000Z", escalationEligible: true },
        { occurredAt: "2026-02-07T00:00:00.000Z", escalationEligible: true }
      ]
    });

    expect(message).toContain("7 Feb 2027, 07.00 WIB");
  });
});
