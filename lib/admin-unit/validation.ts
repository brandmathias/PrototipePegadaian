const MONEY_REGEX = /^\d+(\.\d{1,2})?$/;
const ALLOWED_CATEGORIES = new Set(["emas", "elektronik", "kendaraan", "perhiasan", "logam_mulia", "lainnya"]);
const ALLOWED_CONDITIONS = new Set(["baik", "cukup", "rusak_ringan"]);
const ALLOWED_MEDIA_TYPES = new Set(["foto", "video"]);

export const ADMIN_BARANG_MEDIA_LIMIT = 4;

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
  const date = new Date(`${result}T00:00:00.000Z`);
  if (!result || Number.isNaN(date.getTime())) {
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
    description: String(input.description ?? "").trim()
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

export function validatePemasaranPayload(input: { mode?: unknown; price?: unknown; durationDays?: unknown }) {
  const mode = requiredText(input.mode, "Mode pemasaran wajib dipilih.");
  const price = normalizeMoney(input.price, "Harga pemasaran harus lebih dari 0.");

  if (mode !== "fixed_price" && mode !== "vickrey") {
    throw new Error("Mode pemasaran belum valid.");
  }

  if (mode === "fixed_price") {
    return { mode, price, durationDays: null };
  }

  const durationDays = Number(input.durationDays);
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 30) {
    throw new Error("Durasi lelang harus 1 sampai 30 hari.");
  }

  return { mode, price, durationDays };
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
