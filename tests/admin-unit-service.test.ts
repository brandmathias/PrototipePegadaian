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
  listAdminUnits,
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
        isActive: false,
      }),
    ]);
  });

  it("releases phone held by a detached admin hidden from active unit data", async () => {
    const updatePayloads: Array<Record<string, unknown>> = [];

    mocks.db.select.mockImplementationOnce(() =>
      mockSelectRows([{ id: "admin-terlepas" }]),
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
      "admin.baru@example.com",
      "082217460191",
    );

    expect(mocks.tx.delete).toHaveBeenCalledTimes(2);
    expect(updatePayloads).toEqual([
      expect.objectContaining({
        email: "deleted-admin-terlepas@admin-unit.local",
        phoneNumber: null,
        unitId: null,
        isActive: false,
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

  it("keeps active admin feed limited to admins attached to real units", async () => {
    const rows = [
      {
        id: "admin-ranotana",
        name: "Admin Unit Ranotana",
        email: "admin.unit.ranotana@pegadaian.co.id",
        phoneNumber: "081200001234",
        isActive: true,
        unitId: "unit-ranotana",
        unitName: "UPC Ranotana",
        unitCode: "UPC-RNT",
        lastLogin: null,
      },
      {
        id: "admin-test",
        name: "Admin Unit Test",
        email: "admin.unit.1776893226@example.com",
        phoneNumber: null,
        isActive: true,
        unitId: null,
        unitName: null,
        unitCode: null,
        lastLogin: null,
      },
      {
        id: "admin-stale",
        name: "Admin Unit Tanpa Unit",
        email: "admin.unit.stale@example.com",
        phoneNumber: null,
        isActive: true,
        unitId: "unit-missing",
        unitName: null,
        unitCode: null,
        lastLogin: null,
      },
    ];
    const chain = {
      from: vi.fn(),
      groupBy: vi.fn(),
      leftJoin: vi.fn(),
      orderBy: vi.fn().mockResolvedValue(rows),
      where: vi.fn(),
    };

    chain.from.mockReturnValue(chain);
    chain.leftJoin.mockReturnValue(chain);
    chain.where.mockReturnValue(chain);
    chain.groupBy.mockReturnValue(chain);
    mocks.db.select.mockReturnValueOnce(chain);

    await expect(listAdminUnits()).resolves.toEqual([
      expect.objectContaining({
        id: "admin-ranotana",
        name: "Admin Unit Ranotana",
        unit: "UPC Ranotana",
      }),
    ]);
  });
});
