"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Banknote,
  CheckCircle2,
  Gavel,
  Info,
  LoaderCircle,
  Lock,
  Send,
  Tag,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatCurrencyInput, getCurrencyInputDigits } from "@/components/ui/currency-input";
import { useToast } from "@/components/ui/toast";
import { currency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

type MarketingMode = "fixed_price" | "vickrey";

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      className="text-[0.72rem] font-black uppercase tracking-[0.14em] text-[#0d5f40]"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

function formatDurationFieldValue(value: string, padLength: number) {
  const digits = normalizeDigits(value);
  if (!digits) {
    return padLength === 3 ? "0" : "00";
  }

  if (padLength === 3) {
    return digits.slice(-3);
  }

  return digits.slice(-padLength).padStart(padLength, "0");
}

function normalizeDurationInput(value: string, maxDigits: number, maxValue?: number) {
  const digits = normalizeDigits(value).slice(-maxDigits);
  if (!digits) {
    return "";
  }

  const numericValue = Number(digits);
  if (Number.isFinite(maxValue) && numericValue > Number(maxValue)) {
    return String(maxValue);
  }

  return digits;
}

function ModeCard({
  active,
  description,
  disabled = false,
  icon,
  title,
  onClick,
}: {
  active: boolean;
  description: string;
  disabled?: boolean;
  icon: ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        "relative flex w-full items-start gap-5 overflow-hidden rounded-[0.95rem] border px-6 text-left transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.99]",
        disabled && "cursor-not-allowed",
        active
          ? "min-h-[11.5rem] border-[#006747] bg-[linear-gradient(135deg,#006747_0%,#005238_100%)] pb-6 pt-11 shadow-[0_18px_34px_-24px_rgba(0,74,35,0.72)]"
          : disabled
            ? "min-h-[10.5rem] border-[#e5e8e6] bg-[#f7f8f8] py-8 text-slate-400"
            : "min-h-[10.5rem] border-[#d9e3dc] bg-white py-8 text-slate-500 shadow-[0_12px_24px_-28px_rgba(8,69,50,0.35)] hover:-translate-y-0.5 hover:border-[#a6cdb7] hover:bg-[#fcfdfc]"
      )}
      onClick={onClick}
      type="button"
    >
      {active ? (
        <>
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-[#006747] shadow-[0_8px_18px_-14px_rgba(0,0,0,0.5)]">
            Dipilih
          </span>
          <span className="absolute right-5 top-6 grid size-8 place-items-center rounded-full bg-white text-[#006747] shadow-[0_12px_22px_-16px_rgba(0,0,0,0.46)]">
            <CheckCircle2 className="size-4" strokeWidth={2.6} />
          </span>
        </>
      ) : disabled ? (
        <span className="absolute right-5 top-6 grid size-8 place-items-center rounded-full border border-[#d9dfdb] bg-white text-slate-300">
          <Lock className="size-3.5" strokeWidth={2.3} />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="absolute right-5 top-6 size-8 rounded-full border border-[#9aa8bb] bg-white"
          data-testid="marketing-mode-indicator"
        />
      )}

      <span
        className={cn(
          "grid size-20 shrink-0 place-items-center rounded-full border",
          active
            ? "border-white/70 bg-[#e8f6ee] text-[#006747]"
            : disabled
              ? "border-slate-200 bg-slate-100 text-slate-300"
              : "border-slate-200 bg-slate-50 text-slate-400"
        )}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1 pr-9">
        <span
          className={cn(
            "block text-[1.06rem] font-black tracking-[-0.02em] sm:text-[1.2rem]",
            active ? "text-white" : disabled ? "text-slate-400" : "text-slate-700"
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "mt-1.5 block text-justify text-[0.82rem] font-semibold leading-6 [hyphens:auto] [text-justify:inter-word] sm:text-[0.88rem]",
            active ? "text-emerald-50" : disabled ? "text-slate-300" : "text-slate-500"
          )}
        >
          {description}
        </span>
      </span>
    </button>
  );
}

