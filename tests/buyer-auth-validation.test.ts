import { describe, expect, it } from "vitest";

import {
  normalizeBuyerNationalId,
  normalizeBuyerPhoneNumber,
  validateBuyerLoginPayload,
  validateBuyerRegisterPayload
} from "@/lib/auth/buyer-auth-validation";
import { getIndonesianPhoneNumberVariants } from "@/lib/phone-number";

describe("buyer auth validation", () => {
  it("sanitizes indonesian phone numbers without changing the entered prefix", () => {
    expect(normalizeBuyerPhoneNumber("0812-3456-7890")).toBe("081234567890");
    expect(normalizeBuyerPhoneNumber("+62 812 3456 7890")).toBe("6281234567890");
  });

  it("maps local and international phone variants to the same identity", () => {
    expect(getIndonesianPhoneNumberVariants("0812-3456-7890")).toEqual([
      "081234567890",
      "6281234567890"
    ]);
    expect(getIndonesianPhoneNumberVariants("+62 812 3456 7890")).toEqual([
      "6281234567890",
      "081234567890"
    ]);
  });

  it("rejects invalid national id values", () => {
    expect(() => normalizeBuyerNationalId("1234")).toThrow("Nomor KTP harus terdiri dari 16 digit.");
  });

  it("returns sanitized register payload", () => {
    expect(
      validateBuyerRegisterPayload({
        name: "  Raras Maheswari  ",
        email: " RARAS@MAIL.COM ",
        phoneNumber: "0812 3456 7890",
        nationalId: "7371122301990001",
        password: "rahasia123"
      })
    ).toEqual({
      name: "Raras Maheswari",
      email: "raras@mail.com",
      phoneNumber: "081234567890",
      nationalId: "7371122301990001",
      password: "rahasia123"
    });
  });

  it("requires a valid email for login", () => {
    expect(() =>
      validateBuyerLoginPayload({
        email: "email-tidak-valid",
        password: "rahasia123"
      })
    ).toThrow("Format email belum valid.");
  });
});
