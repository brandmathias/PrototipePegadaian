const NON_DIGIT_PATTERN = /\D/g;

export function sanitizeCustomerNumberInput(value: string) {
  const digits = value.replace(NON_DIGIT_PATTERN, "");

  if (digits.startsWith("62")) {
    return digits.slice(2, 14);
  }

  if (digits.startsWith("0")) {
    return digits.slice(1, 13);
  }

  return digits.slice(0, 12);
}

export function getCustomerNumberInputValue(value: string) {
  return sanitizeCustomerNumberInput(value);
}

export function normalizeCustomerNumber(value: string) {
  const digits = value.replace(NON_DIGIT_PATTERN, "");

  if (!digits) {
    throw new Error("Nomor telepon wajib diisi.");
  }

  const normalized = digits.startsWith("62")
    ? `0${digits.slice(2)}`
    : digits.startsWith("8")
      ? `0${digits}`
      : digits;

  if (!/^08\d{8,11}$/.test(normalized)) {
    throw new Error("Nomor telepon harus diawali 08 dan terdiri dari 10 sampai 13 digit.");
  }

  return normalized;
}
