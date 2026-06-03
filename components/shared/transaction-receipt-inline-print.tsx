"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import { Printer } from "lucide-react";

type TransactionReceiptInlinePrintProps = {
  buttonClassName: string;
  children: ReactNode;
  label?: string;
  rootId: string;
};

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
  label = "Cetak Nota",
  rootId
}: TransactionReceiptInlinePrintProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isPrintReady) {
      return;
    }

    const clearPrintSheet = () => setIsPrintReady(false);

    window.addEventListener("afterprint", clearPrintSheet);

    return () => window.removeEventListener("afterprint", clearPrintSheet);
  }, [isPrintReady]);

  const handlePrint = useCallback(async () => {
    flushSync(() => setIsPrintReady(true));
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));

    const root = document.getElementById(rootId);

    if (root) {
      await waitForTransactionReceiptPrintAssets(root);
    }

    window.print();
  }, [rootId]);

  return (
    <>
      <button className={buttonClassName} onClick={() => void handlePrint()} type="button">
        <Printer className="size-4" />
        {label}
      </button>
      {isMounted && isPrintReady
        ? createPortal(
            <div
              className="transaction-receipt-print-document hidden bg-white text-[#10251c] print:block"
              data-testid="transaction-receipt-print-document"
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
                    width: 100% !important;
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
