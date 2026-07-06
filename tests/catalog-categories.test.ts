import { describe, expect, it } from "vitest";

import { ADMIN_UNIT_CATEGORY_FILTER_OPTIONS } from "@/lib/catalog/categories";

describe("catalog category filters", () => {
  it("provides every category in Indonesian alphabetical order", () => {
    expect(ADMIN_UNIT_CATEGORY_FILTER_OPTIONS.map((option) => option.label)).toEqual([
      "Elektronik",
      "Kendaraan",
      "Lainnya",
      "Logam Mulia",
      "Perhiasan"
    ]);
  });
});