function DurationField({
  isEditing,
  disabled,
  id,
  label,
  maxDigits = 2,
  maxValue,
  onBlur,
  onChange,
  onFocus,
  padLength = 2,
  value,
}: {
  disabled: boolean;
  id: string;
  isEditing: boolean;
  label: string;
  maxDigits?: number;
  maxValue?: number;
  onBlur: () => void;
  onChange: (value: string) => void;
  onFocus: () => void;
  padLength?: number;
  value: string;
}) {
  const displayValue = isEditing ? normalizeDigits(value) : formatDurationFieldValue(value, padLength);

  return (
    <div className="space-y-1">
      <input
        aria-label={label}
        className={cn(
          "h-[2.7rem] w-full rounded-[0.75rem] border text-center text-[0.86rem] font-black tracking-tight transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#006747]/10",
          disabled
            ? "border-slate-200/80 bg-slate-100 text-slate-400"
            : "border-slate-200 bg-[#f6f7f8] text-[#161f1b] hover:border-[#bfd3c7] focus-visible:border-[#006747]"
        )}
        disabled={disabled}
        id={id}
        inputMode="numeric"
        maxLength={maxDigits}
        min={0}
        onBlur={onBlur}
        onChange={(event) => onChange(normalizeDurationInput(event.target.value, maxDigits, maxValue))}
        onFocus={(event) => {
          onFocus();
          event.currentTarget.select();
        }}
        pattern="[0-9]*"
        type="text"
        value={displayValue}
      />
      <label className="block text-center text-[0.58rem] font-black uppercase tracking-[0.12em] text-[#6e7872]" htmlFor={id}>
        {label}
      </label>
    </div>
  );
}

