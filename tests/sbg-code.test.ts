import { describe, expect, it } from "vitest";

import { formatSbgCode, isCanonicalSbgCode } from "@/lib/barang/sbg-code";

describe("SBG code", () => {
  it("combines the five-digit unit number with an eleven-digit sequence", () => {
    expect(formatSbgCode("CP-MND-11787", 25_010_004_741)).toBe("SBG-1178725010004741");
    expect(isCanonicalSbgCode("SBG-1178725010004741")).toBe(true);
  });

  it("rejects noncanonical unit codes and exhausted sequences", () => {
    expect(() => formatSbgCode("CP-MND-13", 1)).toThrow("Kode unit belum menggunakan format resmi.");
    expect(() => formatSbgCode("CP-MND-11787", 100_000_000_000)).toThrow(
      "Nomor urut SBG telah melampaui kapasitas 11 digit.",
    );
  });
});
