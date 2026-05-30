import { normalizeBarangSpecifications } from "@/lib/admin-unit/specifications";

const MONEY_REGEX = /^\d+(\.\d{1,2})?$/;
const ALLOWED_CATEGORIES = new Set(["emas", "elektronik", "kendaraan", "perhiasan", "logam_mulia", "lainnya"]);
const ALLOWED_CONDITIONS = new Set(["baik", "cukup", "rusak_ringan"]);
const ALLOWED_MEDIA_TYPES = new Set(["foto", "video"]);

export const ADMIN_BARANG_MEDIA_LIMIT = 5;

export type AdminBarangMediaInput = {
  type?: unknown;
  url?: unknown;
  fileName?: unknown;
  sizeBytes?: unknown;
  sortOrder?: unknown;
};

function requiredText(value: unknown, message: string) {
  const result = String(value ?? "").trim();
  if (!result) {
    throw new Error(message);
  }
  return result;
}

function normalizeMoney(value: unknown, message: string) {
  const result = String(value ?? "").trim();
  if (!MONEY_REGEX.test(result) || Number(result) <= 0) {
    throw new Error(message);
  }
  return result;
}

function normalizeDate(value: unknown, message: string) {
  const result = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) {
    throw new Error(message);
  }

  const date = new Date(`${result}T00:00:00.000Z`);
  if (!result || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== result) {
    throw new Error(message);
  }
  return result;
}

export function validateAdminBarangPayload(input: {
  name?: unknown;
  category?: unknown;
  condition?: unknown;
  appraisalValue?: unknown;
  loanValue?: unknown;
  pawnedAt?: unknown;
  dueDate?: unknown;
  ownerName?: unknown;
  customerNumber?: unknown;
  description?: unknown;
  specifications?: unknown;
}) {
  const name = requiredText(input.name, "Nama barang wajib diisi.");
  const category = requiredText(input.category, "Kategori barang wajib diisi.").toLowerCase();
  const condition = requiredText(input.condition, "Kondisi barang wajib diisi.").toLowerCase();
  const appraisalValue = normalizeMoney(input.appraisalValue, "Nilai taksiran harus lebih dari 0.");
  const loanValue = normalizeMoney(input.loanValue, "Nilai gadai harus lebih dari 0.");
  const pawnedAt = normalizeDate(input.pawnedAt, "Tanggal gadai belum valid.");
  const dueDate = normalizeDate(input.dueDate, "Tanggal jatuh tempo belum valid.");
  const ownerName = requiredText(input.ownerName, "Nama penggadai wajib diisi.");

  if (!ALLOWED_CATEGORIES.has(category)) {
    throw new Error("Kategori barang belum valid.");
  }

  if (!ALLOWED_CONDITIONS.has(condition)) {
    throw new Error("Kondisi barang belum valid.");
  }

  if (Number(loanValue) > Number(appraisalValue)) {
    throw new Error("Nilai gadai tidak boleh melebihi nilai taksiran.");
  }

  if (new Date(`${dueDate}T00:00:00.000Z`) <= new Date(`${pawnedAt}T00:00:00.000Z`)) {
    throw new Error("Tanggal jatuh tempo harus setelah tanggal gadai.");
  }

  return {
    name,
    category,
    condition,
    appraisalValue,
    loanValue,
    pawnedAt,
    dueDate,
    ownerName,
    customerNumber: String(input.customerNumber ?? "").trim(),
    description: String(input.description ?? "").trim(),
    specifications: normalizeBarangSpecifications(category, input.specifications)
  };
}

export function validateFixedPriceMarketingPricePayload(input: { marketingPrice?: unknown }) {
  return {
    marketingPrice: normalizeMoney(input.marketingPrice, "Harga fixed price harus lebih dari 0.")
  };
}

export function validateAdminBarangMediaList(input: unknown): Array<{
  type: "foto" | "video";
  url: string;
  fileName: string;
  sizeBytes: number;
  sortOrder: number;
}> {
  if (input === undefined || input === null) {
    return [];
  }

  if (!Array.isArray(input)) {
    throw new Error("Media barang belum valid.");
  }

  if (input.length > ADMIN_BARANG_MEDIA_LIMIT) {
    throw new Error(`Maksimal ${ADMIN_BARANG_MEDIA_LIMIT} foto atau video untuk satu barang.`);
  }

  return input.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Media barang belum valid.");
    }

    const media = item as AdminBarangMediaInput;
    const type = String(media.type ?? "foto").trim().toLowerCase();
    const url = requiredText(media.url, "URL media wajib diisi.");
    const sizeBytes = Number(media.sizeBytes ?? 0);
    const sortOrder = Number(media.sortOrder ?? index);

    if (!ALLOWED_MEDIA_TYPES.has(type)) {
      throw new Error("Jenis media hanya bisa foto atau video.");
    }

    if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
      throw new Error("Ukuran media belum valid.");
    }

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new Error("Urutan media belum valid.");
    }

    return {
      type: type as "foto" | "video",
      url,
      fileName: String(media.fileName ?? "").trim(),
      sizeBytes,
      sortOrder
    };
  });
}

