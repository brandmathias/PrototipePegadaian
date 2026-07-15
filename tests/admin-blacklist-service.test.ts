import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@/lib/db/client", () => ({ db: mocks.db }));

import {
  getAdminBlacklistByUserId,
  listAdminBlacklist,
} from "@/lib/services/admin-blacklist.service";

const L1_OCCURRED_AT = new Date("2026-05-01T01:07:28.000Z");
const L2_OCCURRED_AT = new Date("2026-06-01T01:07:28.000Z");
const L3_OCCURRED_AT = new Date("2026-07-15T00:00:00.000Z");

function queryResult(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  for (const method of [
    "from",
    "innerJoin",
    "leftJoin",
    "where",
    "orderBy",
    "limit",
  ]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(rows).then(resolve, reject);
  return chain;
}

function localTraceRow(level: 1 | 2 | 3 = 1) {
  const scenario = {
    1: {
      id: "violation-sarinah-l1",
      itemName: "Kalung Emas Rantai Singapura 22K",
      occurredAt: L1_OCCURRED_AT,
      unitId: "unit-sarinah",
      unitName: "UPC Sarinah",
    },
    2: {
      id: "violation-ranotana-l2",
      itemName: "Cincin Emas Solitaire 22K",
      occurredAt: L2_OCCURRED_AT,
      unitId: "unit-ranotana",
      unitName: "UPC Ranotana",
    },
    3: {
      id: "violation-wanea-l3",
      itemName: "Gelang Emas Bangle Polos 22K",
      occurredAt: L3_OCCURRED_AT,
      unitId: "unit-wanea",
      unitName: "UPC Wanea",
    },
  }[level];

  return {
    violation: {
      id: scenario.id,
      userId: "buyer-safira",
      unitId: scenario.unitId,
      transaksiId: `transaction-${level}`,
      pemasaranId: `auction-${level}`,
      escalationEligible: true,
      note: "Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam.",
      createdAt: scenario.occurredAt,
    },
    transaction: {
      id: `transaction-${level}`,
      status: "gagal",
      amount: "8458212096",
      paymentDeadline: scenario.occurredAt,
      createdAt: new Date(scenario.occurredAt.getTime() - 24 * 60 * 60 * 1000),
    },
    auction: {
      id: `auction-${level}`,
      mode: "vickrey",
      basePrice: "8458212096",
      price: null,
      finalPrice: "8500000000",
    },
    item: {
      id: `item-${level}`,
      code: "SBG-118880000000042",
      name: scenario.itemName,
      category: "perhiasan",
      condition: "baik",
      description: "Kalung emas kuning 22K dengan pola rantai Singapura.",
      appraisalValue: "8458212096",
    },
    media: null,
    unit: {
      id: scenario.unitId,
      name: scenario.unitName,
    },
  };
}

function globalBlacklistRow() {
  return {
    blacklist: {
      id: "blacklist-safira",
      userId: "buyer-safira",
      unitId: "unit-wanea",
      totalViolations: 3,
      blockedUntil: new Date("2027-07-15T00:00:00.000Z"),
      isActive: true,
      createdAt: L1_OCCURRED_AT,
      updatedAt: L3_OCCURRED_AT,
    },
    user: {
      id: "buyer-safira",
      name: "Safira Melani",
      email: "safira@gmail.com",
      phoneNumber: "-",
    },
    unit: {
      id: "unit-wanea",
      name: "UPC Wanea",
    },
  };
}

const globalFacts = [
  {
    id: "violation-sarinah-l1",
    userId: "buyer-safira",
    unitId: "unit-sarinah",
    escalationEligible: true,
    createdAt: L1_OCCURRED_AT,
    paymentDeadline: L1_OCCURRED_AT,
  },
  {
    id: "violation-ranotana-l2",
    userId: "buyer-safira",
    unitId: "unit-ranotana",
    escalationEligible: true,
    createdAt: L2_OCCURRED_AT,
    paymentDeadline: L2_OCCURRED_AT,
  },
  {
    id: "violation-wanea-l3",
    userId: "buyer-safira",
    unitId: "unit-wanea",
    escalationEligible: true,
    createdAt: L3_OCCURRED_AT,
    paymentDeadline: L3_OCCURRED_AT,
  },
];

function installDatabaseScenario({
  hasLocalTrace = true,
  localLevel = 1,
}: {
  hasLocalTrace?: boolean;
  localLevel?: 1 | 2 | 3;
} = {}) {
  let localTraceWasLoaded = false;

  mocks.db.select.mockImplementation((selection: Record<string, unknown>) => {
    if ("violation" in selection) {
      localTraceWasLoaded = true;
      return queryResult(hasLocalTrace ? [localTraceRow(localLevel)] : []);
    }
    if ("blacklist" in selection) {
      return queryResult(localTraceWasLoaded ? [globalBlacklistRow()] : []);
    }
    if ("escalationEligible" in selection) {
      return queryResult(globalFacts);
    }
    if ("action" in selection) {
      return queryResult([]);
    }
    throw new Error(`Unexpected select keys: ${Object.keys(selection).join(", ")}`);
  });
}

describe("admin blacklist cross-unit history", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T03:00:00.000Z"));
    mocks.db.select.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists Sarinah's ended Level 1 even when the global row points to Wanea", async () => {
    installDatabaseScenario();

    const entries = await listAdminBlacklist("unit-sarinah");

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual(
      expect.objectContaining({
        userId: "buyer-safira",
        name: "Safira Melani",
        level: 1,
        violations: 1,
        status: "TIDAK_AKTIF",
        blockedUntilAt: "2026-05-08T01:07:28.000Z",
        lastIncidentAt: "2026-05-01T01:07:28.000Z",
        unit: "unit-sarinah",
        unitName: "UPC Sarinah",
        unpaidAuctionCount: 1,
      }),
    );
    expect(entries[0]?.crossUnitViolationSummary).toEqual({
      currentUnitViolationCount: 1,
      effectiveViolationTotal: 3,
      externalUnitCount: 2,
      externalViolationCount: 2,
      hasExternalViolations: true,
    });
  });

  it("opens only Sarinah's local detail although the global row points to Wanea", async () => {
    installDatabaseScenario();

    const entry = await getAdminBlacklistByUserId("unit-sarinah", "buyer-safira");

    expect(entry).toEqual(
      expect.objectContaining({
        level: 1,
        status: "TIDAK_AKTIF",
        unit: "unit-sarinah",
        unitName: "UPC Sarinah",
      }),
    );
    expect(entry.unpaidAuctionTraces).toHaveLength(1);
    expect(entry.unpaidAuctionTraces[0]).toEqual(
      expect.objectContaining({
        id: "violation-sarinah-l1",
        imageUrl:
          "/media/violation-items/kalung-emas-rantai-singapura-22k.webp",
        itemName: "Kalung Emas Rantai Singapura 22K",
      }),
    );
  });

  it.each([
    {
      blockedUntilAt: "2026-07-01T01:07:28.000Z",
      expectedLevel: 2,
      expectedStatus: "TIDAK_AKTIF",
      localLevel: 2 as const,
      unitId: "unit-ranotana",
      unitName: "UPC Ranotana",
    },
    {
      blockedUntilAt: "2027-07-15T00:00:00.000Z",
      expectedLevel: 3,
      expectedStatus: "AKTIF",
      localLevel: 3 as const,
      unitId: "unit-wanea",
      unitName: "UPC Wanea",
    },
  ])(
    "lists $unitName using its own Level $expectedLevel restriction window",
    async ({ blockedUntilAt, expectedLevel, expectedStatus, localLevel, unitId, unitName }) => {
      installDatabaseScenario({ localLevel });

      const entries = await listAdminBlacklist(unitId);

      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual(
        expect.objectContaining({
          blockedUntilAt,
          level: expectedLevel,
          status: expectedStatus,
          unit: unitId,
          unitName,
          violations: expectedLevel,
        }),
      );
      expect(entries[0]?.crossUnitViolationSummary.effectiveViolationTotal).toBe(3);
    },
  );

  it("rejects detail access when the admin unit has no counted local trace", async () => {
    installDatabaseScenario({ hasLocalTrace: false });

    await expect(
      getAdminBlacklistByUserId("unit-unrelated", "buyer-safira"),
    ).rejects.toThrow("Riwayat blacklist tidak ditemukan di unit Anda.");
  });
});
