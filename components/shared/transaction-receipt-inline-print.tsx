"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import { Printer } from "lucide-react";

const RECEIPT_PRINTING_BODY_CLASS = "transaction-receipt-printing";
const RECEIPT_PRINT_TARGET_CLASS = "transaction-receipt-print-target";

type TransactionReceiptInlinePrintProps = {
  buttonClassName: string;
  children: ReactNode;
  documentClassName?: string;
  documentTestId?: string;
  label?: string;
  mobilePrintHref?: string;
  rootId: string;
};

function enableReceiptPrintMode() {
  document.body.classList.add(RECEIPT_PRINTING_BODY_CLASS);
}

function disableReceiptPrintMode() {
  document.body.classList.remove(RECEIPT_PRINTING_BODY_CLASS);
}

async function waitForTransactionReceiptPrintAssets(root: HTMLElement) {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          let fallback: number | undefined;
          const finish = async () => {
            if (fallback) {
              window.clearTimeout(fallback);
            }
            if (image.naturalWidth > 0 && "decode" in image) {
              try {
                await image.decode();
              } catch {
                // The print preview can still use the loaded bitmap even when decode rejects.
              }
            }
            resolve();
          };

          if (image.complete && image.naturalWidth > 0) {
            void finish();
            return;
          }

          fallback = window.setTimeout(() => resolve(), 800);

          image.addEventListener("load", () => void finish(), { once: true });
          image.addEventListener("error", finish, { once: true });
        })
    )
  );

  await new Promise((resolve) => window.setTimeout(resolve, 80));
}

export function shouldUseDedicatedMobilePrintRoute() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  return (
    /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1)
  );
}

export function openDedicatedMobilePrintView(href: string) {
  const printWindow = window.open(href, "_blank");

  if (printWindow) {
    try {
      printWindow.opener = null;
      printWindow.focus?.();
    } catch {
      // Some mobile browsers expose a restricted WindowProxy after opening a new tab.
    }
    return;
  }

  window.location.assign(href);
}

export function TransactionReceiptInlinePrint({
  buttonClassName,
  children,
  documentClassName = "transaction-receipt-print-document hidden bg-white text-[#10251c] print:block",
  documentTestId = "transaction-receipt-print-document",
  label = "Cetak Nota",
  mobilePrintHref,
  rootId
}: TransactionReceiptInlinePrintProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);

  const clearPrintSheet = useCallback(() => {
    disableReceiptPrintMode();
    setIsPrintReady(false);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isPrintReady) {
      return;
    }

    window.addEventListener("afterprint", clearPrintSheet);

    return () => {
      window.removeEventListener("afterprint", clearPrintSheet);
      disableReceiptPrintMode();
    };
  }, [clearPrintSheet, isPrintReady]);

  const handlePrint = useCallback(async () => {
    if (mobilePrintHref && shouldUseDedicatedMobilePrintRoute()) {
      openDedicatedMobilePrintView(mobilePrintHref);
      return;
    }

    enableReceiptPrintMode();
    window.addEventListener("afterprint", clearPrintSheet, { once: true });

    flushSync(() => setIsPrintReady(true));

    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));

    const root = document.getElementById(rootId);

    if (root) {
      await waitForTransactionReceiptPrintAssets(root);
    }

    window.print();
  }, [clearPrintSheet, mobilePrintHref, rootId]);

  return (
    <>
      <button className={buttonClassName} onClick={() => void handlePrint()} type="button">
        <Printer className="size-4" />
        {label}
      </button>
      {isMounted && isPrintReady
        ? createPortal(
            <div
              className={`${documentClassName} ${RECEIPT_PRINT_TARGET_CLASS}`}
              data-testid={documentTestId}
              id={rootId}
            >
              <style>{`
                @media print {
                  body > :not(#${rootId}) {
                    display: none !important;
                  }

                  #${rootId} {
                    display: block !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 210mm !important;
                    max-width: 210mm !important;
                    min-height: 297mm !important;
                  }
                }
              `}</style>
              {children}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
