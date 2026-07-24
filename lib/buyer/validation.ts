import { currency } from "@/lib/formatters/currency";

export type BuyerPurchasePayload = {
  paymentMethod: "transfer";
  fileName?: string;
  reference?: string;
};

export type BuyerBidPayload = {
  amount: number;
};

export type BuyerPaymentProofPayload = {
  fileName: string;
  reference?: string;
};

export type BuyerProfileUpdatePayload = {
  name: string;
  image?: string | null;
};

function readRecord(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Payload tidak valid.");
  }

  return input as Record<string, unknown>;
}

export function validateBuyerPurchasePayload(input: unknown): BuyerPurchasePayload {
  const payload = readRecord(input);
  const paymentMethod = payload.paymentMethod ?? "transfer";
  const fileName = typeof payload.fileName === "string" ? payload.fileName.trim() : "";
  const reference = typeof payload.reference === "string" ? payload.reference.trim() : "";

  if (paymentMethod !== "transfer") {
    throw new Error("Fixed price hanya mendukung pembayaran transfer bank.");
  }

  if (fileName && !/\.(jpg|jpeg|png|pdf)$/i.test(fileName)) {
    throw new Error("Format bukti pembayaran harus JPG, PNG, atau PDF.");
  }

  return {
    paymentMethod,
    ...(fileName ? { fileName } : {}),
    ...(reference ? { reference } : {})
  };
}

export function validateBuyerBidPayload(input: unknown, basePrice: number): BuyerBidPayload {
  const payload = readRecord(input);
  const amount = Number(payload.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Masukkan nominal bid yang valid.");
  }

  if (amount < basePrice) {
    throw new Error(`Nominal bid minimal ${currency.format(basePrice)}.`);
  }

  return { amount };
}

export function validateBuyerPaymentProofPayload(input: unknown): BuyerPaymentProofPayload {
  const payload = readRecord(input);
  const fileName = typeof payload.fileName === "string" ? payload.fileName.trim() : "";
  const reference = typeof payload.reference === "string" ? payload.reference.trim() : "";

  if (!fileName) {
    throw new Error("Nama file bukti pembayaran wajib diisi.");
  }

  if (!/\.(jpg|jpeg|png|pdf)$/i.test(fileName)) {
    throw new Error("Format bukti pembayaran harus JPG, PNG, atau PDF.");
  }

  return {
    fileName,
    ...(reference ? { reference } : {})
  };
}

export function validateBuyerProfileUpdatePayload(input: unknown): BuyerProfileUpdatePayload {
  const payload = readRecord(input);
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const rawImage = "image" in payload ? payload.image : undefined;
  const image = typeof rawImage === "string" ? rawImage.trim() : rawImage === null ? null : undefined;

  if ("email" in payload || "phoneNumber" in payload || "nationalId" in payload) {
    throw new Error("Email, nomor telepon, dan NIK tidak dapat diubah dari profil.");
  }

  if (name.length < 3) {
    throw new Error("Nama lengkap minimal 3 karakter.");
  }

  if (typeof image === "string") {
    if (image.length > 1_500_000) {
      throw new Error("Ukuran foto profil terlalu besar. Gunakan gambar maksimal sekitar 1 MB.");
    }

    if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(image)) {
      throw new Error("Format foto profil harus PNG, JPG, atau WebP.");
    }
  }

  return {
    name,
    ...(image !== undefined ? { image } : {})
  };
}
