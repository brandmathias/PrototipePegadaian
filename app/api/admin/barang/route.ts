import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { createAdminBarang, listAdminBarang } from "@/lib/services/admin-barang.service";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Permintaan barang gagal diproses.";
  return NextResponse.json({ message }, { status: 400 });
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
    const data = await createAdminBarang(access.unitId, access.session.user.id, await request.json());
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
