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

  it("keeps the shared catalog database read cached without build-time prerendering", async () => {
    const route = await source("app/(public)/katalog/page.tsx");

    expect(route).toContain('import { connection } from "next/server"');
    expect(route).toContain("await connection()");
    expect(route).toContain("unstable_cache");
    expect(route).toContain("revalidate: 10");
    expect(route).not.toContain("force-dynamic");
    expect(route).not.toContain("getServerSession");
    expect(route).not.toContain("getBuyerWishlistIds");
  });

  it("keeps catalog filtering out of legacy and repeated client work", async () => {
    const page = await source("components/pages/catalog-page.tsx");

    expect(page).toContain("const catalogIndex = useMemo");
    expect(page).not.toContain(".flatMap(");
    expect(page).not.toContain("router.refresh()");
  });

  it("keeps the public layout from blocking catalog HTML on session reads", async () => {
    const layout = await source("app/(public)/layout.tsx");

    expect(layout).not.toContain("force-dynamic");
    expect(layout).not.toContain("getServerSession");
    expect(layout).not.toContain("getBuyerWishlistCount");
  });
});
