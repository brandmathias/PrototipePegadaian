"use client";

import { FormEvent, ReactNode, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { AdminDatePicker } from "@/components/admin-unit/admin-date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/50 sm:text-xs">
      {children}
    </label>
  );
}

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AdminRedeemForm({
  customerNumber,
  itemId,
  ownerName
}: {
  customerNumber: string;
  itemId: string;
  ownerName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [redeemedAt, setRedeemedAt] = useState(todayIsoDate());
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reference.trim()) {
      toast({
        title: "Referensi belum diisi",
        description: "Masukkan nomor kuitansi atau referensi transaksi offline sebelum penebusan dikonfirmasi.",
        variant: "error",
        scope: "admin-unit"
      });
      return;
    }

    setIsConfirmOpen(true);
  }

  async function confirmRedeem() {
    setIsSubmitting(true);
    toast({
      title: "Mengonfirmasi penebusan",
      description: "Sistem sedang menutup alur barang ini sebagai barang yang ditebus nasabah.",
      variant: "info",
      scope: "admin-unit",
      duration: 2600
    });

    try {
      const response = await fetch(`/api/admin/barang/${itemId}/tebus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          redeemedAt,
          reference: reference.trim()
        })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message ?? "Penebusan belum berhasil diproses.");
      }

      toast({
        title: "Penebusan dikonfirmasi",
        description: "Barang keluar dari alur penjualan dan tersimpan sebagai riwayat tebus.",
        variant: "success",
        scope: "admin-unit"
      });
      router.push(`/admin/barang/${itemId}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Penebusan belum berhasil",
        description: error instanceof Error ? error.message : "Coba ulangi setelah memeriksa referensi penebusan.",
        variant: "error",
        scope: "admin-unit",
        duration: 5600
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  }

  return (
    <>
      <form className="grid gap-6 xl:grid-cols-[1fr_0.9fr]" onSubmit={handleSubmit}>
        <Card className="rounded-2xl border border-black/10 bg-white">
          <CardHeader className="border-b border-black/8">
            <CardTitle className="text-2xl">Data Penebusan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel>Nama penggadai</FieldLabel>
                <Input className="h-12" readOnly value={ownerName} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Nomor nasabah</FieldLabel>
                <Input className="h-12" readOnly value={customerNumber} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <FieldLabel>Nomor referensi penebusan</FieldLabel>
                <Input
                  className="h-12"
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Contoh: KWT-2026-00045"
                  value={reference}
                />
              </div>
            </div>

            <AdminDatePicker
              label="Tanggal penebusan"
              onChange={setRedeemedAt}
              value={redeemedAt}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/10 bg-[#f8faf8]">
          <CardHeader>
            <CardTitle className="text-xl">Yang Akan Terjadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-black/70">
            <p>Barang ditandai selesai ditebus dan keluar dari alur pemasaran.</p>
            <p>Riwayat status tetap tersimpan untuk kebutuhan audit unit.</p>
            <p>Pastikan referensi pembayaran offline sudah benar sebelum konfirmasi.</p>
            <Button className="mt-4 h-12 w-full rounded-2xl" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Mengonfirmasi penebusan...
                </>
              ) : (
                "Konfirmasi Penebusan"
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      <ConfirmDialog
        cancelLabel="Kembali"
        confirmLabel="Ya, konfirmasi tebus"
        description="Setelah penebusan dikonfirmasi, barang keluar dari alur penjualan unit dan tercatat sebagai riwayat selesai."
        loading={isSubmitting}
        onConfirm={() => void confirmRedeem()}
        onOpenChange={setIsConfirmOpen}
        open={isConfirmOpen}
        title="Konfirmasi penebusan barang"
        variant="destructive"
      />
    </>
  );
}
