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

  it("prioritizes the visible hero instead of below-fold catalog media", async () => {
    const [route, template, hero, page] = await Promise.all([
      source("app/(public)/katalog/page.tsx"),
      source("app/(public)/katalog/template.tsx"),
      source("components/pages/catalog-hero.tsx"),
      source("components/pages/catalog-page.tsx")
    ]);

    expect(route).toContain('import { CatalogHero } from "@/components/pages/catalog-hero"');
    expect(route).toContain("<CatalogHero />");
    expect(hero).not.toContain('"use client"');
    expect(hero).not.toContain('rel="preload"');
    expect(hero).toContain('data-testid="catalog-hero-image"');
    expect(hero).toContain("md:bg-[image:var(--catalog-hero-image)]");
    expect(hero).toContain("md:bg-[length:100%_auto]");
    expect(template).toContain('import { preload } from "react-dom"');
    expect(template).toContain('preload("/assets/catalog-hero-buyer.webp"');
    expect(template).toContain('media: "(min-width: 768px)"');
    expect(template).toContain('type: "image/webp"');
    expect(page).not.toContain("priority={currentPage === 0 && index === 0}");
    expect(page).not.toContain("function HeroInfoCard");
  });

  it("keeps buyer navigation and catalog branding out of the guest critical path", async () => {
    const [publicShell, buyerNav] = await Promise.all([
      source("components/layout/public-shell.tsx"),
      source("components/layout/buyer-top-nav.tsx")
    ]);

    expect(publicShell).toContain('import dynamic from "next/dynamic"');
    expect(publicShell).not.toContain(
      'import { BuyerTopNav } from "@/components/layout/buyer-top-nav"'
    );
    expect(publicShell).toContain('import("@/components/layout/buyer-top-nav")');
    expect(publicShell).not.toContain("shouldPrioritizeBrand");
    expect(buyerNav).not.toContain("shouldPrioritizeBrand");
  });

  it("defers the cached catalog database read until runtime", async () => {
    const route = await source("app/(public)/katalog/page.tsx");

    expect(route).toContain('import { Suspense } from "react"');
    expect(route).toContain("async function CatalogResults()");
    expect(route).toContain("<Suspense");
    expect(route).toContain("fallback={<CatalogResultsFallback />}");
    expect(route).not.toContain("export default async function Page()");
    expect(route).toContain('import { connection } from "next/server"');
    expect(route).toContain("await connection()");
    expect(route).toContain("unstable_cache");
    expect(route).toContain("revalidate: 10");
    expect(route).not.toContain("force-dynamic");
  });

  it("hydrates buyer wishlist state when returning to the catalog", async () => {
    const route = await source("app/(public)/katalog/page.tsx");

    expect(route).toContain('import { getServerSession } from "@/lib/auth/session"');
    expect(route).toContain('import { getBuyerWishlistIds } from "@/lib/services/wishlist.service"');
    expect(route).toContain("initialFavoriteIds={favoriteIds}");
  });

  it("keeps catalog filtering out of legacy and repeated client work", async () => {
    const page = await source("components/pages/catalog-page.tsx");

    expect(page).toContain("const catalogIndex = useMemo");
    expect(page).not.toContain(".flatMap(");
    expect(page).not.toContain("router.refresh()");
  });

  it("keeps the public layout from blocking catalog HTML on session reads", async () => {
    const layout = await source("app/(public)/layout.tsx");

    expect(layout).toContain('import { PublicShell } from "@/components/layout/public-shell"');
    expect(layout).not.toContain("force-dynamic");
  });
});
