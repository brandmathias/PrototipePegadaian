"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Expand, Image as ImageIcon, PlayCircle, X } from "lucide-react";

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

function revealVideoPreviewFrame(event: SyntheticEvent<HTMLVideoElement>) {
  const video = event.currentTarget;
  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    return;
  }

  try {
    video.currentTime = Math.min(0.2, video.duration / 4);
  } catch {
    // Some browsers block seeking before enough metadata is available.
  }
}

export function LotMediaGallery({
  category,
  title,
  media,
  className,
  priority = false,
  showCategoryBadge = true,
  variant = "default",
  showVideoControls = true,
  allowFullscreen = false
}: {
  category: string;
  title: string;
  media: LotMediaItem[];
  className?: string;
  priority?: boolean;
  showCategoryBadge?: boolean;
  variant?: "default" | "dark" | "pdp";
  showVideoControls?: boolean;
  allowFullscreen?: boolean;
}) {
  const initialIndex = useMemo(() => getInitialIndex(media), [media]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

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
              onLoadedMetadata={revealVideoPreviewFrame}
              playsInline
              preload={showVideoControls ? "metadata" : "none"}
              src={activeMedia.url}
            />
          ) : (
            <Image
              alt={activeMediaLabel}
              fill
              className="object-cover transition duration-500 ease-out"
              priority={priority}
              quality={72}
              sizes="(min-width: 1280px) 58vw, (min-width: 768px) 72vw, 100vw"
              src={activeMedia.url}
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
        {allowFullscreen ? (
          <button
            aria-label="Buka preview penuh media barang"
            className="absolute right-4 top-4 z-[2] grid size-10 place-items-center rounded-full bg-white/94 text-[#264139] shadow-[0_18px_42px_rgba(8,69,50,0.08)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f7faf8] sm:right-5 sm:top-5 md:right-6 md:top-6"
            onClick={() => setIsFullscreenOpen(true)}
            type="button"
          >
            <Expand className="size-4" />
          </button>
        ) : null}
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
                        onLoadedMetadata={revealVideoPreviewFrame}
                        playsInline
                        preload="metadata"
                        src={item.url}
                      />
                    ) : (
                      <Image
                        alt={`${title} foto ${index + 1}`}
                        fill
                        className="object-cover transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025]"
                        quality={60}
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

      {allowFullscreen && isFullscreenOpen
        ? createPortal(
            <div
              aria-modal="true"
              className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#081b14]/72 px-3 py-3 backdrop-blur-md sm:px-6 sm:py-6"
              onClick={() => setIsFullscreenOpen(false)}
              role="dialog"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,184,93,0.16),transparent_36%)]" />
              <div
                className="modal-viewport relative z-[141] my-auto w-full max-w-6xl rounded-[2rem] border border-white/28 bg-[linear-gradient(180deg,rgba(248,246,239,0.96),rgba(255,255,255,0.92))] p-2 shadow-[0_48px_120px_-40px_rgba(3,21,14,0.82)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] border border-black/5 bg-[#fbfbf8]">
                  <div className="flex items-start justify-between gap-4 border-b border-black/6 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <p className="font-body text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#8d6c08]">
                        Media Barang
                      </p>
                      <h3 className="mt-1 truncate font-headline text-[1.35rem] font-black tracking-tight text-[#13211c]">
                        {mediaLabel(activeMedia, activeIndex)}
                      </h3>
                    </div>
                    <button
                      aria-label="Tutup preview media barang"
                      className="grid size-11 shrink-0 place-items-center rounded-full border border-black/8 bg-white text-primary transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f5f7f2] active:scale-[0.97]"
                      onClick={() => setIsFullscreenOpen(false)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="bg-[linear-gradient(180deg,#f7f8f4,#eef1ea)] p-3 sm:p-4">
                    <div className="overflow-hidden rounded-[1.5rem] border border-black/6 bg-white shadow-[0_24px_60px_-36px_rgba(8,69,50,0.28)]">
                      {activeMedia.type === "video" ? (
                        <video
                          aria-label={`Preview penuh ${activeMediaLabel}`}
                          className="media-preview-frame w-full bg-[#0d1712] object-contain"
                          controls
                          key={activeMedia.id}
                          playsInline
                          src={activeMedia.url}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={`Preview penuh ${activeMediaLabel}`}
                          className="media-preview-frame w-full bg-[#f8f8f5] object-contain"
                          src={activeMedia.url}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
