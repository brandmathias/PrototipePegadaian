"use client";

import { ChangeEvent, useRef, useState } from "react";
import { FileVideo, Image as ImageIcon, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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
      title: "Mengunggah media",
      description: "Foto atau video sedang disimpan ke data barang.",
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
        description: "Galeri barang sudah diperbarui.",
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
            return (
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white" key={item.id}>
                <div className="aspect-video bg-[#edf3ef]">
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
        disabled={isUploading || remainingSlots === 0}
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
    </div>
  );
}
