import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { createFixedPricePurchase } from "@/lib/services/buyer.service";

type Context = { params: Promise<{ pemasaranId: string }> };

export async function POST(request: Request, context: Context) {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { pemasaranId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const data = await createFixedPricePurchase(access.userId, pemasaranId, body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pembelian gagal diproses.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
