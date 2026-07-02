import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("canonical runtime code fallbacks", () => {
  it("does not create legacy BRG or ADM identifiers in runtime sources", () => {
    const adminPages = readFileSync(
      join(process.cwd(), "components", "pages", "admin-pages.tsx"),
      "utf8",
    );
    const mockData = readFileSync(join(process.cwd(), "lib", "mock-data.ts"), "utf8");

    expect(adminPages).not.toContain("`BRG-${");
    expect(mockData).not.toContain(`unitCode: "ADM-MND-01"`);
  });
});
