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
});
