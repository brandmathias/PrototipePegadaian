import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

async function source(filePath: string) {
  return readFile(path.join(process.cwd(), filePath), "utf8");
}

describe("public catalog performance", () => {
  it("does not mount a realtime listener tree for every catalog card", async () => {
    const page = await source("components/pages/catalog-page.tsx");

    expect(page).not.toContain('import { LotRealtimeStats }');
    expect(page).not.toContain("<LotRealtimeStats");
    expect(page).toContain("function CatalogLotStats");
  });

  it("defers rendering cards below the viewport", async () => {
    const page = await source("components/pages/catalog-page.tsx");

    expect(page).toContain("[content-visibility:auto]");
    expect(page).toContain("[contain-intrinsic-size:");
  });

  it("briefly caches the shared catalog database read", async () => {
    const route = await source("app/(public)/katalog/page.tsx");

    expect(route).toContain("unstable_cache");
    expect(route).toContain("revalidate: 10");
  });
});
