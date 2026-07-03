"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ADMIN_BARANG_MEDIA_LIMIT } from "@/lib/admin-unit/validation";

type AdminBarangMedia = {
  id: string;
  type: string;
  url: string;
  fileName?: string;
  sizeBytes?: number;
};

export type AdminBarangMediaDraftChange = {
  addedFiles: File[];
  deletedMediaIds: string[];
};

type DraftMedia = AdminBarangMedia & {
  file?: File;
  isNew?: boolean;
};

function isSupportedMedia(file: File) {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

function createPreviewUrl(file: File) {
  return typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : "";
}

function revokePreviewUrl(url: string) {
  if (typeof URL.revokeObjectURL === "function" && url) {
    URL.revokeObjectURL(url);
  }
}

export function AdminBarangMediaManager({
  barangId: _barangId,
  disabled = false,
  media,
  onDraftChange
}: {
  barangId: string;
  disabled?: boolean;
  media: AdminBarangMedia[];
  onDraftChange?: (change: AdminBarangMediaDraftChange) => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const draftMediaRef = useRef<DraftMedia[]>(media);
  const [draftMedia, setDraftMedia] = useState<DraftMedia[]>(media);
  const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<AdminBarangMedia | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const remainingSlots = Math.max(0, ADMIN_BARANG_MEDIA_LIMIT - draftMedia.length);
  const activeMedia = draftMedia[activeIndex] ?? draftMedia[0] ?? null;

  useEffect(() => {
    draftMediaRef.current = draftMedia;
  }, [draftMedia]);

  useEffect(() => {
    return () => {
      draftMediaRef.current.forEach((item) => {
        if (item.isNew) {
          revokePreviewUrl(item.url);
        }
      });
    };
  }, []);

  function emitDraftChange(nextMedia: DraftMedia[], nextDeletedMediaIds: string[]) {
    onDraftChange?.({
      addedFiles: nextMedia.flatMap((item) => (item.isNew && item.file ? [item.file] : [])),
      deletedMediaIds: nextDeletedMediaIds
    });
  }

  function applyDraft(nextMedia: DraftMedia[], nextDeletedMediaIds = deletedMediaIds) {
    setDraftMedia(nextMedia);
    setDeletedMediaIds(nextDeletedMediaIds);
    setActiveIndex((current) => Math.min(current, Math.max(0, nextMedia.length - 1)));
    emitDraftChange(nextMedia, nextDeletedMediaIds);
  }

  function uploadFiles(files: File[]) {
    const supported = files.filter(isSupportedMedia);

    if (supported.length === 0) {
      toast({
        title: "File belum sesuai",
        description: "Pilih foto atau video agar bisa disimpan sebagai media barang.",
        variant: "error",
        scope: "admin-unit"
      });
      return;
    }

    const safeFiles = supported.slice(0, remainingSlots);

    if (safeFiles.length === 0 || supported.length > remainingSlots) {
      toast({
        title: "Batas media terlampaui",
        description: `Sisa slot media hanya ${remainingSlots}. Total media per barang maksimal ${ADMIN_BARANG_MEDIA_LIMIT}.`,
        variant: "error",
        scope: "admin-unit"
      });
      return;
    }

    const nextMedia = [
      ...draftMedia,
      ...safeFiles.map((file) => ({
        id: `draft-${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        type: file.type.startsWith("video/") ? "video" : "foto",
        url: createPreviewUrl(file),
        fileName: file.name,
        sizeBytes: file.size,
        file,
        isNew: true
      }))
    ];

    applyDraft(nextMedia);
    toast({
      title: "Media masuk draft",
      description: "Galeri baru akan tersimpan setelah Anda menekan Simpan Perubahan.",
      variant: "info",
      scope: "admin-unit",
      duration: 2600
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    uploadFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function deleteMedia(target: AdminBarangMedia | null) {
    if (!target) {
      return;
    }

    const draftTarget = draftMedia.find((item) => item.id === target.id);
    const nextMedia = draftMedia.filter((item) => item.id !== target.id);
    const nextDeletedMediaIds = draftTarget?.isNew
      ? deletedMediaIds
      : Array.from(new Set([...deletedMediaIds, target.id]));

    if (draftTarget?.isNew) {
      revokePreviewUrl(draftTarget.url);
    }

    applyDraft(nextMedia, nextDeletedMediaIds);
    setPendingDelete(null);
    toast({
      title: "Media masuk daftar perubahan",
      description: "Penghapusan media baru akan tersimpan setelah Anda menekan Simpan Perubahan.",
      variant: "info",
      scope: "admin-unit",
      duration: 2600
    });
  }

  return (
    <div className="space-y-4">
      <input
        accept="image/*,video/*"
        className="sr-only"
        disabled={disabled || remainingSlots === 0}
        multiple
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />

      {draftMedia.length > 0 ? (
        <>
          <div className="space-y-2">
            <p className="text-[0.72rem] font-black text-slate-800">Preview Utama</p>
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <div className="aspect-[16/8.1]">
                {activeMedia ? (
                  activeMedia.type === "video" || activeMedia.url.match(/\.(mp4|mov|webm)$/i) ? (
                    <video className="size-full object-cover" controls src={activeMedia.url} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={activeMedia.fileName || "Foto barang"} className="size-full object-cover" src={activeMedia.url} />
                  )
                ) : null}
              </div>
              {activeMedia ? (
                <button
                  aria-label={`Hapus ${activeMedia.fileName || "media barang"}`}
                  className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/95 text-slate-700 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.5)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 hover:bg-[#fff0f0] hover:text-[#9f1239] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={disabled}
                  onClick={() => setPendingDelete(activeMedia)}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[0.72rem] font-black text-slate-800">Galeri Media</p>
            <div className="grid grid-cols-5 gap-2">
              {draftMedia.map((item, index) => {
                const isVideo = item.type === "video" || item.url.match(/\.(mp4|mov|webm)$/i);
                const active = (draftMedia[activeIndex] ?? draftMedia[0])?.id === item.id;
                return (
                  <div className="relative" key={item.id}>
                    <button
                      aria-label={`Tampilkan ${item.fileName || "media barang"}`}
                      className={`group relative aspect-square w-full overflow-hidden rounded-lg border-2 bg-slate-50 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        active ? "border-[#006747] shadow-[0_12px_24px_-22px_rgba(0,103,71,0.58)]" : "border-slate-200 hover:border-emerald-300"
                      }`}
                      onClick={() => setActiveIndex(index)}
                      type="button"
                    >
                      {isVideo ? (
                        <video className="size-full object-cover" muted playsInline src={item.url} />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={item.fileName || "Foto barang"} className="size-full object-cover" src={item.url} />
                      )}
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-1.5 py-1 text-left text-[0.58rem] font-black uppercase tracking-[0.08em] text-white opacity-0 transition group-hover:opacity-100">
                        {isVideo ? "Video" : "Foto"}
                      </span>
                    </button>
                    <button
                      aria-label={`Hapus thumbnail ${item.fileName || "media barang"}`}
                      className="absolute right-1 top-1 z-10 grid size-5 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm transition hover:scale-105 hover:text-[#9f1239]"
                      disabled={disabled}
                      onClick={() => setPendingDelete(item)}
                      type="button"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                );
              })}
              {remainingSlots > 0 ? (
                <button
                  aria-label="Tambah Foto / Video"
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 bg-white text-[0.62rem] font-black uppercase tracking-[0.08em] text-slate-400 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#006747] hover:text-[#006747] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={disabled}
                  onClick={() => inputRef.current?.click()}
                  type="button"
                >
                  <UploadCloud className="size-4" />
                  Add
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[0.68rem] font-black uppercase tracking-[0.1em] text-slate-500">
              <span>Keterangan Galeri</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[#006747]">
                {draftMedia.length}/{ADMIN_BARANG_MEDIA_LIMIT} Media Terpilih
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#006747] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${(draftMedia.length / ADMIN_BARANG_MEDIA_LIMIT) * 100}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-dashed border-[#9fd0bb] bg-[#f1faf5] p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0a6a49] shadow-sm">
                <UploadCloud className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0a6a49]">
                  {draftMedia.length}/{ADMIN_BARANG_MEDIA_LIMIT} media tersimpan
                </p>
                <p className="mt-1 text-sm leading-6 text-black/65">
                  Tambahkan foto atau video pendukung sebelum barang ditayangkan. Sisa slot: {remainingSlots}.
                </p>
              </div>
            </div>
          </div>

          <Button
            className="w-full rounded-xl"
            disabled={disabled || remainingSlots === 0}
            onClick={() => inputRef.current?.click()}
            type="button"
            variant="secondary"
          >
            <UploadCloud className="size-4" />
            Tambah Foto / Video
          </Button>
        </>
      )}

      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel="Ya, hapus media"
        description={
          pendingDelete
            ? `Media ${pendingDelete.fileName ? `"${pendingDelete.fileName}"` : "ini"} akan dilepas dari galeri barang. Data barang tetap aman, dan Anda masih bisa mengunggah media pengganti selama slot tersedia.`
            : "Media akan dilepas dari galeri barang."
        }
        loading={false}
        onConfirm={() => deleteMedia(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        open={Boolean(pendingDelete)}
        title="Hapus media dari barang?"
        variant="destructive"
      />
    </div>
  );
}
