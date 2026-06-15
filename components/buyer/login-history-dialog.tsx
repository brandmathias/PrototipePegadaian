"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronRight, Clock3, MonitorCheck, X } from "lucide-react";

type LoginHistoryDialogProps = {
  activeSessionCount: number;
  entries: string[];
  accessLabel?: string;
  description?: string;
  sessionTitle?: string;
};

export function LoginHistoryDialog({
  activeSessionCount,
  entries,
  accessLabel = "Akses pembeli",
  description = "Lihat riwayat akses akun",
  sessionTitle = "Sesi Login"
}: LoginHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const visibleEntries = entries.slice(0, 8);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-expanded={open}
        className="group w-full rounded-[1.35rem] border border-primary/10 bg-[linear-gradient(180deg,#ffffff,#f8fbf8)] p-4 text-left transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-[0_22px_50px_-42px_rgba(8,69,50,0.62)] active:scale-[0.99]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/[0.08] text-primary transition duration-500 group-hover:bg-primary group-hover:text-white">
              <CalendarDays className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{sessionTitle}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {activeSessionCount} sesi aktif
            </span>
            <span className="grid size-8 place-items-center rounded-full border border-primary/10 bg-white text-primary transition duration-500 group-hover:translate-x-0.5 group-hover:border-primary/25 group-hover:bg-primary group-hover:text-white">
              <ChevronRight className="size-4" />
            </span>
          </span>
        </div>
      </button>

      {open && typeof document !== "undefined" ? createPortal(
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#102018]/45 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div
            className="modal-viewport relative z-[141] my-auto w-full max-w-xl rounded-[2.25rem] border border-white/55 bg-[#f8f4ea] p-2 shadow-[0_44px_120px_-48px_rgba(3,35,24,0.72)]"
            data-testid="login-history-dialog-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-[calc(2.25rem-0.5rem)] border border-primary/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(242,250,244,0.9)_58%,rgba(255,248,223,0.84))]">
              <div className="absolute -right-16 -top-20 size-52 rounded-full bg-[#d8ad38]/20 blur-3xl" />
              <div className="absolute -left-20 bottom-10 size-48 rounded-full bg-primary/10 blur-3xl" />

              <div className="relative border-b border-primary/10 px-5 py-5 md:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary/45">
                      Keamanan Akun
                    </p>
                    <h3
                      className="mt-1 font-headline text-2xl font-black tracking-[-0.035em] text-[#13211c]"
                      id={titleId}
                    >
                      Riwayat Sesi Login
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      Pantau waktu akses terbaru agar aktivitas akun tetap mudah diawasi.
                    </p>
                  </div>
                  <button
                    aria-label="Tutup riwayat login"
                    className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/10 bg-white/80 text-primary transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-primary hover:text-white active:scale-[0.96]"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="relative space-y-4 p-5 md:p-6">
                <div className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-primary/10 bg-white/72 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <MonitorCheck className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Sesi aktif saat ini</p>
                      <p className="text-xs text-muted-foreground">Perangkat yang masih memiliki akses.</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white">
                    {activeSessionCount}
                  </span>
                </div>

                <div className="rounded-[1.5rem] border border-primary/10 bg-white/82 p-2">
                  {visibleEntries.length > 0 ? (
                    <div className="divide-y divide-primary/10">
                      {visibleEntries.map((entry, index) => (
                        <div
                          className="flex items-center justify-between gap-4 px-3 py-3.5"
                          key={`${entry}-${index}`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#edf6ef] text-primary">
                              <Clock3 className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{accessLabel}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">Sesi login tercatat sistem</p>
                            </div>
                          </div>
                          <p className="shrink-0 text-right text-sm font-medium text-muted-foreground">{entry}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <p className="font-headline text-lg font-black text-foreground">Belum ada riwayat sesi</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Riwayat login akan muncul setelah akun digunakan kembali.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
