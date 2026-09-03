"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Landmark,
  LoaderCircle,
  ShieldCheck,
  UploadCloud
} from "lucide-react";

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
    "Buat checkout Midtrans untuk memilih VA, QRIS, atau e-wallet secara aman."
  );
  const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);

  async function startPaymentWorkflow() {
    if (status === "loading") {
      return;
    }

    setStatus("loading");
    setMessage("Menyiapkan checkout Midtrans.");

    try {
      const response = await fetch(`/api/user/beli/${lot.id}`, {
        method: "POST"
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/katalog/${lot.id}/beli`)}`);
        return;
      }

      if (!response.ok) {
        const nextMessage = payload.message ?? "Transaksi belum bisa dibuat. Silakan coba lagi.";
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

      const transactionId = payload?.data?.transactionId;
      if (!transactionId) {
        const nextMessage = "Transaksi dibuat, tetapi detail pembayaran belum tersedia.";
        setStatus("error");
        setMessage(nextMessage);
        toast({
        title: "Checkout Midtrans belum lengkap",
          description: nextMessage,
          variant: "error",
          scope: "buyer"
        });
        return;
      }

      router.replace(`/transaksi/${transactionId}`);
    } catch {
      const nextMessage = "Koneksi terputus. Coba buat transaksi lagi dalam beberapa saat.";
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
    router.replace(`/katalog/${lot.id}?source=payment`);
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
            Lanjutkan ke detail pembayaran
          </h2>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            Sistem membuat checkout Midtrans dengan nominal yang dikunci. Pilih metode pembayaran dan
            selesaikan pembayaran di halaman Midtrans tanpa unggah bukti transfer.
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

        <div className="flex min-h-[30rem] flex-col justify-between rounded-[1.75rem] border border-border/70 bg-[linear-gradient(145deg,#ffffff_0%,#f7faf8_100%)] p-6">
          <div className="grid gap-4">
            {[
              { icon: CreditCard, label: "Metode pembayaran", value: "Midtrans: VA, QRIS, atau e-wallet" },
              { icon: ShieldCheck, label: "Status saat ini", value: "Siap membuat checkout aman" },
              { icon: CheckCircle2, label: "Tahap berikutnya", value: "Bayar di halaman Midtrans" }
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

            <div className="rounded-[1.25rem] border border-[#dbe8df] bg-white p-4 shadow-[0_14px_32px_rgba(8,69,50,0.04)]">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Landmark className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Pembayaran Terverifikasi Otomatis
                  </p>
                  <p className="mt-2 text-lg font-black text-foreground">Midtrans</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Nominal pembayaran dikirim dari sistem ke Midtrans dan statusnya diperbarui otomatis setelah dana diterima.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-[1.25rem] border border-[#dbe8df] bg-white p-4 shadow-[0_14px_32px_rgba(8,69,50,0.04)]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Workflow Pembayaran
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    Tidak perlu upload bukti transfer.
                  </p>
                </div>
              </div>
              <p className="rounded-[1rem] border border-[#d7eadc] bg-[#f3fbf6] px-4 py-3 text-sm font-medium leading-6 text-[#0d6845]">
                Setelah pembayaran berhasil, status transaksi otomatis berubah menjadi lunas dan Admin Unit dapat menyiapkan serah-terima barang.
              </p>
            </div>
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
                <Button disabled={isLoading} onClick={startPaymentWorkflow}>
                  Lanjut ke Detail Pembayaran
                  <CheckCircle2 className="size-4" />
                </Button>
                <Button onClick={() => setIsBackConfirmOpen(true)} variant="secondary">
                  Kembali ke Detail Barang
                  <ArrowLeft className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button className="w-full" disabled={isLoading} onClick={startPaymentWorkflow}>
                  {isLoading ? (
                    <>
                      <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
                      Membuat transaksi
                    </>
                  ) : (
                    <>
                      Lanjut ke Detail Pembayaran
                      <CheckCircle2 className="size-4" />
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
