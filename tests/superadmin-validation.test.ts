import { describe, expect, it } from "vitest";

import {
  extractUnitNumber,
  formatUnitCode,
  getProvinceRegionCode,
  normalizeUnitAccountNumber,
  normalizeUnitBankName,
  normalizeSuperAdminLevel,
  validateAdminUnitPayload,
  validateManagedUnitCreatePayload,
  validateSuperAdminAccountCreatePayload,
  validateSuperAdminAccountUpdatePayload,
  validateSuperAdminPasswordResetPayload,
  validateUnitAccountPayload,
  validateUnitPayload
} from "@/lib/superadmin/validation";

describe("superadmin validation", () => {
  it("normalizes unit payload values", () => {
    expect(
      validateUnitPayload({
        unitNumber: "11793",
        name: " Pegadaian CP Manado ",
        address: " Jl. Piere Tendean No. 88 ",
        domicile: "Sulawesi Utara"
      })
    ).toEqual({
      code: "CP-MND-11793",
      unitNumber: "11793",
      name: "Pegadaian CP Manado",
      address: "Jl. Piere Tendean No. 88",
      domicile: "Sulawesi Utara"
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

  it("normalizes bank labels and account numbers for consistent unit records", () => {
    expect(normalizeUnitBankName(" Bank Rakyat Indonesia (BRI) ")).toBe("BRI");
    expect(normalizeUnitBankName("Bank Mandiri")).toBe("Mandiri");
    expect(normalizeUnitBankName("Bank Negara Indonesia (BNI)")).toBe("BNI");
    expect(normalizeUnitAccountNumber("0123-4567 8901-234")).toBe("012345678901234");

    expect(
      validateUnitAccountPayload({
        bankName: " Bank Rakyat Indonesia (BRI) ",
        accountNumber: "0123-4567 8901-234",
        accountHolderName: " PT Pegadaian UPC Ranotana "
      })
    ).toMatchObject({
      bankName: "BRI",
      accountNumber: "012345678901234",
      accountHolderName: "PT Pegadaian UPC Ranotana"
    });
  });

  it("derives the canonical unit code from domicile and five-digit unit number", () => {
    expect(getProvinceRegionCode("Sulawesi Utara")).toBe("MND");
    expect(formatUnitCode("Sulawesi Utara", "11793")).toBe("CP-MND-11793");
    expect(extractUnitNumber("CP-MND-11793")).toBe("11793");
  });

  it("rejects unit numbers that are not exactly five digits", () => {
    expect(() =>
      validateUnitPayload({
        unitNumber: "13",
        name: "UPC Ranotana",
        address: "Manado",
        domicile: "Sulawesi Utara"
      })
    ).toThrow("Kode unit harus terdiri dari tepat 5 angka.");
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

  it("validates superadmin account create and reset payloads", () => {
    expect(
      validateSuperAdminAccountCreatePayload({
        name: " Owner Nasional ",
        email: " OWNER@PEGADAIAN.TEST ",
        temporaryPassword: "rahasia-123",
        level: "owner"
      })
    ).toMatchObject({
      name: "Owner Nasional",
      email: "owner@pegadaian.test",
      level: "owner"
    });

    expect(() =>
      validateSuperAdminAccountCreatePayload({
        name: "Operator Nasional",
        email: "operator",
        temporaryPassword: "pendek"
      })
    ).toThrow("Format email superadmin belum valid.");

    expect(() => validateSuperAdminPasswordResetPayload({ temporaryPassword: "1234567" })).toThrow(
      "Password sementara superadmin minimal 8 karakter."
    );
  });

  it("normalizes legacy superadmin level to owner and rejects invalid updates", () => {
    expect(normalizeSuperAdminLevel(null)).toBe("owner");
    expect(normalizeSuperAdminLevel("operator")).toBe("operator");

    expect(validateSuperAdminAccountUpdatePayload({ level: "operator", isActive: false })).toEqual({
      level: "operator",
      isActive: false
    });

    expect(() => validateSuperAdminAccountUpdatePayload({ level: "viewer" })).toThrow(
      "Level superadmin belum valid."
    );
  });

  it("requires an active primary account when creating a managed unit", () => {
    expect(() =>
      validateManagedUnitCreatePayload({
        unitNumber: "11787",
        name: "Pegadaian CP Boulevard",
        address: "Jl. Boulevard Manado",
        domicile: "Sulawesi Utara",
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
        unitNumber: "11788",
        name: "Pegadaian CP Tikala",
        address: "Jl. Tikala Baru",
        domicile: "Sulawesi Utara",
        primaryAccount: {
          bankName: "",
          accountNumber: "1234567890",
          accountHolderName: "PT Pegadaian Area Manado"
        }
      })
    ).toThrow("Rekening aktif utama wajib dilengkapi saat membuat unit.");
  });
});
