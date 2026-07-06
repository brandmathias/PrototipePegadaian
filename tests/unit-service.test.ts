import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    transaction: vi.fn(),
    update: vi.fn()
  },
  revalidateTag: vi.fn()
}));

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag
}));

import { getUnitItemOperationalState } from "@/lib/services/unit.service";

describe("getUnitItemOperationalState", () => {
  it("keeps a relisted harga tetap item marketed even when an older proof was rejected", () => {
    expect(
      getUnitItemOperationalState({
        itemStatus: "dipasarkan",
        activeMarketingMode: "fixed_price",
        activeMarketingStatus: "aktif",
        latestMarketingStatus: "aktif",
        transactionStatus: "ditolak_bukti"
      })
    ).toEqual({
      operationalStatus: "Sedang Dipasarkan",
      operationalTone: "blue"
    });
  });
});
