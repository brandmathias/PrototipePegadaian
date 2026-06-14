"use client";

import dynamic from "next/dynamic";
import { Bell } from "lucide-react";

type AlertCenterProps = {
  scope: "buyer" | "admin-unit" | "superadmin";
  className?: string;
};

function AlertCenterFallback() {
  return (
    <div>
      <button
        aria-label="Memuat pusat alert"
        className="interactive-tap relative inline-flex size-12 items-center justify-center rounded-2xl border border-black/10 bg-white text-[#085a41] shadow-sm transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#eef6f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7a57] dark:border-emerald-200/14 dark:bg-[#102019] dark:text-emerald-100 dark:shadow-[0_18px_36px_-28px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-[#14271f]"
        disabled
        type="button"
      >
        <Bell aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}

const LazyAlertCenter = dynamic<AlertCenterProps>(
  () => import("@/components/ui/alert-center").then((module) => module.AlertCenter),
  {
    loading: () => <AlertCenterFallback />,
    ssr: false
  }
);

export function DeferredAlertCenter(props: AlertCenterProps) {
  const { className, ...alertProps } = props;

  return (
    <div className={className}>
      <LazyAlertCenter {...alertProps} />
    </div>
  );
}
