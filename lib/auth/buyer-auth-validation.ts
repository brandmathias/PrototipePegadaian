import { getPhoneNumberDigits } from "@/lib/phone-number";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGIT_PATTERN = /\D/g;

export type BuyerRegisterPayload = {
  name: string;
  email: string;
  phoneNumber: string;
  nationalId: string;
  password: string;
};

export type BuyerLoginPayload = {
  email: string;
  password: string;
};

export function normalizeBuyerEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateBuyerEmail(email: string) {
  const normalized = normalizeBuyerEmail(email);

  if (!EMAIL_PATTERN.test(normalized)) {
    throw new Error("Format email belum valid.");
  }

  return normalized;
}

export function normalizeBuyerPhoneNumber(phoneNumber: string) {
  const digits = getPhoneNumberDigits(phoneNumber);

  if (!digits) {
    throw new Error("Nomor telepon wajib diisi.");
  }

  if (!digits.startsWith("08") && !digits.startsWith("62")) {
    throw new Error("Nomor telepon harus diawali 08 atau 62.");
  }

  if (digits.length < 10 || digits.length > 15) {
    throw new Error("Nomor telepon harus terdiri dari 10 sampai 15 digit.");
  }

  return digits;
}

export function normalizeBuyerNationalId(nationalId: string) {
  const normalized = nationalId.replace(DIGIT_PATTERN, "");

  if (normalized.length !== 16) {
    throw new Error("Nomor KTP harus terdiri dari 16 digit.");
  }

  return normalized;
}

export function validateBuyerRegisterPayload(payload: BuyerRegisterPayload) {
  const name = payload.name.trim();
  const email = validateBuyerEmail(payload.email);
  const password = payload.password.trim();

  if (name.length < 3) {
    throw new Error("Nama lengkap minimal 3 karakter.");
  }

  if (password.length < 8) {
    throw new Error("Kata sandi minimal 8 karakter.");
  }

  return {
    name,
    email,
    password,
    phoneNumber: normalizeBuyerPhoneNumber(payload.phoneNumber),
    nationalId: normalizeBuyerNationalId(payload.nationalId)
  };
}

export function validateBuyerLoginPayload(payload: BuyerLoginPayload) {
  const email = validateBuyerEmail(payload.email);
  const password = payload.password.trim();

  if (!password) {
    throw new Error("Kata sandi wajib diisi.");
  }

  return {
    email,
    password
  };
}
