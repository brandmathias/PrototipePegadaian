import { NextResponse } from "next/server";

import { saveAdminBarangMediaFiles } from "@/lib/admin-unit/media-upload";
import { ADMIN_BARANG_MEDIA_LIMIT } from "@/lib/admin-unit/validation";
import { requireAdminApiSession } from "@/lib/auth/session";
import { addAdminBarangMedia, addAdminBarangMediaBatch, getAdminBarangById } from "@/lib/services/admin-barang.service";

type Context = { params: Promise<{ id: string }> };

async function readMediaPayload(request: Request, unitId: string, barangId: string) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return {
      mode: "single" as const,
      payload: await request.json()
    };
  }

  const formData = await request.formData();
  const files = formData.getAll("media").filter((item): item is File => item instanceof File && item.size > 0);

  if (files.length === 0) {
    throw new Error("Pilih minimal satu foto atau video untuk diunggah.");
  }

  const item = await getAdminBarangById(unitId, barangId);
  const existingMediaCount = Array.isArray(item.media) ? item.media.length : 0;
  if (existingMediaCount + files.length > ADMIN_BARANG_MEDIA_LIMIT) {
    throw new Error(`Maksimal ${ADMIN_BARANG_MEDIA_LIMIT} foto atau video untuk satu barang.`);
  }

  return {
    mode: "batch" as const,
    payload: await saveAdminBarangMediaFiles(files)
  };
}

export async function POST(request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const mediaPayload = await readMediaPayload(request, access.unitId, id);
    const data =
      mediaPayload.mode === "batch"
        ? await addAdminBarangMediaBatch(access.unitId, id, mediaPayload.payload)
        : await addAdminBarangMedia(access.unitId, id, mediaPayload.payload);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Media gagal disimpan.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
