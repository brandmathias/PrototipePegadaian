"use client";

import { FormEvent, ReactNode, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
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
};

const categories = [
  { value: "emas", label: "Emas" },
  { value: "perhiasan", label: "Perhiasan" },
  { value: "elektronik", label: "Elektronik" },
  { value: "kendaraan", label: "Kendaraan" },
  { value: "logam_mulia", label: "Logam Mulia" },
  { value: "lainnya", label: "Lainnya" }
];

const conditions = [
  { value: "baik", label: "Baik" },
  { value: "cukup", label: "Cukup" },
  { value: "rusak_ringan", label: "Rusak ringan" }
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

function SelectField({
  id,
  label,
  onChange,
  options,
  value
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        className={cn(
          "flex h-12 w-full rounded-md border border-input bg-[#f3f3f3] px-4 py-2 text-sm font-medium text-black/78",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
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
  const [description, setDescription] = useState(String(item.description ?? ""));
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          dueDate: item.dueDate
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
        <SelectField
          id="admin-barang-category"
          label="Kategori"
          onChange={setCategory}
          options={categories}
          value={category}
        />
        <SelectField
          id="admin-barang-condition"
          label="Kondisi"
          onChange={setCondition}
          options={conditions}
          value={condition}
        />
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