export function AdminMarketingForm({
  barangId: _barangId,
  cancelHref,
  defaultMode = "fixed_price",
  defaultPrice,
  endpoint,
  presentation = "panel",
  redirectTo,
  serverNow,
  heroIcon,
  submitIcon,
  submitLabel,
  successDescription,
  successTitle,
  onCancel,
}: {
  barangId: string;
  cancelHref?: string;
  defaultMode?: MarketingMode;
  defaultPrice: number;
  endpoint: string;
  presentation?: "modal" | "panel";
  redirectTo: string;
  serverNow: string;
  heroIcon?: ReactNode;
  submitIcon?: ReactNode;
  submitLabel: string;
  successDescription: string;
  successTitle: string;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<MarketingMode>(defaultMode);
  const [price, setPrice] = useState(String(Math.max(1, Math.round(defaultPrice || 0))));
  const [durationDays, setDurationDays] = useState("0");
  const [durationHours, setDurationHours] = useState("0");
  const [durationMinutes, setDurationMinutes] = useState("5");
  const [durationSeconds, setDurationSeconds] = useState("0");
  const [activeDurationField, setActiveDurationField] = useState<null | "days" | "hours" | "minutes" | "seconds">(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalClosedAfterSuccess, setIsModalClosedAfterSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const normalizedPrice = Number(price);
  const normalizedDurationDays = Number(durationDays || "0");
  const normalizedDurationHours = Number(durationHours || "0");
  const normalizedDurationMinutes = Number(durationMinutes || "0");
  const normalizedDurationSeconds = Number(durationSeconds || "0");
  const normalizedDurationTotalSeconds =
    normalizedDurationDays * 24 * 60 * 60 +
    normalizedDurationHours * 60 * 60 +
    normalizedDurationMinutes * 60 +
    normalizedDurationSeconds;
  const baseNowMs = useMemo(() => new Date(serverNow).getTime(), [serverNow]);
  const priceLabel = mode === "fixed_price" ? "Masukkan Nominal Harga" : "Masukkan Harga Dasar Lelang";
  const summaryLabel = mode === "fixed_price" ? "Ringkasan Penjualan" : "Ringkasan Penawaran";
  const estimatedEnd = useMemo(() => {
    if (
      mode !== "vickrey" ||
      !Number.isFinite(baseNowMs) ||
      !Number.isFinite(normalizedDurationTotalSeconds) ||
      normalizedDurationTotalSeconds <= 0
    ) {
      return "Tanpa countdown";
    }

    const date = new Date(baseNowMs + normalizedDurationTotalSeconds * 1000);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Makassar",
    });
  }, [baseNowMs, mode, normalizedDurationTotalSeconds]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || presentation !== "modal" || isModalClosedAfterSuccess) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalClosedAfterSuccess, mounted, presentation]);

  function handleCancel() {
    if (onCancel) {
      onCancel();
      return;
    }

    router.push(cancelHref ?? redirectTo);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      toast({
        title: "Harga belum valid",
        description: "Masukkan harga jual atau harga dasar lebih dari nol.",
        variant: "error",
        scope: "admin-unit",
      });
      return;
    }

    if (
      mode === "vickrey" &&
      (!Number.isInteger(normalizedDurationDays) ||
        !Number.isInteger(normalizedDurationHours) ||
        !Number.isInteger(normalizedDurationMinutes) ||
        !Number.isInteger(normalizedDurationSeconds) ||
        normalizedDurationDays < 0 ||
        normalizedDurationDays > 365 ||
        normalizedDurationHours < 0 ||
        normalizedDurationHours > 23 ||
        normalizedDurationMinutes < 0 ||
        normalizedDurationMinutes > 59 ||
        normalizedDurationSeconds < 0 ||
        normalizedDurationSeconds > 59 ||
        normalizedDurationTotalSeconds <= 0 ||
        normalizedDurationTotalSeconds > 365 * 24 * 60 * 60)
    ) {
      toast({
        title: "Durasi lelang belum sesuai",
        description: "Durasi Lelang Tertutup perlu diisi lebih presisi dengan batas maksimal 365 hari.",
        variant: "error",
        scope: "admin-unit",
      });
      return;
    }

    setIsSubmitting(true);
    toast({
      title: "Menyiapkan tayangan katalog",
      description:
        mode === "vickrey"
          ? "Sesi lelang tertutup sedang dibuat dengan countdown sesuai durasi."
          : "Barang sedang dipublikasikan sebagai harga tetap.",
      variant: "info",
      scope: "admin-unit",
      duration: 2800,
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          price: price.trim(),
          durationDays: mode === "vickrey" ? durationDays.trim() : undefined,
          durationHours: mode === "vickrey" ? durationHours.trim() : undefined,
          durationMinutes: mode === "vickrey" ? durationMinutes.trim() : undefined,
          durationSeconds: mode === "vickrey" ? durationSeconds.trim() : undefined,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message ?? "Barang belum berhasil dipublikasikan.");
      }

      toast({
        title: successTitle,
        description: successDescription,
        variant: "success",
        scope: "admin-unit",
      });
      if (presentation === "modal") {
        setIsModalClosedAfterSuccess(true);
      }
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast({
        title: "Pemasaran belum berhasil",
        description: error instanceof Error ? error.message : "Coba ulangi setelah memeriksa data barang.",
        variant: "error",
        scope: "admin-unit",
        duration: 5600,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const marketingCard = (
    <div
      className={cn(
        "relative overflow-visible rounded-[2rem] border border-[#dfe8e2] bg-white shadow-[0_42px_120px_-52px_rgba(3,21,14,0.82),0_18px_38px_-28px_rgba(8,69,50,0.24)]",
        presentation === "modal" && "modal-viewport my-auto w-full max-w-[66rem]"
      )}
    >
        <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
          <div className="grid size-16 place-items-center rounded-full border-[5px] border-white bg-[#006747] shadow-[0_18px_30px_-18px_rgba(0,103,71,0.7)]">
            {heroIcon ? (
              heroIcon
            ) : mode === "fixed_price" ? (
              <Tag className="size-6 text-white" strokeWidth={2.2} />
            ) : (
              <Gavel className="size-6 text-white" strokeWidth={2.2} />
            )}
          </div>
        </div>

        <div className="p-5 pt-9 sm:p-7 sm:pt-10 lg:p-7 lg:pt-10">
          <div className="flex justify-end">
            <button
              aria-label="Tutup popup pasarkan barang"
              className="grid size-9 place-items-center rounded-lg text-slate-400 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-100 hover:text-slate-700"
              onClick={handleCancel}
              type="button"
            >
              <X className="size-4.5" strokeWidth={2.2} />
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1 text-center">
              <h3 className="font-headline text-[1.75rem] font-black tracking-[-0.035em] text-[#111a16] sm:text-[2rem]">
                Pasarkan Barang
              </h3>
              <p className="mx-auto max-w-md text-[0.86rem] font-semibold leading-6 text-slate-500">
                Konfigurasi akhir sebelum unit ditayangkan ke katalog publik.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
              <div className="flex h-full min-w-0 flex-col gap-2.5" data-testid="marketing-method-column">
                <FieldLabel>Metode Penjualan</FieldLabel>
                <div className="flex flex-col gap-4">
                  <ModeCard
                    active={mode === "fixed_price"}
                    description="Penjualan instan dengan harga tetap yang ditentukan. Pembeli dapat langsung melakukan transaksi tanpa proses lelang."
                    icon={<Tag className="size-7" strokeWidth={2.2} />}
                    onClick={() => setMode("fixed_price")}
                    title="Harga Tetap"
                  />
                  <ModeCard
                    active={mode === "vickrey"}
                    description="Lelang tertutup (sealed-bid) di mana pemenang membayar harga penawaran tertinggi kedua."
                    icon={<Gavel className="size-7" strokeWidth={2.2} />}
                    onClick={() => setMode("vickrey")}
                    title="Lelang Tertutup"
                  />
                </div>
              </div>

              <div
                className={cn(
                  "flex h-full min-w-0 flex-col gap-2.5 border-[#dfe8e2] lg:border-l lg:pl-5",
                  mode === "fixed_price" ? "justify-start" : "justify-between"
                )}
                data-testid="marketing-summary-column"
              >
                <FieldLabel>{summaryLabel}</FieldLabel>
                <div className="rounded-[1rem] border border-[#dfe8e2] bg-white p-3 shadow-[0_16px_32px_-30px_rgba(8,69,50,0.45)]">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#eaf6ef] text-[#006747]">
                      <Banknote className="size-5" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <FieldLabel htmlFor="marketing-price">{priceLabel}</FieldLabel>
                      <div className="flex overflow-hidden rounded-[0.8rem] border-2 border-[#b9ddc8] bg-white transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-within:border-[#006747] focus-within:ring-4 focus-within:ring-[#006747]/10">
                        <span className="flex items-center px-3 text-[1rem] font-black text-[#006747]">
                          Rp
                        </span>
                        <input
                          className="h-[2.75rem] w-full bg-transparent pr-4 text-[0.88rem] font-black tracking-[0.01em] text-[#0d4e34] outline-none placeholder:font-semibold placeholder:text-slate-300"
                          id="marketing-price"
                          inputMode="numeric"
                          onChange={(event) => setPrice(getCurrencyInputDigits(event.target.value))}
                          placeholder="Masukkan nominal harga"
                          type="text"
                          value={formatCurrencyInput(price)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {mode === "vickrey" ? (
                  <div className="space-y-1">
                    <FieldLabel>Durasi Lelang</FieldLabel>
                    <div className="grid grid-cols-4 gap-1.5 rounded-[0.85rem] border border-[#e2ebe6] bg-[#f8faf9] p-2">
                      <DurationField
                        disabled={false}
                        id="marketing-duration-days"
                        isEditing={activeDurationField === "days"}
                        label="Hari"
                        maxDigits={3}
                        maxValue={365}
                        onBlur={() => setActiveDurationField(null)}
                        onChange={setDurationDays}
                        onFocus={() => setActiveDurationField("days")}
                        padLength={3}
                        value={durationDays}
                      />
                      <DurationField
                        disabled={false}
                        id="marketing-duration-hours"
                        isEditing={activeDurationField === "hours"}
                        label="Jam"
                        maxValue={23}
                        onBlur={() => setActiveDurationField(null)}
                        onChange={setDurationHours}
                        onFocus={() => setActiveDurationField("hours")}
                        value={durationHours}
                      />
                      <DurationField
                        disabled={false}
                        id="marketing-duration-minutes"
                        isEditing={activeDurationField === "minutes"}
                        label="Menit"
                        maxValue={59}
                        onBlur={() => setActiveDurationField(null)}
                        onChange={setDurationMinutes}
                        onFocus={() => setActiveDurationField("minutes")}
                        value={durationMinutes}
                      />
                      <DurationField
                        disabled={false}
                        id="marketing-duration-seconds"
                        isEditing={activeDurationField === "seconds"}
                        label="Detik"
                        maxValue={59}
                        onBlur={() => setActiveDurationField(null)}
                        onChange={setDurationSeconds}
                        onFocus={() => setActiveDurationField("seconds")}
                        value={durationSeconds}
                      />
                    </div>
                  </div>
                ) : null}

                <div className={cn("space-y-2.5", mode === "fixed_price" ? "mt-4" : "mt-auto")} data-testid="marketing-summary-footer">
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-[1rem] bg-[linear-gradient(135deg,#006747_0%,#005238_100%)] px-4 py-3 text-white shadow-[0_22px_44px_-30px_rgba(0,74,35,0.9)]",
                      mode === "fixed_price" && "flex min-h-[7.5rem] items-center"
                    )}
                    data-testid="marketing-summary-total"
                  >
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/12" />
                    <div className="relative grid w-full gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5 pr-2 sm:pr-4">
                        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-emerald-100">
                          {mode === "fixed_price" ? "Total Harga Jual" : "Total Nilai Dasar"}
                        </p>
                        <p className="font-headline text-[1.12rem] font-black tracking-tight text-white sm:text-[1.25rem]">
                          {Number.isFinite(normalizedPrice) && normalizedPrice > 0 ? currency.format(normalizedPrice) : "Rp 0"}
                        </p>
                      </div>
                      <div className="space-y-1.5 pl-0 sm:pl-4">
                        <div className="flex items-center gap-2 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-emerald-100">
                          <Info className="size-4 opacity-90" strokeWidth={2.2} />
                          <span>{mode === "fixed_price" ? "Status Listing" : "Selesai Pada"}</span>
                        </div>
                        <p className="text-[0.82rem] font-semibold text-emerald-50 sm:text-[0.86rem] leading-snug">
                          {mode === "fixed_price" ? "Listing aktif di katalog publik" : estimatedEnd}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex gap-3 rounded-[0.9rem] border border-[#d9ebe0] bg-[#f4faf6] px-4 py-3 text-[0.82rem] font-semibold leading-[1.45] text-[#384e43]",
                      mode === "fixed_price" && "min-h-[6.1rem] items-center"
                    )}
                    data-testid="marketing-summary-terms"
                  >
                    <Info className="mt-0.5 size-6 shrink-0 text-[#006747]" strokeWidth={2.2} />
                    <p>
                      Dengan menekan tombol di bawah, Anda menyetujui syarat dan ketentuan penempatan unit di katalog publik Ruang Agunan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#e8eeea]" />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                className="h-11 min-w-[7.25rem] rounded-xl border border-[#d7e1db] bg-white px-5 text-[0.96rem] font-bold tracking-tight text-[#33443b] shadow-none hover:bg-[#f7faf8] hover:text-[#13211c] active:scale-[0.98]"
                onClick={handleCancel}
                type="button"
                variant="ghost"
              >
                Batal
              </Button>
              <Button
                className={cn(
                  "h-[2.5rem] min-w-[15.5rem] rounded-[1rem] bg-[#006747] px-6 text-[0.92rem] font-bold text-white shadow-[0_18px_32px_-22px_rgba(0,103,71,0.7)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#005238] active:scale-[0.98]",
                  isSubmitting && "hover:translate-y-0"
                )}
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Menyimpan pemasaran...
                  </>
                ) : (
                  <>
                    {submitLabel}
                    {submitIcon ?? <Send className="size-4" strokeWidth={2.2} />}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
    </div>
  );

  if (presentation === "modal") {
    if (!mounted || isModalClosedAfterSuccess) {
      return null;
    }

    return createPortal(
      <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#081b14]/42 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-[2px] sm:px-6 sm:py-6">
          {marketingCard}
      </div>,
      document.body
    );
  }

  return <div className="mx-auto w-full max-w-[66rem]">{marketingCard}</div>;
}
