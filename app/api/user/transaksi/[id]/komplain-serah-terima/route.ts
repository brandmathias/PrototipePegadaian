import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { submitBuyerHandoverComplaint } from "@/lib/services/buyer.service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const payload = await request.json().catch(() => ({}));
    const data = await submitBuyerHandoverComplaint(access.userId, id, payload);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Komplain serah-terima gagal dikirim.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

