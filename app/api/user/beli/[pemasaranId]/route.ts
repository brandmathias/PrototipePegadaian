import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { createFixedPriceMidtransCheckout } from "@/lib/services/buyer.service";

type Context = { params: Promise<{ pemasaranId: string }> };

export async function POST(_request: Request, context: Context) {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { pemasaranId } = await context.params;
    const data = await createFixedPriceMidtransCheckout(access.userId, pemasaranId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout Midtrans gagal dibuat.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
