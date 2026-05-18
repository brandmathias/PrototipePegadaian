"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, PlayCircle } from "lucide-react";

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
  showVideoControls = true
}: {
  category: string;
  title: string;
  media: LotMediaItem[];
  className?: string;
  showVideoControls?: boolean;
}) {
  const initialIndex = useMemo(() => getInitialIndex(media), [media]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    setActiveIndex(getInitialIndex(media));
  }, [media]);

  if (!media.length) {
    return <LotFigure category={category} className={className} />;
  }

  const activeMedia = media[activeIndex];
  const activeMediaLabel = `${title} ${activeMedia.type === "video" ? "video" : "foto"} ${activeIndex + 1}`;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] border border-border/70 bg-transparent shadow-[0_18px_50px_rgba(10,40,28,0.08)]",
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
              sizes="(min-width: 1280px) 58vw, (min-width: 768px) 72vw, 100vw"
              src={activeMedia.url}
            />
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-5 md:p-6">
          <span className="rounded-full bg-black/32 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white/90 backdrop-blur">
            {category}
          </span>
          {media.length > 1 ? (
            <span className="rounded-full bg-black/28 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
              {activeIndex + 1}/{media.length}
            </span>
          ) : null}
        </div>
        <div className="min-h-[22rem] md:min-h-[34rem]" />
      </div>

      {media.length > 1 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {media.map((item, index) => {
            const isActive = index === activeIndex;
            const isVideo = item.type === "video";

            return (
              <button
                aria-label={`Lihat ${mediaLabel(item, index)}`}
                className={cn(
                  "group relative overflow-hidden rounded-[1.2rem] border bg-surface-low text-left transition duration-300",
                  isActive
                    ? "border-primary shadow-[0_14px_30px_rgba(10,106,73,0.14)] ring-2 ring-primary/15"
                    : "border-border/70 hover:-translate-y-0.5 hover:border-primary/30"
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
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                      sizes="(min-width: 1280px) 18vw, (min-width: 640px) 45vw, 100vw"
                      src={item.url}
                    />
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-3 text-[11px] font-semibold text-white">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/32 px-2.5 py-1 backdrop-blur">
                      {isVideo ? <PlayCircle className="size-3.5" /> : <ImageIcon className="size-3.5" />}
                      {item.type === "video" ? "Video" : "Foto"}
                    </span>
                    <span className="rounded-full bg-black/32 px-2.5 py-1 backdrop-blur">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
