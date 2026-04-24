import { describe, expect, it } from "vitest";

import { getSafeSuperAdminNextPath } from "@/lib/auth/guards";

describe("superadmin auth guards", () => {
  it("keeps superadmin navigation inside its own area", () => {
    expect(getSafeSuperAdminNextPath("/superadmin/unit/unit-alpha-central")).toBe(
      "/superadmin/unit/unit-alpha-central"
    );
    expect(getSafeSuperAdminNextPath("/admin")).toBe("/superadmin");
  });
});
