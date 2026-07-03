import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { barang } from "@/lib/db/schema";

describe("retired loan value", () => {
  it("removes loan value from the active schema and production database startup", () => {
    const startup = readFileSync(resolve(process.cwd(), "scripts/start-production.mjs"), "utf8");

    expect(Object.keys(barang)).not.toContain("loanValue");
    expect(startup).toMatch(/drop column if exists "loan_value"/i);
    expect(startup).toMatch(/column_name = 'loan_value'/i);
  });
});
