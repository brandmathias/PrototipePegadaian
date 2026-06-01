"use client";

import { ChangeEvent, useRef, useState } from "react";
import { LoaderCircle, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";

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

function isSupportedMedia(file: File) {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

export function AdminBarangMediaManager({
  barangId,
  media
}: {
  barangId: string;
  media: AdminBarangMedia[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminBarangMedia | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const remainingSlots = Math.max(0, ADMIN_BARANG_MEDIA_LIMIT - media.length);
  const activeMedia = media[activeIndex] ?? media[0] ?? null;

  async function uploadFiles(files: File[]) {
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

    if (supported.length > remainingSlots) {
      toast({
        title: "Batas media terlampaui",
        description: `Sisa slot media hanya ${remainingSlots}. Total media per barang maksimal ${ADMIN_BARANG_MEDIA_LIMIT}.`,
        variant: "error",
        scope: "admin-unit"
      });
      return;
    }

    const formData = new FormData();
    supported.forEach((file) => formData.append("media", file));
    setIsUploading(true);
    toast({
      title: "Mengunggah media barang",
      description: "Foto atau video sedang ditambahkan ke galeri. Tetap di halaman ini sebentar.",
      variant: "info",
      scope: "admin-unit",
      duration: 2600
    });

    try {
      const response = await fetch(`/api/admin/barang/${barangId}/media`, {
        method: "POST",
        body: formData
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message ?? "Media belum berhasil diunggah.");
      }

      toast({
        title: "Media berhasil ditambahkan",
        description: "Galeri barang sudah diperbarui dan siap ditinjau sebelum tayang.",
        variant: "success",
        scope: "admin-unit"
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Upload belum berhasil",
        description: error instanceof Error ? error.message : "Coba ulangi beberapa saat lagi.",
        variant: "error",
        scope: "admin-unit",
        duration: 5600
      });
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void uploadFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  async function deleteMedia(target: AdminBarangMedia | null) {
    if (!target) {
      return;
    }

    setDeletingId(target.id);
    toast({
      title: "Menghapus media dari galeri",
      description: "Sebentar, kami sedang merapikan galeri barang ini.",
      variant: "info",
      scope: "admin-unit",
      duration: 2200
    });

    try {
      const response = await fetch(`/api/admin/barang/${barangId}/media/${target.id}`, {
        method: "DELETE"
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message ?? "Media belum berhasil dihapus.");
      }

      toast({
        title: "Media dihapus",
        description: "Galeri barang sudah diperbarui. Anda masih bisa menambahkan media pengganti bila diperlukan.",
        variant: "success",
        scope: "admin-unit"
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Media belum terhapus",
        description: error instanceof Error ? error.message : "Coba ulangi setelah memastikan koneksi dan hak akses aktif.",
        variant: "error",
        scope: "admin-unit",
        duration: 5600
      });
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <input
        accept="image/*,video/*"
        className="sr-only"
        disabled={isUploading || remainingSlots === 0}
        multiple
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />

      {media.length > 0 ? (
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
                  disabled={isUploading || Boolean(deletingId)}
                  onClick={() => setPendingDelete(activeMedia)}
                  type="button"
                >
                  {deletingId === activeMedia.id ? <LoaderCircle className="size-4 animate-spin" /> : <X className="size-4" />}
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[0.72rem] font-black text-slate-800">Galeri Media</p>
            <div className="grid grid-cols-5 gap-2">
              {media.map((item, index) => {
                const isVideo = item.type === "video" || item.url.match(/\.(mp4|mov|webm)$/i);
                const isDeleting = deletingId === item.id;
                const active = (media[activeIndex] ?? media[0])?.id === item.id;
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
                      disabled={isUploading || Boolean(deletingId)}
                      onClick={() => setPendingDelete(item)}
                      type="button"
                    >
                      {isDeleting ? <LoaderCircle className="size-3 animate-spin" /> : <X className="size-3" />}
                    </button>
                  </div>
                );
              })}
              {remainingSlots > 0 ? (
                <button
                  aria-label="Tambah Foto / Video"
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 bg-white text-[0.62rem] font-black uppercase tracking-[0.08em] text-slate-400 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#006747] hover:text-[#006747] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isUploading || Boolean(deletingId)}
                  onClick={() => inputRef.current?.click()}
                  type="button"
                >
                  {isUploading ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                  Add
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[0.68rem] font-black uppercase tracking-[0.1em] text-slate-500">
              <span>Keterangan Galeri</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[#006747]">
                {media.length}/{ADMIN_BARANG_MEDIA_LIMIT} Media Terpilih
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#006747] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${(media.length / ADMIN_BARANG_MEDIA_LIMIT) * 100}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-dashed border-[#9fd0bb] bg-[#f1faf5] p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0a6a49] shadow-sm">
                {isUploading ? <LoaderCircle className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0a6a49]">
                  {media.length}/{ADMIN_BARANG_MEDIA_LIMIT} media tersimpan
                </p>
                <p className="mt-1 text-sm leading-6 text-black/65">
                  Tambahkan foto atau video pendukung sebelum barang ditayangkan. Sisa slot: {remainingSlots}.
                </p>
              </div>
            </div>
          </div>

          <Button
            className="w-full rounded-xl"
            disabled={isUploading || Boolean(deletingId) || remainingSlots === 0}
            onClick={() => inputRef.current?.click()}
            type="button"
            variant="secondary"
          >
            {isUploading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Mengunggah media...
              </>
            ) : (
              <>
                <UploadCloud className="size-4" />
                Tambah Foto / Video
              </>
            )}
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
        loading={Boolean(deletingId)}
        onConfirm={() => void deleteMedia(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
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
