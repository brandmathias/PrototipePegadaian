import { describe, expect, it, vi } from "vitest";

import {
  BUYER_REGISTRATION_BLACKLIST_MESSAGE,
  BUYER_REGISTRATION_DUPLICATE_MESSAGE,
  ensureBuyerRegistrationIdentityIsAvailable,
  normalizeBuyerRegistrationIdentity
} from "@/lib/auth/buyer-registration-guard";

describe("buyer registration identity guard", () => {
  it("normalizes registration identity before database checks", () => {
    expect(
      normalizeBuyerRegistrationIdentity({
        email: " BUYER@EXAMPLE.COM ",
        phoneNumber: "0812-0000-9999",
        nationalId: "7371 1230 5260 0002"
      })
    ).toEqual({
      email: "buyer@example.com",
      phoneNumber: "081200009999",
      nationalId: "7371123052600002"
    });
  });

  it("rejects duplicate email, phone, or national id with a safe generic message", async () => {
    await expect(
      ensureBuyerRegistrationIdentityIsAvailable(
        {
          email: "buyer@example.com",
          phoneNumber: "081200009999",
          nationalId: "7371123052600002"
        },
        {
          findExistingIdentity: vi.fn().mockResolvedValue(true),
          findActiveBlacklistByNationalId: vi.fn().mockResolvedValue(false)
        }
      )
    ).rejects.toThrow(BUYER_REGISTRATION_DUPLICATE_MESSAGE);
  });

  it("rejects an identity whose national id is still actively blacklisted", async () => {
    await expect(
      ensureBuyerRegistrationIdentityIsAvailable(
        {
          email: "fresh@example.com",
          phoneNumber: "081200001111",
          nationalId: "7371123052600002"
        },
        {
          findExistingIdentity: vi.fn().mockResolvedValue(false),
          findActiveBlacklistByNationalId: vi.fn().mockResolvedValue(true)
        }
      )
    ).rejects.toThrow(BUYER_REGISTRATION_BLACKLIST_MESSAGE);
  });
});
