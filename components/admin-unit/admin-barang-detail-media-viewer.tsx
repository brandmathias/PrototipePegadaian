"use client";

import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Expand, Package2, X } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type DetailMedia = {
  id: string;
  type: string;
  url: string;
  fileName?: string;
};

function isVideoMedia(media: DetailMedia | null | undefined) {
  if (!media) return false;
  return media.type === "video" || /\.(mp4|mov|webm|mkv)$/i.test(media.url);
}

function getInitialIndex(media: DetailMedia[]) {
  const firstPhotoIndex = media.findIndex((item) => !isVideoMedia(item));
  return firstPhotoIndex >= 0 ? firstPhotoIndex : 0;
}

function getMediaName(media: DetailMedia, index: number) {
  return media.fileName || `media-${index + 1}`;
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

export function AdminBarangDetailMediaViewer({
  category,
  className,
  media,
  title,
}: {
  category: string;
  className?: string;
  media: DetailMedia[];
  title: string;
}) {
  const initialIndex = useMemo(() => getInitialIndex(media), [media]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(getInitialIndex(media));
  }, [media]);

  if (!media.length) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="overflow-hidden rounded-[1.15rem] border border-[#e5ebe7] bg-white shadow-[0_18px_38px_-32px_rgba(8,69,50,0.24)]">
          <div className="flex h-[18rem] w-full flex-col items-center justify-center bg-[linear-gradient(180deg,#f7f8f5,#eef2ec)] px-5 text-center lg:h-[19.5rem]">
            <span className="grid size-11 place-items-center rounded-full border border-[#cfeadd] bg-[#f4fbf7] text-[#006747]">
              <Package2 className="size-5" />
            </span>
            <span className="mt-3 block text-xs font-extrabold text-slate-900">
              Media barang belum tersedia
            </span>
            <span className="mt-1 block text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {category}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const activeMedia = media[Math.min(activeIndex, media.length - 1)];
  const activeIsVideo = isVideoMedia(activeMedia);
  const thumbnailMedia = [
    { item: activeMedia, index: Math.min(activeIndex, media.length - 1) },
    ...media
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.index !== activeIndex),
  ].slice(0, 5);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-hidden rounded-[1.15rem] border border-[#e5ebe7] bg-white shadow-[0_18px_38px_-32px_rgba(8,69,50,0.24)]">
        <div
          aria-label="Buka preview penuh media barang"
          className="group relative h-[18rem] w-full overflow-hidden bg-[linear-gradient(180deg,#f4f6f2,#eef2ec)] text-left outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-[#006747]/25 lg:h-[19.5rem]"
          data-testid="admin-detail-active-media"
          onClick={() => setIsFullscreenOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsFullscreenOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
        >
          {activeIsVideo ? (
            <video
              aria-label={`Preview media aktif ${title}: ${getMediaName(activeMedia, activeIndex)}`}
              className="size-full object-cover"
              key={activeMedia.id}
              muted
              onLoadedMetadata={revealVideoPreviewFrame}
              playsInline
              preload="metadata"
              src={activeMedia.url}
            />
          ) : (
            <Image
              alt={`Preview media aktif ${title}: ${getMediaName(activeMedia, activeIndex)}`}
              className="size-full object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015]"
              fill
              quality={60}
              sizes="(max-width: 640px) calc(100vw - 3rem), 28rem"
              src={activeMedia.url}
            />
          )}

          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_42%,rgba(7,28,20,0.18))]" />
          <button
            aria-label="Buka preview penuh media barang"
            className="absolute right-3 top-3 z-[2] grid size-10 place-items-center rounded-full bg-white/95 text-[#111827] shadow-[0_16px_32px_-24px_rgba(8,69,50,0.42)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f7faf8] active:scale-[0.97]"
            onClick={(event) => {
              event.stopPropagation();
              setIsFullscreenOpen(true);
            }}
            type="button"
          >
            <Expand className="size-4" />
          </button>
        </div>
      </div>

      {media.length > 1 ? (
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1">
            {thumbnailMedia.map(({ item, index }) => {
              const isVideo = isVideoMedia(item);
              const selected = index === activeIndex;

              return (
                <button
                  aria-label={`Lihat media barang ${index + 1}`}
                  className={cn(
                    "group relative size-16 shrink-0 overflow-hidden rounded-xl border bg-[#f2f4f0] shadow-[0_14px_28px_-24px_rgba(8,69,50,0.26)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006747]/25 sm:size-[4.5rem]",
                    selected
                      ? "border-[#007a3d] ring-2 ring-[#007a3d]/20"
                      : "border-[#e3e9e5] hover:border-[#b7d6c3]",
                  )}
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  {isVideo ? (
                    <div className="relative size-full overflow-hidden rounded-xl bg-[#0d1712] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <video
                        aria-label={`Thumbnail video ${title}: ${getMediaName(item, index)}`}
                        className="size-full object-cover opacity-95 transition duration-500 group-hover:scale-[1.025]"
                        muted
                        onLoadedMetadata={revealVideoPreviewFrame}
                        playsInline
                        preload="metadata"
                        src={item.url}
                      />
                      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,17,12,0.04),rgba(4,17,12,0.48))]" />
                    </div>
                  ) : (
                    <Image
                      alt={`Thumbnail ${title}: ${getMediaName(item, index)}`}
                      className="size-full object-cover transition duration-500 group-hover:scale-[1.025]"
                      fill
                      quality={60}
                      sizes="96px"
                      src={item.url}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            aria-label="Lihat media berikutnya"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#174e3b] shadow-[0_14px_32px_rgba(8,69,50,0.08)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f7faf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006747]/25"
            onClick={() =>
              setActiveIndex((current) => (current + 1) % media.length)
            }
            type="button"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : null}

      {isFullscreenOpen
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
                        {getMediaName(activeMedia, activeIndex)}
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
                      {activeIsVideo ? (
                        <video
                          aria-label="Preview penuh video barang"
                          className="media-preview-frame w-full bg-[#0d1712] object-contain"
                          controls
                          key={activeMedia.id}
                          playsInline
                          src={activeMedia.url}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt="Preview penuh media barang"
                          className="media-preview-frame w-full bg-[#f8f8f5] object-contain"
                          src={activeMedia.url}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
