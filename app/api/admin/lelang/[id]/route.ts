import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { getAdminPemasaranById } from "@/lib/services/admin-pemasaran.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const data = await getAdminPemasaranById(access.unitId, id);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sesi pemasaran gagal dibuka.";
    return NextResponse.json({ message }, { status: 404 });
  }
}
