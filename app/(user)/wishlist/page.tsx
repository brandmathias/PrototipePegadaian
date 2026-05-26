import { WishlistPage } from "@/components/pages/wishlist-page";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { listBuyerWishlist } from "@/lib/services/wishlist.service";

export default async function Page() {
  const buyer = await getBuyerSessionUser("/wishlist");
  const wishlist = await listBuyerWishlist(buyer.id);

  return <WishlistPage {...wishlist} serverNow={new Date().toISOString()} />;
}
