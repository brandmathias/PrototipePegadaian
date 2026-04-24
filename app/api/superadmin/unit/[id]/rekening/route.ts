import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import { createUnitAccount, listUnitAccounts } from "@/lib/services/rekening-unit.service";

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Permintaan rekening unit gagal diproses.";
  const status = message.includes("belum ditemukan") ? 404 : 400;

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
    const data = await listUnitAccounts(id);
    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
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
    const data = await createUnitAccount(id, body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
