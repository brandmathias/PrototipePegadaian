import { NextResponse } from "next/server";

import { saveAdminBarangMediaFiles } from "@/lib/admin-unit/media-upload";
import { requireAdminApiSession } from "@/lib/auth/session";
import { getAdminBarangById, updateAdminBarang } from "@/lib/services/admin-barang.service";

type Context = {
  params: Promise<{ id: string }>;
};

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Permintaan barang gagal diproses.";
  const status = message.includes("tidak ditemukan") ? 404 : 400;
  return NextResponse.json({ message }, { status });
}

async function readUpdatePayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return {
      input: await request.json(),
      mediaChanges: undefined
    };
  }

  const formData = await request.formData();
  const rawPayload = formData.get("payload");

  if (typeof rawPayload !== "string" || !rawPayload.trim()) {
    throw new Error("Payload perubahan barang belum valid.");
  }

  const files = formData.getAll("media").filter((item): item is File => item instanceof File && item.size > 0);
  const deleteMediaIds = formData.getAll("deleteMediaIds").map((item) => String(item ?? ""));

  return {
    input: JSON.parse(rawPayload),
    mediaChanges: {
      addMedia: await saveAdminBarangMediaFiles(files),
      deleteMediaIds
    }
  };
}

export async function GET(_request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const data = await getAdminBarangById(access.unitId, id);
    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const { input, mediaChanges } = await readUpdatePayload(request);
    const data = await updateAdminBarang(access.unitId, id, input, mediaChanges);
    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
