"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { CarFront, Cpu, Gem, LoaderCircle, Medal, Save, Shapes, Tag } from "lucide-react";
import { useRouter } from "next/navigation";

import { AdminOptionGrid } from "@/components/admin-unit/admin-option-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { getBarangSpecificationFields, type BarangSpecificationRecord } from "@/lib/admin-unit/specifications";

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
  { value: "emas", label: "Emas", description: "Perhiasan emas dasar dan emas batangan kecil.", icon: Gem },
  { value: "perhiasan", label: "Perhiasan", description: "Cincin, kalung, gelang, anting, dan sejenisnya.", icon: Shapes },
  { value: "elektronik", label: "Elektronik", description: "Gawai, laptop, kamera, atau perangkat rumah tangga.", icon: Cpu },
  { value: "kendaraan", label: "Kendaraan", description: "Motor atau kendaraan lain yang siap dinilai unit.", icon: CarFront },
  { value: "logam_mulia", label: "Logam Mulia", description: "Batangan bernilai tinggi dengan pasar harga ketat.", icon: Medal },
  { value: "lainnya", label: "Lainnya", description: "Barang jaminan lain di luar kategori utama.", icon: Save }
];

const conditions = [
  { value: "baik", label: "Baik", description: "Siap tampil ke katalog tanpa catatan mayor.", icon: Gem },
  { value: "cukup", label: "Cukup", description: "Ada jejak pakai ringan, masih layak dipasarkan.", icon: Shapes },
  { value: "rusak_ringan", label: "Rusak ringan", description: "Perlu catatan kondisi agar ekspektasi buyer jelas.", icon: Cpu }
];

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/50 sm:text-xs"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

export function AdminBarangEditForm({ item }: { item: AdminBarangEditValue }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(String(item.name ?? ""));
  const [category, setCategory] = useState(String(item.category ?? "emas").toLowerCase());
  const [condition, setCondition] = useState(String(item.condition ?? "baik").toLowerCase());
  const [appraisalValue, setAppraisalValue] = useState(String(item.appraisalValue ?? ""));
  const [loanValue, setLoanValue] = useState(String(item.loanValue ?? ""));
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
    <form className="rounded-2xl border border-black/10 bg-white" onSubmit={handleSubmit}>
      <div className="border-b border-black/8 px-5 py-5 sm:px-6">
        <h3 className="font-headline text-[1.55rem] font-black text-black/85 sm:text-[1.8rem]">
          Form Edit Barang
        </h3>
        <p className="mt-1 text-sm leading-6 text-black/60 sm:text-base">
          Perubahan inti disimpan langsung ke data barang unit.
        </p>
      </div>
      <div className="grid gap-5 p-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <FieldLabel htmlFor="admin-barang-name">Nama barang</FieldLabel>
          <Input
            className="h-12 text-sm sm:text-base"
            id="admin-barang-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </div>
        <div className="md:col-span-2">
          <AdminOptionGrid
            label="Kategori"
            name="adminBarangCategory"
            onChange={setCategory}
            options={categories}
            value={category}
          />
        </div>
        <div className="md:col-span-2">
          <AdminOptionGrid
            label="Kondisi"
            name="adminBarangCondition"
            onChange={setCondition}
            options={conditions}
            value={condition}
          />
        </div>
        <div className="space-y-4 rounded-2xl border border-black/8 bg-[#fbfaf6] p-4 md:col-span-2">
          <div>
            <FieldLabel>Spesifikasi kategori</FieldLabel>
            <p className="mt-1 text-sm leading-6 text-black/55">
              Field ini mengikuti kategori aktif dan tampil sebagai spesifikasi produk di katalog buyer.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {specificationFields.map((field) => (
              <div className="space-y-2" key={field.key}>
                <FieldLabel htmlFor={`admin-barang-specification-${field.key}`}>{field.label}</FieldLabel>
                <Input
                  className="h-12 text-sm sm:text-base"
                  id={`admin-barang-specification-${field.key}`}
                  onChange={(event) => updateSpecification(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  value={specifications[field.key] ?? ""}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="admin-barang-appraisal">Nilai taksiran</FieldLabel>
          <Input
            className="h-12 text-sm sm:text-base"
            id="admin-barang-appraisal"
            onChange={(event) => setAppraisalValue(event.target.value)}
            type="number"
            value={appraisalValue}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="admin-barang-loan">Nilai gadai</FieldLabel>
          <Input
            className="h-12 text-sm sm:text-base"
            id="admin-barang-loan"
            onChange={(event) => setLoanValue(event.target.value)}
            type="number"
            value={loanValue}
          />
        </div>
        {canEditFixedPrice ? (
          <div className="space-y-3 rounded-2xl border border-[#0d6b4c]/15 bg-[#f3fbf7] p-4 md:col-span-2">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#0d6b4c] text-white">
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
              className="h-12 bg-white text-sm font-semibold sm:text-base"
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
          <FieldLabel htmlFor="admin-barang-description">Deskripsi</FieldLabel>
          <Textarea
            className="min-h-40 text-sm sm:text-base"
            id="admin-barang-description"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </div>
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
      </div>
    </form>
  );
}
