"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FavoriteToggleButton } from "@/components/shared/favorite-toggle-button";

type DetailFavoriteToggleProps = {
  className?: string;
  initialFavorited?: boolean;
  itemName: string;
  lotId: string;
  wishlistSyncEnabled?: boolean;
};

export function DetailFavoriteToggle({
  className,
  initialFavorited = false,
  itemName,
  lotId,
  wishlistSyncEnabled = false
}: DetailFavoriteToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  async function handleToggle() {
    if (pending) {
      return;
    }

    if (!wishlistSyncEnabled) {
      const currentQuery = searchParams.toString();
      const nextPath = `${pathname}${currentQuery ? `?${currentQuery}` : ""}`;
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    const previousFavorited = favorited;
    setFavorited(!previousFavorited);

    setPending(true);

    try {
      const response = await fetch(`/api/user/wishlist/${lotId}`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Failed to sync wishlist");
      }

      const result = (await response.json()) as { count?: number; favorited?: boolean };
      setFavorited(Boolean(result.favorited));
      if (typeof result.count === "number") {
        window.dispatchEvent(new CustomEvent("pegadaian:wishlist-count-updated", { detail: { count: result.count } }));
      }
      window.dispatchEvent(new CustomEvent("pegadaian:lot-stats-refresh", { detail: { lotId } }));
      router.refresh();
    } catch {
      setFavorited(previousFavorited);
    } finally {
      setPending(false);
    }
  }

  return (
    <FavoriteToggleButton
      className={className}
      disabled={pending}
      favorited={favorited}
      itemName={itemName}
      onClick={handleToggle}
    />
  );
}
