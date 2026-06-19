import { describe, expect, it } from "vitest";

describe("superadmin monitoring links", () => {
  it("routes unit monitoring detail actions to the unit inventory/detail page", async () => {
    process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/prototipe_pegadaian";

    const { getSuperAdminUnitDetailHref } = await import("@/lib/services/monitoring.service");

    expect(getSuperAdminUnitDetailHref("unit-1")).toBe("/superadmin/unit/unit-1");
  });
});
