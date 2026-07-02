import { extractUnitNumber } from "@/lib/locations/indonesia-provinces";

const MAX_SBG_SEQUENCE = 99_999_999_999;

export function formatSbgCode(unitCode: unknown, sequence: number | string) {
  const unitNumber = extractUnitNumber(unitCode);
  const sequenceNumber = Number(sequence);

  if (!unitNumber) {
    throw new Error("Kode unit belum menggunakan format resmi.");
  }

  if (!Number.isSafeInteger(sequenceNumber) || sequenceNumber < 1 || sequenceNumber > MAX_SBG_SEQUENCE) {
    throw new Error("Nomor urut SBG telah melampaui kapasitas 11 digit.");
  }

  return `SBG-${unitNumber}${String(sequenceNumber).padStart(11, "0")}`;
}

export function isCanonicalSbgCode(value: unknown) {
  return /^SBG-\d{16}$/.test(String(value ?? "").trim());
}
