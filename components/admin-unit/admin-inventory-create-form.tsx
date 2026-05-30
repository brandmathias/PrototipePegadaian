"use client";

import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CarFront,
  CalendarDays,
  Check,
  Circle,
  Expand,
  Gem,
  LockKeyhole,
  LoaderCircle,
  Medal,
  MonitorSmartphone,
  Package2,
  PackagePlus,
  PlayCircle,
  Plus,
  UploadCloud,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { getBarangSpecificationFields } from "@/lib/admin-unit/specifications";
import { ADMIN_BARANG_MEDIA_LIMIT } from "@/lib/admin-unit/validation";
import { cn } from "@/lib/utils";

type MediaPreview = {
  id: string;
  file: File;
  previewUrl: string;
};

type ChecklistState = {
  hasMedia: boolean;
  hasCoreData: boolean;
  hasValidDates: boolean;
  hasSpecifications: boolean;
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
      className="block text-[0.64rem] font-black uppercase tracking-[0.16em] text-slate-500"
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
    <div className="border-b border-slate-100 px-6 pb-4 pt-5 sm:px-8">
      <h3 className="font-headline text-xl font-black tracking-[-0.02em] text-slate-950">
        {title}
      </h3>
      {description ? <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{description}</p> : null}
    </div>
  );
}

function isSupportedMedia(file: File) {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

function FormInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={cn(
        "h-11 rounded-xl border-transparent bg-slate-50 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus-visible:border-[#006747] focus-visible:bg-white focus-visible:ring-[#006747]/10",
        className
      )}
    />
  );
}

function DateInput(props: React.ComponentProps<typeof Input>) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-transparent bg-slate-50 transition focus-within:border-[#006747] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#006747]/10">
      <Input
        {...props}
        className="h-11 flex-1 border-0 bg-transparent px-3 text-xs font-semibold text-slate-700 shadow-none focus-visible:ring-0"
        type="date"
      />
      <span className="flex items-center border-l border-slate-200/60 bg-slate-100/50 px-3 text-slate-400">
        <CalendarDays className="size-3.5" />
      </span>
    </div>
  );
}

function MoneyInput(props: React.ComponentProps<typeof Input>) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-transparent bg-slate-50 transition focus-within:border-[#006747] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#006747]/10">
      <Input
        {...props}
        className="h-11 flex-1 border-0 bg-transparent px-3 text-xs font-bold text-slate-800 shadow-none focus-visible:ring-0"
        type="number"
      />
      <span className="flex items-center border-l border-slate-200/60 bg-slate-100/50 px-3.5 text-[0.64rem] font-black uppercase tracking-[0.08em] text-slate-400">
        Rp
      </span>
    </div>
  );
}

