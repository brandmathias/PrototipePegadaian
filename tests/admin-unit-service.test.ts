import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    select: vi.fn(),
    transaction: vi.fn(),
  };
  const tx = {
    delete: vi.fn(),
    update: vi.fn(),
  };

  return { db, tx };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db,
}));

import {
  deactivateAdminUnit,
  releaseInactiveAdminIdentityConflicts,
} from "@/lib/services/admin-unit.service";

function mockSelectRows(rows: Array<{ id: string }>, withLimit = false) {
  const where = vi.fn();

  if (withLimit) {
    where.mockReturnValue({
      limit: vi.fn().mockResolvedValue(rows),
    });
  } else {
    where.mockResolvedValue(rows);
  }

  return {
    from: vi.fn().mockReturnValue({ where }),
  };
}

function mockDelete() {
  return {
    where: vi.fn().mockResolvedValue(undefined),
  };
}

describe("admin unit identity cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.db.transaction.mockImplementation(async (callback) =>
      callback(mocks.tx),
    );
    mocks.tx.delete.mockImplementation(() => mockDelete());
  });

  it("releases email and phone held by an inactive admin", async () => {
    const updatePayloads: Array<Record<string, unknown>> = [];

    mocks.db.select.mockImplementationOnce(() =>
      mockSelectRows([{ id: "admin-lama" }]),
    );
    mocks.tx.update.mockImplementation(() => ({
      set: vi.fn((payload) => {
        updatePayloads.push(payload);
        return {
          where: vi.fn().mockResolvedValue(undefined),
        };
      }),
    }));

    await releaseInactiveAdminIdentityConflicts(
      "admin@example.com",
      "082217460191",
    );

    expect(mocks.tx.delete).toHaveBeenCalledTimes(2);
    expect(updatePayloads).toEqual([
      expect.objectContaining({
        email: "deleted-admin-lama@admin-unit.local",
        phoneNumber: null,
        unitId: null,
      }),
    ]);
  });

  it("removes login access and hides a deleted admin from active unit data", async () => {
    const updatePayloads: Array<Record<string, unknown>> = [];

    mocks.db.select.mockImplementationOnce(() =>
      mockSelectRows([{ id: "admin-1" }], true),
    );
    mocks.tx.update.mockImplementation(() => ({
      set: vi.fn((payload) => {
        updatePayloads.push(payload);
        return {
          where: vi.fn().mockResolvedValue(undefined),
        };
      }),
    }));

    await expect(deactivateAdminUnit("admin-1")).resolves.toEqual({
      deleted: true,
      id: "admin-1",
    });

    expect(mocks.tx.delete).toHaveBeenCalledTimes(2);
    expect(updatePayloads).toEqual([
      expect.objectContaining({
        email: "deleted-admin-1@admin-unit.local",
        phoneNumber: null,
        unitId: null,
        isActive: false,
      }),
    ]);
  });
});
