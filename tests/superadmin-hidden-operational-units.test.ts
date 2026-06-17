import { describe, expect, it } from "vitest";

import { isHiddenOperationalUnit } from "@/lib/superadmin/hidden-operational-units";

describe("superadmin hidden operational units", () => {
  it("recognizes legacy dummy units by id or code", () => {
    expect(isHiddenOperationalUnit({ id: "8842237d-f5fb-4788-9744-8a48f6eb740d" })).toBe(true);
    expect(isHiddenOperationalUnit({ code: "CP-TST-7933" })).toBe(true);
    expect(isHiddenOperationalUnit({ code: "CP-FIN-1776908883473" })).toBe(true);
  });

  it("keeps real operational units visible", () => {
    expect(isHiddenOperationalUnit({ id: "unit-ranotana", code: "CP-MND-13" })).toBe(false);
    expect(isHiddenOperationalUnit({ id: "unit-wanea", code: "CP-MND-11787" })).toBe(false);
  });
});
