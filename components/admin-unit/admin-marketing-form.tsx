"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
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
import { useToast } from "@/components/ui/toast";
import { currency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

type MarketingMode = "fixed_price" | "vickrey";

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#57655f]"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatInputCurrency(value: string) {
  const digits = normalizeDigits(value);
  if (!digits) {
    return "";
  }

  return Number(digits).toLocaleString("id-ID");
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
        "relative flex min-h-[6.6rem] items-start gap-3 rounded-[1rem] border px-4 py-3 text-left transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        disabled && "cursor-not-allowed",
        active
          ? "border-[#005c3b] bg-[#f7fbf8] shadow-[0_12px_28px_-22px_rgba(0,103,71,0.45)]"
          : disabled
            ? "border-[#e5e8e6] bg-[#f7f8f8] text-slate-400"
            : "border-[#d9e3dc] bg-white text-slate-500 hover:-translate-y-0.5 hover:border-[#c4d5cb] hover:bg-[#fcfdfc]"
      )}
      onClick={onClick}
      type="button"
    >
      {active ? (
        <span className="absolute right-4 top-4 grid size-7 place-items-center rounded-full bg-[#006747] text-white shadow-[0_12px_22px_-16px_rgba(0,103,71,0.6)]">
          <CheckCircle2 className="size-4" strokeWidth={2.6} />
        </span>
      ) : disabled ? (
        <span className="absolute right-4 top-4 grid size-7 place-items-center rounded-full border border-[#d9dfdb] bg-white text-slate-300">
          <Lock className="size-3.5" strokeWidth={2.3} />
        </span>
      ) : null}

      <span
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-[0.85rem] border",
          active
            ? "border-emerald-200 bg-emerald-50 text-[#006747]"
            : disabled
              ? "border-slate-200 bg-slate-100 text-slate-300"
              : "border-slate-200 bg-slate-50 text-slate-400"
        )}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1 pr-10">
        <span
          className={cn(
            "block text-[0.96rem] font-black tracking-tight sm:text-[1rem]",
            active ? "text-[#101a16]" : disabled ? "text-slate-400" : "text-slate-600"
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "mt-1 block text-[0.8rem] leading-[1.35rem]",
            active ? "text-[#b9c6bf]" : disabled ? "text-slate-300" : "text-slate-500"
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
          "h-[3.55rem] w-full rounded-[0.85rem] border text-center text-[0.9rem] font-black tracking-tight transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#006747]/10",
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
  submitIcon,
  submitLabel,
  successDescription,
  successTitle,
}: {
  barangId: string;
  cancelHref?: string;
  defaultMode?: MarketingMode;
  defaultPrice: number;
  endpoint: string;
  presentation?: "modal" | "panel";
  redirectTo: string;
  serverNow: string;
  submitIcon?: ReactNode;
  submitLabel: string;
  successDescription: string;
  successTitle: string;
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
  const selectedModeLabel = mode === "fixed_price" ? "Fixed Price" : "Vickrey Auction";
  const priceLabel = mode === "fixed_price" ? "Harga Jual Instan" : "Harga Dasar Lelang";
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

  function handleCancel() {
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
        description: "Durasi Vickrey perlu diisi lebih presisi dengan batas maksimal 365 hari.",
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
          : "Barang sedang dipublikasikan sebagai fixed price.",
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
    <div className="w-full max-w-[66rem]">
      <div className="relative overflow-visible rounded-[2rem] border border-[#dfe8e2] bg-white shadow-[0_42px_120px_-52px_rgba(3,21,14,0.82),0_18px_38px_-28px_rgba(8,69,50,0.24)]">
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2">
          <div className="grid size-12 place-items-center rounded-full border-[4px] border-white bg-[#006747] shadow-[0_18px_30px_-18px_rgba(0,103,71,0.7)]">
            {mode === "fixed_price" ? (
              <Tag className="size-4.5 text-white" strokeWidth={2.2} />
            ) : (
              <Gavel className="size-4.5 text-white" strokeWidth={2.2} />
            )}
          </div>
        </div>

        <div className="p-5 pt-14 sm:p-6 sm:pt-14 lg:p-6 lg:pt-14">
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

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-1 text-center">
              <h3 className="font-headline text-[1.34rem] font-black tracking-tight text-[#0e4e34] sm:text-[1.48rem]">
                Pasarkan Barang
              </h3>
              <p className="mx-auto max-w-[34rem] text-[0.8rem] leading-5 text-slate-500">
                Konfigurasi akhir sebelum unit ditayangkan ke katalog publik.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
              <div className="space-y-1.5">
                <FieldLabel>Metode Penjualan</FieldLabel>
                <div className="space-y-2">
                  <ModeCard
                    active={mode === "fixed_price"}
                    description="Penjualan instan dengan harga tetap yang ditentukan. Pembeli dapat langsung melakukan transaksi tanpa proses lelang."
                    icon={<Tag className="size-4.5" strokeWidth={2.2} />}
                    onClick={() => setMode("fixed_price")}
                    title="Fixed Price"
                  />
                  <ModeCard
                    active={mode === "vickrey"}
                    description="Lelang tertutup (sealed-bid) di mana pemenang membayar harga penawaran tertinggi kedua."
                    icon={<Gavel className="size-4.5" strokeWidth={2.2} />}
                    onClick={() => setMode("vickrey")}
                    title="Vickrey Auction"
                  />
                </div>
              </div>

              <div className="space-y-1.5 lg:pl-1">
                <div className="space-y-1.5">
                  <FieldLabel>Mode yang Dipilih</FieldLabel>
                  <div className="rounded-[0.85rem] border border-[#dfe5e1] bg-[#f3f5f4] px-4 py-2 text-[0.92rem] font-medium tracking-tight text-[#bcc5bf] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    {selectedModeLabel}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <FieldLabel htmlFor="marketing-price">{priceLabel}</FieldLabel>
                  <div className="flex overflow-hidden rounded-[1rem] border-2 border-[#cfe5da] bg-white shadow-[0_12px_24px_-24px_rgba(0,103,71,0.18)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-within:border-[#006747] focus-within:ring-4 focus-within:ring-[#006747]/10">
                    <span className="flex items-center px-5 text-[1.1rem] font-black text-[#006747]">
                      Rp
                    </span>
                    <input
                      className="h-[3rem] w-full bg-transparent pr-5 text-[0.92rem] font-black tracking-[0.02em] text-[#0d4e34] outline-none placeholder:text-slate-300"
                      id="marketing-price"
                      inputMode="numeric"
                      onChange={(event) => setPrice(normalizeDigits(event.target.value))}
                      placeholder="0"
                      type="text"
                      value={formatInputCurrency(price)}
                    />
                  </div>
                </div>

                {mode === "vickrey" ? (
                  <div className="space-y-1">
                    <FieldLabel>Durasi Lelang</FieldLabel>
                    <div className="grid grid-cols-4 gap-1.5">
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

                <div className="space-y-2">
                  <div className="relative overflow-hidden rounded-[1rem] bg-[#005f2e] px-4 py-2 text-white shadow-[0_22px_44px_-30px_rgba(0,74,35,0.9)]">
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/12" />
                    <div className="relative grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 pr-2 sm:pr-4">
                        <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-emerald-100">
                          {mode === "fixed_price" ? "Total Harga Jual" : "Total Nilai Dasar"}
                        </p>
                        <p className="font-headline text-[0.9rem] font-black tracking-tight text-white sm:text-[1rem]">
                          {Number.isFinite(normalizedPrice) && normalizedPrice > 0 ? currency.format(normalizedPrice) : "Rp 0"}
                        </p>
                      </div>
                      <div className="space-y-1 pl-0 sm:pl-4">
                        <div className="flex items-center gap-2 text-[0.62rem] font-black uppercase tracking-[0.14em] text-emerald-100">
                          <Info className="size-3.5 opacity-90" strokeWidth={2.2} />
                          <span>{mode === "fixed_price" ? "Status Listing" : "Selesai Pada"}</span>
                        </div>
                        <p className="text-[0.74rem] font-semibold text-emerald-50 sm:text-[0.78rem]">
                          {mode === "fixed_price" ? "Listing aktif di katalog publik" : estimatedEnd}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[0.68rem] italic leading-[1.15rem] text-slate-500">
                    *Dengan menekan tombol di bawah, Anda menyetujui syarat dan ketentuan penempatan unit di katalog publik Pegadaian Lelang.
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                className="h-10 min-w-[6rem] rounded-xl px-0 text-left text-[0.96rem] font-bold tracking-tight text-slate-500 shadow-none hover:bg-transparent hover:text-slate-800"
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
    </div>
  );

  if (presentation === "modal") {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#081b14]/42 p-4 backdrop-blur-[2px] sm:p-5">
        {marketingCard}
      </div>
    );
  }

  return <div className="mx-auto w-full max-w-[66rem]">{marketingCard}</div>;
}
