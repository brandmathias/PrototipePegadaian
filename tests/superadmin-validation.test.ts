import { describe, expect, it } from "vitest";

import {
  normalizeUnitCode,
  validateAdminUnitPayload,
  validateBlacklistRevokePayload,
  validateUnitAccountPayload,
  validateUnitPayload
} from "@/lib/superadmin/validation";

describe("superadmin validation", () => {
  it("normalizes unit payload values", () => {
    expect(
      validateUnitPayload({
        code: " cp-mdn-01 ",
        name: " Pegadaian CP Manado ",
        address: " Jl. Piere Tendean No. 88 "
      })
    ).toEqual({
      code: "CP-MDN-01",
      name: "Pegadaian CP Manado",
      address: "Jl. Piere Tendean No. 88"
    });
  });

  it("requires complete unit account payload", () => {
    expect(() =>
      validateUnitAccountPayload({
        bankName: "",
        accountNumber: " 1234567890 ",
        accountHolderName: ""
      })
    ).toThrow("Data rekening unit belum lengkap.");
  });

  it("normalizes unit code helper", () => {
    expect(normalizeUnitCode(" upc-mks-01 ")).toBe("UPC-MKS-01");
  });

  it("requires email, unit, and temporary password for admin unit", () => {
    expect(() =>
      validateAdminUnitPayload({
        name: "Admin Manado",
        email: "admin@pegadaian.test",
        unitId: "",
        temporaryPassword: ""
      })
    ).toThrow("Data admin unit belum lengkap.");
  });

  it("requires a reason before revoking blacklist", () => {
    expect(() => validateBlacklistRevokePayload({ reason: "   " })).toThrow(
      "Alasan pencabutan blacklist wajib diisi."
    );
  });
});
