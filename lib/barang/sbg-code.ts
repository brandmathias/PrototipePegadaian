import { extractUnitNumber } from "@/lib/locations/indonesia-provinces";

const MAX_SBG_SEQUENCE = 99_999_999_999n;

export function formatSbgCode(unitCode: unknown, sequence: bigint) {
  const unitNumber = extractUnitNumber(unitCode);

  if (!unitNumber) {
    throw new Error("Kode unit belum menggunakan format resmi.");
  }

  if (sequence < 1n || sequence > MAX_SBG_SEQUENCE) {
    throw new Error("Nomor urut SBG telah melampaui kapasitas 11 digit.");
  }

  return `SBG-${unitNumber}${sequence.toString().padStart(11, "0")}`;
}

export function isCanonicalSbgCode(value: unknown) {
  return /^SBG-\d{16}$/.test(String(value ?? "").trim());
}
