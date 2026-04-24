import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import { deactivateUnit, getUnitById, updateUnit } from "@/lib/services/unit.service";

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Permintaan detail unit gagal diproses.";
  const status = message.includes("belum ditemukan") ? 404 : message.includes("sudah") ? 409 : 400;

  return NextResponse.json({ message }, { status });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const data = await getUnitById(id);
    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const data = await updateUnit(id, body);
    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const data = await deactivateUnit(id);
    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
