import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/client", () => ({
  db: {}
}));

import { getSuperAdminAccessChangeBlockReason } from "@/lib/services/superadmin-account.service";

describe("superadmin account guardrails", () => {
  it("blocks owner self-deactivation", () => {
    expect(
      getSuperAdminAccessChangeBlockReason({
        actorUserId: "owner-1",
        targetUserId: "owner-1",
        currentLevel: "owner",
        currentIsActive: true,
        nextLevel: "owner",
        nextIsActive: false,
        activeOwnerCount: 2
      })
    ).toBe("Owner tidak dapat menonaktifkan akunnya sendiri.");
  });

  it("blocks demoting or deactivating the last active owner", () => {
    expect(
      getSuperAdminAccessChangeBlockReason({
        actorUserId: "owner-1",
        targetUserId: "owner-2",
        currentLevel: "owner",
        currentIsActive: true,
        nextLevel: "operator",
        nextIsActive: true,
        activeOwnerCount: 1
      })
    ).toBe("Minimal harus ada satu Owner Superadmin aktif.");

    expect(
      getSuperAdminAccessChangeBlockReason({
        actorUserId: "owner-1",
        targetUserId: "owner-2",
        currentLevel: "owner",
        currentIsActive: true,
        nextLevel: "owner",
        nextIsActive: false,
        activeOwnerCount: 1
      })
    ).toBe("Minimal harus ada satu Owner Superadmin aktif.");
  });

  it("allows changing an operator when at least one owner remains", () => {
    expect(
      getSuperAdminAccessChangeBlockReason({
        actorUserId: "owner-1",
        targetUserId: "operator-1",
        currentLevel: "operator",
        currentIsActive: true,
        nextLevel: "operator",
        nextIsActive: false,
        activeOwnerCount: 1
      })
    ).toBeNull();
  });
});
