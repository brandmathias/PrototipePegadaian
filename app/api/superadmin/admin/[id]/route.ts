import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import { deactivateAdminUnit, getAdminUnitById, updateAdminUnit } from "@/lib/services/admin-unit.service";

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Permintaan admin unit gagal diproses.";
  const status = message.includes("sudah") ? 409 : message.includes("belum ditemukan") ? 404 : 400;

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
    const data = await getAdminUnitById(id);
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
    const data = await updateAdminUnit(id, body);
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
    const data = await deactivateAdminUnit(id);
    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
