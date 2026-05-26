import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { removeBuyerWishlist, toggleBuyerWishlist } from "@/lib/services/wishlist.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ pemasaranId: string }> }
) {
  const access = await requireBuyerApiSession();

  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const { pemasaranId } = await params;
  const result = await toggleBuyerWishlist(access.userId, pemasaranId);

  return NextResponse.json(result);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ pemasaranId: string }> }
) {
  const access = await requireBuyerApiSession();

  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const { pemasaranId } = await params;
  const result = await removeBuyerWishlist(access.userId, pemasaranId);

  return NextResponse.json(result);
}
