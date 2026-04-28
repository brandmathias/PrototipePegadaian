import { NextResponse } from "next/server";

import { getPublicLotById } from "@/lib/services/public-catalog.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const data = await getPublicLotById(id);

  if (!data) {
    return NextResponse.json({ message: "Barang tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ data });
}
