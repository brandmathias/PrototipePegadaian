import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  isFixedPriceBuyerCatalogHiddenStatus,
  isFixedPriceTransactionCatalogHiddenStatus
} from "@/lib/buyer/fixed-price-visibility";

describe("fixed price catalog visibility", () => {
  it("keeps harga tetap catalog visible until buyer submits payment proof", () => {
    expect(isFixedPriceTransactionCatalogHiddenStatus("menunggu_pembayaran")).toBe(false);
    expect(isFixedPriceBuyerCatalogHiddenStatus("MENUNGGU_PEMBAYARAN")).toBe(false);
  });

  it("hides harga tetap catalog after payment proof is submitted", () => {
    expect(isFixedPriceTransactionCatalogHiddenStatus("bukti_diunggah")).toBe(true);
    expect(isFixedPriceBuyerCatalogHiddenStatus("BUKTI_DIUNGGAH")).toBe(true);
  });

  it("orders active catalog rows by the publication time inherited by a relisted session", async () => {
    const service = await readFile(
      path.join(process.cwd(), "lib/services/public-catalog.service.ts"),
      "utf8"
    );

    expect(service).not.toContain('min("catalog_history"."created_at")');
    expect(service).toContain("desc(pemasaran.createdAt),");
  });

  it("hides active Midtrans reservations from the catalog while keeping stale detail URLs resolvable", async () => {
    const service = await readFile(
      path.join(process.cwd(), "lib/services/public-catalog.service.ts"),
      "utf8"
    );
    const detailPage = await readFile(
      path.join(process.cwd(), "app/(public)/katalog/[id]/page.tsx"),
      "utf8"
    );

    expect(service).toContain("eq(transaksi.paymentMethod, \"midtrans\")");
    expect(service).toContain("eq(transaksi.status, \"menunggu_pembayaran\")");
    expect(service).toContain("gt(transaksi.paymentDeadline, now)");
    expect(detailPage).toContain("getPublicLotById(id, { includeUnavailableFixedPrice: true })");

    const wishlistService = await readFile(
      path.join(process.cwd(), "lib/services/wishlist.service.ts"),
      "utf8"
    );

    expect(service).toContain("export function publicCatalogVisibilityConditions");
    expect(wishlistService).toContain("publicCatalogVisibilityConditions(now)");
  });
});
