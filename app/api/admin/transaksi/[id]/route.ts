import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { getAdminTransactionById } from "@/lib/services/admin-transaction.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const data = await getAdminTransactionById(access.unitId, id);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaksi gagal dibuka.";
    return NextResponse.json({ message }, { status: 404 });
  }
}
