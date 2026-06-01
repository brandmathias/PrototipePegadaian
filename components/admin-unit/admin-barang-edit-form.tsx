"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  CarFront,
  CheckCircle2,
  FileText,
  Gem,
  Layers,
  LoaderCircle,
  Medal,
  MonitorSmartphone,
  Package2,
  Save,
  Tag
} from "lucide-react";
import { useRouter } from "next/navigation";

import { AdminSelect } from "@/components/admin/admin-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { getBarangSpecificationFields, type BarangSpecificationRecord } from "@/lib/admin-unit/specifications";
import { cn } from "@/lib/utils";

type AdminBarangEditValue = {
  id: string;
  name: string;
  category: string;
  condition: string;
  appraisalValue: number | string;
  loanValue: number | string;
  description: string;
  ownerName: string;
  customerNumber: string;
  pawnedAt: string;
  dueDate: string;
  marketingMode?: string | null;
  marketingPrice?: number | string | null;
  specifications?: BarangSpecificationRecord;
};

const categories = [
  { value: "perhiasan", label: "Perhiasan", icon: Gem },
  { value: "logam_mulia", label: "Logam Mulia", icon: Medal },
  { value: "elektronik", label: "Elektronik", icon: MonitorSmartphone },
  { value: "kendaraan", label: "Kendaraan", icon: CarFront },
  { value: "lainnya", label: "Lainnya", icon: Package2 }
] as const;

const conditions = [
  { value: "baik", label: "Baik" },
  { value: "cukup", label: "Cukup" },
  { value: "rusak_ringan", label: "Rusak Ringan" }
] as const;

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

function normalizeEditableCategory(value: string) {
  return value.toLowerCase() === "emas" ? "perhiasan" : value.toLowerCase();
}

function getSpecificationSuffix(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("berat")) return "gram";
  if (normalized.includes("panjang")) return "cm";
  if (normalized.includes("diameter") || normalized.includes("ukuran")) return "mm";
  if (normalized.includes("tahun")) return "tahun";
  return null;
}

function CategoryDropdown({
  value,
  onChange
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor="admin-barang-category">Kategori barang</FieldLabel>
      <AdminSelect
        ariaLabel="Kategori barang"
        className="[&_.admin-select-trigger]:h-12 [&_.admin-select-trigger]:rounded-xl [&_.admin-select-trigger]:text-sm [&_.admin-select-trigger]:font-bold"
        id="admin-barang-category"
        onValueChange={onChange}
        options={[...categories]}
        value={value}
      />
    </div>
  );
}

