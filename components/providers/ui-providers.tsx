"use client";

import { ToastProvider } from "@/components/ui/toast";

export function UiProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
