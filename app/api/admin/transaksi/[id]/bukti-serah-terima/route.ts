import { mkdir, writeFile } from "node:fs/promises";
import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { uploadAdminTransactionHandoverProof } from "@/lib/services/admin-transaction.service";
import { createUploadWriteTarget } from "@/lib/uploads/storage";

type Context = { params: Promise<{ id: string }> };

const MAX_HANDOVER_PROOF_SIZE = 5 * 1024 * 1024;

async function readHandoverProofPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return request.json().catch(() => ({}));
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Pilih foto bukti serah-terima terlebih dahulu.");
  }

  if (file.size > MAX_HANDOVER_PROOF_SIZE) {
    throw new Error("Ukuran bukti serah-terima maksimal 5 MB.");
  }

  if (!/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
    throw new Error("Format bukti serah-terima harus JPG, PNG, atau WebP.");
  }

  const target = createUploadWriteTarget("serah-terima", file.name);
  await mkdir(target.directory, { recursive: true });
  await writeFile(target.filePath, Buffer.from(await file.arrayBuffer()));

  return {
    fileName: target.publicUrl
  };
}

export async function POST(request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const body = await readHandoverProofPayload(request);
    const data = await uploadAdminTransactionHandoverProof(access.unitId, access.session.user.id, id, body);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bukti serah-terima gagal dikirim.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
