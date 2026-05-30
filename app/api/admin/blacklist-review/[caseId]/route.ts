import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { submitAdminBlacklistReviewRecommendation } from "@/lib/services/blacklist-review.service";

type Context = { params: Promise<{ caseId: string }> };

export async function POST(request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { caseId } = await context.params;
    const data = await submitAdminBlacklistReviewRecommendation(
      access.unitId,
      access.session.user.id,
      caseId,
      await request.json()
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rekomendasi review blacklist gagal disimpan.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
