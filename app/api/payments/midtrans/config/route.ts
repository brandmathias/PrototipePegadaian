import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";

export async function GET() {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim() ?? "";
  if (!clientKey) {
    return NextResponse.json({ message: "Layanan pembayaran belum dikonfigurasi." }, { status: 503 });
  }

  return NextResponse.json({
    data: {
      clientKey,
      isProduction: process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
    }
  });
}
