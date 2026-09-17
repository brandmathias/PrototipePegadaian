"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Clock3, CircleOff } from "lucide-react";

import {
  DEFAULT_FIXED_PRICE_AVAILABILITY,
  type FixedPriceAvailability
} from "@/lib/contracts/fixed-price-availability";
import { cn } from "@/lib/utils";

type AvailabilityContextValue = {
  availability: FixedPriceAvailability;
  refresh: () => Promise<void>;
};

const DEFAULT_CONTEXT_VALUE: AvailabilityContextValue = {
  availability: DEFAULT_FIXED_PRICE_AVAILABILITY,
  refresh: async () => undefined
};

const FixedPriceAvailabilityContext = createContext<AvailabilityContextValue | null>(null);

function isFixedPriceAvailability(value: unknown): value is FixedPriceAvailability {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<FixedPriceAvailability>;
  const validStatus = ["available", "reserved", "sold"].includes(candidate.status ?? "");
  const validOwner = candidate.owner === null || candidate.owner === "self" || candidate.owner === "other";
  const validExpiry = candidate.expiresAt === null || typeof candidate.expiresAt === "string";
  const validBuyerActiveInvoice =
    candidate.buyerActiveInvoice === undefined ||
    candidate.buyerActiveInvoice === null ||
    (typeof candidate.buyerActiveInvoice === "object" &&
      typeof candidate.buyerActiveInvoice.transactionId === "string" &&
      (candidate.buyerActiveInvoice.expiresAt === null ||
        typeof candidate.buyerActiveInvoice.expiresAt === "string"));

  return validStatus && validOwner && validExpiry && validBuyerActiveInvoice;
}

export function hasActiveFixedPriceInvoice(availability: FixedPriceAvailability) {
  return Boolean(availability.buyerActiveInvoice);
}

export function isFixedPriceUnavailable(availability: FixedPriceAvailability) {
  return (
    hasActiveFixedPriceInvoice(availability) ||
    availability.status === "sold" ||
    (availability.status === "reserved" &&
      (availability.owner === "other" || availability.canContinue === false))
  );
}

export function FixedPriceAvailabilityProvider({
  children,
  enabled = true,
  initialAvailability,
  lotId
}: {
  children: ReactNode;
  enabled?: boolean;
  initialAvailability?: FixedPriceAvailability;
  lotId: string;
}) {
  const [availability, setAvailability] = useState<FixedPriceAvailability>(
    initialAvailability ?? DEFAULT_FIXED_PRICE_AVAILABILITY
  );

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/barang/${lotId}/availability`, {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        return;
      }

      const payload: unknown = await response.json().catch(() => null);
      const nextAvailability =
        payload && typeof payload === "object" && "data" in payload
          ? (payload as { data?: unknown }).data
          : null;

      if (isFixedPriceAvailability(nextAvailability)) {
        setAvailability(nextAvailability);
      }
    } catch {
      // A temporary refresh failure should not interrupt the checkout action.
    }
  }, [lotId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void refresh();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, 5_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, refresh]);

  const contextValue = useMemo(
    () => ({ availability, refresh }),
    [availability, refresh]
  );

  return (
    <FixedPriceAvailabilityContext.Provider value={contextValue}>
      {children}
    </FixedPriceAvailabilityContext.Provider>
  );
}

export function useFixedPriceAvailability() {
  return useContext(FixedPriceAvailabilityContext) ?? DEFAULT_CONTEXT_VALUE;
}

export function FixedPriceAvailabilityBadge({ fallbackLabel = "Tersedia" }: { fallbackLabel?: string }) {
  const { availability } = useFixedPriceAvailability();
  const hasActiveInvoice = hasActiveFixedPriceInvoice(availability);
  const isSold = availability.status === "sold";
  const isReservedByOther = availability.status === "reserved" && availability.owner === "other";
  const label = hasActiveInvoice ? "Pembayaran aktif" : isSold || isReservedByOther ? "Tidak tersedia" : fallbackLabel;

  return (
    <span
      className={cn(
        "relative rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
        hasActiveInvoice
          ? "bg-[#fff7e1] text-[#956b00]"
          : isSold || isReservedByOther
          ? "bg-[#fff0f2] text-[#b4233c]"
          : "bg-[#f7f2e8] text-[#9a6a00]"
      )}
      data-testid="fixed-price-availability-badge"
    >
      {label}
    </span>
  );
}

export function FixedPriceAvailabilityMedia({ children }: { children: ReactNode }) {
  const { availability } = useFixedPriceAvailability();
  const hasActiveInvoice = hasActiveFixedPriceInvoice(availability);
  const unavailable = isFixedPriceUnavailable(availability);
  const showUnavailableMedia = unavailable && !hasActiveInvoice;

  return (
    <div className="relative h-full">
      {children}
      {showUnavailableMedia ? (
        <div
          className="fixed-price-unavailable-media pointer-events-none absolute inset-0 z-[3] grid place-items-center bg-[#17231d]/16 px-6 backdrop-blur-[1px]"
          data-testid="fixed-price-unavailable-media"
        >
          <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-white/80 bg-white/[0.96] px-4 py-3 text-left shadow-[0_18px_42px_rgba(8,69,50,0.18)] sm:px-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff0f2] text-[#b4233c]">
              <CircleOff className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <strong className="block text-sm font-black leading-5 text-[#183f32] sm:text-[15px]">
                Barang tidak tersedia
              </strong>
              <small className="mt-0.5 block text-xs font-medium leading-5 text-[#66756e]">
                {hasActiveInvoice
                  ? "Selesaikan pembayaran Harga Tetap yang masih aktif sebelum membeli barang lain."
                  : availability.status === "sold"
                  ? "Barang sudah terjual."
                  : "Pembelian tidak tersedia saat ini."}
              </small>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FixedPriceActiveInvoiceNotice() {
  const { availability } = useFixedPriceAvailability();
  const activeInvoice = availability.buyerActiveInvoice;

  if (!activeInvoice) {
    return null;
  }

  return (
    <div
      className="relative flex items-start gap-3 rounded-[1.35rem] border border-[#f0d899] bg-[linear-gradient(135deg,#fffaf0,#fff5dc)] p-4 text-[#765a16] shadow-[0_20px_44px_-34px_rgba(149,107,0,0.48)]"
      data-testid="fixed-price-active-invoice-notice"
      role="status"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#a97700] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <Clock3 className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black text-[#624b13]">Pembayaran Harga Tetap masih aktif</p>
        <p className="mt-1 text-sm leading-6 text-[#806a32]">
          Selesaikan pembayaran pada invoice yang sedang berjalan sebelum membeli barang Harga Tetap lain.
        </p>
        <Link
          className="mt-2 inline-flex items-center text-sm font-black text-[#805f00] underline decoration-[#d3a62e] decoration-2 underline-offset-4 transition duration-200 ease-out hover:text-[#5d4300]"
          href={`/transaksi/${activeInvoice.transactionId}`}
        >
          Lihat pembayaran aktif
        </Link>
      </div>
    </div>
  );
}
