import { describe, expect, it } from "vitest";

describe("superadmin monitoring query", () => {
  it("qualifies the outer unit id inside comparative subqueries", async () => {
    process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/prototipe_pegadaian";

    const { buildSuperAdminUnitRowsQuery } = await import("@/lib/services/monitoring.service");
    const rendered = (buildSuperAdminUnitRowsQuery() as any).toSQL().sql as string;

    expect(rendered).toContain('"monitoring_units"."id"');
    expect(rendered).not.toContain('= "id"');
    expect(rendered).toContain("b.due_date > now()");
    expect(rendered).toContain("locked_t.status in");
    expect(rendered).toContain("coalesce(sum(t.amount), 0)");
    expect(rendered).toContain("t.status in ($");
  }, 15000);
});
