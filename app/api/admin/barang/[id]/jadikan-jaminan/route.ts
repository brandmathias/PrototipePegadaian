import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { convertAdminBarangToJaminan } from "@/lib/services/admin-barang.service";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const data = await convertAdminBarangToJaminan(access.unitId, access.session.user.id, id);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Konversi barang gagal diproses.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
