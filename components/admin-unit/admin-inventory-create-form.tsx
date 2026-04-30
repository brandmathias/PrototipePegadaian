"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  FileVideo,
  Image as ImageIcon,
  LoaderCircle,
  PackagePlus,
  UploadCloud,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ADMIN_BARANG_MEDIA_LIMIT } from "@/lib/admin-unit/validation";
import { cn } from "@/lib/utils";

type MediaPreview = {
  id: string;
  file: File;
  previewUrl: string;
};

function dateAfter(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function FieldLabel({
  children,
  htmlFor
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/50 sm:text-xs"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

function PanelTitle({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-black/8 px-5 py-5 sm:px-6">
      <h3 className="font-headline text-[1.55rem] font-black text-black/85 sm:text-[1.8rem]">
        {title}
      </h3>
      {description ? <p className="mt-1 text-sm leading-6 text-black/60 sm:text-base">{description}</p> : null}
    </div>
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function isSupportedMedia(file: File) {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

export function AdminInventoryCreateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRef = useRef<MediaPreview[]>([]);
  const [media, setMedia] = useState<MediaPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultPawnedAt = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultDueDate = useMemo(() => dateAfter(30), []);

  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  useEffect(() => {
    return () => {
      mediaRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  function addFiles(files: File[]) {
    const supported = files.filter(isSupportedMedia);
    const rejectedCount = files.length - supported.length;
    const remainingSlots = ADMIN_BARANG_MEDIA_LIMIT - media.length;

    if (rejectedCount > 0) {
      toast({
        title: "Sebagian file belum bisa dipakai",
        description: "Gunakan file foto atau video agar bisa disimpan sebagai media barang.",
        variant: "error",
        scope: "admin-unit"
      });
    }

    if (remainingSlots <= 0) {
      toast({
        title: "Batas media sudah penuh",
        description: `Satu barang maksimal memiliki ${ADMIN_BARANG_MEDIA_LIMIT} foto atau video.`,
        variant: "error",
        scope: "admin-unit"
      });
      return;
    }

    if (supported.length > remainingSlots) {
      toast({
        title: "Sebagian media tidak ditambahkan",
        description: `Batas upload adalah ${ADMIN_BARANG_MEDIA_LIMIT} foto atau video per barang.`,
        variant: "info",
        scope: "admin-unit"
      });
    }

    const next = supported.slice(0, remainingSlots).map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setMedia((current) => {
      const currentSlots = ADMIN_BARANG_MEDIA_LIMIT - current.length;
      const safeNext = next.slice(0, currentSlots);
      next.slice(currentSlots).forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [...current, ...safeNext];
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function removeMedia(id: string) {
    setMedia((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((item) => item.id !== id);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (media.length === 0) {
      toast({
        title: "Tambahkan minimal satu media",
        description: "Foto utama membantu admin dan pembeli memahami kondisi barang sejak awal.",
        variant: "error",
        scope: "admin-unit"
      });
      fileInputRef.current?.focus();
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.delete("media");
    media.forEach((item) => formData.append("media", item.file));

    setIsSubmitting(true);
    toast({
      title: "Menyimpan barang dan media",
      description: "File sedang diunggah, lalu data barang akan dicatat ke unit Anda.",
      variant: "info",
      scope: "admin-unit",
      duration: 2600
    });

    try {
      const response = await fetch("/api/admin/barang", {
        method: "POST",
        body: formData
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message ?? "Barang belum berhasil disimpan.");
      }

      toast({
        title: "Barang gadai tersimpan",
      description: "Data barang dan media pendukung sudah masuk ke daftar barang jaminan unit.",
        variant: "success",
        scope: "admin-unit"
      });
      router.push("/admin/barang");
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
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]" onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-black/10 bg-white">
        <PanelTitle
          description="Data awal ini menjadi dasar sebelum barang jaminan dipasarkan ke katalog."
          title="Data Barang"
        />
        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <FieldLabel htmlFor="name">Nama barang</FieldLabel>
            <Input
              className="h-12 text-sm sm:text-base"
              id="name"
              name="name"
              placeholder="Contoh: Kalung Emas 24K 10 gram"
              required
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="category">Kategori</FieldLabel>
            <select
              className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
              defaultValue="emas"
              id="category"
              name="category"
              required
            >
              <option value="emas">Emas</option>
              <option value="perhiasan">Perhiasan</option>
              <option value="logam_mulia">Logam Mulia</option>
              <option value="elektronik">Elektronik</option>
              <option value="kendaraan">Kendaraan</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="condition">Kondisi</FieldLabel>
            <select
              className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
              defaultValue="baik"
              id="condition"
              name="condition"
              required
            >
              <option value="baik">Baik</option>
              <option value="cukup">Cukup</option>
              <option value="rusak_ringan">Rusak ringan</option>
            </select>
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="appraisalValue">Nilai taksiran</FieldLabel>
            <Input className="h-12 text-sm sm:text-base" id="appraisalValue" min={1} name="appraisalValue" placeholder="0" required type="number" />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="loanValue">Nilai gadai</FieldLabel>
            <Input className="h-12 text-sm sm:text-base" id="loanValue" min={1} name="loanValue" placeholder="0" required type="number" />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="pawnedAt">Tanggal gadai</FieldLabel>
            <Input className="h-12 text-sm sm:text-base" defaultValue={defaultPawnedAt} id="pawnedAt" name="pawnedAt" required type="date" />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="dueDate">Tanggal jatuh tempo</FieldLabel>
            <Input className="h-12 text-sm sm:text-base" defaultValue={defaultDueDate} id="dueDate" name="dueDate" required type="date" />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="ownerName">Nama penggadai</FieldLabel>
            <Input className="h-12 text-sm sm:text-base" id="ownerName" name="ownerName" placeholder="Nama nasabah" required />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="customerNumber">Nomor nasabah</FieldLabel>
            <Input className="h-12 text-sm sm:text-base" id="customerNumber" name="customerNumber" placeholder="ID nasabah" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <FieldLabel htmlFor="description">Deskripsi barang</FieldLabel>
            <Textarea
              className="min-h-40 text-sm sm:text-base"
              id="description"
              name="description"
              placeholder="Jelaskan kondisi fisik, spesifikasi, kelengkapan, dan catatan appraisal."
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-dashed border-[#93c7b0] bg-[#f1faf5] p-6">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-white text-[#0a6a49] shadow-sm">
            <UploadCloud className="size-6" />
          </div>
          <h3 className="mt-4 font-headline text-2xl font-black text-[#0a6a49]">Upload Media Barang</h3>
          <p className="mt-2 text-sm leading-7 text-black/70 sm:text-base">
            Tambahkan foto atau video pendukung. Batas upload adalah {ADMIN_BARANG_MEDIA_LIMIT} media per barang.
          </p>
          <input
            accept="image/*,video/*"
            className="sr-only"
            id="media"
            multiple
            name="media"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
          <div
            className={cn(
              "mt-4 rounded-2xl border border-dashed border-[#93c7b0] bg-white p-8 text-center text-sm text-black/60 transition-all sm:text-base",
              isDragging && "scale-[1.01] border-[#0a6a49] bg-[#e7f7ee] text-[#0a6a49]"
            )}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDrop={handleDrop}
          >
            <button
              className="mx-auto inline-flex items-center gap-2 rounded-2xl bg-[#0a6a49] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#064d36]"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <UploadCloud className="size-4" />
              Pilih foto atau video
            </button>
            <p className="mt-3">atau seret file ke area ini</p>
            <p className="mt-1 text-xs text-black/45">
              {media.length}/{ADMIN_BARANG_MEDIA_LIMIT} media terpilih
            </p>
          </div>

          {media.length > 0 ? (
            <div className="mt-4 space-y-3">
              {media.map((item) => {
                const isVideo = item.file.type.startsWith("video/");
                const Icon = isVideo ? FileVideo : ImageIcon;

                return (
                  <div
                    className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-3"
                    key={item.id}
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#eef5f1] text-[#0a6a49]">
                      {isVideo ? (
                        <Icon className="size-5" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" className="size-full object-cover" src={item.previewUrl} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-black/80">{item.file.name}</p>
                      <p className="text-xs text-black/50">
                        {isVideo ? "Video" : "Foto"} - {formatFileSize(item.file.size)}
                      </p>
                    </div>
                    <button
                      aria-label={`Hapus ${item.file.name}`}
                      className="rounded-full p-2 text-black/50 transition hover:bg-black/5 hover:text-black"
                      onClick={() => removeMedia(item.id)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <Card className="rounded-2xl border border-black/10">
          <CardHeader>
            <CardTitle className="text-xl">Checklist sebelum simpan</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Pastikan data inti sudah aman sebelum barang disimpan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-black/70 sm:text-base">
            <p>- Minimal satu media tersedia, maksimal {ADMIN_BARANG_MEDIA_LIMIT} foto atau video.</p>
            <p>- Nilai gadai tidak boleh melebihi nilai taksiran.</p>
            <p>- Tanggal jatuh tempo harus berada setelah tanggal gadai.</p>
            <p>- Setelah disimpan, barang akan masuk sebagai barang jaminan yang siap dipasarkan.</p>
          </CardContent>
        </Card>

        <Button className="h-12 w-full rounded-2xl text-sm sm:text-base" disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Menyimpan barang...
            </>
          ) : (
            <>
              <PackagePlus className="size-4" />
              Simpan Barang Gadai
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
