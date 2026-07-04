import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

async function source(filePath: string) {
  return readFile(path.join(process.cwd(), filePath), "utf8");
}

describe("superadmin unit monitoring performance", () => {
  it("serves inventory thumbnails through next/image at their rendered size", async () => {
    const page = await source("components/pages/superadmin-pages.tsx");
    const inventory = page.slice(
      page.indexOf("function SuperAdminUnitInventorySection"),
      page.indexOf("export function SuperAdminUnitDetailPage"),
    );

    expect(inventory).not.toMatch(/<img[\s>]/);
    expect(inventory).toContain("<Image");
    expect(inventory).toContain('sizes="48px"');
    expect(inventory).toContain("quality={60}");
  });

  it("server-renders the unit detail instead of waiting for a client-only chunk", async () => {
    const lazyPages = await source("components/pages/superadmin-pages.lazy.tsx");
    const detailLoader = lazyPages.slice(
      lazyPages.indexOf("const LazySuperAdminUnitDetailPage"),
      lazyPages.indexOf("const LazySuperAdminManagementUnitDetailPage"),
    );

    expect(detailLoader).not.toContain("ssr: false");
  });

  it("parallelizes unit reads and briefly caches repeated monitoring requests", async () => {
    const [service, route] = await Promise.all([
      source("lib/services/unit.service.ts"),
      source("app/superadmin/unit/[id]/page.tsx"),
    ]);
    const unitReader = service.slice(
      service.indexOf("export async function getUnitById"),
      service.indexOf("export async function getSuperAdminUnitBarangDetail"),
    );

    expect(unitReader).toContain("await Promise.all");
    expect(route).toContain("unstable_cache");
    expect(route).toContain("revalidate: 5");
  });

  it("optimizes item-detail gallery images and server-renders the detail page", async () => {
    const [viewer, lazyPages] = await Promise.all([
      source("components/admin-unit/admin-barang-detail-media-viewer.tsx"),
      source("components/pages/superadmin-pages.lazy.tsx"),
    ]);
    const initialGallery = viewer.slice(0, viewer.indexOf("{isFullscreenOpen"));
    const detailLoader = lazyPages.slice(
      lazyPages.indexOf("const LazySuperAdminUnitBarangDetailPage"),
      lazyPages.indexOf("const LazySuperAdminUnitAccountsPage"),
    );

    expect(initialGallery).not.toMatch(/<img[\s>]/);
    expect(viewer).toContain('import Image from "next/image"');
    expect(initialGallery).toContain('sizes="96px"');
    expect(initialGallery).toContain("quality={60}");
    expect(detailLoader).not.toContain("ssr: false");
  });

  it("briefly caches repeated item-detail requests", async () => {
    const route = await source("app/superadmin/unit/[id]/barang/[barangId]/page.tsx");

    expect(route).toContain("unstable_cache");
    expect(route).toContain("revalidate: 5");
  });

  it("keeps the item-detail route out of the giant superadmin client bundle", async () => {
    const [route, page, deferredMarketing] = await Promise.all([
      source("app/superadmin/unit/[id]/barang/[barangId]/page.tsx"),
      source("components/pages/superadmin-unit-barang-detail-page.tsx"),
      source("components/pages/deferred-superadmin-marketing-audit.tsx"),
    ]);

    expect(route).toContain("@/components/pages/superadmin-unit-barang-detail-page");
    expect(route).not.toContain("superadmin-pages.lazy");
    expect(page).not.toContain('"use client"');
    expect(page).toContain("<DeferredSuperAdminMarketingAudit");
    expect(deferredMarketing).toContain("IntersectionObserver");
  });
});
