import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import { revokeBlacklist } from "@/lib/services/blacklist.service";

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Aksi cabut blacklist gagal diproses.";
  const status = message.includes("tidak ditemukan") ? 404 : 400;

  return NextResponse.json({ message }, { status });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { userId } = await context.params;
    const body = await request.json();
    const data = await revokeBlacklist(userId, access.session.user.id, body);
    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
