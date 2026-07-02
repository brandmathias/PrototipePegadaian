import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  blacklistActionLogs,
  blacklists,
  pelanggaranUser,
} from "@/lib/db/schema";

describe("retired manual blacklist surface", () => {
  it("does not expose columns owned by manual revoke or review", () => {
    expect(Object.keys(blacklists)).not.toEqual(
      expect.arrayContaining(["revokedByUserId", "revokeReason"]),
    );
    expect(Object.keys(blacklistActionLogs)).not.toEqual(
      expect.arrayContaining(["performedByType", "performedByUserId"]),
    );
    expect(Object.keys(pelanggaranUser)).not.toEqual(
      expect.arrayContaining([
        "resolutionType",
        "resolutionReasonCode",
        "resolutionNote",
        "resolvedByUserId",
        "resolvedAt",
      ]),
    );
  });

  it.each([
    "app/api/superadmin/blacklist/[userId]/cabut/route.ts",
    "app/api/admin/blacklist/[userId]/perpanjang/route.ts",
    "app/admin/blacklist/[userId]/perpanjang/page.tsx",
    "components/superadmin/cabut-blacklist-form.tsx",
    "components/admin-unit/admin-blacklist-extend-form.tsx",
    "lib/blacklist/revoke.ts",
  ])("removes %s", (path) => {
    expect(existsSync(resolve(process.cwd(), path))).toBe(false);
  });
});
