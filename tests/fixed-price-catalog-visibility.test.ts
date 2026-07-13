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

  it("keeps a relisted item in its original catalog position", async () => {
    const service = await readFile(
      path.join(process.cwd(), "lib/services/public-catalog.service.ts"),
      "utf8"
    );

    expect(service).toContain('min("catalog_history"."created_at")');
    expect(service).not.toContain(".orderBy(desc(pemasaran.createdAt));");
  });
});
