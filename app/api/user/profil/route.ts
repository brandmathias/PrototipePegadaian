import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { updateBuyerProfile } from "@/lib/services/buyer.service";

export async function PUT(request: Request) {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const data = await updateBuyerProfile(access.userId, await request.json());
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profil belum berhasil diperbarui.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
