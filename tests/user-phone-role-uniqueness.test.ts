import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("role-scoped user phone uniqueness", () => {
  it("replaces the global user phone index with per-role partial indexes", () => {
    const migration = readFileSync(join(process.cwd(), "drizzle", "0019_loud_liz_osborn.sql"), "utf8");

    expect(migration).toContain('DROP INDEX "user_phone_number_unique"');
    expect(migration).toContain('"user_buyer_phone_number_unique"');
    expect(migration).toContain('"user_admin_unit_phone_number_unique"');
    expect(migration).toContain('"user_super_admin_phone_number_unique"');
    expect(migration).toContain(`"user"."role" = 'buyer'`);
    expect(migration).toContain(`"user"."role" = 'admin_unit'`);
    expect(migration).toContain(`"user"."role" = 'super_admin'`);
  });
});
