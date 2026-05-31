"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  ReceiptText,
  Wallet,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { AdminSelect } from "@/components/admin/admin-select";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/formatters/currency";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const PAYMENT_METHOD_OPTIONS = [
  { label: "Tunai", value: "Tunai" },
  { label: "EDC Debit", value: "EDC Debit" },
  { label: "Transfer Bank Unit", value: "Transfer Bank Unit" },
];

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#1f2f27]">
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

function normalizeToken(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildRedemptionReference(paymentMethod: string, itemCode: string, itemId: string) {
  const normalizedMethod = normalizeToken(paymentMethod) || "TUNAI";
  const normalizedCode = normalizeToken(itemCode) || normalizeToken(itemId.slice(0, 8));
  return `TEBUS-${normalizedMethod}-${normalizedCode}`;
}

export function AdminRedeemForm({
  customerNumber,
  itemCode,
  itemId,
  itemName,
  ownerName,
  previewImageUrl,
  redemptionAmount,
}: {
  customerNumber: string;
  itemCode: string;
  itemId: string;
  itemName: string;
  ownerName: string;
  previewImageUrl?: string | null;
  redemptionAmount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [redeemedAt] = useState(todayIsoDate());
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [imageFailed, setImageFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [previewImageUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const reference = buildRedemptionReference(paymentMethod, itemCode, itemId);

    setIsSubmitting(true);
    toast({
      title: "Menyimpan catatan penebusan",
      description: "Sistem sedang menutup alur barang ini sebagai barang yang ditebus nasabah.",
      variant: "info",
      scope: "admin-unit",
      duration: 2600,
    });

    try {
      const response = await fetch(`/api/admin/barang/${itemId}/tebus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          redeemedAt,
          reference,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message ?? "Penebusan belum berhasil diproses.");
      }

      toast({
        title: "Transaksi penebusan tersimpan",
        description: "Barang keluar dari alur penjualan dan tercatat sebagai riwayat tebus.",
        variant: "success",
        scope: "admin-unit",
      });
      router.push(`/admin/barang/${itemId}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Penebusan belum berhasil",
        description: error instanceof Error ? error.message : "Coba ulangi setelah memeriksa data transaksi penebusan.",
        variant: "error",
        scope: "admin-unit",
        duration: 5600,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#081b14]/42 p-4 backdrop-blur-[2px] sm:p-6">
      <div className="w-full max-w-[42rem]">
        <div className="relative rounded-[2rem] border border-[#dfe8e2] bg-white shadow-[0_42px_120px_-52px_rgba(3,21,14,0.82),0_18px_38px_-28px_rgba(8,69,50,0.24)]">
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="grid size-16 place-items-center rounded-full border-[5px] border-white bg-[#006747] shadow-[0_18px_30px_-18px_rgba(0,103,71,0.7)]">
              <Wallet className="size-6 text-white" strokeWidth={2.1} />
            </div>
          </div>

          <div className="p-5 pt-10 sm:p-7 sm:pt-11">
            <div className="flex justify-end">
              <Link
                aria-label="Tutup popup penebusan"
                className="grid size-9 place-items-center rounded-lg text-slate-400 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-100 hover:text-slate-700"
                href={`/admin/barang/${itemId}`}
              >
                <X className="size-4.5" strokeWidth={2.2} />
              </Link>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2 text-center">
                <h3 className="font-headline text-[1.55rem] font-black tracking-tight text-[#15231d] sm:text-[1.72rem]">
                  Catat Penebusan Gadai
                </h3>
                <p className="mx-auto max-w-md text-[0.9rem] leading-7 text-slate-500">
                  Selesaikan kewajiban untuk mengambil jaminan.
                </p>
              </div>

              <div className="rounded-[1.15rem] border border-[#f5c88a] bg-[#fff7ed] px-4 py-2.5 text-[#c46d11] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:px-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0" strokeWidth={2.2} />
                  <p className="text-[0.86rem] font-medium leading-6">
                    Penebusan akan menghapus aset dari daftar jaminan aktif secara permanen.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.25rem] border border-[#dcebe3] bg-white shadow-[0_18px_36px_-28px_rgba(8,69,50,0.2)]">
                <div className="relative overflow-hidden border-b border-[#e8f0eb] bg-[linear-gradient(180deg,rgba(241,250,245,0.92),rgba(253,255,254,0.96))] px-5 py-3.5 text-center">
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
                    fill="none"
                    viewBox="0 0 640 160"
                  >
                    <path
                      d="M-40 118C32 74 96 152 168 108C240 64 304 138 376 100C448 62 512 136 584 94C624 70 666 90 704 110"
                      stroke="#9FD3B8"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M-20 134C50 94 112 166 182 122C252 78 314 150 384 114C454 78 516 150 586 110C624 88 662 102 700 122"
                      stroke="#B8E2CD"
                      strokeLinecap="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <div className="relative z-10 space-y-2">
                    <p className="text-[0.72rem] font-black uppercase tracking-[0.14em] text-[#57655f]">
                      Total Pelunasan
                    </p>
                    <p className="text-[1.62rem] font-black tracking-tight text-[#006747] sm:text-[1.82rem]">
                      {currency.format(redemptionAmount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 px-5 py-3.5">
                  <div className="space-y-2">
                    <FieldLabel>Metode Pembayaran Loket</FieldLabel>
                    <AdminSelect
                      ariaLabel="Metode pembayaran loket"
                      className="w-full"
                      onValueChange={setPaymentMethod}
                      options={PAYMENT_METHOD_OPTIONS}
                      value={paymentMethod}
                    />
                  </div>

                  <div className="rounded-[1.15rem] border border-slate-200/70 bg-[#f8fafc] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                    <div className="flex items-center gap-3">
                      <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[0.95rem] border border-slate-200/70 bg-white shadow-[0_10px_22px_-20px_rgba(15,23,42,0.35)]">
                        {previewImageUrl && !imageFailed ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={itemName}
                            className="size-full object-cover"
                            src={previewImageUrl}
                            onError={() => setImageFailed(true)}
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[linear-gradient(180deg,#f8e7a6,#d9b24a)] px-2 text-center text-[#6d5413]">
                            <ReceiptText className="size-4.5" strokeWidth={1.8} />
                            <span className="text-[0.62rem] font-black uppercase tracking-[0.12em]">
                              Jaminan
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-[1.02rem] font-black tracking-tight text-[#17251f]">
                          {itemName}
                        </p>
                        <p className="text-[0.92rem] font-medium text-slate-500">{itemCode}</p>
                        <p className="text-[0.84rem] text-slate-400">
                          {ownerName} / {customerNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-end">
                <Link href={`/admin/barang/${itemId}`}>
                  <Button
                    className="h-11 min-w-[6.5rem] rounded-xl px-4 text-sm font-bold text-slate-500 shadow-none hover:bg-slate-50 hover:text-slate-800"
                    type="button"
                    variant="ghost"
                  >
                    Batal
                  </Button>
                </Link>
                <Button
                  className={cn(
                    "h-11 min-w-[12.5rem] rounded-xl bg-[#006747] px-5 text-sm font-bold text-white shadow-[0_18px_32px_-22px_rgba(0,103,71,0.7)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#005238] active:scale-[0.98]",
                    isSubmitting && "hover:translate-y-0"
                  )}
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Menyimpan transaksi...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" strokeWidth={2.2} />
                      Simpan Transaksi
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
