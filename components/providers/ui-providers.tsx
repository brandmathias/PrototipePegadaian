"use client";

import { ToastProvider } from "@/components/ui/toast";
import { PushServiceWorkerUpdater } from "@/components/ui/push-notification-control";

export function UiProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider><PushServiceWorkerUpdater />{children}</ToastProvider>;
}
