import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("canonical unit and SBG migration", () => {
  const migrationPath = join(process.cwd(), "drizzle", "0023_canonical_unit_sbg_codes.sql");

  it("preserves unit names while assigning approved Ranotana and Wanea codes", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain(`lower(trim("name")) = 'upc ranotana'`);
    expect(migration).toContain(`'CP-MND-11793'`);
    expect(migration).toContain(`lower(trim("name")) = 'upc wanea'`);
    expect(migration).toContain(`'CP-MND-11787'`);
    expect(migration).not.toMatch(/update\s+"units"\s+set\s+"name"/i);
  });

  it("creates the sequence and rewrites legacy item codes into 16-digit SBG codes", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain(`create sequence if not exists "barang_sbg_number_seq"`);
    expect(migration).toContain(`'SBG-'`);
    expect(migration).toContain(`!~ '^SBG-[0-9]{16}$'`);
    expect(migration).toContain(`lpad(nextval('barang_sbg_number_seq')::text, 11, '0')`);
  });

  it("runs the same migration automatically before the production server", () => {
    const startup = readFileSync(join(process.cwd(), "scripts", "start-production.mjs"), "utf8");
    const dockerfile = readFileSync(join(process.cwd(), "Dockerfile"), "utf8");
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

    expect(startup).toContain("canonical-code-migration.sql");
    expect(dockerfile).toContain(
      "/app/drizzle/0023_canonical_unit_sbg_codes.sql ./canonical-code-migration.sql",
    );
    expect(packageJson.scripts["db:migrate:canonical-codes"]).toBe(
      "tsx scripts/apply-canonical-codes-migration.ts",
    );
  });
});
