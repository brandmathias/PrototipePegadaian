"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type {
  SuperAdminMarketingReceiptContext,
  SuperAdminUnitBarangMarketingSession,
} from "@/components/pages/superadmin-pages";

const MarketingAuditPanel = dynamic(() =>
  import("@/components/pages/superadmin-pages").then(
    (module) => module.SuperAdminMarketingAuditPanel,
  ),
);

export function DeferredSuperAdminMarketingAudit({
  marketing,
  receiptContext,
}: {
  marketing: SuperAdminUnitBarangMarketingSession;
  receiptContext: SuperAdminMarketingReceiptContext;
}) {
  const markerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });

    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="[contain-intrinsic-size:auto_70rem] [content-visibility:auto]"
      ref={markerRef}
    >
      {visible ? (
        <MarketingAuditPanel marketing={marketing} receiptContext={receiptContext} />
      ) : (
        <div
          aria-hidden="true"
          className="h-24 rounded-2xl border border-[#d8e8dd] bg-white"
        />
      )}
    </div>
  );
}
