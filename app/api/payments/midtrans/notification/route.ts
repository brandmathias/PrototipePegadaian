import { NextResponse } from "next/server";

import { getMidtransGatewayConfig, verifyMidtransNotificationSignature } from "@/lib/payments/midtrans";
import {
  MidtransPaymentSyncError,
  syncMidtransTransactionStatus
} from "@/lib/services/midtrans-payment.service";

type MidtransNotification = {
  gross_amount?: string;
  order_id?: string;
  signature_key?: string;
  status_code?: string;
};

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const notification = (await request.json().catch(() => ({}))) as MidtransNotification;
  const orderId = readString(notification.order_id);
  const statusCode = readString(notification.status_code);
  const grossAmount = readString(notification.gross_amount);
  const signatureKey = readString(notification.signature_key);
  const config = getMidtransGatewayConfig();

  if (
    !orderId ||
    !statusCode ||
    !grossAmount ||
    !signatureKey ||
    !verifyMidtransNotificationSignature({ orderId, statusCode, grossAmount, signatureKey }, config.serverKey)
  ) {
    return NextResponse.json({ message: "Signature Midtrans tidak valid." }, { status: 401 });
  }

  try {
    const result = await syncMidtransTransactionStatus({ config, orderId });
    return NextResponse.json({ ok: true, ignored: result.status === "unknown" ? true : undefined });
  } catch (error) {
    if (error instanceof MidtransPaymentSyncError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    throw error;
  }
}
