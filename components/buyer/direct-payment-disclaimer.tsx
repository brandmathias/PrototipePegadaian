import { Clock3, MapPinned, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

type DirectPaymentDisclaimerProps = {
  checked?: boolean;
  checkboxId?: string;
  className?: string;
  context?: "purchase" | "bid";
  onCheckedChange?: (checked: boolean) => void;
  showCheckbox?: boolean;
  unitAddress?: string | null;
  unitName: string;
};

const OPERATIONAL_HOURS = "Senin-Jumat 08.00-15.00, Sabtu 08.00-12.00 waktu setempat";

export function DirectPaymentDisclaimer({
  checked = false,
  checkboxId = "direct-payment-confirmation",
  className,
  context = "purchase",
  onCheckedChange,
  showCheckbox = false,
  unitAddress,
  unitName
}: DirectPaymentDisclaimerProps) {
  const resolvedAddress = unitAddress?.trim() || "Alamat unit belum dilengkapi. Hubungi unit sebelum datang.";
  const actionText =
    context === "bid"
      ? "Jika Anda menang, pembayaran hasil lelang hanya dapat diselesaikan di unit pemilik barang."
      : "Bayar langsung hanya dapat diselesaikan di unit pemilik barang.";

  return (
    <div
      className={cn(
        "rounded-[1.65rem] border border-amber-300/45 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(255,255,255,0.98)_56%,rgba(240,249,244,0.92))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-200/45 text-[#8a6410]">
          <MapPinned aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#8a6410]">
            Konfirmasi lokasi bayar langsung
          </p>
          <h4 className="mt-2 text-lg font-extrabold tracking-tight text-foreground">
            {unitName}
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {actionText} Pastikan Anda dapat mengunjungi unit ini sebelum batas waktu pembayaran.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl border border-black/5 bg-white/78 p-4">
          <div className="flex items-start gap-3">
            <MapPinned aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Alamat unit
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground">
                {resolvedAddress}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white/78 p-4">
          <div className="flex items-start gap-3">
            <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Jam operasional
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground">
                {OPERATIONAL_HOURS}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 text-sm leading-relaxed text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Tidak ada pembatasan berdasarkan kota pengguna. Namun, informasi unit harus dipahami
          sebelum submit agar Anda tidak memilih pembayaran langsung ke unit yang tidak bisa dikunjungi.
        </p>
      </div>

      {showCheckbox ? (
        <label
          className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-black/8 bg-white p-4 text-sm leading-relaxed text-foreground transition hover:border-primary/30"
          htmlFor={checkboxId}
        >
          <input
            checked={checked}
            className="mt-1 size-5 shrink-0 accent-primary"
            id={checkboxId}
            onChange={(event) => onCheckedChange?.(event.target.checked)}
            type="checkbox"
          />
          <span>
            Saya memahami pembayaran langsung harus dilakukan di unit yang tertera dan saya dapat
            datang sesuai jam operasional sebelum batas waktu berakhir.
          </span>
        </label>
      ) : null}
    </div>
  );
}
