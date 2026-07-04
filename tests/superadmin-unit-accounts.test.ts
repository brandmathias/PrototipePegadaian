import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

async function source(filePath: string) {
  return readFile(path.join(process.cwd(), filePath), "utf8");
}

function block(sourceText: string, start: string, end: string) {
  const startIndex = sourceText.indexOf(start);
  const endIndex = sourceText.indexOf(end);

  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);

  return sourceText.slice(startIndex, endIndex);
}

describe("superadmin unit account ledger contracts", () => {
  it("keeps inactive unit accounts visible in account APIs and detail pages", async () => {
    const [rekeningService, unitService] = await Promise.all([
      source("lib/services/rekening-unit.service.ts"),
      source("lib/services/unit.service.ts"),
    ]);

    const listUnitAccounts = block(
      rekeningService,
      "export async function listUnitAccounts",
      "export async function createUnitAccount",
    );
    const detailAccountsQuery = block(
      unitService,
      "const accountsPromise = db",
      "const adminsPromise = db",
    );
    const managementCountQuery = block(
      unitService,
      "const accountCounts = await db",
      "const activeAccounts = await db",
    );

    expect(listUnitAccounts).not.toContain("eq(unitAccounts.isActive, true)");
    expect(detailAccountsQuery).not.toContain("eq(unitAccounts.isActive, true)");
    expect(managementCountQuery).not.toContain("eq(unitAccounts.isActive, true)");
  });
});
