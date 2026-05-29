import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    select: vi.fn(),
    transaction: vi.fn()
  };
  const tx = {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  };
  const notifyBlacklistActivated = vi.fn();

  return {
    db,
    notifyBlacklistActivated,
    tx
  };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("@/lib/services/notification-events", () => ({
  notifyBlacklistActivated: mocks.notifyBlacklistActivated,
  notifyPaymentDeadlineSoon: vi.fn(),
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

describe("overdue Vickrey payment settlement", () => {
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
});
