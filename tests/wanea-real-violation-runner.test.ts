import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("UPC Wanea real buyer violation runner", () => {
  it("requires explicit production approval, a one-off password secret, and transaction rollback by default", () => {
    const source = readFileSync(
      join(process.cwd(), "scripts", "apply-wanea-real-violation-scenario.ts"),
      "utf8"
    );

    expect(source).toContain('process.env.SCENARIO_TARGET === "production"');
    expect(source).toContain("WANEA_SCENARIO_PASSWORDS_JSON");
    expect(source).toContain("getBlacklistDurationUnit() !== \"days\"");
    expect(source).toContain("pg_advisory_xact_lock");
    expect(source).toContain("if (userIds.length) {");
    expect(source).not.toContain("if (!userIds.length) return");
    expect(source).toContain("Audit jumlah barang gagal.");
    expect(source).toContain("Audit jumlah bid gagal.");
    expect(source).toContain("Audit jumlah pelanggaran gagal.");
    expect(source).toContain('await client.query("rollback")');
    expect(source).toContain('await client.query("commit")');
  });
});
