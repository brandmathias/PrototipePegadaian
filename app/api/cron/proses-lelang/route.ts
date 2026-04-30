import { NextResponse } from "next/server";

import { runAuctionSettlementCron } from "@/lib/services/cron.service";

async function handleCron(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ message: "CRON_SECRET belum diatur." }, { status: 500 });
  }

  const authorizationHeader = request.headers.get("authorization");

  if (authorizationHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Akses cron ditolak." }, { status: 401 });
  }

  try {
    const data = await runAuctionSettlementCron();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron settlement gagal dijalankan.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
