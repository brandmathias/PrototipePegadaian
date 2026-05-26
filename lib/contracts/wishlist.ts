import type { Lot } from "@/lib/contracts/catalog";

export type BuyerWishlistItem = {
  likedAt: string;
  isAvailable: boolean;
  unavailableReason?: string;
  lot: Lot;
};

export type BuyerWishlist = {
  activeItems: BuyerWishlistItem[];
  unavailableItems: BuyerWishlistItem[];
};
