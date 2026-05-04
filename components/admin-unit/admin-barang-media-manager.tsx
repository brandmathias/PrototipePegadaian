"use client";

import { ChangeEvent, useRef, useState } from "react";
import { FileVideo, Image as ImageIcon, LoaderCircle, UploadCloud, X } from "lucide-react";
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

function formatFileSize(size?: number) {
  const value = Number(size ?? 0);
  if (!value) {
    return "Ukuran belum tercatat";
  }
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
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
  const remainingSlots = Math.max(0, ADMIN_BARANG_MEDIA_LIMIT - media.length);

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

      <div className="rounded-2xl border border-dashed border-[#9fd0bb] bg-[#f1faf5] p-5">
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

      {media.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {media.map((item) => {
            const isVideo = item.type === "video" || item.url.match(/\.(mp4|mov|webm)$/i);
            const isDeleting = deletingId === item.id;
            return (
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white" key={item.id}>
                <div className="relative aspect-video bg-[#edf3ef]">
                  <button
                    aria-label={`Hapus ${item.fileName || "media barang"}`}
                    className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/95 text-black shadow-sm transition hover:scale-105 hover:bg-[#fff0f0] hover:text-[#9f1239] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isUploading || Boolean(deletingId)}
                    onClick={() => setPendingDelete(item)}
                    type="button"
                  >
                    {isDeleting ? <LoaderCircle className="size-4 animate-spin" /> : <X className="size-4" />}
                  </button>
                  {isVideo ? (
                    <video className="size-full object-cover" controls src={item.url} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={item.fileName || "Foto barang"} className="size-full object-cover" src={item.url} />
                  )}
                </div>
                <div className="flex items-center gap-2 p-3 text-xs text-black/55">
                  {isVideo ? <FileVideo className="size-4 text-[#0a6a49]" /> : <ImageIcon className="size-4 text-[#0a6a49]" />}
                  <span className="min-w-0 flex-1 truncate">{item.fileName || item.url}</span>
                  <span>{formatFileSize(item.sizeBytes)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <Button
        className="w-full rounded-2xl"
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
