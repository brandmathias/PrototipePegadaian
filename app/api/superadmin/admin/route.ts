import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import { createAdminUnit, listAdminUnits } from "@/lib/services/admin-unit.service";

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Permintaan admin unit gagal diproses.";
  const status = message.includes("sudah") ? 409 : message.includes("belum ditemukan") ? 404 : 400;

  return NextResponse.json({ message }, { status });
}

export async function GET() {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const data = await listAdminUnits();
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const body = await request.json();
    const data = await createAdminUnit(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