export function AdminBarangEditForm({
  formId,
  item,
  showSubmit = true
}: {
  formId?: string;
  item: AdminBarangEditValue;
  showSubmit?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(String(item.name ?? ""));
  const [category, setCategory] = useState(normalizeEditableCategory(String(item.category ?? "perhiasan")));
  const [condition, setCondition] = useState(String(item.condition ?? "baik").toLowerCase());
  const appraisalValue = String(item.appraisalValue ?? "");
  const loanValue = String(item.loanValue ?? "");
  const [marketingPrice, setMarketingPrice] = useState(String(item.marketingPrice ?? ""));
  const [description, setDescription] = useState(String(item.description ?? ""));
  const [specifications, setSpecifications] = useState<BarangSpecificationRecord>(item.specifications ?? {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const specificationFields = useMemo(() => getBarangSpecificationFields(category), [category]);
  const canEditFixedPrice = String(item.marketingMode ?? "").toLowerCase() === "fixed_price";

  function updateSpecification(key: string, value: string) {
    setSpecifications((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    toast({
      title: "Menyimpan perubahan barang",
      description: "Kami sedang memperbarui data inti barang agar riwayat unit tetap konsisten.",
      variant: "info",
      scope: "admin-unit",
      duration: 2600
    });

    try {
      const response = await fetch(`/api/admin/barang/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          category,
          condition,
          description,
          appraisalValue,
          loanValue,
          ownerName: item.ownerName,
          customerNumber: item.customerNumber,
          pawnedAt: item.pawnedAt,
          dueDate: item.dueDate,
          ...(canEditFixedPrice ? { marketingPrice } : {}),
          specifications
        })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message ?? "Data barang belum berhasil diperbarui.");
      }

      toast({
        title: "Perubahan tersimpan",
        description: "Informasi barang sudah diperbarui. Anda bisa kembali ke detail atau lanjut merapikan media.",
        variant: "success",
        scope: "admin-unit"
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Perubahan belum tersimpan",
        description: error instanceof Error ? error.message : "Periksa lagi data barang, lalu coba simpan ulang.",
        variant: "error",
        scope: "admin-unit",
        duration: 5600
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_18px_54px_-46px_rgba(15,23,42,0.46)]"
      id={formId}
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 sm:px-6">
        <span className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-[#006747]">
          <FileText className="size-4" strokeWidth={2.1} />
        </span>
        <h3 className="text-[0.95rem] font-black uppercase tracking-[0.08em] text-slate-900">
          Informasi Barang
        </h3>
      </div>
      <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <FieldLabel htmlFor="admin-barang-name">Nama barang</FieldLabel>
          <Input
            className="h-11 rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-none transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:border-[#006747] focus-visible:ring-4 focus-visible:ring-[#006747]/8 sm:text-sm"
            id="admin-barang-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </div>
        <div className="md:col-span-2">
          <CategoryDropdown onChange={setCategory} value={category} />
        </div>
        <div className="space-y-2">
          <FieldLabel>Kondisi barang</FieldLabel>
          <input name="adminBarangCondition" type="hidden" value={condition} />
          <div
            aria-label="Kondisi"
            className="grid h-11 grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1"
            role="radiogroup"
          >
            {conditions.map((option) => {
              const active = option.value === condition;
              return (
                <button
                  aria-checked={active}
                  aria-label={option.label}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg text-[0.72rem] font-black transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    active
                      ? "border border-emerald-200 bg-white text-[#006747] shadow-[0_12px_22px_-20px_rgba(0,103,71,0.42)]"
                      : "text-slate-500 hover:bg-white hover:text-slate-800"
                  )}
                  key={option.value}
                  onClick={() => setCondition(option.value)}
                  role="radio"
                  type="button"
                >
                  <span
                    className={cn(
                      "grid size-4 place-items-center rounded-full border",
                      active ? "border-[#006747] bg-[#006747] text-white" : "border-slate-300 bg-white text-transparent"
                    )}
                  >
                    <CheckCircle2 className="size-3" strokeWidth={2.4} />
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-4 rounded-[1.1rem] border border-slate-200 bg-slate-50/45 p-4 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="size-4 text-[#006747]" strokeWidth={2.1} />
            <FieldLabel>Spesifikasi kategori</FieldLabel>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {specificationFields.map((field) => {
              const suffix = getSpecificationSuffix(field.label);
              return (
                <div className="space-y-2" key={field.key}>
                  <FieldLabel htmlFor={`admin-barang-specification-${field.key}`}>{field.label}</FieldLabel>
                  <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-within:border-[#006747] focus-within:ring-4 focus-within:ring-[#006747]/8">
                    <input
                      className="h-10 w-full bg-transparent px-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-300"
                      id={`admin-barang-specification-${field.key}`}
                      onChange={(event) => updateSpecification(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      value={specifications[field.key] ?? ""}
                    />
                    {suffix ? (
                      <span className="flex min-w-14 items-center justify-center border-l border-slate-100 bg-slate-50 px-3 text-[0.68rem] font-black text-slate-500">
                        {suffix}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {canEditFixedPrice ? (
          <div className="space-y-3 rounded-[1.1rem] border border-[#0d6b4c]/15 bg-[#f3fbf7] p-4 md:col-span-2">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#0d6b4c] text-white">
                <Tag className="size-4.5" />
              </span>
              <div>
                <FieldLabel htmlFor="admin-barang-marketing-price">Harga fixed price aktif</FieldLabel>
                <p className="mt-1 text-sm leading-6 text-black/55">
                  Harga ini tampil di katalog buyer dan bisa disesuaikan selama barang fixed price belum terjual.
                </p>
              </div>
            </div>
            <Input
              className="h-11 rounded-xl bg-white text-sm font-semibold sm:text-sm"
              id="admin-barang-marketing-price"
              min={1}
              onChange={(event) => setMarketingPrice(event.target.value)}
              placeholder="Contoh: 12500000"
              type="number"
              value={marketingPrice}
            />
          </div>
        ) : null}
        <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel>Nomor nasabah</FieldLabel>
            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
              {item.customerNumber || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel>Nama penggadai</FieldLabel>
            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
              {item.ownerName || "-"}
            </div>
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <FieldLabel htmlFor="admin-barang-description">Deskripsi barang</FieldLabel>
          <Textarea
            className="scrollbar-none min-h-28 resize-none rounded-xl border-slate-200 text-justify text-sm font-medium leading-6 text-slate-700 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:border-[#006747] focus-visible:ring-4 focus-visible:ring-[#006747]/8 sm:text-sm"
            id="admin-barang-description"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </div>
        {showSubmit ? (
          <div className="md:col-span-2">
            <Button className="h-12 w-full rounded-2xl" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Menyimpan perubahan...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
