import { currency } from "@/lib/mock-data";
import {
  normalizeBuyerNationalId,
  normalizeBuyerPhoneNumber
} from "@/lib/auth/buyer-auth-validation";

export type BuyerPurchasePayload = {
  paymentMethod: "transfer" | "langsung";
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
  phoneNumber: string;
  nationalId: string;
};

function readRecord(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Payload tidak valid.");
  }

  return input as Record<string, unknown>;
}

export function validateBuyerPurchasePayload(input: unknown): BuyerPurchasePayload {
  const payload = readRecord(input);
  const paymentMethod = payload.paymentMethod;

  if (paymentMethod !== "transfer" && paymentMethod !== "langsung") {
    throw new Error("Pilih metode pembayaran yang tersedia.");
  }

  return { paymentMethod };
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

  if (name.length < 3) {
    throw new Error("Nama lengkap minimal 3 karakter.");
  }

  return {
    name,
    phoneNumber: normalizeBuyerPhoneNumber(String(payload.phoneNumber ?? "")),
    nationalId: normalizeBuyerNationalId(String(payload.nationalId ?? ""))
  };
}
