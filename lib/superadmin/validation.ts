const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeUnitCode(value: string) {
  return value.trim().toUpperCase();
}

export function validateUnitPayload(input: {
  code?: string;
  name?: string;
  address?: string;
}) {
  const code = normalizeUnitCode(String(input.code ?? ""));
  const name = String(input.name ?? "").trim();
  const address = String(input.address ?? "").trim();

  if (!code || !name || !address) {
    throw new Error("Data unit belum lengkap.");
  }

  return { code, name, address };
}

export function validateUnitAccountPayload(input: {
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  branchName?: string;
  isActive?: boolean;
}) {
  const bankName = String(input.bankName ?? "").trim();
  const accountNumber = String(input.accountNumber ?? "").trim();
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

export function validateBlacklistRevokePayload(input: { reason?: string }) {
  const reason = String(input.reason ?? "").trim();

  if (!reason) {
    throw new Error("Alasan pencabutan blacklist wajib diisi.");
  }

  return { reason };
}
