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
    "Transfer sesuai nominal, lalu unggah bukti pembayaran agar transaksi harga tetap dicatat."
  );
  const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");

  async function startPaymentWorkflow() {
    if (status === "loading") {
      return;
    }

    if (!proofFile) {
      const nextMessage = "Pilih file bukti pembayaran terlebih dahulu sebelum mencatat transaksi.";
      setStatus("error");
      setMessage(nextMessage);
      toast({
        title: "Bukti pembayaran belum dipilih",
        description: nextMessage,
        variant: "error",
        scope: "buyer"
      });
      return;
    }

    setStatus("loading");
    setMessage("Mengunggah bukti pembayaran dan mencatat transaksi harga tetap.");

    try {
      const formData = new FormData();
      formData.append("file", proofFile);
      if (reference.trim()) {
        formData.append("reference", reference.trim());
      }

      const response = await fetch(`/api/user/beli/${lot.id}`, {
        method: "POST",
        body: formData
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/katalog/${lot.id}/beli`)}`);
        return;
      }

      if (!response.ok) {
        const nextMessage = payload.message ?? "Bukti pembayaran belum bisa dikirim. Silakan coba lagi.";
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
        const nextMessage = "Transaksi dicatat, tetapi ID transaksi belum diterima.";
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
        title: "Bukti pembayaran terkirim",
        description: "Transaksi harga tetap sudah dicatat dan menunggu verifikasi admin unit.",
        variant: "success",
        scope: "buyer"
      });
      router.replace(`/transaksi/${transactionId}`);
      router.refresh();
    } catch {
      const nextMessage = "Koneksi terputus. Coba unggah bukti pembayaran lagi dalam beberapa saat.";
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
  const accountNumber = lot.bankAccountNumber ?? "Rekening tujuan belum tersedia";
  const accountHolder = lot.bankAccountHolder ?? "Nama pemilik rekening belum tersedia";
  const bankName = lot.bankName ?? "Bank unit belum tersedia";

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
            Transaksi harga tetap baru tercatat setelah bukti pembayaran dikirim. Pastikan transfer
            sesuai nominal dan rekening tujuan unit sebelum melanjutkan.
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
              { icon: CreditCard, label: "Metode pembayaran", value: "Transfer Bank" },
              { icon: ShieldCheck, label: "Status saat ini", value: "Siap menerima bukti pembayaran" },
              { icon: CheckCircle2, label: "Tahap berikutnya", value: "Verifikasi admin unit" }
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
                    Rekening Tujuan
                  </p>
                  <p className="mt-2 text-lg font-black text-foreground">{bankName}</p>
                  <p className="mt-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Nomor Rekening
                  </p>
                  <p className="mt-1 overflow-x-auto whitespace-nowrap font-headline text-2xl font-black tracking-normal text-primary">
                    {accountNumber}
                  </p>
                  <p className="mt-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Atas Nama
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">{accountHolder}</p>
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
                    Bukti Pembayaran
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    Transaksi dicatat setelah file bukti terkirim.
                  </p>
                </div>
              </div>
              <p className="rounded-[1rem] border border-[#d7eadc] bg-[#f3fbf6] px-4 py-3 text-sm font-medium leading-6 text-[#0d6845]">
                Setelah bukti dikirim, transaksi akan muncul di halaman Transaksi dengan status
                menunggu verifikasi admin unit.
              </p>
              <label className="grid gap-2 text-sm font-semibold text-foreground">
                <span>File bukti pembayaran</span>
                <input
                  accept=".jpg,.jpeg,.png,.pdf"
                  aria-label="File bukti pembayaran"
                  className="min-h-12 rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;
                    setProofFile(nextFile);
                    setStatus("idle");
                    setMessage(
                      nextFile
                        ? "Bukti siap dikirim. Pastikan nominal transfer sesuai harga barang."
                        : "Transfer sesuai nominal, lalu unggah bukti pembayaran agar transaksi harga tetap dicatat."
                    );
                  }}
                  type="file"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-foreground">
                <span>Nomor referensi transfer</span>
                <input
                  className="min-h-12 rounded-2xl border border-border/70 bg-white px-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Opsional, contoh: BRI-2026-001"
                  type="text"
                  value={reference}
                />
              </label>
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
                  Kirim Bukti Pembayaran
                  <CheckCircle2 className="size-4" />
                </Button>
                <Button onClick={() => setIsBackConfirmOpen(true)} variant="secondary">
                  Kembali ke Detail Barang
                  <ArrowLeft className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button className="w-full" disabled={isLoading || !proofFile} onClick={startPaymentWorkflow}>
                  {isLoading ? (
                    <>
                      <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
                      Mengirim bukti
                    </>
                  ) : (
                    <>
                      Kirim Bukti Pembayaran
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
