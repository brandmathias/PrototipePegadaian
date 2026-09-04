import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/session";
import { getFixedPriceAvailability } from "@/lib/services/fixed-price-availability.service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const [{ id }, session] = await Promise.all([context.params, getServerSession()]);
    const viewerId = session?.user?.role === "buyer" ? session.user.id : null;
    const data = await getFixedPriceAvailability(id, viewerId);

    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json(
      { message: "Ketersediaan barang belum dapat diperbarui." },
      { headers: { "Cache-Control": "no-store, max-age=0" }, status: 500 }
    );
  }
}
