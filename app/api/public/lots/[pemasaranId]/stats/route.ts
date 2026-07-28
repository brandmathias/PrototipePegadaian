import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/session";
import { getLotStats, recordLotView } from "@/lib/services/public-lot-stats.service";

function normalizeViewerKey(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 160);
}

async function getVisitId(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return "";
  }

  return normalizeViewerKey("visitId" in payload ? payload.visitId : "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pemasaranId: string }> }
) {
  const { pemasaranId } = await params;
  const stats = await getLotStats(pemasaranId);

  return NextResponse.json(stats);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pemasaranId: string }> }
) {
  const { pemasaranId } = await params;
  const session = await getServerSession().catch(() => null);
  const visitId = await getVisitId(request);
  const viewerKey = visitId
    ? `${session?.user?.id ? `user:${session.user.id}` : "anon"}:visit:${visitId}`.slice(0, 160)
    : "";
  const stats = await recordLotView(pemasaranId, viewerKey);

  return NextResponse.json(stats);
}
