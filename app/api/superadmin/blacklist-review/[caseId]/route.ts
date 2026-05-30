import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import { decideSuperadminBlacklistReviewCase } from "@/lib/services/blacklist-review.service";

type Context = { params: Promise<{ caseId: string }> };

export async function POST(request: Request, context: Context) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { caseId } = await context.params;
    const data = await decideSuperadminBlacklistReviewCase(caseId, access.session.user.id, await request.json());
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Keputusan review blacklist gagal disimpan.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
