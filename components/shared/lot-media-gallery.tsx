"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Image as ImageIcon, PlayCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { LotFigure } from "./lot-figure";

type LotMediaItem = {
  id: string;
  type: "foto" | "video";
  url: string;
  fileName: string;
};

function getInitialIndex(media: LotMediaItem[]) {
  const primaryPhotoIndex = media.findIndex((item) => item.type === "foto");
  return primaryPhotoIndex >= 0 ? primaryPhotoIndex : 0;
}

function mediaLabel(item: LotMediaItem, index: number) {
  return `${item.type === "video" ? "Video" : "Foto"} ${index + 1}`;
}

export function LotMediaGallery({
  category,
  title,
  media,
  className,
  priority = false,
  showCategoryBadge = true,
  variant = "default",
  showVideoControls = true
}: {
  category: string;
  title: string;
  media: LotMediaItem[];
  className?: string;
  priority?: boolean;
  showCategoryBadge?: boolean;
  variant?: "default" | "dark" | "pdp";
  showVideoControls?: boolean;
}) {
  const initialIndex = useMemo(() => getInitialIndex(media), [media]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    setActiveIndex(getInitialIndex(media));
  }, [media]);

  if (!media.length) {
    return (
      <LotFigure
        category={category}
        className={className}
        showCategoryBadge={showCategoryBadge}
        variant={variant}
      />
    );
  }

  const activeMedia = media[activeIndex];
  const activeMediaLabel = `${title} ${activeMedia.type === "video" ? "video" : "foto"} ${activeIndex + 1}`;
  const isPdp = variant === "pdp";
  const progressScale = media.length > 1 ? (activeIndex + 1) / media.length : 1;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] border border-border/70 bg-transparent shadow-[0_18px_50px_rgba(10,40,28,0.08)]",
          variant === "dark" &&
            "border-transparent bg-[#082d24] shadow-[0_30px_90px_rgba(0,0,0,0.38)]",
          isPdp &&
            "border-transparent bg-[#f7f8f6] shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]",
          className
        )}
      >
        <div className="absolute inset-0" data-testid="lot-media-active">
          {activeMedia.type === "video" ? (
            <video
              aria-label={activeMediaLabel}
              autoPlay={!showVideoControls}
              className="size-full object-cover"
              controls={showVideoControls}
              key={activeMedia.id}
              loop={!showVideoControls}
              muted
              playsInline
              preload="metadata"
              src={activeMedia.url}
            />
          ) : (
            <Image
              alt={activeMediaLabel}
              fill
              className="object-cover transition duration-500 ease-out"
              priority={priority}
              sizes="(min-width: 1280px) 58vw, (min-width: 768px) 72vw, 100vw"
              src={activeMedia.url}
              unoptimized={priority}
            />
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-5 md:p-6">
          {showCategoryBadge ? (
            <span className="rounded-full bg-black/32 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white/90 backdrop-blur">
              {category}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          {media.length > 1 && !isPdp ? (
            <span
              className={cn(
                "rounded-full bg-black/28 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur",
                variant === "dark" && "bg-white/10 text-white/72"
              )}
            >
              {activeIndex + 1}/{media.length}
            </span>
          ) : null}
        </div>
        {media.length > 1 && isPdp ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 flex items-center justify-center gap-4 text-[0.68rem] font-bold text-[#17633f]">
            <span>{String(activeIndex + 1).padStart(2, "0")}</span>
            <span className="relative h-px w-24 overflow-hidden rounded-full bg-[#dfe7de]">
              <span
                className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[#17633f] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `scaleX(${progressScale})` }}
              />
            </span>
            <span>{String(media.length).padStart(2, "0")}</span>
          </div>
        ) : null}
        <div className="min-h-[22rem] md:min-h-[34rem]" />
      </div>

      {media.length > 1 ? (
        <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", isPdp && "flex grid-cols-none items-center gap-3")}>
          <div className={cn("contents", isPdp && "grid flex-1 grid-cols-3 gap-3 sm:grid-cols-5")}>
            {media.map((item, index) => {
              const isActive = index === activeIndex;
              const isVideo = item.type === "video";

              return (
                <button
                  aria-label={`Lihat ${mediaLabel(item, index)}`}
                  className={cn(
                    "group relative overflow-hidden rounded-[1.2rem] border bg-surface-low text-left transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isActive
                      ? "border-primary shadow-[0_14px_30px_rgba(10,106,73,0.14)] ring-2 ring-primary/15"
                      : "border-border/70 hover:-translate-y-0.5 hover:border-primary/30",
                    variant === "dark" &&
                      (isActive
                        ? "border-[#d4af37]/70 bg-white/10 shadow-[0_18px_38px_rgba(0,0,0,0.24)] ring-2 ring-[#d4af37]/20"
                        : "border-white/10 bg-white/[0.055] hover:border-[#d4af37]/34 hover:bg-white/[0.075]"),
                    isPdp &&
                      (isActive
                        ? "border-[#17633f] bg-white shadow-[0_18px_38px_rgba(23,99,63,0.08)] ring-2 ring-[#17633f]/12"
                        : "border-transparent bg-[#f2f4f0] hover:-translate-y-0.5 hover:bg-white hover:ring-1 hover:ring-[#dfe7de]")
                  )}
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <div
                    className={cn(
                      "relative aspect-[4/3]",
                      isVideo
                        ? "bg-[#050505]"
                        : "bg-[linear-gradient(180deg,#f8f4ec_0%,#f2ece2_100%)]"
                    )}
                  >
                    {isVideo ? (
                      <video
                        aria-label={`${title} video ${index + 1}`}
                        className="size-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        src={item.url}
                      />
                    ) : (
                      <Image
                        alt={`${title} foto ${index + 1}`}
                        fill
                        className="object-cover transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025]"
                        sizes="(min-width: 1280px) 18vw, (min-width: 640px) 45vw, 100vw"
                        src={item.url}
                      />
                    )}

                    {!isPdp ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-3 text-[11px] font-semibold text-white">
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/32 px-2.5 py-1 backdrop-blur">
                          {isVideo ? <PlayCircle className="size-3.5" /> : <ImageIcon className="size-3.5" />}
                          {item.type === "video" ? "Video" : "Foto"}
                        </span>
                        <span className="rounded-full bg-black/32 px-2.5 py-1 backdrop-blur">
                          #{index + 1}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          {isPdp ? (
            <button
              aria-label="Lihat media berikutnya"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#174e3b] shadow-[0_14px_32px_rgba(8,69,50,0.08)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f7faf8]"
              type="button"
              onClick={() => setActiveIndex((current) => (current + 1) % media.length)}
            >
              <ChevronRight className="size-4" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
