import type { ComponentPropsWithoutRef } from "react";
import { Heart, HeartCrack } from "lucide-react";

import { cn } from "@/lib/utils";

type FavoriteToggleButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  favorited: boolean;
  itemName: string;
};

export function FavoriteToggleButton({
  className,
  favorited,
  itemName,
  ...props
}: FavoriteToggleButtonProps) {
  const label = favorited ? `Hapus suka ${itemName}` : `Sukai ${itemName}`;
  const tooltipLabel = favorited ? "Hapus dari disukai" : "Sukai barang";

  return (
    <button
      aria-label={label}
      aria-pressed={favorited}
      className={cn(
        "group/favorite relative grid size-9 place-items-center rounded-full border border-white bg-white text-[#13211c] shadow-[0_12px_24px_-16px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.98)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.03] hover:text-[#075f42] active:scale-[0.96]",
        favorited &&
          "border-[#f2d17d] bg-[#fff4cf] text-[#bd7a00] shadow-[0_16px_28px_-18px_rgba(189,122,0,0.45),inset_0_1px_0_rgba(255,255,255,0.98)] hover:border-[#f0bcc4] hover:bg-[#fff1f2] hover:text-[#c81e38]",
        className
      )}
      title={favorited ? "Hapus dari disukai" : "Sukai barang"}
      type="button"
      {...props}
    >
      <Heart
        className={cn(
          "absolute size-4.5 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          favorited
            ? "fill-current group-hover/favorite:scale-75 group-hover/favorite:rotate-[-8deg] group-hover/favorite:opacity-0"
            : "group-hover/favorite:scale-90 group-hover/favorite:text-[#0b6a49]"
        )}
        strokeWidth={2.15}
      />
      {favorited ? (
        <>
          <HeartCrack
            aria-hidden="true"
            className="absolute size-4.5 scale-75 opacity-0 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/favorite:scale-100 group-hover/favorite:opacity-100"
            strokeWidth={2.15}
          />
        </>
      ) : null}
      <span
        className={cn(
          "pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-20 w-max max-w-[10rem] translate-y-1 rounded-md border bg-white px-2.5 py-1 text-[0.64rem] font-black opacity-0 shadow-[0_18px_42px_-30px_rgba(18,24,21,0.38)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/favorite:translate-y-0 group-hover/favorite:opacity-100",
          favorited ? "border-[#f0bcc4] text-[#9f3030]" : "border-black/10 text-[#1b3027]"
        )}
      >
        {tooltipLabel}
      </span>
    </button>
  );
}
