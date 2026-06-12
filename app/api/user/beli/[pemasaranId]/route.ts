import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { createFixedPricePurchase } from "@/lib/services/buyer.service";

type Context = { params: Promise<{ pemasaranId: string }> };

const MAX_PROOF_SIZE = 5 * 1024 * 1024;
const PROOF_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "bukti");

function sanitizeFileName(fileName: string) {
  const normalized = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${Date.now()}-${normalized}`;
}

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

  await mkdir(PROOF_UPLOAD_DIR, { recursive: true });
  const storedFileName = sanitizeFileName(file.name);
  const storedPath = path.join(PROOF_UPLOAD_DIR, storedFileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storedPath, buffer);

  return {
    paymentMethod: "transfer",
    fileName: `/uploads/bukti/${storedFileName}`,
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
