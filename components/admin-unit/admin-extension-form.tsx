"use client";

import { FormEvent, ReactNode, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { AdminDatePicker, getDateAfter } from "@/components/admin-unit/admin-date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/50 sm:text-xs">
      {children}
    </label>
  );
}

function formatDisplayDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

export function AdminExtensionForm({
  currentDueDate,
  itemId
}: {
  currentDueDate: string;
  itemId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const minDate = getDateAfter(currentDueDate, 1);
  const [newDueDate, setNewDueDate] = useState(getDateAfter(currentDueDate, 30));
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (new Date(`${newDueDate}T00:00:00`) <= new Date(`${currentDueDate}T00:00:00`)) {
      toast({
        title: "Tanggal belum sesuai",
        description: "Tanggal jatuh tempo baru harus lebih akhir dari tanggal yang berjalan sekarang.",
        variant: "error",
        scope: "admin-unit"
      });
      return;
    }

    setIsSubmitting(true);
    toast({
      title: "Mencatat perpanjangan",
      description: "Tanggal jatuh tempo baru sedang diperbarui di riwayat barang.",
      variant: "info",
      scope: "admin-unit",
      duration: 2600
    });

    try {
      const response = await fetch(`/api/admin/barang/${itemId}/perpanjang`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          newDueDate,
          note: note.trim() || "Perpanjangan dicatat melalui dashboard admin unit."
        })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message ?? "Perpanjangan belum berhasil diproses.");
      }

      toast({
        title: "Perpanjangan tersimpan",
        description: "Tanggal jatuh tempo sudah diperbarui sesuai pilihan Anda.",
        variant: "success",
        scope: "admin-unit"
      });
      router.push(`/admin/barang/${itemId}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Perpanjangan belum berhasil",
        description: error instanceof Error ? error.message : "Coba ulangi setelah memeriksa tanggal baru.",
        variant: "error",
        scope: "admin-unit",
        duration: 5600
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6 xl:grid-cols-[1fr_0.9fr]" onSubmit={handleSubmit}>
      <Card className="rounded-2xl border border-black/10 bg-white">
        <CardHeader className="border-b border-black/8">
          <CardTitle className="text-2xl">Form Perpanjangan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.25rem] border border-black/10 bg-[#f7f8f6] p-4">
              <FieldLabel>Jatuh tempo saat ini</FieldLabel>
              <p className="mt-2 text-lg font-bold text-black/78">
                {formatDisplayDate(currentDueDate)}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[#c7dbcf] bg-[#f1faf5] p-4">
              <FieldLabel>Jatuh tempo baru</FieldLabel>
              <p className="mt-2 text-lg font-bold text-[#0a6a49]">
                {formatDisplayDate(newDueDate)}
              </p>
            </div>
          </div>

          <AdminDatePicker
            label="Pilih tanggal jatuh tempo baru"
            minDate={minDate}
            onChange={setNewDueDate}
            value={newDueDate}
          />

          <div className="space-y-2">
            <FieldLabel>Catatan perpanjangan</FieldLabel>
            <Textarea
              className="min-h-32"
              onChange={(event) => setNote(event.target.value)}
              placeholder="Tambahkan nomor kontrak, catatan petugas, atau konteks singkat bila diperlukan."
              value={note}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-black/10 bg-[#f8faf8]">
        <CardHeader>
          <CardTitle className="text-xl">Pengecekan Sebelum Simpan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-black/70">
          <p>Tanggal baru harus lebih akhir dari jatuh tempo yang berjalan saat ini.</p>
          <p>Riwayat perpanjangan tersimpan sebagai jejak audit barang.</p>
          <p>Status barang tetap berada di tahap jaminan selama belum dipasarkan.</p>
          <Button className="mt-4 h-12 w-full rounded-2xl" disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Menyimpan perpanjangan...
              </>
            ) : (
              "Simpan perpanjangan"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
