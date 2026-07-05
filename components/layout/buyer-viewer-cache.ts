export const BUYER_VIEWER_CACHE_KEY = "pegadaian:buyer-nav-viewer:v1";

export type CachedBuyerViewer = {
  name: string;
  image: string | null;
  role: "buyer";
  homeHref: "/dashboard";
  wishlistCount: number;
};

type BuyerViewerInput = {
  name: string;
  image?: string | null;
  wishlistCount?: number | null;
};

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function toCachedBuyerViewer(input: BuyerViewerInput): CachedBuyerViewer {
  return {
    name: input.name.trim() || "Pengguna",
    image: typeof input.image === "string" && input.image ? input.image : null,
    role: "buyer",
    homeHref: "/dashboard",
    wishlistCount: typeof input.wishlistCount === "number" ? input.wishlistCount : 0,
  };
}

export function readBuyerViewerCache(): CachedBuyerViewer | null {
  const storage = getSessionStorage();
  const rawValue = storage?.getItem(BUYER_VIEWER_CACHE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const value = JSON.parse(rawValue) as Partial<CachedBuyerViewer> | null;

    if (!value || value.role !== "buyer" || typeof value.name !== "string") {
      return null;
    }

    return toCachedBuyerViewer({
      name: value.name,
      image: value.image,
      wishlistCount: value.wishlistCount,
    });
  } catch {
    return null;
  }
}

export function writeBuyerViewerCache(input: BuyerViewerInput) {
  const storage = getSessionStorage();

  storage?.setItem(BUYER_VIEWER_CACHE_KEY, JSON.stringify(toCachedBuyerViewer(input)));
}

export function clearBuyerViewerCache() {
  getSessionStorage()?.removeItem(BUYER_VIEWER_CACHE_KEY);
}
