import { NextResponse } from "next/server";

import { listPublicLots } from "@/lib/services/public-catalog.service";

export async function GET() {
  const data = await listPublicLots();
  return NextResponse.json({ data });
}
