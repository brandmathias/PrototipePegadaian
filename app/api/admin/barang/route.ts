import { NextResponse } from "next/server";

import { saveAdminBarangMediaFiles } from "@/lib/admin-unit/media-upload";
import { getBarangSpecificationFields } from "@/lib/admin-unit/specifications";
import { requireAdminApiSession } from "@/lib/auth/session";
import { validateAdminBarangPayload } from "@/lib/admin-unit/validation";
import { createAdminBarang, listAdminBarang } from "@/lib/services/admin-barang.service";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Permintaan barang gagal diproses.";
  return NextResponse.json({ message }, { status: 400 });
}

async function readBarangPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return request.json();
  }

  const formData = await request.formData();
  const files = formData.getAll("media").filter((item): item is File => item instanceof File && item.size > 0);
  const category = String(formData.get("category") ?? "");
  const specifications = Object.fromEntries(
    getBarangSpecificationFields(category).map((field) => [
      field.key,
      formData.get(`specifications.${field.key}`)
    ])
  );
  const payload = {
    name: formData.get("name"),
    category,
    condition: formData.get("condition"),
    description: formData.get("description"),
    appraisalValue: formData.get("appraisalValue"),
    ownerName: formData.get("ownerName"),
    customerNumber: formData.get("customerNumber"),
    pawnedAt: formData.get("pawnedAt"),
    dueAt: formData.get("dueAt"),
    specifications
  };

  validateAdminBarangPayload(payload);
  const media = await saveAdminBarangMediaFiles(files);

  return {
    ...payload,
    media
  };
}

export async function GET() {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const data = await listAdminBarang(access.unitId);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const data = await createAdminBarang(access.unitId, access.session.user.id, await readBarangPayload(request));
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
