import Image from "next/image";
import { Gem, Laptop, Car, Coins, Package } from "lucide-react";

import { cn } from "@/lib/utils";

type LotFigureProps = {
  category: string;
  className?: string;
  media?: Array<{
    type: "foto" | "video";
    url: string;
    fileName: string;
  }>;
  showCategoryBadge?: boolean;
  showVideoControls?: boolean;
  variant?: "default" | "dark" | "pdp";
};

const categoryMap = {
  Perhiasan: {
    icon: Gem,
    tone: "from-[#0a5d2d] via-[#0d6b35] to-[#735c00]"
  },
  Elektronik: {
    icon: Laptop,
    tone: "from-[#143b2a] via-[#006432] to-[#224f6d]"
  },
  Kendaraan: {
    icon: Car,
    tone: "from-[#1f3326] via-[#004a23] to-[#4e5d1d]"
  },
  "Logam Mulia": {
    icon: Coins,
    tone: "from-[#735c00] via-[#9c7a00] to-[#004a23]"
  },
  Lainnya: {
    icon: Package,
    tone: "from-[#244236] via-[#355f4f] to-[#735c00]"
  }
} as const;

export function LotFigure({
  category,
  className,
  media = [],
  showCategoryBadge = true,
  showVideoControls = false,
  variant = "default"
}: LotFigureProps) {
  const config = categoryMap[category as keyof typeof categoryMap] ?? categoryMap.Lainnya;
  const Icon = config.icon;
  const primaryMedia = media.find((item) => item.type === "foto") ?? media[0];
  const primaryMediaLabel = primaryMedia ? `${category} ${primaryMedia.type === "video" ? "video" : "foto"} utama` : category;
  const mediaToneClass =
    primaryMedia?.type === "video"
      ? "bg-[#050505]"
      : "bg-[linear-gradient(180deg,#f8f4ec_0%,#f2ece2_100%)]";

  if (primaryMedia) {
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-[1.25rem] text-white",
          mediaToneClass,
          className
        )}
      >
        {primaryMedia.type === "video" ? (
          <video
            aria-label={primaryMediaLabel}
            autoPlay={!showVideoControls}
            className="absolute inset-0 h-full w-full object-cover"
            controls={showVideoControls}
            loop={!showVideoControls}
            muted
            playsInline
            preload="metadata"
            src={primaryMedia.url}
          />
        ) : (
          <Image
            alt={primaryMediaLabel}
            fill
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(min-width: 1280px) 34vw, (min-width: 768px) 50vw, 100vw"
            src={primaryMedia.url}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.02)_48%,rgba(0,0,0,0.22))]" />
        <div className="pointer-events-none relative flex h-full min-h-40 flex-col justify-between p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            {showCategoryBadge ? (
              <span className="w-fit rounded-full bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white/90 backdrop-blur">
                {category}
              </span>
            ) : null}
          </div>
          <div className="flex items-end justify-between">
            <div className="space-y-1 opacity-75">
              <div className="h-2 w-20 rounded-full bg-white/35" />
              <div className="h-2 w-28 rounded-full bg-white/25" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br p-6 text-white",
        config.tone,
        variant === "dark" && "bg-none bg-[#082d24]",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,214,91,0.24),transparent_30%)]",
          variant === "dark" &&
            "bg-[radial-gradient(circle_at_48%_35%,rgba(212,175,55,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_30%)]"
        )}
      />
      <div className="relative flex h-full min-h-40 flex-col justify-between">
        {showCategoryBadge ? (
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
            {category}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="h-2 w-20 rounded-full bg-white/20" />
            <div className="h-2 w-28 rounded-full bg-white/15" />
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <Icon className="size-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
