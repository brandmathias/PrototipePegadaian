import { describe, expect, it } from "vitest";

describe("superadmin monitoring query", () => {
  it("summarizes only restrictions that are effectively active", async () => {
    process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/prototipe_pegadaian";

    const { summarizeBlacklistCompliance } = await import("@/lib/services/monitoring.service");
    const summary = summarizeBlacklistCompliance(
      [
        {
          blockedUntil: new Date("2026-06-19T10:00:00.000Z"),
          isActive: true,
          totalViolations: 1,
        },
        {
          blockedUntil: new Date("2026-06-21T10:00:00.000Z"),
          isActive: true,
          totalViolations: 1,
        },
        {
          blockedUntil: new Date("2026-06-21T10:00:00.000Z"),
          isActive: true,
          totalViolations: 2,
        },
        {
          blockedUntil: new Date("2026-06-19T10:00:00.000Z"),
          isActive: true,
          totalViolations: 3,
        },
      ],
      new Date("2026-06-20T10:00:00.000Z"),
    );

    expect(summary).toEqual({
      levelOne: 1,
      levelTwo: 1,
      levelThree: 0,
      total: 2,
    });
  });

  it("qualifies the outer unit id inside comparative subqueries", async () => {
    process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/prototipe_pegadaian";

    const { buildSuperAdminUnitRowsQuery } = await import("@/lib/services/monitoring.service");
    const query = (buildSuperAdminUnitRowsQuery() as any).toSQL();
    const rendered = query.sql as string;

    expect(rendered).toContain('"monitoring_units"."id"');
    expect(rendered).not.toContain('= "id"');
    expect(rendered).toContain("b.due_date > now()");
    expect(rendered).toContain("locked_t.status in");
    expect(rendered).toContain("coalesce(sum(t.amount), 0)");
    expect(rendered).toContain("t.status in ($");
    expect(rendered).not.toContain("b.status = 'terjual' or");
    expect(query.params).toEqual(["selesai", "selesai"]);
  }, 15000);
});
