"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
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
  itemTitle,
  proof
}: HandoverProofCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const titleId = useId();
  const previewTitleId = `${titleId}-preview`;
  const fileUrl = proof?.fileUrl || null;
  const location = displayValue(proof?.location, "Loket unit");
  const uploadedAt = displayValue(proof?.uploadedAt, "Menunggu dokumentasi");
  const uploadedBy = displayValue(proof?.uploadedBy, "Admin Unit");
  const imageAlt = `Bukti serah-terima barang ${itemTitle ?? "transaksi"}`;

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
          "overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_18px_42px_-36px_rgba(8,69,50,0.26)]",
          "border-l-4 border-l-[#0a6a49]",
          className
        )}
      >
        <div className={cn("grid grid-cols-1 items-stretch gap-5", compact ? "xl:grid-cols-1" : "lg:grid-cols-12")}>
          <div className={cn("flex flex-col justify-between gap-4", compact ? "" : "lg:col-span-5")}>
            <div className="divide-y divide-slate-100">
              <div className="flex items-start gap-3.5 pb-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-100 bg-slate-50 text-[#0a6a49]">
                  <Camera className="size-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <h3
                    className="text-xs font-black tracking-tight text-slate-950"
                    id={titleId}
                  >
                    Dokumentasi Serah Terima Barang Fisik
                  </h3>
                  <p className="mt-0.5 text-[11px] font-medium leading-normal text-slate-500">
                    {getAudienceSubtitle(audience)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-100 bg-slate-50 text-[#0a6a49]">
                  <CalendarDays className="size-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Waktu Penyerahan
                  </span>
                  <span className="mt-0.5 block break-words text-xs font-black tracking-tight text-slate-800">
                    {uploadedAt}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-100 bg-slate-50 text-[#0a6a49]">
                  <MapPin className="size-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Lokasi Loket Unit
                  </span>
                  <span className="mt-0.5 block break-words text-xs font-black tracking-tight text-slate-800">
                    {location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-100 bg-slate-50 text-[#0a6a49]">
                  <ShieldCheck className="size-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Diunggah Oleh
                  </span>
                  <span className="mt-0.5 block break-words text-xs font-black tracking-tight text-slate-800">
                    {uploadedBy}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[10px] font-medium leading-normal text-slate-500">
              <Info className="mt-0.5 size-3.5 shrink-0 text-slate-300" />
              <p>
                {fileUrl
                  ? "Foto ini tersimpan sebagai bukti serah-terima fisik barang."
                  : "Menunggu admin unit mengunggah bukti serah-terima barang."}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "relative min-h-[180px] overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100",
              compact ? "" : "lg:col-span-7 lg:min-h-[220px]"
            )}
          >
            {fileUrl ? (
              <button
                aria-label="Buka fullscreen bukti serah-terima barang"
                className="group relative block h-full min-h-[180px] w-full overflow-hidden text-left"
                onClick={() => setIsPreviewOpen(true)}
                type="button"
              >
                <Image
                  alt={imageAlt}
                  className="object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015]"
                  fill
                  sizes={compact ? "(max-width: 768px) 100vw, 420px" : "(max-width: 1024px) 100vw, 58vw"}
                  src={fileUrl}
                />
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,20,14,0.02),transparent_36%,rgba(5,20,14,0.24))]" />
                <span className="pointer-events-none absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-white/55 bg-white/90 text-[#0a6a49] shadow-[0_16px_32px_-22px_rgba(8,69,50,0.46)] transition duration-300 group-hover:scale-[1.04]">
                  <Expand className="size-4" />
                </span>
              </button>
            ) : (
              <div className="flex h-full min-h-[180px] flex-col items-center justify-center bg-[linear-gradient(135deg,#f8faf8,#eef3ef)] px-6 text-center">
                <span className="grid size-14 place-items-center rounded-2xl border border-[#dce7df] bg-white text-[#0a6a49] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <Camera className="size-6" strokeWidth={1.8} />
                </span>
                <p className="mt-4 text-sm font-black text-slate-800">Belum ada bukti serah-terima</p>
                <p className="mt-1 max-w-[18rem] text-xs leading-5 text-slate-500">
                  Panel ini akan menampilkan foto setelah admin unit mengunggah dokumentasi barang.
                </p>
              </div>
            )}
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
                      <Image
                        alt={imageAlt}
                        className="object-contain"
                        fill
                        sizes="100vw"
                        src={fileUrl}
                      />
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
