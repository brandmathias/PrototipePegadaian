"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import type { Lot } from "@/lib/contracts/catalog";
import { currency } from "@/lib/formatters/currency";

type PurchaseWorkflowProps = {
  lot: Lot;
};

type PurchaseStatus = "loading" | "error";

export function PurchaseWorkflow({ lot }: PurchaseWorkflowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const hasSubmittedRef = useRef(false);
  const [status, setStatus] = useState<PurchaseStatus>("loading");
  const [message, setMessage] = useState("Membuat detail pembayaran transfer untuk transaksi ini.");

  useEffect(() => {
    if (hasSubmittedRef.current) {
      return;
    }

    hasSubmittedRef.current = true;

    async function createTransferTransaction() {
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

      toast({
        title: "Detail pembayaran dibuat",
        description: "Anda diarahkan ke halaman pembayaran transfer.",
        variant: "success",
        scope: "buyer"
      });
      router.replace(`/transaksi/${payload.data.id}`);
      router.refresh();
    }

    void createTransferTransaction();
  }, [lot.id, router, toast]);

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
            Menyiapkan pembayaran transfer
          </h2>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            Fixed price sekarang memakai transfer bank. Sistem membuat transaksi dan rekening tujuan
            otomatis, lalu membawa Anda langsung ke halaman detail pembayaran.
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
              { icon: ShieldCheck, label: "Status awal", value: "Menunggu Pembayaran" },
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
            <div className="rounded-[1.25rem] border border-[#e6ddbc] bg-[#fffaf0] px-4 py-3 text-sm font-medium leading-6 text-[#735a0f]">
              {message}
            </div>
            {isError ? (
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
                <Link href={`/katalog/${lot.id}`}>
                  <Button variant="secondary">
                    Kembali ke Detail
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <Button className="w-full" disabled>
                <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
                Membuka detail pembayaran
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
