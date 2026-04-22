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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeBuyerPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(DIGIT_PATTERN, "");

  if (!digits) {
    throw new Error("Nomor telepon wajib diisi.");
  }

  let normalized = digits;

  if (digits.startsWith("0")) {
    normalized = `62${digits.slice(1)}`;
  }

  if (!normalized.startsWith("62")) {
    throw new Error("Nomor telepon harus diawali 08 atau 62.");
  }

  if (normalized.length < 10 || normalized.length > 15) {
    throw new Error("Nomor telepon harus terdiri dari 10 sampai 15 digit.");
  }

  return normalized;
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
  const email = normalizeEmail(payload.email);
  const password = payload.password.trim();

  if (name.length < 3) {
    throw new Error("Nama lengkap minimal 3 karakter.");
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Format email belum valid.");
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
  const email = normalizeEmail(payload.email);
  const password = payload.password.trim();

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Format email belum valid.");
  }

  if (!password) {
    throw new Error("Kata sandi wajib diisi.");
  }

  return {
    email,
    password
  };
}