export function validatePerpanjanganPayload(input: { newDueDate?: unknown; note?: unknown }, currentDueDate: string) {
  const newDueDate = normalizeDate(input.newDueDate, "Tanggal jatuh tempo baru belum valid.");
  const current = new Date(`${currentDueDate}T00:00:00.000Z`);
  const next = new Date(`${newDueDate}T00:00:00.000Z`);

  if (next <= current) {
    throw new Error("Tanggal jatuh tempo baru harus lebih besar dari tanggal saat ini.");
  }

  return {
    newDueDate,
    note: String(input.note ?? "").trim()
  };
}

export function validateTebusPayload(input: { reference?: unknown; redeemedAt?: unknown }) {
  return {
    reference: requiredText(input.reference, "Nomor referensi penebusan wajib diisi."),
    redeemedAt: normalizeDate(input.redeemedAt ?? new Date().toISOString().slice(0, 10), "Tanggal tebus belum valid.")
  };
}

function normalizeWholeNumber(value: unknown, fallback: number, message: string) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value !== "string") {
    throw new Error(message);
  }

  const normalized = value.trim();
  if (normalized === "") {
    return fallback;
  }

  if (!/^\d+$/.test(normalized)) {
    throw new Error(message);
  }

  return Number(normalized);
}

export function validatePemasaranPayload(input: {
  mode?: unknown;
  price?: unknown;
  durationDays?: unknown;
  durationHours?: unknown;
  durationMinutes?: unknown;
  durationSeconds?: unknown;
}):
  | {
      mode: "fixed_price";
      price: string;
    }
  | {
      mode: "vickrey";
      price: string;
      durationDays: number;
      durationHours: number;
      durationMinutes: number;
      durationSeconds: number;
      totalSeconds: number;
    } {
  const mode = requiredText(input.mode, "Mode pemasaran wajib dipilih.");
  const price = normalizeMoney(input.price, "Harga pemasaran harus lebih dari 0.");

  if (mode !== "fixed_price" && mode !== "vickrey") {
    throw new Error("Mode pemasaran belum valid.");
  }

  if (mode === "fixed_price") {
    return { mode: "fixed_price", price };
  }

  const durationDays = normalizeWholeNumber(input.durationDays, 0, "Durasi lelang maksimal 30 hari.");
  const durationHours = normalizeWholeNumber(input.durationHours, 0, "Jam lelang harus 0 sampai 23.");
  const durationMinutes = normalizeWholeNumber(input.durationMinutes, 0, "Menit lelang harus 0 sampai 59.");
  const durationSeconds = normalizeWholeNumber(input.durationSeconds, 0, "Detik lelang harus 0 sampai 59.");

  if (durationHours > 23) {
    throw new Error("Jam lelang harus 0 sampai 23.");
  }

  if (durationMinutes > 59) {
    throw new Error("Menit lelang harus 0 sampai 59.");
  }

  if (durationSeconds > 59) {
    throw new Error("Detik lelang harus 0 sampai 59.");
  }

  const totalSeconds = durationDays * 24 * 60 * 60 + durationHours * 60 * 60 + durationMinutes * 60 + durationSeconds;

  if (totalSeconds <= 0) {
    throw new Error("Durasi lelang harus lebih dari 0 detik.");
  }

  if (totalSeconds > 30 * 24 * 60 * 60) {
    throw new Error("Durasi lelang maksimal 30 hari.");
  }

  return {
    mode: "vickrey",
    price,
    durationDays,
    durationHours,
    durationMinutes,
    durationSeconds,
    totalSeconds
  };
}

export function validateTransactionVerificationPayload(input: { reference?: unknown }) {
  return {
    reference: requiredText(input.reference, "Nomor referensi wajib diisi.")
  };
}

export function validateTransactionRejectPayload(input: { reason?: unknown }) {
  return {
    reason: requiredText(input.reason, "Alasan penolakan wajib diisi.")
  };
}

export function validateBlacklistExtendPayload(input: { blockedUntil?: unknown; reason?: unknown }) {
  return {
    blockedUntil: normalizeDate(input.blockedUntil, "Tanggal selesai blokir belum valid."),
    reason: requiredText(input.reason, "Alasan perpanjangan blacklist wajib diisi.")
  };
}
