import {
  normalizeBuyerNationalId,
  normalizeBuyerPhoneNumber,
  validateBuyerEmail
} from "@/lib/auth/buyer-auth-validation";

export const BUYER_REGISTRATION_DUPLICATE_MESSAGE =
  "Registrasi tidak dapat dilakukan. Salah satu data yang Anda masukkan sudah terdaftar atau digunakan dengan akun yang memiliki riwayat pelanggaran. Hubungi unit Pegadaian terdekat untuk informasi lebih lanjut.";

export const BUYER_REGISTRATION_BLACKLIST_MESSAGE =
  "Identitas Anda sedang dalam masa pembatasan akses sistem. Silakan kunjungi unit Pegadaian terdekat untuk informasi lebih lanjut.";

export type NormalizedBuyerRegistrationIdentity = {
  email: string;
  phoneNumber: string;
  nationalId: string;
};

type BuyerRegistrationIdentityChecks = {
  findExistingIdentity(identity: NormalizedBuyerRegistrationIdentity): Promise<boolean>;
  findActiveBlacklistByNationalId(nationalId: string): Promise<boolean>;
};

export function normalizeBuyerRegistrationIdentity(input: {
  email?: unknown;
  phoneNumber?: unknown;
  nationalId?: unknown;
}): NormalizedBuyerRegistrationIdentity {
  return {
    email: validateBuyerEmail(String(input.email ?? "")),
    phoneNumber: normalizeBuyerPhoneNumber(String(input.phoneNumber ?? "")),
    nationalId: normalizeBuyerNationalId(String(input.nationalId ?? ""))
  };
}

export async function ensureBuyerRegistrationIdentityIsAvailable(
  input: {
    email?: unknown;
    phoneNumber?: unknown;
    nationalId?: unknown;
  },
  checks: BuyerRegistrationIdentityChecks
) {
  const identity = normalizeBuyerRegistrationIdentity(input);

  if (await checks.findExistingIdentity(identity)) {
    throw new Error(BUYER_REGISTRATION_DUPLICATE_MESSAGE);
  }

  if (await checks.findActiveBlacklistByNationalId(identity.nationalId)) {
    throw new Error(BUYER_REGISTRATION_BLACKLIST_MESSAGE);
  }

  return identity;
}
