import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("admin barang detail chronology", () => {
  it("does not cap the item timeline before the initial Barang Masuk event", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/admin/barang/[id]/page.tsx"),
      "utf8",
    );

    expect(source).toContain("listAdminBarangHistory(unitId, undefined, id)");
  });
});
