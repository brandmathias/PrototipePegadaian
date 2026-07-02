import {
  extractUnitNumber,
  formatUnitCode,
  normalizeIndonesiaProvince
} from "@/lib/locations/indonesia-provinces";

export { extractUnitNumber, formatUnitCode, getProvinceRegionCode } from "@/lib/locations/indonesia-provinces";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SUPERADMIN_LEVELS = ["owner", "operator"] as const;
export type SuperAdminLevel = (typeof SUPERADMIN_LEVELS)[number];

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeSuperAdminLevel(value: unknown): SuperAdminLevel {
  return value === "operator" ? "operator" : "owner";
}

function validateSuperAdminLevel(value: unknown): SuperAdminLevel {
  if (value === "owner" || value === "operator") {
    return value;
  }

  throw new Error("Level superadmin belum valid.");
}

export function normalizeUnitCode(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeUnitBankName(value: unknown) {
  const bankName = String(value ?? "").trim().replace(/\s+/g, " ");
  const normalized = bankName.toLowerCase();

  if (normalized.includes("bank rakyat indonesia") || /\bbri\b/.test(normalized)) {
    return "BRI";
  }
  if (normalized.includes("bank negara indonesia") || /\bbni\b/.test(normalized)) {
    return "BNI";
  }
  if (normalized.includes("bank central asia") || /\bbca\b/.test(normalized)) {
    return "BCA";
  }
  if (normalized.includes("bank tabungan negara") || /\bbtn\b/.test(normalized)) {
    return "BTN";
  }
  if (normalized.includes("bank syariah indonesia") || /\bbsi\b/.test(normalized)) {
    return "BSI";
  }
  if (normalized.includes("cimb niaga")) {
    return "CIMB Niaga";
  }
  if (normalized.includes("mandiri")) {
    return "Mandiri";
  }
  if (normalized.includes("danamon")) {
    return "Danamon";
  }
  if (normalized.includes("maybank")) {
    return "Maybank";
  }
  if (normalized.includes("muamalat")) {
    return "Muamalat";
  }

  return bankName.replace(/^bank\s+/i, "");
}

export function normalizeUnitAccountNumber(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

export function validateUnitPayload(input: {
  code?: string;
  unitNumber?: string;
  name?: string;
  address?: string;
  domicile?: string;
}) {
  const name = String(input.name ?? "").trim();
  const address = String(input.address ?? "").trim();
  const domicile = normalizeIndonesiaProvince(input.domicile);
  const unitNumber = String(input.unitNumber ?? extractUnitNumber(input.code) ?? "").trim();

  if (!name || !address || !domicile) {
    throw new Error("Data unit belum lengkap.");
  }

  if (!/^\d{5}$/.test(unitNumber)) {
    throw new Error("Kode unit harus terdiri dari tepat 5 angka.");
  }

  const code = formatUnitCode(domicile, unitNumber);

  if (!code) {
    throw new Error("Domisili unit belum memiliki kode wilayah.");
  }

  return { code, unitNumber, name, address, domicile };
}

export function validateUnitAccountPayload(input: {
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  branchName?: string;
  isActive?: boolean;
}) {
  const bankName = normalizeUnitBankName(input.bankName);
  const accountNumber = normalizeUnitAccountNumber(input.accountNumber);
  const accountHolderName = String(input.accountHolderName ?? "").trim();
  const branchName = String(input.branchName ?? "").trim();

  if (!bankName || !accountNumber || !accountHolderName) {
    throw new Error("Data rekening unit belum lengkap.");
  }

  return {
    bankName,
    accountNumber,
    accountHolderName,
    branchName,
    isActive: Boolean(input.isActive)
  };
}

export function validateManagedUnitCreatePayload(input: {
  code?: string;
  unitNumber?: string;
  name?: string;
  address?: string;
  domicile?: string;
  primaryAccount?: {
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    branchName?: string;
  };
}) {
  const unit = validateUnitPayload(input);

  try {
    const primaryAccount = validateUnitAccountPayload({
      ...(input.primaryAccount ?? {}),
      isActive: true
    });

    return {
      ...unit,
      primaryAccount: {
        ...primaryAccount,
        isActive: true
      }
    };
  } catch {
    throw new Error("Rekening aktif utama wajib dilengkapi saat membuat unit.");
  }
}

export function validateAdminUnitPayload(input: {
  name?: string;
  email?: string;
  unitId?: string;
  temporaryPassword?: string;
  phoneNumber?: string;
}) {
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const unitId = String(input.unitId ?? "").trim();
  const temporaryPassword = String(input.temporaryPassword ?? "");
  const phoneNumber = String(input.phoneNumber ?? "").trim();

  if (!name || !email || !unitId || !temporaryPassword) {
    throw new Error("Data admin unit belum lengkap.");
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Format email admin belum valid.");
  }

  if (temporaryPassword.length < 8) {
    throw new Error("Password sementara admin minimal 8 karakter.");
  }

  return { name, email, unitId, temporaryPassword, phoneNumber };
}

export function validateSuperAdminAccountCreatePayload(input: {
  name?: string;
  email?: string;
  temporaryPassword?: string;
  phoneNumber?: string;
  level?: string;
}) {
  const name = String(input.name ?? "").trim();
  const email = normalizeEmail(input.email);
  const temporaryPassword = String(input.temporaryPassword ?? "");
  const phoneNumber = String(input.phoneNumber ?? "").trim();
  const level = validateSuperAdminLevel(input.level ?? "operator");

  if (!name || !email || !temporaryPassword) {
    throw new Error("Data superadmin belum lengkap.");
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Format email superadmin belum valid.");
  }

  if (temporaryPassword.length < 8) {
    throw new Error("Password sementara superadmin minimal 8 karakter.");
  }

  return { name, email, temporaryPassword, phoneNumber, level };
}

export function validateSuperAdminAccountUpdatePayload(input: {
  name?: string;
  email?: string;
  phoneNumber?: string;
  level?: string;
  isActive?: boolean;
}) {
  const next: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    level?: SuperAdminLevel;
    isActive?: boolean;
  } = {};

  if ("name" in input) {
    const name = String(input.name ?? "").trim();
    if (!name) {
      throw new Error("Nama superadmin wajib diisi.");
    }
    next.name = name;
  }

  if ("email" in input) {
    const email = normalizeEmail(input.email);
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new Error("Format email superadmin belum valid.");
    }
    next.email = email;
  }

  if ("phoneNumber" in input) {
    next.phoneNumber = String(input.phoneNumber ?? "").trim();
  }

  if ("level" in input) {
    next.level = validateSuperAdminLevel(input.level);
  }

  if ("isActive" in input) {
    if (typeof input.isActive !== "boolean") {
      throw new Error("Status superadmin belum valid.");
    }
    next.isActive = input.isActive;
  }

  if (Object.keys(next).length === 0) {
    throw new Error("Tidak ada perubahan superadmin yang dikirim.");
  }

  return next;
}

export function validateSuperAdminPasswordResetPayload(input: {
  temporaryPassword?: string;
}) {
  const temporaryPassword = String(input.temporaryPassword ?? "");

  if (temporaryPassword.length < 8) {
    throw new Error("Password sementara superadmin minimal 8 karakter.");
  }

  return { temporaryPassword };
}
