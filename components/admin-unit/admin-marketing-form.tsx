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

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/50 sm:text-xs">
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
  const [durationDays, setDurationDays] = useState("7");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedPrice = Number(price);
  const normalizedDuration = Number(durationDays);
  const estimatedEnd = useMemo(() => {
    if (mode !== "vickrey" || !Number.isFinite(normalizedDuration) || normalizedDuration < 1) {
      return "Tidak memakai countdown";
    }

    const date = new Date(Date.now() + normalizedDuration * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }, [mode, normalizedDuration]);

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

    if (mode === "vickrey" && (!Number.isInteger(normalizedDuration) || normalizedDuration < 1 || normalizedDuration > 30)) {
      toast({
        title: "Durasi lelang belum sesuai",
        description: "Durasi Vickrey perlu diisi 1 sampai 30 hari.",
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
          price: normalizedPrice,
          durationDays: mode === "vickrey" ? normalizedDuration : undefined
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
            <FieldLabel>{mode === "fixed_price" ? "Harga jual" : "Harga dasar"}</FieldLabel>
            <Input
              className="h-12"
              min={1}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="0"
              type="number"
              value={price}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Durasi lelang (hari)</FieldLabel>
            <Input
              className="h-12"
              disabled={mode !== "vickrey"}
              max={30}
              min={1}
              onChange={(event) => setDurationDays(event.target.value)}
              placeholder="Isi 1 sampai 30 hari"
              type="number"
              value={durationDays}
            />
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
