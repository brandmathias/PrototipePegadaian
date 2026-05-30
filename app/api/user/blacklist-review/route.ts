import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { readBlacklistReviewRequestPayload } from "@/lib/blacklist/review-upload";
import {
  createBuyerBlacklistReviewCase,
  listBuyerBlacklistReviewCases
} from "@/lib/services/blacklist-review.service";

export async function GET() {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const data = await listBuyerBlacklistReviewCases(access.userId);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const data = await createBuyerBlacklistReviewCase(
      access.userId,
      await readBlacklistReviewRequestPayload(request)
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bantuan blacklist gagal dikirim.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
