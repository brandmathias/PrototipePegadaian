"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
type ToastScope = "global" | "buyer" | "admin-unit" | "superadmin";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  createdAt: number;
  scope: ToastScope;
  duration: number;
};

type ToastNotification = ToastItem & {
  read: boolean;
};

type ToastInput = {
  title: string;
  description?: string;
  variant: ToastVariant;
  scope?: ToastScope;
  duration?: number;
  persist?: boolean;
};

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  notifications: ToastNotification[];
  unreadCount: number;
  markAllAsRead: (scope?: ToastScope) => void;
  markAsRead: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue>({
  toast: () => "",
  dismiss: () => undefined,
  notifications: [],
  unreadCount: 0,
  markAllAsRead: () => undefined,
  markAsRead: () => undefined
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
      chrome: "",
      container:
        "border-primary/20 bg-[linear-gradient(135deg,rgba(8,90,65,0.14),rgba(255,255,255,0.98)_46%,rgba(240,249,244,0.98))]",
      close: "text-muted-foreground hover:bg-black/5 hover:text-foreground focus-visible:ring-primary/30",
      description: "text-muted-foreground",
      icon: "bg-primary/12 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]",
      accent: "bg-primary",
      progressTrack: "bg-black/6",
      title: "text-foreground"
    };
  }

  if (variant === "error") {
    return {
      chrome: "",
      container:
        "border-destructive/20 bg-[linear-gradient(135deg,rgba(184,28,28,0.12),rgba(255,255,255,0.98)_48%,rgba(255,246,246,0.98))]",
      close: "text-muted-foreground hover:bg-black/5 hover:text-foreground focus-visible:ring-primary/30",
      description: "text-muted-foreground",
      icon: "bg-destructive/12 text-destructive shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]",
      accent: "bg-destructive",
      progressTrack: "bg-black/6",
      title: "text-foreground"
    };
  }

  return {
    chrome: "",
    container:
      "border-accent/30 bg-[linear-gradient(135deg,rgba(180,140,12,0.14),rgba(255,255,255,0.98)_48%,rgba(255,250,232,0.98))]",
    close: "text-muted-foreground hover:bg-black/5 hover:text-foreground focus-visible:ring-primary/30",
    description: "text-muted-foreground",
    icon: "bg-accent/20 text-accent-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
    accent: "bg-accent",
    progressTrack: "bg-black/6",
    title: "text-foreground"
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [notifications, setNotifications] = React.useState<ToastNotification[]>([]);
  const dismissTimersRef = React.useRef(new Map<string, number>());

  const clearDismissTimer = React.useCallback((id: string) => {
    const timerId = dismissTimersRef.current.get(id);

    if (timerId === undefined) {
      return;
    }

    window.clearTimeout(timerId);
    dismissTimersRef.current.delete(id);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    clearDismissTimer(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, [clearDismissTimer]);

  React.useEffect(() => {
    return () => {
      dismissTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      dismissTimersRef.current.clear();
    };
  }, []);

  const markAsRead = React.useCallback((id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = React.useCallback((scope?: ToastScope) => {
    setNotifications((current) =>
      current.map((notification) =>
        !scope || notification.scope === scope || notification.scope === "global"
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const toast = React.useCallback((input: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const shouldPersist = input.persist ?? false;
    const item: ToastItem = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant,
      createdAt: Date.now(),
      scope: input.scope ?? "global",
      duration: input.duration ?? 4200
    };

    setToasts((current) => [...current, item]);
    if (shouldPersist) {
      setNotifications((current) => [{ ...item, read: false }, ...current].slice(0, 12));
    }

    const timerId = window.setTimeout(() => {
      dismissTimersRef.current.delete(id);
      setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
    }, item.duration);
    dismissTimersRef.current.set(id, timerId);

    return id;
  }, []);

  const unreadCount = React.useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  return (
    <ToastContext.Provider
      value={{
        toast,
        dismiss,
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead
      }}
    >
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 top-3 z-[200] flex max-h-[calc(100dvh-1rem)] justify-center overflow-y-auto px-3 pt-[env(safe-area-inset-top)] sm:top-4 sm:justify-end sm:px-4"
      >
        <div className="flex w-full max-w-md flex-col gap-3">
          {toasts.map((item) => {
            const Icon = getToastIcon(item.variant);
            const classes = getToastClasses(item.variant);

            return (
              <div
                className={cn(
                  "pointer-events-auto relative overflow-hidden rounded-[1.35rem] border backdrop-blur-xl",
                  "toast-enter shadow-[0_18px_44px_rgba(15,23,42,0.16)]",
                  classes.container
                )}
                key={item.id}
                role={item.variant === "error" ? "alert" : "status"}
                style={
                  {
                    "--toast-duration": `${item.duration}ms`
                  } as React.CSSProperties
                }
              >
                {classes.chrome ? <div className={cn("pointer-events-none absolute inset-0", classes.chrome)} /> : null}
                <div className="toast-sheen pointer-events-none absolute inset-0" />
                <div className={cn("absolute inset-y-0 left-0 w-1.5", classes.accent)} />
                <div className="flex min-w-0 items-start gap-3 p-3 pl-4 sm:p-4 sm:pl-5">
                  <div
                    className={cn(
                      "toast-icon-pop mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl",
                      classes.icon
                    )}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className={cn("break-words text-sm font-semibold leading-snug", classes.title)}>
                      {item.title}
                    </p>
                    {item.description ? (
                      <p
                        className={cn(
                          "mt-1 break-words text-justify text-sm leading-relaxed [text-align-last:left]",
                          classes.description
                        )}
                      >
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <button
                    aria-label="Tutup notifikasi"
                    className={cn(
                      "interactive-tap -mr-1 -mt-1 grid size-10 shrink-0 place-items-center rounded-full p-1 transition-[background-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 sm:mr-0 sm:mt-0",
                      classes.close
                    )}
                    onClick={() => dismiss(item.id)}
                    type="button"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                </div>
                <div className={cn("toast-progress absolute inset-x-0 bottom-0 h-[3px]", classes.progressTrack)}>
                  <div className={cn("toast-progress-bar h-full origin-left", classes.accent)} />
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