function CategorySegments({
  value,
  onChange
}: {
  value: (typeof categoryOptions)[number]["value"];
  onChange: (nextValue: (typeof categoryOptions)[number]["value"]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>Kategori</FieldLabel>
      <input name="category" type="hidden" value={value} />
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-5" role="radiogroup" aria-label="Kategori">
        {categoryOptions.map((option) => {
          const Icon = option.icon;
          const active = option.value === value;

          return (
            <button
              aria-checked={active}
              aria-label={option.label}
              className={cn(
                "group flex h-14 items-center justify-center gap-2 border-slate-200 px-3 text-xs font-bold transition duration-200 first:border-l-0 sm:border-l",
                active
                  ? "bg-emerald-50/50 text-[#006747] ring-1 ring-inset ring-[#006747]"
                  : "bg-white text-slate-600 hover:bg-slate-50 hover:text-[#006747]"
              )}
              key={option.value}
              onClick={() => onChange(option.value)}
              role="radio"
              type="button"
            >
              <Icon className={cn("size-4", active ? "text-[#006747]" : "text-slate-400 group-hover:text-[#006747]")} />
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConditionSegments({
  value,
  onChange
}: {
  value: (typeof conditionOptions)[number]["value"];
  onChange: (nextValue: (typeof conditionOptions)[number]["value"]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>Kondisi</FieldLabel>
      <input name="condition" type="hidden" value={value} />
      <div className="grid gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Kondisi">
        {conditionOptions.map((option) => {
          const active = option.value === value;

          return (
            <button
              aria-checked={active}
              aria-label={option.label}
              className={cn(
                "flex h-12 items-center justify-between rounded-xl border px-4 text-xs font-bold transition duration-200",
                active
                  ? "border-[#006747] bg-emerald-50/35 text-[#006747]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
              key={option.value}
              onClick={() => onChange(option.value)}
              role="radio"
              type="button"
            >
              <span>{option.label}</span>
              {active ? <Check className="size-4 stroke-[3]" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AdminMediaUploadGallery({
  activeMedia,
  activeIndex,
  isDragging,
  media,
  onAddClick,
  onDrop,
  onDragLeave,
  onDragOver,
  onOpenPreview,
  onRemove,
  onSelect
}: {
  activeMedia: MediaPreview | null;
  activeIndex: number;
  isDragging: boolean;
  media: MediaPreview[];
  onAddClick: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onOpenPreview: () => void;
  onRemove: (id: string) => void;
  onSelect: (index: number) => void;
}) {
  const activeIsVideo = activeMedia?.file.type.startsWith("video/");
  const secondaryMedia = media
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.index !== activeIndex)
    .slice(0, 4);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_4px_25px_rgba(0,0,0,0.012)]">
      <h3 className="px-1 font-headline text-base font-black tracking-[-0.01em] text-[#004A23]">Upload Media Barang</h3>
      <div
        className={cn(
          "mt-4 overflow-hidden rounded-2xl border-2 border-dashed border-emerald-500/25 bg-emerald-50/5 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isDragging && "scale-[1.01] ring-2 ring-[#006747]/30"
        )}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="relative overflow-hidden rounded-[calc(1rem-2px)] bg-[linear-gradient(180deg,#f4f6f2,#eef2ec)]">
          {activeMedia ? (
            <div
              aria-label="Buka preview penuh media barang"
              className="group block w-full overflow-hidden rounded-[calc(1rem-2px)] text-left outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-[#006747]/25"
              onClick={onOpenPreview}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenPreview();
                }
              }}
              role="button"
              tabIndex={0}
            >
              {activeIsVideo ? (
                <video
                  aria-label={`Preview media barang ${activeIndex + 1}`}
                  className="h-48 w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  src={activeMedia.previewUrl}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`Preview media barang ${activeIndex + 1}`}
                  className="h-48 w-full object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015]"
                  src={activeMedia.previewUrl}
                />
              )}
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_42%,rgba(7,28,20,0.16))]" />
              <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1.5 text-[0.64rem] font-bold text-[#0d573e] shadow-[0_14px_28px_-22px_rgba(8,69,50,0.42)]">
                {activeIsVideo ? <PlayCircle className="size-3.5" /> : <UploadCloud className="size-3.5" />}
                {activeIsVideo ? "Video Preview" : "360 View"}
              </span>
              <span
                aria-hidden="true"
                className="absolute bottom-3 left-3 grid size-9 place-items-center rounded-full bg-white/92 text-[#174e3b] shadow-[0_14px_28px_-22px_rgba(8,69,50,0.42)]"
              >
                <Expand className="size-4" />
              </span>
              <button
                aria-label={`Hapus ${activeMedia.file.name}`}
                className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/92 text-red-600 shadow-[0_14px_28px_-22px_rgba(8,69,50,0.42)] transition hover:-translate-y-0.5 hover:bg-red-50"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(activeMedia.id);
                }}
                type="button"
              >
                <X className="size-4" />
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-3 text-[0.64rem] font-bold text-[#17633f]">
                <span>{String(activeIndex + 1).padStart(2, "0")}</span>
                <span className="relative h-px w-20 overflow-hidden rounded-full bg-white/75">
                  <span
                    className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[#17633f] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ transform: `scaleX(${media.length ? (activeIndex + 1) / media.length : 0})` }}
                  />
                </span>
                <span>{String(media.length).padStart(2, "0")}</span>
              </div>
            </div>
          ) : (
            <button
              className="flex h-48 w-full flex-col items-center justify-center px-5 text-center transition hover:bg-white/30"
              onClick={onAddClick}
              type="button"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-[#006747]">
                <UploadCloud className="size-5" />
              </span>
              <span className="mt-4 block text-xs font-extrabold text-slate-900">Drag & drop foto di sini</span>
              <span className="mt-1 block text-[0.64rem] font-semibold leading-5 text-slate-500">
                atau klik untuk memilih file
                <br />
                JPG, PNG maks. 5MB
              </span>
              <span className="mt-3 block text-[0.64rem] font-black uppercase tracking-[0.16em] text-slate-400">
                {media.length}/{ADMIN_BARANG_MEDIA_LIMIT} media terpilih
              </span>
            </button>
          )}
        </div>
      </div>

      {media.length > 0 ? (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {secondaryMedia.map(({ item, index }) => {
              const isVideo = item.file.type.startsWith("video/");

              return (
                <div
                  aria-label={`Lihat media barang ${index + 1}`}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-xl border border-transparent bg-[#f2f4f0] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-white hover:ring-1 hover:ring-[#dfe7de]"
                  )}
                  key={item.id}
                  onClick={() => onSelect(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(index);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {isVideo ? (
                    <div className="flex size-full flex-col items-center justify-center gap-1 bg-[#0d1712] text-white">
                      <PlayCircle className="size-4" />
                      <span className="text-[0.55rem] font-black uppercase tracking-[0.08em]">Video</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.025]" src={item.previewUrl} />
                  )}
                  <button
                    aria-label={`Hapus ${item.file.name}`}
                    className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemove(item.id);
                    }}
                    type="button"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              );
            })}
            {media.length < ADMIN_BARANG_MEDIA_LIMIT ? (
              <button
                aria-label="Tambah media barang"
                className="flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 transition hover:-translate-y-0.5 hover:border-[#17633f] hover:text-[#17633f]"
                onClick={onAddClick}
                type="button"
              >
                <Plus className="size-5" />
                <span className="mt-1 text-[0.62rem] font-bold">Tambah</span>
              </button>
            ) : null}
        </div>
      ) : null}
      <p className="mt-3 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {media.length}/{ADMIN_BARANG_MEDIA_LIMIT} media terpilih
      </p>
    </div>
  );
}

function ChecklistItem({
  done,
  text
}: {
  done: boolean;
  text: string;
}) {
  return (
    <div className={cn("flex gap-3 transition", done ? "text-slate-700" : "text-slate-400")}>
      <span
        aria-label={`${done ? "Checklist selesai" : "Checklist belum selesai"}: ${text}`}
        className={cn(
          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full transition",
          done ? "bg-[#006747] text-white" : "border border-slate-300 bg-white text-slate-300"
        )}
      >
        {done ? <Check className="size-2.5 stroke-[3]" /> : <Circle className="size-2 fill-current" />}
      </span>
      <p>{text}</p>
    </div>
  );
}

const categoryOptions = [
  { value: "perhiasan", label: "Perhiasan", icon: Gem },
  { value: "logam_mulia", label: "Logam Mulia", icon: Medal },
  { value: "elektronik", label: "Elektronik", icon: MonitorSmartphone },
  { value: "kendaraan", label: "Kendaraan", icon: CarFront },
  { value: "lainnya", label: "Lainnya", icon: Package2 }
] as const;

const conditionOptions = [
  { value: "baik", label: "Baik" },
  { value: "cukup", label: "Cukup Baik" },
  { value: "rusak_ringan", label: "Rusak Ringan" }
] as const;

export function AdminInventoryCreateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRef = useRef<MediaPreview[]>([]);
  const [media, setMedia] = useState<MediaPreview[]>([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isMediaPreviewOpen, setIsMediaPreviewOpen] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistState>({
    hasMedia: false,
    hasCoreData: false,
    hasValidDates: false,
    hasSpecifications: false
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState<(typeof categoryOptions)[number]["value"]>("perhiasan");
  const [condition, setCondition] = useState<(typeof conditionOptions)[number]["value"]>("baik");

  const defaultPawnedAt = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultDueDate = useMemo(() => dateAfter(30), []);
  const specificationFields = useMemo(() => getBarangSpecificationFields(category), [category]);
  const activeMedia = media[activeMediaIndex] ?? media[0] ?? null;
  const checklistItems = useMemo(
    () => [
      {
        done: checklist.hasMedia,
        text: `Minimal satu media tersedia, maksimal ${ADMIN_BARANG_MEDIA_LIMIT} foto atau video.`
      },
      {
        done: checklist.hasCoreData,
        text: "Nama barang, nilai taksiran, nama penggadai, dan nomor telepon nasabah sudah terisi."
      },
      {
        done: checklist.hasValidDates,
        text: "Tanggal jatuh tempo berada setelah tanggal gadai."
      },
      {
        done: checklist.hasSpecifications,
        text: "Spesifikasi kategori sudah dilengkapi untuk katalog buyer."
      }
    ],
    [checklist]
  );
  const isChecklistComplete = checklistItems.every((item) => item.done);

  function refreshChecklist(nextMedia = media) {
    const form = formRef.current;
    if (!form) {
      setChecklist((current) => ({ ...current, hasMedia: nextMedia.length > 0 }));
      return;
    }

    const formData = new FormData(form);
    const getValue = (name: string) => String(formData.get(name) ?? "").trim();
    const pawnedAt = getValue("pawnedAt");
    const dueDate = getValue("dueDate");
    const hasValidDates =
      Boolean(pawnedAt && dueDate) &&
      new Date(`${dueDate}T00:00:00.000Z`) > new Date(`${pawnedAt}T00:00:00.000Z`);
    const hasSpecifications = specificationFields.every((field) => getValue(`specifications.${field.key}`).length > 0);

    setChecklist({
      hasMedia: nextMedia.length > 0,
      hasCoreData: ["name", "appraisalValue", "ownerName", "customerNumber"].every((name) => getValue(name).length > 0),
      hasValidDates,
      hasSpecifications
    });
  }

  useEffect(() => {
    mediaRef.current = media;
    setActiveMediaIndex((current) => {
      if (media.length === 0) return 0;
      return Math.min(current, media.length - 1);
    });
    refreshChecklist(media);
  }, [media]);

  useEffect(() => {
    refreshChecklist();
  }, [category, specificationFields]);

  useEffect(() => {
    if (!isMediaPreviewOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMediaPreviewOpen(false);
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMediaPreviewOpen]);

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
        title: "Ada file yang belum bisa dipakai",
        description: "Pilih foto atau video saja agar galeri barang tetap rapi dan mudah dicek.",
        variant: "error",
        scope: "admin-unit"
      });
    }

    if (remainingSlots <= 0) {
      toast({
        title: "Slot media sudah penuh",
        description: `Satu barang hanya bisa memiliki ${ADMIN_BARANG_MEDIA_LIMIT} foto atau video. Hapus salah satu media bila ingin mengganti.`,
        variant: "error",
        scope: "admin-unit"
      });
      return;
    }

    if (supported.length > remainingSlots) {
      toast({
        title: "Sebagian media belum ditambahkan",
        description: `Kami hanya mengambil file sesuai sisa slot. Batas upload tetap ${ADMIN_BARANG_MEDIA_LIMIT} media per barang.`,
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
    setIsMediaPreviewOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (media.length === 0) {
      toast({
        title: "Media barang belum dipilih",
        description: "Tambahkan minimal satu foto atau video agar barang punya bukti visual sebelum disimpan.",
        variant: "error",
        scope: "admin-unit"
      });
      fileInputRef.current?.focus();
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.delete("media");
    formData.set("loanValue", String(formData.get("appraisalValue") ?? ""));
    media.forEach((item) => formData.append("media", item.file));

    setIsSubmitting(true);
    toast({
      title: "Sedang menyimpan barang jaminan",
      description: "Kami mengunggah media dan mencatat data appraisal. Tetap di halaman ini sebentar.",
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
        title: "Barang berhasil dicatat",
        description: "Data dan media sudah masuk ke daftar barang jaminan. Anda bisa lanjut cek detail atau siapkan pemasaran.",
        variant: "success",
        scope: "admin-unit"
      });
      router.push("/admin/barang");
      router.refresh();
    } catch (error) {
      toast({
        title: "Barang belum bisa disimpan",
        description: error instanceof Error ? error.message : "Periksa kembali data dan media, lalu coba simpan lagi.",
        variant: "error",
        scope: "admin-unit",
        duration: 5600
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form
        className="grid items-start gap-5 lg:grid-cols-10"
        onChange={() => refreshChecklist()}
        onInput={() => refreshChecklist()}
        onSubmit={handleSubmit}
        ref={formRef}
      >
      <div className="rounded-3xl border border-slate-100/80 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.012)] lg:col-span-7">
        <PanelTitle
          description="Data awal ini menjadi dasar sebelum barang jaminan dipasarkan ke katalog."
          title="Data Barang"
        />
        <div className="grid gap-4 p-6 sm:p-8 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <FieldLabel htmlFor="name">Nama barang</FieldLabel>
            <FormInput
              id="name"
              name="name"
              placeholder="Masukkan nama barang"
              required
            />
          </div>
          <div className="md:col-span-2">
            <CategorySegments onChange={setCategory} value={category} />
          </div>
          <div className="md:col-span-2">
            <ConditionSegments onChange={setCondition} value={condition} />
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-5 md:col-span-2">
            <div className="space-y-1">
              <FieldLabel>Spesifikasi kategori</FieldLabel>
              <p className="text-xs font-semibold leading-5 text-slate-400">
                Field berikut menyesuaikan kategori barang agar detail katalog tidak berisi informasi berulang.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {specificationFields.map((field) => (
                <div className={cn("space-y-1.5", field.key === "sertifikat" && "md:col-span-2")} key={field.key}>
                  <FieldLabel htmlFor={`specification-${field.key}`}>{field.label}</FieldLabel>
                  <FormInput
                    id={`specification-${field.key}`}
                    name={`specifications.${field.key}`}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="appraisalValue">Nilai taksiran</FieldLabel>
            <MoneyInput id="appraisalValue" min={1} name="appraisalValue" placeholder="Masukkan nilai taksiran" required />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="dueDate">Tanggal jatuh tempo</FieldLabel>
            <DateInput defaultValue={defaultDueDate} id="dueDate" name="dueDate" required />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="pawnedAt">Tanggal gadai</FieldLabel>
            <DateInput defaultValue={defaultPawnedAt} id="pawnedAt" name="pawnedAt" required />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="customerNumber">Nomor nasabah</FieldLabel>
            <FormInput id="customerNumber" name="customerNumber" placeholder="Nomor telepon nasabah" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="ownerName">Nama penggadai</FieldLabel>
            <FormInput id="ownerName" name="ownerName" placeholder="Nama nasabah" required />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <FieldLabel htmlFor="description">Deskripsi appraisal</FieldLabel>
            <Textarea
              className="min-h-28 resize-none rounded-xl border-transparent bg-slate-50 p-4 text-xs font-semibold leading-6 text-slate-700 placeholder:text-slate-400 focus-visible:border-[#006747] focus-visible:bg-white focus-visible:ring-[#006747]/10"
              id="description"
              name="description"
              placeholder="Jelaskan kondisi fisik, spesifikasi, kelengkapan, dan catatan appraisal."
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-8 lg:col-span-3">
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
        <AdminMediaUploadGallery
          activeIndex={activeMediaIndex}
          activeMedia={activeMedia}
          isDragging={isDragging}
          media={media}
          onAddClick={() => fileInputRef.current?.click()}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDrop={handleDrop}
          onOpenPreview={() => setIsMediaPreviewOpen(true)}
          onRemove={removeMedia}
          onSelect={setActiveMediaIndex}
        />

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.012)]">
          <h3 className="font-headline text-lg font-black tracking-[-0.02em] text-slate-950">Checklist sebelum simpan</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">Pastikan data inti sudah aman sebelum barang disimpan.</p>
          <div className="mt-5 space-y-3 text-xs font-semibold leading-5 text-slate-600">
            {checklistItems.map((item) => (
              <ChecklistItem done={item.done} key={item.text} text={item.text} />
            ))}
          </div>
        </div>

        <Button className="h-14 w-full rounded-xl bg-[#006747] font-body text-sm font-bold text-white shadow-[0_18px_34px_-24px_rgba(0,103,71,0.7)] hover:bg-[#00583d]" disabled={isSubmitting || !isChecklistComplete} type="submit">
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

        <div className="flex items-start gap-3 px-2 text-xs font-semibold leading-5 text-slate-500">
          <LockKeyhole className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <p>Data tersimpan aman dan hanya dapat diakses oleh petugas berwenang.</p>
        </div>
      </div>
      </form>
      {isMediaPreviewOpen && activeMedia
        ? createPortal(
            <div
              aria-modal="true"
              className="fixed inset-0 z-[140] flex items-center justify-center bg-[#081b14]/72 p-4 backdrop-blur-md sm:p-6"
              onClick={() => setIsMediaPreviewOpen(false)}
              role="dialog"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,184,93,0.16),transparent_36%)]" />
              <div
                className="relative z-[141] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/28 bg-[linear-gradient(180deg,rgba(248,246,239,0.96),rgba(255,255,255,0.92))] p-2 shadow-[0_48px_120px_-40px_rgba(3,21,14,0.82)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] border border-black/5 bg-[#fbfbf8]">
                  <div className="flex items-start justify-between gap-4 border-b border-black/6 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <p className="font-body text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#8d6c08]">
                        Media Barang
                      </p>
                      <h3 className="mt-1 truncate font-headline text-[1.35rem] font-black tracking-tight text-[#13211c]">
                        {activeMedia.file.name}
                      </h3>
                    </div>
                    <button
                      aria-label="Tutup preview media barang"
                      className="grid size-11 shrink-0 place-items-center rounded-full border border-black/8 bg-white text-primary transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f5f7f2] active:scale-[0.97]"
                      onClick={() => setIsMediaPreviewOpen(false)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="bg-[linear-gradient(180deg,#f7f8f4,#eef1ea)] p-3 sm:p-4">
                    <div className="overflow-hidden rounded-[1.5rem] border border-black/6 bg-white shadow-[0_24px_60px_-36px_rgba(8,69,50,0.28)]">
                      {activeMedia.file.type.startsWith("video/") ? (
                        <video
                          aria-label="Preview penuh video barang"
                          className="max-h-[78dvh] w-full bg-[#0d1712] object-contain"
                          controls
                          muted
                          playsInline
                          src={activeMedia.previewUrl}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt="Preview penuh media barang"
                          className="max-h-[78dvh] w-full object-contain bg-[#f8f8f5]"
                          src={activeMedia.previewUrl}
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
