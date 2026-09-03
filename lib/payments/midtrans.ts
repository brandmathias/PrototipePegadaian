import { createHash, timingSafeEqual } from "node:crypto";

export const MIDTRANS_RESERVATION_MINUTES = 15;

type MidtransEnvironment = Record<string, string | undefined>;

type MidtransNotificationSignatureInput = {
  grossAmount: string;
  orderId: string;
  signatureKey: string;
  statusCode: string;
};

export type MidtransGatewayConfig = {
  isProduction: boolean;
  serverKey: string;
  snapApiUrl: string;
  statusApiBaseUrl: string;
};

type FetchLike = typeof fetch;

type CreateMidtransSnapTransactionInput = {
  amount: number;
  config: MidtransGatewayConfig;
  fetchImpl?: FetchLike;
  itemName: string;
  orderId: string;
};

type GetMidtransTransactionStatusInput = {
  config: MidtransGatewayConfig;
  fetchImpl?: FetchLike;
  orderId: string;
};

export function getMidtransGatewayConfig(env: MidtransEnvironment = process.env): MidtransGatewayConfig {
  const serverKey = env.MIDTRANS_SERVER_KEY?.trim() ?? "";

  if (!serverKey) {
    throw new Error("Konfigurasi Midtrans belum lengkap.");
  }

  const isProduction = env.MIDTRANS_IS_PRODUCTION === "true";
  const appBaseUrl = isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
  const apiBaseUrl = isProduction ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";

  return {
    isProduction,
    serverKey,
    snapApiUrl: `${appBaseUrl}/snap/v1/transactions`,
    statusApiBaseUrl: apiBaseUrl
  };
}

export function verifyMidtransNotificationSignature(
  input: MidtransNotificationSignatureInput,
  serverKey: string
) {
  const expected = createHash("sha512")
    .update(`${input.orderId}${input.statusCode}${input.grossAmount}${serverKey}`)
    .digest("hex");
  const received = input.signatureKey.toLowerCase();

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export function mapMidtransTransactionStatus(status: string) {
  switch (status.toLowerCase()) {
    case "capture":
    case "settlement":
      return "lunas";
    case "pending":
      return "menunggu_pembayaran";
    case "cancel":
    case "deny":
    case "expire":
      return "gagal";
    default:
      return "unknown";
  }
}

export async function createMidtransSnapTransaction({
  amount,
  config,
  fetchImpl = fetch,
  itemName,
  orderId
}: CreateMidtransSnapTransactionInput) {
  const response = await fetchImpl(config.snapApiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      transaction_details: { order_id: orderId, gross_amount: amount },
      item_details: [{ id: orderId, name: itemName, price: amount, quantity: 1 }],
      enabled_payments: ["bank_transfer", "gopay", "qris", "shopeepay"],
      expiry: { unit: "minute", duration: MIDTRANS_RESERVATION_MINUTES }
    })
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error_messages?: string[];
    redirect_url?: string;
    token?: string;
  };

  if (!response.ok || !payload.token || !payload.redirect_url) {
    throw new Error(payload.error_messages?.[0] ?? "Midtrans tidak dapat membuat pembayaran.");
  }

  return { token: payload.token, redirectUrl: payload.redirect_url };
}

export async function getMidtransTransactionStatus({
  config,
  fetchImpl = fetch,
  orderId
}: GetMidtransTransactionStatusInput) {
  const response = await fetchImpl(`${config.statusApiBaseUrl}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`
    }
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(typeof payload.status_message === "string" ? payload.status_message : "Status Midtrans tidak dapat diperiksa.");
  }

  return payload;
}
