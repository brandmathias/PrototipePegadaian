import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { extendAdminBarang } from "@/lib/services/admin-barang.service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const data = await extendAdminBarang(access.unitId, access.session.user.id, id, await request.json());
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Perpanjangan gagal diproses.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
