import {
  validateBuyerEmail,
  normalizeBuyerNationalId,
  normalizeBuyerPhoneNumber
} from "@/lib/auth/buyer-auth-validation";
import { currency } from "@/lib/formatters/currency";

export type BuyerPurchasePayload = {
  paymentMethod: "transfer";
  fileName?: string;
  reference?: string;
};

export type BuyerBidPayload = {
  amount: number;
};

export type BuyerBidCommitmentPayload = {
  bidHash: string;
};

export type BuyerBidEscrowPayload = {
  amount: number;
  bidHash: string;
  salt: string;
};

export type BuyerPaymentProofPayload = {
  fileName: string;
  reference?: string;
};

export type BuyerProfileUpdatePayload = {
  name: string;
  email: string;
  phoneNumber: string;
  nationalId: string;
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

export function validateBuyerBidCommitmentPayload(input: unknown): BuyerBidCommitmentPayload {
  const payload = readRecord(input);
  const bidHash = typeof payload.bidHash === "string" ? payload.bidHash.trim().toLowerCase() : "";

  if (!/^[a-f0-9]{64}$/.test(bidHash)) {
    throw new Error("Hash bid belum valid.");
  }

  return { bidHash };
}

export function validateBuyerBidEscrowPayload(input: unknown, basePrice: number): BuyerBidEscrowPayload {
  const payload = readRecord(input);
  const { amount } = validateBuyerBidPayload(payload, basePrice);
  const { bidHash } = validateBuyerBidCommitmentPayload(payload);
  const salt = typeof payload.salt === "string" ? payload.salt.trim() : "";

  if (salt.length < 16) {
    throw new Error("Salt bid belum valid.");
  }

  return { amount, bidHash, salt };
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
  const email = validateBuyerEmail(String(payload.email ?? ""));
  const rawImage = "image" in payload ? payload.image : undefined;
  const image = typeof rawImage === "string" ? rawImage.trim() : rawImage === null ? null : undefined;

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
    email,
    phoneNumber: normalizeBuyerPhoneNumber(String(payload.phoneNumber ?? "")),
    nationalId: normalizeBuyerNationalId(String(payload.nationalId ?? "")),
    ...(image !== undefined ? { image } : {})
  };
}
