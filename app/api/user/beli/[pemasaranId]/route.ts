import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { createFixedPricePurchase } from "@/lib/services/buyer.service";
import { saveUserUploadFile } from "@/lib/storage/user-upload-storage";

type Context = { params: Promise<{ pemasaranId: string }> };

const MAX_PROOF_SIZE = 5 * 1024 * 1024;

async function readPurchasePayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return request.json().catch(() => ({}));
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const referenceValue = formData.get("reference");
  const reference = typeof referenceValue === "string" ? referenceValue.trim() : "";

  if (!(file instanceof File) || file.size === 0) {
    return {
      paymentMethod: "transfer",
      ...(reference ? { reference } : {})
    };
  }

  if (file.size > MAX_PROOF_SIZE) {
    throw new Error("Ukuran bukti pembayaran maksimal 5 MB.");
  }

  if (!/\.(jpg|jpeg|png|pdf)$/i.test(file.name)) {
    throw new Error("Format bukti pembayaran harus JPG, PNG, atau PDF.");
  }

  const savedFile = await saveUserUploadFile({
    file,
    folder: "bukti"
  });

  return {
    paymentMethod: "transfer",
    fileName: savedFile.url,
    ...(reference ? { reference } : {})
  };
}

export async function POST(request: Request, context: Context) {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { pemasaranId } = await context.params;
    const body = await readPurchasePayload(request);
    const data = await createFixedPricePurchase(access.userId, pemasaranId, body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pembelian gagal diproses.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
