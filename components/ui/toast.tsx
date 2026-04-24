"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (input: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue>({
  toast: () => undefined,
  dismiss: () => undefined
});

function getToastIcon(variant: ToastVariant) {
  if (variant === "success") {
    return CheckCircle2;
  }

  if (variant === "error") {
    return AlertCircle;
  }

  return Info;
}

function getToastClasses(variant: ToastVariant) {
  if (variant === "success") {
    return {
      container: "border-primary/20 bg-[linear-gradient(135deg,rgba(8,90,65,0.12),rgba(255,255,255,0.96))]",
      icon: "bg-primary/12 text-primary",
      accent: "bg-primary"
    };
  }

  if (variant === "error") {
    return {
      container: "border-destructive/20 bg-[linear-gradient(135deg,rgba(184,28,28,0.1),rgba(255,255,255,0.96))]",
      icon: "bg-destructive/12 text-destructive",
      accent: "bg-destructive"
    };
  }

  return {
    container: "border-accent/30 bg-[linear-gradient(135deg,rgba(180,140,12,0.12),rgba(255,255,255,0.96))]",
    icon: "bg-accent/20 text-accent-foreground",
    accent: "bg-accent"
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = React.useCallback((input: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, ...input }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:justify-end"
      >
        <div className="flex w-full max-w-md flex-col gap-3">
          {toasts.map((item) => {
            const Icon = getToastIcon(item.variant);
            const classes = getToastClasses(item.variant);

            return (
              <div
                className={cn(
                  "toast-enter pointer-events-auto relative overflow-hidden rounded-[1.35rem] border shadow-[0_18px_44px_rgba(15,23,42,0.16)] backdrop-blur-sm",
                  classes.container
                )}
                key={item.id}
                role={item.variant === "error" ? "alert" : "status"}
              >
                <div className={cn("absolute inset-y-0 left-0 w-1.5", classes.accent)} />
                <div className="flex items-start gap-3 p-4 pl-5">
                  <div className={cn("mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl", classes.icon)}>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    {item.description ? (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                  <button
                    aria-label="Tutup notifikasi"
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
                    onClick={() => dismiss(item.id)}
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
