import { describe, expect, it } from "vitest";

import {
  normalizeUnitCode,
  validateAdminUnitPayload,
  validateBlacklistRevokePayload,
  validateManagedUnitCreatePayload,
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

  it("requires an active primary account when creating a managed unit", () => {
    expect(() =>
      validateManagedUnitCreatePayload({
        code: "CP-MND-02",
        name: "Pegadaian CP Boulevard",
        address: "Jl. Boulevard Manado",
        primaryAccount: {
          bankName: "BRI",
          accountNumber: "9876543210",
          accountHolderName: "PT Pegadaian Area Manado",
          branchName: "Manado"
        }
      })
    ).not.toThrow();

    expect(() =>
      validateManagedUnitCreatePayload({
        code: "CP-MND-03",
        name: "Pegadaian CP Tikala",
        address: "Jl. Tikala Baru",
        primaryAccount: {
          bankName: "",
          accountNumber: "1234567890",
          accountHolderName: "PT Pegadaian Area Manado"
        }
      })
    ).toThrow("Rekening aktif utama wajib dilengkapi saat membuat unit.");
  });
});
