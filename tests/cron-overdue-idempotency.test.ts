import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    select: vi.fn(),
    transaction: vi.fn()
  };
  const tx = {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  };
  const notifyBlacklistActivated = vi.fn();
  const listActiveAdminUnitNotificationRecipientIds = vi.fn().mockResolvedValue(["admin-unit-1"]);
  const listActiveSuperAdminNotificationRecipientIds = vi.fn().mockResolvedValue(["superadmin-1"]);
  const notifyAdminUnitVickreyResult = vi.fn();
  const notifySuperAdminPolicyAlert = vi.fn();

  return {
    db,
    listActiveAdminUnitNotificationRecipientIds,
    listActiveSuperAdminNotificationRecipientIds,
    notifyAdminUnitVickreyResult,
    notifyBlacklistActivated,
    notifySuperAdminPolicyAlert,
    tx
  };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("@/lib/services/notification-events", () => ({
  listActiveAdminUnitNotificationRecipientIds: mocks.listActiveAdminUnitNotificationRecipientIds,
  listActiveSuperAdminNotificationRecipientIds: mocks.listActiveSuperAdminNotificationRecipientIds,
  notifyAdminUnitVickreyResult: mocks.notifyAdminUnitVickreyResult,
  notifyBlacklistActivated: mocks.notifyBlacklistActivated,
  notifyPaymentDeadlineSoon: vi.fn(),
  notifySuperAdminPolicyAlert: mocks.notifySuperAdminPolicyAlert,
  notifyVickreyLoss: vi.fn(),
  notifyVickreyWinner: vi.fn()
}));

import { processOverdueVickreyPayments } from "@/lib/services/cron.service";

function mockOverdueRows(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(rows)
            })
          })
        })
      })
    })
  };
}

function mockNoUpdatedTransaction() {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([])
      })
    })
  };
}

function mockUpdatedTransaction() {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "trx-1" }])
      })
    })
  };
}

function mockVoidUpdate(onSet?: (value: Record<string, unknown>) => void) {
  return {
    set: vi.fn((value) => {
      onSet?.(value);

      return {
        where: vi.fn().mockResolvedValue(undefined)
      };
    })
  };
}

function mockExistingBlacklist(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(rows)
        })
      })
    })
  };
}

describe("overdue Lelang Tertutup payment settlement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.db.transaction.mockImplementation(async (callback) => callback(mocks.tx));
  });

  it("does not duplicate violations when another sweep already changed the transaction status", async () => {
    mocks.db.select.mockImplementationOnce(() =>
      mockOverdueRows([
        {
          buyerNationalId: "7371121305260002",
          item: {
            id: "barang-1",
            status: "dipasarkan",
            unitId: "unit-1"
          },
          marketing: {
            id: "pemasaran-1"
          },
          transaction: {
            id: "trx-1",
            pemasaranId: "pemasaran-1",
            userId: "buyer-1"
          }
        }
      ])
    );
    mocks.tx.update.mockImplementationOnce(() => mockNoUpdatedTransaction());

    const summary = await processOverdueVickreyPayments(new Date("2026-05-29T14:36:04.000Z"));

    expect(summary).toEqual({
      processed: 1,
      blacklisted: 0
    });
    expect(mocks.tx.insert).not.toHaveBeenCalled();
    expect(mocks.notifyBlacklistActivated).not.toHaveBeenCalled();
  });

  it("continues blacklist level from an expired historical restriction", async () => {
    const updatePayloads: Array<Record<string, unknown>> = [];

    mocks.db.select.mockImplementationOnce(() =>
      mockOverdueRows([
        {
          buyerNationalId: "7371121305260002",
          item: {
            id: "barang-1",
            status: "dipasarkan",
            unitId: "unit-1"
          },
          marketing: {
            id: "pemasaran-1"
          },
          transaction: {
            id: "trx-1",
            pemasaranId: "pemasaran-1",
            userId: "buyer-current"
          }
        }
      ])
    );

    mocks.tx.update
      .mockImplementationOnce(() => mockUpdatedTransaction())
      .mockImplementation(() => mockVoidUpdate((value) => updatePayloads.push(value)));
    mocks.tx.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined)
    });
    mocks.tx.select.mockImplementationOnce(() =>
      mockExistingBlacklist([
        {
          id: "blacklist-old",
          nationalId: "7371121305260002",
          totalViolations: 1,
          userId: "buyer-old"
        }
      ])
    );

    const summary = await processOverdueVickreyPayments(new Date("2026-05-29T14:36:04.000Z"));

    expect(summary).toEqual({
      processed: 1,
      blacklisted: 1
    });
    expect(updatePayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          isActive: true,
          totalViolations: 2,
          userId: "buyer-current"
        })
      ])
    );
    expect(mocks.notifyBlacklistActivated).toHaveBeenCalledWith(
      expect.objectContaining({
        totalViolations: 2,
        userId: "buyer-current"
      })
    );
  });

  it("does not escalate a new violation while the previous punishment window is still active", async () => {
    const updatePayloads: Array<Record<string, unknown>> = [];
    const insertPayloads: Array<Record<string, unknown>> = [];

    mocks.db.select.mockImplementationOnce(() =>
      mockOverdueRows([
        {
          buyerNationalId: "7371121305260002",
          item: {
            id: "barang-1",
            status: "dipasarkan",
            unitId: "unit-1"
          },
          marketing: {
            id: "pemasaran-1"
          },
          transaction: {
            id: "trx-1",
            pemasaranId: "pemasaran-1",
            userId: "buyer-current"
          }
        }
      ])
    );

    mocks.tx.update
      .mockImplementationOnce(() => mockUpdatedTransaction())
      .mockImplementation(() => mockVoidUpdate((value) => updatePayloads.push(value)));
    mocks.tx.insert.mockReturnValue({
      values: vi.fn((value) => {
        insertPayloads.push(value);
        return Promise.resolve(undefined);
      })
    });
    mocks.tx.select.mockImplementationOnce(() =>
      mockExistingBlacklist([
        {
          blockedUntil: new Date("2026-06-05T00:00:00.000Z"),
          id: "blacklist-active",
          isActive: true,
          nationalId: "7371121305260002",
          totalViolations: 1,
          userId: "buyer-current"
        }
      ])
    );

    const summary = await processOverdueVickreyPayments(new Date("2026-05-31T12:00:00.000Z"));

    expect(summary).toEqual({
      processed: 1,
      blacklisted: 0
    });
    expect(insertPayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          escalationEligible: false
        })
      ])
    );
    expect(updatePayloads).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          totalViolations: 2
        })
      ])
    );
    expect(mocks.notifyBlacklistActivated).not.toHaveBeenCalled();
  });
});
