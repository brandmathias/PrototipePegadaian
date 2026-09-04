"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CircleOff } from "lucide-react";

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

  return validStatus && validOwner && validExpiry;
}

export function isFixedPriceUnavailable(availability: FixedPriceAvailability) {
  return (
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
  const isSold = availability.status === "sold";
  const isReservedByOther = availability.status === "reserved" && availability.owner === "other";
  const label = isSold ? "Tidak tersedia" : isReservedByOther ? "Sedang diproses" : fallbackLabel;

  return (
    <span
      className={cn(
        "relative rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
        isSold || isReservedByOther
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
  const unavailable = isFixedPriceUnavailable(availability);

  return (
    <div className="relative h-full">
      {children}
      {unavailable ? (
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
                {availability.status === "sold"
                  ? "Barang sudah terjual."
                  : "Sedang diproses pembeli lain."}
              </small>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
