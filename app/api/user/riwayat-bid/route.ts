import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { listBuyerBids } from "@/lib/services/buyer.service";

export async function GET() {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const data = await listBuyerBids(access.userId);
  return NextResponse.json({ data });
}
