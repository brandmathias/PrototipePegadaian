import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import { deleteUnitAccount, updateUnitAccount } from "@/lib/services/rekening-unit.service";

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Perubahan rekening unit gagal diproses.";
  const status = message.includes("belum ditemukan") ? 404 : 400;

  return NextResponse.json({ message }, { status });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; rid: string }> }
) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id, rid } = await context.params;
    const body = await request.json();
    const data = await updateUnitAccount(id, rid, body);
    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; rid: string }> }
) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id, rid } = await context.params;
    const data = await deleteUnitAccount(id, rid);
    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
