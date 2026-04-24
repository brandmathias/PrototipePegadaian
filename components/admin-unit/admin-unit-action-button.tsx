"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type AdminUnitActionButtonProps = {
  endpoint?: string;
  method?: "POST" | "PUT" | "DELETE";
  payload?: Record<string, unknown>;
  successTitle: string;
  successDescription?: string;
  pendingTitle?: string;
  pendingDescription?: string;
  pendingLabel?: string;
  redirectTo?: string;
  refresh?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  confirmVariant?: "default" | "destructive";
  children: ReactNode;
} & Pick<ButtonProps, "className" | "variant">;

export function AdminUnitActionButton({
  endpoint,
  method = "POST",
  payload,
  successTitle,
  successDescription,
  pendingTitle,
  pendingDescription,
  pendingLabel = "Memproses permintaan…",
  redirectTo,
  refresh = true,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  confirmVariant = "default",
  children,
  className,
  variant
}: AdminUnitActionButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  async function runAction() {
    if (!endpoint) {
      toast({
        title: successTitle,
        description: successDescription ?? "Jendela cetak sudah dibuka untuk langkah berikutnya.",
        variant: "success",
        scope: "admin-unit"
      });
      window.print();
      return;
    }

    setIsPending(true);
    toast({
      title: pendingTitle ?? "Permintaan sedang diproses",
      description:
        pendingDescription ??
        "Sistem sedang menjalankan aksi Anda dan akan memberi kabar begitu selesai.",
      variant: "info",
      scope: "admin-unit",
      duration: 2600
    });
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: payload ? JSON.stringify(payload) : undefined
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message ?? "Aksi belum berhasil diproses.");
      }

      toast({
        title: successTitle,
        description: successDescription,
        variant: "success",
        scope: "admin-unit"
      });

      if (redirectTo) {
        router.push(redirectTo);
      }

      if (refresh) {
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Aksi belum berhasil",
        description: error instanceof Error ? error.message : "Coba ulangi beberapa saat lagi.",
        variant: "error",
        scope: "admin-unit",
        duration: 5200
      });
    } finally {
      setIsPending(false);
      setIsConfirmOpen(false);
    }
  }

  return (
    <>
      <Button
        className={className}
        disabled={isPending}
        onClick={() => {
          if (confirmTitle && confirmDescription) {
            setIsConfirmOpen(true);
            return;
          }

          void runAction();
        }}
        type="button"
        variant={variant}
      >
        {isPending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            {pendingLabel}
          </>
        ) : (
          children
        )}
      </Button>
      {confirmTitle && confirmDescription ? (
        <ConfirmDialog
          cancelLabel="Kembali"
          confirmLabel={confirmLabel ?? "Lanjutkan"}
          description={confirmDescription}
          loading={isPending}
          onConfirm={() => void runAction()}
          onOpenChange={setIsConfirmOpen}
          open={isConfirmOpen}
          title={confirmTitle}
          variant={confirmVariant}
        />
      ) : null}
    </>
  );
}
