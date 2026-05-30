import { NextResponse } from "next/server";

import { readBlacklistReviewRequestPayload } from "@/lib/blacklist/review-upload";
import {
  createPublicBlacklistReviewCase,
  lookupPublicBlacklistHelp
} from "@/lib/services/blacklist-review.service";

export async function POST(request: Request) {
  try {
    const body = await readBlacklistReviewRequestPayload(request);
    const hasSubmissionPayload = Boolean(body?.buyerStatement || body?.evidence);
    const data = hasSubmissionPayload
      ? await createPublicBlacklistReviewCase(body)
      : await lookupPublicBlacklistHelp(body);

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bantuan blacklist tidak dapat dibuka.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
