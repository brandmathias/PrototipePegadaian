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

export function TransactionReceiptInlinePrint({
  buttonClassName,
  children,
  documentClassName = "transaction-receipt-print-document hidden bg-white text-[#10251c] print:block",
  documentTestId = "transaction-receipt-print-document",
  label = "Cetak Nota",
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
    enableReceiptPrintMode();
    window.addEventListener("afterprint", clearPrintSheet, { once: true });

    flushSync(() => setIsPrintReady(true));

    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));

    const root = document.getElementById(rootId);

    if (root) {
      await waitForTransactionReceiptPrintAssets(root);
    }

    window.print();
  }, [clearPrintSheet, rootId]);

  return (
    <>
      <button className={buttonClassName} onClick={() => void handlePrint()} type="button">
        <Printer className="size-4" />
        {label}
      </button>
      {isMounted
        ? createPortal(
            <div
              aria-hidden={!isPrintReady}
              className={`${documentClassName} ${RECEIPT_PRINT_TARGET_CLASS}`}
              data-testid={documentTestId}
              hidden={!isPrintReady}
              id={rootId}
            >
              <style>{`
                @media screen {
                  #${rootId}.${RECEIPT_PRINT_TARGET_CLASS} {
                    display: block !important;
                    position: fixed !important;
                    inset: auto auto auto -10000px !important;
                    width: 210mm !important;
                    max-width: 210mm !important;
                    min-height: 297mm !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    pointer-events: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                  }
                }

                @media print {
                  body.${RECEIPT_PRINTING_BODY_CLASS} > :not(#${rootId}) {
                    display: none !important;
                  }

                  body.${RECEIPT_PRINTING_BODY_CLASS} #${rootId} {
                    display: block !important;
                    position: static !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 210mm !important;
                    max-width: 210mm !important;
                    min-height: 297mm !important;
                  }
                }
              `}</style>
              {isPrintReady ? children : null}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
