"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function StatusSyncRefresh({
  enabled,
  intervalMs = 10000
}: {
  enabled: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      const now = Date.now();
      if (now - lastRefreshAtRef.current < 1000) {
        return;
      }

      lastRefreshAtRef.current = now;
      router.refresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    const timer = window.setInterval(refresh, intervalMs);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, intervalMs, router]);

  return null;
}
