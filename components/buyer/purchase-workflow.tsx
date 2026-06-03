"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { Lot } from "@/lib/contracts/catalog";
import { currency } from "@/lib/formatters/currency";

type PurchaseWorkflowProps = {
  lot: Lot;
};

type PurchaseStatus = "idle" | "loading" | "error";

export function PurchaseWorkflow({ lot }: PurchaseWorkflowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<PurchaseStatus>("idle");
  const [message, setMessage] = useState(
    "Transaksi belum dibuat. Lanjutkan hanya jika Anda siap menyelesaikan pembayaran fixed price."
  );
  const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);

  async function createTransferTransaction() {
    if (status === "loading") {
      return;
    }

    setStatus("loading");
    setMessage("Membuat detail pembayaran transfer untuk transaksi ini.");

    try {
      const response = await fetch(`/api/user/beli/${lot.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ paymentMethod: "transfer" })
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/katalog/${lot.id}/beli`)}`);
        return;
      }

      if (!response.ok) {
        const nextMessage = payload.message ?? "Detail pembayaran belum bisa dibuat. Silakan coba lagi.";
        setStatus("error");
        setMessage(nextMessage);
        toast({
          title: "Pembelian belum bisa diproses",
          description: nextMessage,
          variant: "error",
          scope: "buyer"
        });
        return;
      }

      const transactionId = payload?.data?.id;
      if (!transactionId) {
        const nextMessage = "Detail pembayaran berhasil diproses, tetapi ID transaksi belum diterima.";
        setStatus("error");
        setMessage(nextMessage);
        toast({
          title: "Detail pembayaran belum lengkap",
          description: nextMessage,
          variant: "error",
          scope: "buyer"
        });
        return;
      }

      toast({
        title: "Detail pembayaran dibuat",
        description: "Anda diarahkan ke halaman pembayaran transfer.",
        variant: "success",
        scope: "buyer"
      });
      router.replace(`/transaksi/${transactionId}`);
      router.refresh();
    } catch {
      const nextMessage = "Koneksi terputus. Coba lanjutkan pembayaran lagi dalam beberapa saat.";
      setStatus("error");
      setMessage(nextMessage);
      toast({
        title: "Pembelian belum bisa diproses",
        description: nextMessage,
        variant: "error",
        scope: "buyer"
      });
    }
  }

  function returnToLotDetail() {
    setIsBackConfirmOpen(false);
    router.replace(`/katalog/${lot.id}`);
  }

  const isLoading = status === "loading";
  const isError = status === "error";

  return (
    <Card className="overflow-hidden border border-primary/10 bg-white shadow-[0_28px_90px_rgba(8,69,50,0.08)]">
      <CardContent className="relative grid gap-8 p-6 md:grid-cols-[0.92fr_1.08fr] md:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#004a23_0%,#20b96b_56%,#d7ad2f_100%)]" />

        <div className="space-y-5">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-primary">
            Detail Pembayaran
          </p>
          <h2 className="font-headline text-3xl font-black tracking-tight text-[#13211c] md:text-4xl">
            Konfirmasi pembayaran fixed price
          </h2>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            Barang fixed price belum masuk daftar transaksi pada tahap ini. Transaksi baru dibuat
            ketika Anda menekan tombol lanjut pembayaran.
          </p>

          <div className="rounded-[1.5rem] border border-border/70 bg-surface-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Ringkasan Barang
            </p>
            <p className="mt-3 text-lg font-bold text-foreground">{lot.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{lot.code} | {lot.unitName}</p>
            <p className="mt-4 font-headline text-3xl font-black tracking-tight text-primary">
              {currency.format(lot.price)}
            </p>
          </div>
        </div>

        <div className="flex min-h-[24rem] flex-col justify-between rounded-[1.75rem] border border-border/70 bg-[linear-gradient(145deg,#ffffff_0%,#f7faf8_100%)] p-6">
          <div className="grid gap-4">
            {[
              { icon: CreditCard, label: "Metode pembayaran", value: "Transfer Bank" },
              { icon: ShieldCheck, label: "Status saat ini", value: "Belum membuat transaksi" },
              { icon: CheckCircle2, label: "Tahap berikutnya", value: "Unggah bukti transfer" }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div className="flex items-center gap-4 rounded-[1.25rem] bg-white p-4 shadow-[0_14px_32px_rgba(8,69,50,0.05)]" key={item.label}>
                  <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="mt-1 block font-semibold text-foreground">{item.value}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-4">
            <div
              className={
                isError
                  ? "rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700"
                  : "rounded-[1.25rem] border border-[#d7eadc] bg-[#f3fbf6] px-4 py-3 text-sm font-medium leading-6 text-[#0d6845]"
              }
            >
              {message}
            </div>
            {isError ? (
              <div className="flex flex-wrap gap-3">
                <Button onClick={createTransferTransaction}>
                  Lanjutkan Pembayaran
                  <ArrowRight className="size-4" />
                </Button>
                <Button onClick={() => setIsBackConfirmOpen(true)} variant="secondary">
                  Kembali ke Detail Barang
                  <ArrowLeft className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button className="w-full" disabled={isLoading} onClick={createTransferTransaction}>
                  {isLoading ? (
                    <>
                      <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
                      Membuka detail pembayaran
                    </>
                  ) : (
                    <>
                      Lanjutkan Pembayaran
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
                <Button
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => setIsBackConfirmOpen(true)}
                  variant="secondary"
                >
                  <ArrowLeft className="size-4" />
                  Kembali ke Detail Barang
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <ConfirmDialog
        cancelLabel="Tidak, kembali ke detail barang"
        confirmLabel="Ya, tetap di pembayaran"
        description='Pilih "Ya" untuk tetap di halaman ini. Pilih "Tidak" untuk kembali ke detail barang tanpa membuat transaksi.'
        onCancel={returnToLotDetail}
        onConfirm={() => setIsBackConfirmOpen(false)}
        onOpenChange={setIsBackConfirmOpen}
        open={isBackConfirmOpen}
        title="Tetap lanjutkan pembayaran?"
      />
    </Card>
  );
}
