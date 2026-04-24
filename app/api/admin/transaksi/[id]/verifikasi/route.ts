import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { verifyAdminTransaction } from "@/lib/services/admin-transaction.service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const data = await verifyAdminTransaction(access.unitId, access.session.user.id, id, await request.json());
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verifikasi transaksi gagal.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
