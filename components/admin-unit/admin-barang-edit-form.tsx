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
import { CustomerNumberInput } from "@/components/admin-unit/customer-number-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { getCustomerNumberInputValue } from "@/lib/admin-unit/customer-number";
import { getBarangSpecificationFields, type BarangSpecificationRecord } from "@/lib/admin-unit/specifications";
import { cn } from "@/lib/utils";

type AdminBarangEditValue = {
  id: string;
  name: string;
  category: string;
  condition: string;
  appraisalValue: number | string;
  description: string;
  ownerName: string;
  customerNumber: string;
  pawnedAt: string;
  dueDate: string;
  marketingMode?: string | null;
  marketingPrice?: number | string | null;
  specifications?: BarangSpecificationRecord;
};

export type AdminBarangEditSubmitPayload = Record<string, unknown>;

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

const editInputFocusClass =
  "transition-[background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus:border-[#006747]/42 focus:bg-white focus-visible:border-[#006747]/42 focus-visible:shadow-[0_0_0_4px_rgba(189,232,208,0.46),0_18px_38px_-32px_rgba(0,103,71,0.42)]";
const editInputGroupFocusClass =
  "transition-[background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-within:border-[#006747]/42 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(189,232,208,0.46),0_18px_38px_-32px_rgba(0,103,71,0.42)]";

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

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatInputCurrency(value: string) {
  const digits = normalizeDigits(value);
  if (!digits) {
    return "";
  }

  return Number(digits).toLocaleString("id-ID");
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
  correctionOnly = false,
  forceFullSubmit = false,
  formId,
  item,
  onSave,
  onSubmittingChange,
  showSubmit = true
}: {
  correctionOnly?: boolean;
  forceFullSubmit?: boolean;
  formId?: string;
  item: AdminBarangEditValue;
  onSave?: (payload: AdminBarangEditSubmitPayload) => Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  showSubmit?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const initialAppraisalValue = normalizeDigits(String(item.appraisalValue ?? ""));
  const [name, setName] = useState(String(item.name ?? ""));
  const [category, setCategory] = useState(normalizeEditableCategory(String(item.category ?? "perhiasan")));
  const [condition, setCondition] = useState(String(item.condition ?? "baik").toLowerCase());
  const [appraisalValue, setAppraisalValue] = useState(initialAppraisalValue);
  const [ownerName, setOwnerName] = useState(String(item.ownerName ?? ""));
  const [customerNumber, setCustomerNumber] = useState(getCustomerNumberInputValue(String(item.customerNumber ?? "")));
  const [marketingPrice, setMarketingPrice] = useState(String(item.marketingPrice ?? ""));
  const [description, setDescription] = useState(String(item.description ?? ""));
  const [specifications, setSpecifications] = useState<BarangSpecificationRecord>(item.specifications ?? {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const specificationFields = useMemo(() => getBarangSpecificationFields(category), [category]);
  const canEditFixedPrice = String(item.marketingMode ?? "").toLowerCase() === "fixed_price";
  const saveRedirectTo = canEditFixedPrice ? `/admin/barang/${item.id}` : "/admin/barang";

  function updateSpecification(key: string, value: string) {
    setSpecifications((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    onSubmittingChange?.(true);
    const hasFullDataChanges =
      forceFullSubmit ||
      name !== String(item.name ?? "") ||
      category !== normalizeEditableCategory(String(item.category ?? "perhiasan")) ||
      condition !== String(item.condition ?? "baik").toLowerCase() ||
      description !== String(item.description ?? "") ||
      JSON.stringify(specifications) !== JSON.stringify(item.specifications ?? {}) ||
      (canEditFixedPrice && marketingPrice !== String(item.marketingPrice ?? ""));
    const submitCorrectionOnly = correctionOnly || !hasFullDataChanges;
    toast({
      title: "Menyimpan perubahan barang",
      description: "Kami sedang memperbarui data inti barang agar riwayat unit tetap konsisten.",
      variant: "info",
      scope: "admin-unit",
      duration: 2600
    });
    const payload: AdminBarangEditSubmitPayload = submitCorrectionOnly
      ? {
          correctionOnly: true,
          ownerName,
          customerNumber,
          appraisalValue
        }
      : {
          name,
          category,
          condition,
          description,
          appraisalValue,
          ownerName,
          customerNumber,
          pawnedAt: item.pawnedAt,
          dueDate: item.dueDate,
          ...(canEditFixedPrice ? { marketingPrice } : {}),
          specifications
        };

    try {
      if (onSave) {
        await onSave(payload);
      } else {
        const response = await fetch(`/api/admin/barang/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result?.message ?? "Data barang belum berhasil diperbarui.");
        }
      }

      toast({
        title: "Perubahan tersimpan",
        description: canEditFixedPrice
          ? "Informasi barang sudah diperbarui. Anda akan kembali ke barang terkait."
          : "Informasi barang sudah diperbarui. Anda akan kembali ke Kelola Barang.",
        variant: "success",
        scope: "admin-unit"
      });
      router.push(saveRedirectTo);
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
      onSubmittingChange?.(false);
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
        {!correctionOnly ? (
          <>
        <div className="space-y-2 md:col-span-2">
          <FieldLabel htmlFor="admin-barang-name">Nama barang</FieldLabel>
          <Input
            className={cn(
              "h-11 rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-none sm:text-sm",
              editInputFocusClass
            )}
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
                    "flex items-center justify-center gap-1.5 rounded-lg text-[0.72rem] font-black outline-none transition-[background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:shadow-[0_0_0_4px_rgba(189,232,208,0.46)]",
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
                  <div className={cn("flex overflow-hidden rounded-xl border border-slate-200 bg-white", editInputGroupFocusClass)}>
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
                <FieldLabel htmlFor="admin-barang-marketing-price">Harga harga tetap aktif</FieldLabel>
                <p className="mt-1 text-sm leading-6 text-black/55">
                  Harga ini tampil di katalog buyer dan bisa disesuaikan selama barang harga tetap belum terjual.
                </p>
              </div>
            </div>
            <Input
              className={cn("h-11 rounded-xl bg-white text-sm font-semibold sm:text-sm", editInputFocusClass)}
              id="admin-barang-marketing-price"
              min={1}
              onChange={(event) => setMarketingPrice(event.target.value)}
              placeholder="Contoh: 12500000"
              type="number"
              value={marketingPrice}
            />
          </div>
        ) : null}
        <div className="space-y-2 md:col-span-2">
          <FieldLabel htmlFor="admin-barang-description">Deskripsi barang</FieldLabel>
          <Textarea
            className={cn(
              "scrollbar-none min-h-28 resize-none rounded-xl border-slate-200 text-justify text-sm font-medium leading-6 text-slate-700 sm:text-sm",
              editInputFocusClass
            )}
            id="admin-barang-description"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </div>
          </>
        ) : null}
        <div className="grid gap-4 rounded-[1.1rem] border border-emerald-100 bg-emerald-50/35 p-4 md:col-span-2 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel htmlFor="admin-barang-owner-name">Nama penggadai</FieldLabel>
            <Input
              className={cn("h-11 rounded-xl border-slate-200 bg-white text-sm font-semibold", editInputFocusClass)}
              id="admin-barang-owner-name"
              onChange={(event) => setOwnerName(event.target.value)}
              required
              value={ownerName}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="admin-barang-customer-number">Nomor telepon nasabah</FieldLabel>
            <CustomerNumberInput
              className="text-sm"
              id="admin-barang-customer-number"
              onValueChange={setCustomerNumber}
              required
              value={customerNumber}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <FieldLabel htmlFor="admin-barang-appraisal-value">Nilai taksiran</FieldLabel>
            <div className={cn("flex overflow-hidden rounded-xl border border-slate-200 bg-white", editInputGroupFocusClass)}>
              <span className="flex items-center border-r border-slate-100 bg-slate-50 px-3 text-[0.68rem] font-black uppercase tracking-[0.08em] text-slate-500">
                Rp
              </span>
              <Input
                className="h-11 rounded-none border-0 bg-transparent text-sm font-semibold shadow-none focus-visible:ring-0"
                id="admin-barang-appraisal-value"
                inputMode="numeric"
                min={1}
                onChange={(event) => setAppraisalValue(normalizeDigits(event.target.value))}
                pattern="[0-9.]*"
                required
                type="text"
                value={formatInputCurrency(appraisalValue)}
              />
            </div>
            <p className="text-xs font-medium leading-5 text-slate-500">
              Nama dan nomor telepon disinkronkan ke seluruh barang nasabah di unit ini. Nilai taksiran hanya berlaku untuk barang ini.
            </p>
          </div>
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
