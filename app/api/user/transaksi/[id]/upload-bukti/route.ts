import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { uploadBuyerPaymentProof } from "@/lib/services/buyer.service";
import { saveUserUploadFile } from "@/lib/storage/user-upload-storage";

type Context = { params: Promise<{ id: string }> };
const MAX_PROOF_SIZE = 5 * 1024 * 1024;

async function readProofPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return request.json().catch(() => ({}));
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const reference = formData.get("reference");

  if (!(file instanceof File)) {
    throw new Error("Pilih file bukti pembayaran terlebih dahulu.");
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
    fileName: savedFile.url,
    reference: typeof reference === "string" ? reference : ""
  };
}

export async function POST(request: Request, context: Context) {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const body = await readProofPayload(request);
    const data = await uploadBuyerPaymentProof(access.userId, id, body);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bukti pembayaran gagal dikirim.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
