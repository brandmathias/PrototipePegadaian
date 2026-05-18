"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Gavel, LoaderCircle, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { currency } from "@/lib/formatters/currency";

type MarketingMode = "fixed_price" | "vickrey";

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/50 sm:text-xs" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function ModeCard({
  active,
  description,
  icon,
  title,
  onClick
}: {
  active: boolean;
  description: string;
  icon: ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={[
        "group rounded-[1.5rem] border p-5 text-left transition duration-200",
        active
          ? "border-[#0a6a49]/35 bg-[#f1faf5] shadow-[0_18px_34px_rgba(10,106,73,0.10)]"
          : "border-black/10 bg-[#fafaf8] hover:-translate-y-0.5 hover:border-[#0a6a49]/25 hover:bg-white"
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0a6a49] shadow-sm">
          {icon}
        </span>
        <span>
          <span className="block font-semibold text-black/85">{title}</span>
          <span className="mt-2 block text-sm leading-6 text-black/65">{description}</span>
        </span>
      </div>
    </button>
  );
}

export function AdminMarketingForm({
  barangId: _barangId,
  defaultPrice,
  endpoint,
  redirectTo,
  submitIcon,
  submitLabel,
  successDescription,
  successTitle
}: {
  barangId: string;
  defaultPrice: number;
  endpoint: string;
  redirectTo: string;
  submitIcon?: ReactNode;
  submitLabel: string;
  successDescription: string;
  successTitle: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<MarketingMode>("fixed_price");
  const [price, setPrice] = useState(String(Math.max(1, Math.round(defaultPrice || 0))));
  const [durationDays, setDurationDays] = useState("0");
  const [durationHours, setDurationHours] = useState("0");
  const [durationMinutes, setDurationMinutes] = useState("5");
  const [durationSeconds, setDurationSeconds] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedPrice = Number(price);
  const normalizedDurationDays = Number(durationDays);
  const normalizedDurationHours = Number(durationHours);
  const normalizedDurationMinutes = Number(durationMinutes);
  const normalizedDurationSeconds = Number(durationSeconds);
  const normalizedDurationTotalSeconds =
    normalizedDurationDays * 24 * 60 * 60 +
    normalizedDurationHours * 60 * 60 +
    normalizedDurationMinutes * 60 +
    normalizedDurationSeconds;
  const durationSummary = `${durationDays || "0"} hari ${durationHours || "0"} jam ${durationMinutes || "0"} menit ${durationSeconds || "0"} detik`;
  const estimatedEnd = useMemo(() => {
    if (
      mode !== "vickrey" ||
      !Number.isFinite(normalizedDurationTotalSeconds) ||
      normalizedDurationTotalSeconds <= 0
    ) {
      return "Tidak memakai countdown";
    }

    const date = new Date(Date.now() + normalizedDurationTotalSeconds * 1000);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }, [mode, normalizedDurationTotalSeconds]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      toast({
        title: "Harga belum valid",
        description: "Masukkan harga jual atau harga dasar lebih dari nol.",
        variant: "error",
        scope: "admin-unit"
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
        normalizedDurationDays > 30 ||
        normalizedDurationHours < 0 ||
        normalizedDurationHours > 23 ||
        normalizedDurationMinutes < 0 ||
        normalizedDurationMinutes > 59 ||
        normalizedDurationSeconds < 0 ||
        normalizedDurationSeconds > 59 ||
        normalizedDurationTotalSeconds <= 0 ||
        normalizedDurationTotalSeconds > 30 * 24 * 60 * 60)
    ) {
      toast({
        title: "Durasi lelang belum sesuai",
        description: "Durasi Vickrey perlu diisi lebih presisi dengan batas maksimal 30 hari.",
        variant: "error",
        scope: "admin-unit"
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
      duration: 2800
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode,
          price: price.trim(),
          durationDays: mode === "vickrey" ? durationDays.trim() : undefined,
          durationHours: mode === "vickrey" ? durationHours.trim() : undefined,
          durationMinutes: mode === "vickrey" ? durationMinutes.trim() : undefined,
          durationSeconds: mode === "vickrey" ? durationSeconds.trim() : undefined
        })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message ?? "Barang belum berhasil dipublikasikan.");
      }

      toast({
        title: successTitle,
        description: successDescription,
        variant: "success",
        scope: "admin-unit"
      });
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast({
        title: "Pemasaran belum berhasil",
        description: error instanceof Error ? error.message : "Coba ulangi setelah memeriksa data barang.",
        variant: "error",
        scope: "admin-unit",
        duration: 5600
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]" onSubmit={handleSubmit}>
      <Card className="rounded-2xl border border-black/10 bg-white">
        <div className="border-b border-black/8 px-5 py-5 sm:px-6">
          <h3 className="font-headline text-[1.55rem] font-black text-black/85 sm:text-[1.8rem]">
            Pilih Cara Menjual
          </h3>
          <p className="mt-1 text-sm leading-6 text-black/60 sm:text-base">
            Tentukan apakah barang langsung dijual dengan harga pasti atau dibuka sebagai lelang tertutup.
          </p>
        </div>
        <CardContent className="space-y-4 p-6">
          <ModeCard
            active={mode === "fixed_price"}
            description="Cocok untuk barang yang siap dijual langsung dengan harga pasti dan alur transaksi lebih singkat."
            icon={<ShoppingBag className="size-5" />}
            onClick={() => setMode("fixed_price")}
            title="Fixed Price"
          />
          <ModeCard
            active={mode === "vickrey"}
            description="Gunakan untuk lelang tertutup. Countdown hanya aktif pada mode ini dan bid dibuka setelah deadline."
            icon={<Gavel className="size-5" />}
            onClick={() => setMode("vickrey")}
            title="Vickrey Auction"
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-black/10 bg-white">
        <div className="border-b border-black/8 px-5 py-5 sm:px-6">
          <h3 className="font-headline text-[1.55rem] font-black text-black/85 sm:text-[1.8rem]">
            Atur Harga dan Jadwal
          </h3>
          <p className="mt-1 text-sm leading-6 text-black/60 sm:text-base">
            Sistem akan menyimpan harga sebagai harga jual fixed price atau harga dasar lelang.
          </p>
        </div>
        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <FieldLabel>Mode yang dipilih</FieldLabel>
            <div className="rounded-2xl bg-[#f3f3f3] px-4 py-3 font-semibold text-black/75">
              {mode === "fixed_price" ? "Fixed Price" : "Vickrey Auction"}
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="marketing-price">{mode === "fixed_price" ? "Harga jual" : "Harga dasar"}</FieldLabel>
            <Input
              className="h-12"
              id="marketing-price"
              min={1}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="0"
              type="number"
              value={price}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel htmlFor="marketing-duration-days">Hari</FieldLabel>
              <Input
                aria-label="Hari"
                className="h-12"
                disabled={mode !== "vickrey"}
                id="marketing-duration-days"
                max={30}
                min={0}
                onChange={(event) => setDurationDays(event.target.value)}
                type="number"
                value={durationDays}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="marketing-duration-hours">Jam</FieldLabel>
              <Input
                aria-label="Jam"
                className="h-12"
                disabled={mode !== "vickrey"}
                id="marketing-duration-hours"
                max={23}
                min={0}
                onChange={(event) => setDurationHours(event.target.value)}
                type="number"
                value={durationHours}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="marketing-duration-minutes">Menit</FieldLabel>
              <Input
                aria-label="Menit"
                className="h-12"
                disabled={mode !== "vickrey"}
                id="marketing-duration-minutes"
                max={59}
                min={0}
                onChange={(event) => setDurationMinutes(event.target.value)}
                type="number"
                value={durationMinutes}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="marketing-duration-seconds">Detik</FieldLabel>
              <Input
                aria-label="Detik"
                className="h-12"
                disabled={mode !== "vickrey"}
                id="marketing-duration-seconds"
                max={59}
                min={0}
                onChange={(event) => setDurationSeconds(event.target.value)}
                type="number"
                value={durationSeconds}
              />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel>Ringkasan harga</FieldLabel>
            <div className="rounded-2xl bg-[#f3f3f3] px-4 py-3 font-semibold text-[#0a6a49]">
              {Number.isFinite(normalizedPrice) && normalizedPrice > 0
                ? currency.format(normalizedPrice)
                : "Masukkan nominal"}
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel>Ringkasan durasi</FieldLabel>
            <div
              aria-live="polite"
              className="rounded-2xl bg-[#f3f3f3] px-4 py-3 font-semibold text-black/65"
            >
              {mode === "vickrey" ? durationSummary : "Tidak memakai countdown"}
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel>Estimasi selesai</FieldLabel>
            <div className="rounded-2xl bg-[#f3f3f3] px-4 py-3 font-semibold text-black/65">
              {estimatedEnd}
            </div>
          </div>
          <div className="md:col-span-2">
            <Button className="h-12 w-full rounded-2xl" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Menyimpan pemasaran...
                </>
              ) : (
                <>
                  {submitIcon}
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
