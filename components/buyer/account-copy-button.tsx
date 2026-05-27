"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, CreditCard, Hash } from "lucide-react";

import { cn } from "@/lib/utils";

export function AccountCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      {mounted
        ? createPortal(
            <div
              aria-live="polite"
              className={cn(
                "pointer-events-none fixed right-4 top-4 z-[160] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:right-6 sm:top-6",
                copied ? "translate-y-0 scale-100 opacity-100" : "-translate-y-3 scale-[0.96] opacity-0"
              )}
              role="status"
            >
              <div className="relative overflow-hidden rounded-[1.45rem] border border-[#efe3bc] bg-[linear-gradient(135deg,rgba(255,252,244,0.98),rgba(252,244,216,0.98)_52%,rgba(248,237,194,0.98))] p-1 shadow-[0_34px_80px_-36px_rgba(86,67,7,0.48)]">
                <span
                  className={cn(
                    "absolute -right-7 -top-7 size-20 rounded-full bg-[radial-gradient(circle,rgba(217,184,93,0.34),transparent_70%)] transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    copied ? "scale-100 opacity-100" : "scale-50 opacity-0"
                  )}
                />
                <div className="relative flex items-center gap-3 rounded-[calc(1.45rem-0.25rem)] border border-white/40 bg-white/70 px-3.5 py-3 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[1rem] bg-[linear-gradient(145deg,#0f5c42,#167a58)] text-white shadow-[0_18px_34px_-22px_rgba(15,92,66,0.68),inset_0_1px_0_rgba(255,255,255,0.24)]">
                    <CreditCard className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-body text-[0.82rem] font-semibold leading-none text-[#193227]">
                      Rekening tujuan berhasil disalin
                    </span>
                    <span className="mt-1 block text-[0.67rem] font-bold uppercase tracking-[0.14em] text-[#9a7514]">
                      Siap ditempel ke aplikasi bank
                    </span>
                  </span>
                  <span className="relative grid size-8 shrink-0 place-items-center rounded-full bg-[#fff5d7] text-[#b68714]">
                    <span
                      className={cn(
                        "absolute inset-0 rounded-full border border-[#e9cf83] transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        copied ? "scale-[1.45] opacity-0" : "scale-100 opacity-0"
                      )}
                    />
                    <Hash className="size-3.5" />
                  </span>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
      <span className="relative inline-flex items-center justify-center">
      <span
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[1rem] border border-[#d9b85d]/70 transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          copied ? "scale-[1.42] opacity-0" : "scale-100 opacity-0"
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[1rem] bg-[radial-gradient(circle_at_center,rgba(217,184,93,0.26),transparent_68%)] transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          copied ? "scale-[1.25] opacity-100" : "scale-75 opacity-0"
        )}
      />
      <button
        aria-label={copied ? "Nomor rekening tersalin" : "Salin nomor rekening"}
        className={cn(
          "relative inline-flex size-10 items-center justify-center overflow-hidden rounded-[1rem] border border-transparent text-[#8d6c08] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          copied
            ? "scale-[1.05] border-[#ead9a6] bg-[linear-gradient(145deg,#fff7dd,#f3e3a8)] shadow-[0_18px_40px_-20px_rgba(181,141,20,0.68)]"
            : "bg-white/75 hover:-translate-y-0.5 hover:border-[#efe3bc] hover:bg-[#f8f2df] hover:shadow-[0_16px_32px_-24px_rgba(181,141,20,0.48)] active:scale-[0.98]"
        )}
        onClick={handleCopy}
        type="button"
      >
        <span className="relative z-10">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </span>
      </button>
      </span>
    </>
  );
}
