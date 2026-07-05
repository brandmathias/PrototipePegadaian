import { NextResponse } from "next/server";

import { isAuthRole } from "@/lib/auth/guards";
import { getServerSession } from "@/lib/auth/session";
import { getBuyerWishlistCount } from "@/lib/services/wishlist.service";

export async function GET() {
  const session = await getServerSession();
  const role = isAuthRole(session?.user.role) ? session.user.role : null;
  const wishlistCount = session?.user && role === "buyer" ? await getBuyerWishlistCount(session.user.id) : 0;

  return NextResponse.json({
    user: session?.user
      ? {
          ...session.user,
          wishlistCount
        }
      : null
  });
}
