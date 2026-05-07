import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { completeBuyerTransaction } from "@/lib/services/buyer.service";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const data = await completeBuyerTransaction(access.userId, id);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaksi gagal diselesaikan.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
