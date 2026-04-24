"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Lanjutkan",
  cancelLabel = "Batal",
  variant = "default",
  loading = false,
  onConfirm
}: ConfirmDialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Tutup dialog"
        className="absolute inset-0 bg-[#052315]/35 backdrop-blur-[3px]"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <div className="toast-enter relative z-[121] w-full max-w-md overflow-hidden rounded-[1.75rem] border border-border/70 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-primary/75 to-accent" />
        <div className="flex items-start justify-between gap-4 p-6 pb-0">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                variant === "destructive"
                  ? "bg-destructive/12 text-destructive"
                  : "bg-primary/12 text-primary"
              )}
            >
              <TriangleAlert className="size-5" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold text-foreground">{title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>
          <button
            aria-label="Tutup dialog"
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-surface-low hover:text-foreground"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-wrap justify-end gap-3 p-6">
          <Button disabled={loading} onClick={() => onOpenChange(false)} type="button" variant="secondary">
            {cancelLabel}
          </Button>
          <Button
            disabled={loading}
            onClick={onConfirm}
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
          >
            {loading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Memproses...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
