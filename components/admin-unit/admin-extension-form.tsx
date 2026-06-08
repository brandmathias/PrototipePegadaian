"use client";

import { FormEvent, ReactNode, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarDays, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { AdminDatePicker, getDateAfter } from "@/components/admin-unit/admin-date-picker";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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
          note: "Perpanjangan dicatat melalui dashboard admin unit."
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
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#081b14]/42 p-4 backdrop-blur-[2px] sm:p-6">
      <div className="modal-viewport my-auto w-full max-w-[42rem]">
        <div className="relative rounded-[2rem] border border-[#dfe8e2] bg-white shadow-[0_42px_120px_-52px_rgba(3,21,14,0.82),0_18px_38px_-28px_rgba(8,69,50,0.24)]">
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="grid size-16 place-items-center rounded-full border-[5px] border-white bg-[#006747] shadow-[0_18px_30px_-18px_rgba(0,103,71,0.7)]">
              <CalendarClock className="size-6 text-white" strokeWidth={2.2} />
            </div>
          </div>

          <div className="p-5 pt-10 sm:p-7 sm:pt-11">
            <div className="flex justify-end">
              <Link
                aria-label="Tutup popup perpanjangan"
                className="grid size-9 place-items-center rounded-lg text-slate-400 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-100 hover:text-slate-700"
                href={`/admin/barang/${itemId}`}
              >
                <X className="size-4.5" strokeWidth={2.2} />
              </Link>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2 text-center">
                <h3 className="font-headline text-[1.55rem] font-black tracking-tight text-[#15231d] sm:text-[1.72rem]">
                  Catat Perpanjangan Gadai
                </h3>
                <p className="mx-auto max-w-md text-[0.9rem] leading-7 text-slate-500">
                  Pilih tanggal jatuh tempo baru secara langsung menggunakan kalender sistem.
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-dashed border-emerald-600/30 bg-[linear-gradient(180deg,rgba(240,249,244,0.45),rgba(255,255,255,0.96))] p-4 sm:p-5">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] md:items-end">
                  <div className="space-y-2">
                    <FieldLabel>Jatuh Tempo Lama</FieldLabel>
                    <div className="flex min-h-[3.15rem] items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-100 px-3 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                      <CalendarDays className="size-4 shrink-0" strokeWidth={1.9} />
                      <span className="truncate text-[0.82rem] font-bold">
                        {formatDisplayDate(currentDueDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center md:pb-1">
                    <span className="grid size-11 place-items-center rounded-full border border-emerald-100 bg-emerald-50 text-[#006747] shadow-[0_12px_24px_-20px_rgba(0,103,71,0.45)]">
                      <ArrowRight className="size-4.5" strokeWidth={2.2} />
                    </span>
                  </div>

                  <div className="space-y-2">
                    <AdminDatePicker
                      label="Jatuh Tempo Baru"
                      minDate={minDate}
                      onChange={setNewDueDate}
                      placeholder="Pilih tanggal baru"
                      value={newDueDate}
                      variant="compact"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/admin/barang/${itemId}`}>
                  <Button
                    className="h-12 min-w-[7rem] rounded-[0.82rem] border-[#dbe4df] bg-white px-9 text-[0.92rem] font-bold text-[#26342e] shadow-none hover:bg-[#f6faf8]"
                    type="button"
                    variant="secondary"
                  >
                    Batal
                  </Button>
                </Link>
                <Button
                  className={cn(
                    "h-11 min-w-[11.5rem] rounded-xl bg-[#006747] px-5 text-sm font-bold text-white shadow-[0_18px_32px_-22px_rgba(0,103,71,0.7)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#005238] active:scale-[0.98]",
                    isSubmitting && "hover:translate-y-0"
                  )}
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Menyimpan perpanjangan...
                    </>
                  ) : (
                    "Simpan perpanjangan"
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
