"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Landmark,
  MapPinned
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currency, userTransactions, type Lot } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type PurchaseWorkflowProps = {
  lot: Lot;
};

const methods = [
  {
    id: "TRANSFER_BANK",
    label: "Transfer Bank",
    description:
      "Transaksi dibuat lebih dulu, lalu Anda menyelesaikan transfer dan mengunggah bukti dari halaman transaksi."
  },
  {
    id: "BAYAR_LANGSUNG",
    label: "Bayar Langsung di Pegadaian",
    description:
      "Sistem menyiapkan nomor pengajuan yang dibawa ke unit untuk pembayaran langsung bersama petugas."
  }
] as const;

export function PurchaseWorkflow({ lot }: PurchaseWorkflowProps) {
  const [method, setMethod] =
    useState<(typeof methods)[number]["id"]>("TRANSFER_BANK");

  const existingTransaction = userTransactions.find(
    (transaction) =>
      transaction.lotId === lot.id && !["LUNAS", "GAGAL"].includes(transaction.status)
  );

  const preview = useMemo(() => {
    if (method === "TRANSFER_BANK") {
      return {
        title: "Transaksi dibuat dan menunggu pembayaran",
        status: "MENUNGGU_PEMBAYARAN",
        points: [
          "Nomor transaksi dan batas waktu unggah bukti selama 24 jam langsung dibuat.",
          "Rekening bank unit akan tampil lengkap pada halaman detail transaksi.",
          "Setelah bukti transfer diunggah, status berubah menjadi BUKTI_DIUNGGAH dan masuk antrean verifikasi admin."
        ],
        helper:
          "Cocok jika Anda ingin menyelesaikan pembayaran dari aplikasi bank, lalu mengirim bukti untuk diperiksa admin unit."
      };
    }

    return {
      title: "Pengajuan siap dibawa ke unit",
      status: "MENUNGGU_KONFIRMASI_LANGSUNG",
      points: [
        "Nomor pengajuan dibuat otomatis dan dapat langsung ditunjukkan ke petugas.",
        "Alamat unit dan total pembayaran akan tampil pada detail transaksi.",
        "Setelah pembayaran dikonfirmasi admin, status transaksi berubah menjadi LUNAS."
      ],
      helper:
        "Cocok jika Anda ingin menyelesaikan pembayaran langsung di loket Pegadaian tanpa perlu unggah bukti transfer."
    };
  }, [method]);

  return (
    <Card className="overflow-hidden border border-border/70 bg-white">
      <CardHeader className="space-y-3 border-b border-border/60 bg-surface-low/60">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-secondary">
          Pembelian Fixed Price
        </p>
        <CardTitle>Konfirmasi pembelian dan lanjutkan ke transaksi</CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sesuai PRD, pembelian fixed price dilanjutkan dengan memilih metode pembayaran.
          Setelah dikonfirmasi, sistem membuat transaksi dan Anda melanjutkan prosesnya
          dari halaman detail transaksi.
        </p>
      </CardHeader>

      <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-border/70 bg-surface-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Ringkasan barang
            </p>
            <h3 className="mt-3 text-xl font-bold text-foreground">{lot.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {lot.code} | {lot.unitName}
            </p>
            <p className="mt-5 font-headline text-4xl font-extrabold tracking-tight text-primary">
              {currency.format(lot.price)}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Periksa kembali kondisi barang, unit penyelenggara, dan metode pembayaran yang
              paling sesuai sebelum pembelian dikonfirmasi.
            </p>
          </div>

          {existingTransaction ? (
            <div className="rounded-[1.75rem] border border-tertiary-container/25 bg-tertiary-container/10 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 size-5 text-tertiary-container" />
                <div className="space-y-3">
                  <p className="font-semibold text-foreground">
                    Transaksi aktif untuk barang ini sudah ada
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Agar tidak membuat pengajuan ganda, lanjutkan dulu transaksi yang sudah
                    aktif untuk barang ini.
                  </p>
                  <Link href={`/transaksi/${existingTransaction.id}`}>
                    <Button variant="secondary">Buka transaksi aktif</Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {methods.map((option) => (
              <button
                className={cn(
                  "w-full rounded-[1.5rem] border p-5 text-left transition",
                  method === option.id
                    ? "border-primary bg-primary text-white shadow-ambient"
                    : "border-border/70 bg-white hover:border-primary/25 hover:bg-primary/[0.03]"
                )}
                key={option.id}
                onClick={() => setMethod(option.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-base font-bold">{option.label}</p>
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        method === option.id ? "text-white/78" : "text-muted-foreground"
                      )}
                    >
                      {option.description}
                    </p>
                  </div>
                  <CheckCircle2
                    className={cn(
                      "mt-0.5 size-5 shrink-0",
                      method === option.id ? "text-white" : "text-border"
                    )}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-border/70 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Status awal transaksi
                </p>
                <p className="mt-2 text-2xl font-extrabold text-primary">{preview.status}</p>
              </div>
              <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                Nomor transaksi dibuat otomatis
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{preview.helper}</p>
            <div className="mt-5 space-y-3">
              {preview.points.map((point) => (
                <div className="flex items-start gap-3" key={point}>
                  <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ArrowRight className="size-3.5" />
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">{point}</p>
                </div>
              ))}
            </div>
          </div>

          {method === "TRANSFER_BANK" ? (
            <div className="rounded-[1.75rem] border border-primary/15 bg-primary/[0.03] p-5">
              <div className="flex items-start gap-3">
                <Landmark className="mt-1 size-5 text-primary" />
                <div className="space-y-3">
                  <p className="font-semibold text-foreground">Ringkasan rekening tujuan unit</p>
                  <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-ambient sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Bank
                      </p>
                      <p className="mt-2 font-semibold text-foreground">BRI</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Nomor rekening
                      </p>
                      <p className="mt-2 font-semibold text-foreground">0123-4567-8901-234</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Atas nama
                      </p>
                      <p className="mt-2 font-semibold text-foreground">
                        PT Pegadaian (Persero) - {lot.unitName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-accent/35 bg-accent/15 p-5">
              <div className="flex items-start gap-3">
                <MapPinned className="mt-1 size-5 text-accent-foreground" />
                <div className="space-y-3">
                  <p className="font-semibold text-foreground">Bayar langsung di unit</p>
                  <div className="rounded-2xl bg-white p-4 shadow-ambient">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Nomor pengajuan
                    </p>
                    <p className="mt-2 text-lg font-bold text-primary">PGJ-FP-2026-00XX</p>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      Simpan nomor pengajuan ini. Anda akan membutuhkannya saat datang ke
                      unit untuk pembayaran langsung dan konfirmasi petugas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button className="min-w-[13rem]" disabled={Boolean(existingTransaction)}>
              Konfirmasi Pembelian
            </Button>
            <Button disabled={Boolean(existingTransaction)} variant="secondary">
              <Building2 className="size-4" />
              Lihat Simulasi Detail Transaksi
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
