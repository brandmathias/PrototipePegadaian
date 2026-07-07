"use client";

import Image from "next/image";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Camera, Expand, Info, MapPin, ShieldCheck, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type HandoverProofViewModel = {
  fileUrl?: string | null;
  uploadedAt?: string | null;
  uploadedBy?: string | null;
  location?: string | null;
};

type HandoverProofCardProps = {
  className?: string;
  itemTitle?: string;
  proof?: HandoverProofViewModel | null;
  audience?: "buyer" | "admin" | "superadmin";
  compact?: boolean;
  controls?: ReactNode;
  emptyFooterCopy?: string;
  previewUrl?: string | null;
};

function displayValue(value?: string | null, fallback = "-") {
  const normalized = String(value ?? "").trim();
  return normalized && normalized !== "-" ? normalized : fallback;
}

function getAudienceSubtitle(audience: HandoverProofCardProps["audience"]) {
  if (audience === "admin") {
    return "Dokumentasi serah-terima fisik barang kepada buyer.";
  }

  if (audience === "superadmin") {
    return "Arsip read-only serah-terima fisik barang.";
  }

  return "Dokumentasi serah-terima fisik barang kepada pemenang.";
}

export function HandoverProofCard({
  audience = "buyer",
  className,
  compact = false,
  controls,
  emptyFooterCopy,
  itemTitle,
  previewUrl,
  proof
}: HandoverProofCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const titleId = useId();
  const previewTitleId = `${titleId}-preview`;
  const storedFileUrl = proof?.fileUrl || null;
  const fileUrl = previewUrl ?? storedFileUrl;
  const isLocalPreview = Boolean(fileUrl?.startsWith("blob:"));
  const location = displayValue(proof?.location, "Loket unit");
  const uploadedAt = displayValue(proof?.uploadedAt, "Menunggu dokumentasi");
  const uploadedBy = displayValue(proof?.uploadedBy, "Admin Unit");
  const imageAlt = `Preview bukti serah-terima barang ${itemTitle ?? "transaksi"}`;
  const footerCopy = fileUrl
    ? "Foto ini tersimpan sebagai bukti serah-terima fisik barang."
    : emptyFooterCopy ?? "Menunggu admin unit mengunggah bukti serah-terima barang.";
  const metaRows = [
    { icon: CalendarDays, label: "Waktu Penyerahan", value: uploadedAt },
    { icon: MapPin, label: "Lokasi Loket Unit", value: location },
    { icon: ShieldCheck, label: "Diunggah Oleh", value: uploadedBy },
  ];

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPreviewOpen]);

  return (
    <>
      <section
        className={cn(
          "overflow-hidden rounded-2xl border border-slate-200/80 border-l-4 border-l-[#0a6a49] bg-white p-3 shadow-[0_18px_42px_-36px_rgba(8,69,50,0.26)]",
          className
        )}
      >
        <div
          aria-label="Panel bukti serah-terima barang"
          className={cn(
            "grid grid-cols-[repeat(auto-fit,minmax(min(100%,34rem),1fr))] items-stretch gap-4",
            compact && "grid-cols-[repeat(auto-fit,minmax(min(100%,30rem),1fr))]"
          )}
        >
          <div className="flex min-h-[20rem] flex-col px-1 py-1 sm:px-2">
            <div className="flex min-w-0 items-start gap-4 border-b border-slate-100 pb-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-100 bg-slate-50 text-[#0a6a49]">
                <Camera className="size-4" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 pt-0.5">
                <h3
                  className="text-sm font-black leading-snug tracking-tight text-slate-950"
                  id={titleId}
                >
                  Dokumentasi Serah Terima Barang Fisik
                </h3>
                <p className="mt-1 text-xs font-semibold leading-normal text-[#64748b]">
                  {getAudienceSubtitle(audience)}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {metaRows.map(({ icon: Icon, label, value }) => (
                <div className="flex min-w-0 items-center gap-4 py-4" key={label}>
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-100 bg-slate-50 text-[#0a6a49]">
                    <Icon className="size-4" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-[0.72rem] font-black uppercase leading-tight tracking-[0.08em] text-[#9aa8bd]">
                      {label}
                    </span>
                    <span className="mt-1 block break-words text-sm font-black leading-snug tracking-tight text-slate-900">
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto flex min-w-0 items-center gap-2 pt-4 text-xs font-semibold leading-5 text-[#64748b]">
              <Info className="size-4 shrink-0 text-[#c7d3e1]" />
              <p className="min-w-0 truncate" title={footerCopy}>{footerCopy}</p>
            </div>
          </div>

          <div
            aria-label="Area preview bukti serah-terima barang"
            className={cn(
              "min-h-[20rem] rounded-[1.1rem] border border-[#dfe8e3] bg-[#f6faf7] p-3 sm:p-4",
              compact && "w-full"
            )}
          >
            <div className="flex min-h-[18rem] flex-col">
              {fileUrl ? (
                <button
                  aria-label="Buka fullscreen bukti serah-terima barang"
                  className="group relative block min-h-[18rem] flex-1 overflow-hidden rounded-[1.35rem] border border-[#d9ddd7] bg-[#f8f8f5] text-left shadow-[0_24px_48px_-30px_rgba(8,69,50,0.22)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_28px_54px_-28px_rgba(8,69,50,0.26)] active:scale-[0.995]"
                  onClick={() => setIsPreviewOpen(true)}
                  type="button"
                >
                  {isLocalPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={imageAlt}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015]"
                      loading="eager"
                      src={fileUrl}
                    />
                  ) : (
                    <Image
                      alt={imageAlt}
                      className="object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015]"
                      fill
                      loading="eager"
                      sizes={compact ? "(max-width: 768px) 100vw, 420px" : "(max-width: 1024px) 100vw, 58vw"}
                      src={fileUrl}
                    />
                  )}
                  <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,25,18,0.02),transparent_36%,rgba(12,25,18,0.34))]" />
                  <span className="pointer-events-none absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-white/50 bg-white/86 text-primary shadow-[0_18px_32px_-24px_rgba(8,69,50,0.38)] backdrop-blur-sm transition duration-500 group-hover:scale-[1.04]">
                    <Expand className="size-4" />
                  </span>
                </button>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center rounded-[1.35rem] px-5 py-8 text-center">
                  <span className="grid size-16 place-items-center rounded-[1.25rem] border border-[#dfe8e3] bg-white text-[#0a6a49] shadow-[0_18px_42px_-34px_rgba(8,69,50,0.28)] transition duration-500">
                    <Camera className="size-6" strokeWidth={1.9} />
                  </span>
                  <span className="mt-6 block font-body text-[1.05rem] font-black text-slate-900">
                    Belum ada bukti serah-terima
                  </span>
                  <span className="mt-2 block max-w-[28rem] font-body text-sm font-medium leading-7 text-[#64748b]">
                    Panel ini akan menampilkan foto setelah admin unit mengunggah dokumentasi barang.
                  </span>
                </div>
              )}

              {controls}
            </div>
          </div>
        </div>
      </section>

      {isPreviewOpen && fileUrl
        ? createPortal(
            <div
              aria-labelledby={previewTitleId}
              aria-modal="true"
              className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto overscroll-contain bg-[#071610]/78 px-3 py-3 backdrop-blur-md sm:px-6 sm:py-6"
              onClick={() => setIsPreviewOpen(false)}
              role="dialog"
            >
              <div
                className="modal-viewport relative w-full max-w-6xl rounded-[2rem] border border-white/24 bg-white p-2 shadow-[0_48px_120px_-42px_rgba(3,21,14,0.82)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="overflow-hidden rounded-[calc(2rem-0.5rem)] border border-black/5 bg-[#f7faf7]">
                  <div className="flex items-start justify-between gap-4 border-b border-black/6 bg-white px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#0a6a49]">
                        Bukti Serah Terima
                      </p>
                      <h3 className="mt-1 truncate font-headline text-[1.35rem] font-black tracking-tight text-[#13211c]">
                      <span id={previewTitleId}>
                        {itemTitle ?? "Dokumentasi barang"}
                      </span>
                      </h3>
                    </div>
                    <button
                      aria-label="Tutup preview bukti serah-terima barang"
                      className="grid size-11 shrink-0 place-items-center rounded-full border border-black/8 bg-white text-[#0a6a49] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f5f7f2] active:scale-[0.97]"
                      onClick={() => setIsPreviewOpen(false)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="relative media-preview-frame-fixed overflow-hidden rounded-[1.5rem] border border-black/6 bg-white shadow-[0_24px_60px_-36px_rgba(8,69,50,0.28)]">
                      {isLocalPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={imageAlt}
                          className="media-preview-frame-fixed w-full object-contain bg-[#f8f8f5]"
                          loading="eager"
                          src={fileUrl}
                        />
                      ) : (
                        <Image
                          alt={imageAlt}
                          className="object-contain"
                          fill
                          loading="eager"
                          sizes="100vw"
                          src={fileUrl}
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
    </>
  );
}
