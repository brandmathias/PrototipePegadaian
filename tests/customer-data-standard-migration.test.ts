import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("customer data standard migration", () => {
  const migrationPath = join(process.cwd(), "drizzle", "0025_customer_data_standard.sql");

  it("normalizes legacy barang owner names and phone numbers before adding database checks", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain(`update "barang" as item`);
    expect(migration).toContain(`'Brando Mahendra'`);
    expect(migration).toContain(`'Andi Wijaya'`);
    expect(migration).toContain(`"customer_number" ~ '^08[0-9]{8,11}$'`);
    expect(migration).toContain(`"barang_customer_number_format_check"`);
    expect(migration).toContain(`"barang_owner_name_two_words_check"`);
  });

  it("runs the migration automatically before the production server starts", () => {
    const startup = readFileSync(join(process.cwd(), "scripts", "start-production.mjs"), "utf8");
    const dockerfile = readFileSync(join(process.cwd(), "Dockerfile"), "utf8");
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

    expect(startup).toContain("customer-data-standard-migration.sql");
    expect(dockerfile).toContain(
      "/app/drizzle/0025_customer_data_standard.sql ./customer-data-standard-migration.sql",
    );
    expect(packageJson.scripts["db:migrate:customer-data-standard"]).toBe(
      "tsx scripts/apply-customer-data-standard-migration.ts",
    );
    expect(startup).toContain(`"customer_number" !~ '^08[0-9]{8,11}$'`);
    expect(
      readFileSync(join(process.cwd(), "scripts", "apply-customer-data-standard-migration.ts"), "utf8"),
    ).toContain(`"customer_number" !~ '^08[0-9]{8,11}$'`);
  });
});
