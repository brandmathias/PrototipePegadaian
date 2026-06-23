"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import { Printer } from "lucide-react";

import { cn } from "@/lib/utils";

const RECEIPT_PRINTING_BODY_CLASS = "transaction-receipt-printing";
const RECEIPT_PRINT_TARGET_CLASS = "transaction-receipt-print-target";

type TransactionReceiptInlinePrintProps = {
  buttonClassName: string;
  children: ReactNode;
  documentClassName?: string;
  documentTestId?: string;
  disabledReason?: string | null;
  label?: string;
  rootId: string;
};

function enableReceiptPrintMode() {
  document.body.classList.add(RECEIPT_PRINTING_BODY_CLASS);
}

function disableReceiptPrintMode() {
  document.body.classList.remove(RECEIPT_PRINTING_BODY_CLASS);
}

export function shouldUseIsolatedReceiptPrintFrame() {
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

function isJsdomRuntime() {
  const isTestEnvironment =
    typeof process !== "undefined" && process.env.NODE_ENV === "test";

  return isTestEnvironment || (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent || ""));
}

async function waitForTransactionReceiptPrintAssets(root: HTMLElement) {
  const ownerDocument = root.ownerDocument || document;
  const ownerWindow = ownerDocument.defaultView || window;

  if ("fonts" in ownerDocument) {
    await Promise.race([
      ownerDocument.fonts.ready.catch(() => undefined),
      new Promise((resolve) => ownerWindow.setTimeout(resolve, 320))
    ]);
  }

  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          let fallback: number | undefined;
          const finish = async () => {
            if (fallback) {
              ownerWindow.clearTimeout(fallback);
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

          fallback = ownerWindow.setTimeout(() => void finish(), 360);

          image.addEventListener("load", () => void finish(), { once: true });
          image.addEventListener("error", finish, { once: true });
        })
    )
  );

  await new Promise((resolve) => ownerWindow.setTimeout(resolve, 40));
}

function syncReceiptPrintFrameHead(sourceDocument: Document, targetDocument: Document) {
  targetDocument.head.replaceChildren();

  const base = targetDocument.createElement("base");
  base.href = sourceDocument.location?.origin ? `${sourceDocument.location.origin}/` : window.location.href;
  targetDocument.head.appendChild(base);

  sourceDocument.head.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    targetDocument.head.appendChild(node.cloneNode(true));
  });
}

export async function printReceiptElementInIsolatedFrame(root: HTMLElement) {
  const sourceDocument = root.ownerDocument || document;
  const sourceWindow = sourceDocument.defaultView || window;
  const frame = sourceDocument.createElement("iframe");

  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("data-receipt-print-frame", "true");
  frame.setAttribute("data-receipt-root-id", root.id);
  frame.title = "Nota siap cetak";
  frame.style.position = "fixed";
  frame.style.left = "-10000px";
  frame.style.top = "0";
  frame.style.width = "1px";
  frame.style.height = "1px";
  frame.style.border = "0";
  frame.style.opacity = "0";
  frame.style.pointerEvents = "none";

  sourceDocument.body.appendChild(frame);

  const targetDocument = frame.contentDocument;
  const targetWindow = frame.contentWindow;

  if (!targetDocument || !targetWindow) {
    window.print();
    frame.remove();
    return;
  }

  targetDocument.open();
  targetDocument.write("<!doctype html><html><head></head><body></body></html>");
  targetDocument.close();
  targetDocument.body.className = RECEIPT_PRINTING_BODY_CLASS;

  syncReceiptPrintFrameHead(sourceDocument, targetDocument);

  const printStyle = targetDocument.createElement("style");
  printStyle.textContent = `
    @page {
      size: A4;
      margin: 0;
    }

    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm !important;
      min-height: 297mm !important;
      background: #ffffff !important;
    }

    #${root.id} {
      display: block !important;
      position: static !important;
      visibility: visible !important;
      opacity: 1 !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm !important;
      max-width: 210mm !important;
      min-height: 297mm !important;
      pointer-events: auto !important;
    }
  `;
  targetDocument.head.appendChild(printStyle);

  const clonedRoot = root.cloneNode(true) as HTMLElement;
  clonedRoot.removeAttribute("hidden");
  clonedRoot.removeAttribute("aria-hidden");
  Array.from(clonedRoot.children).forEach((child) => {
    if (child.tagName === "STYLE") {
      child.remove();
    }
  });
  targetDocument.body.appendChild(clonedRoot);

  await waitForTransactionReceiptPrintAssets(clonedRoot);

  frame.setAttribute("data-receipt-print-invoked", "true");

  if (!isJsdomRuntime()) {
    targetWindow.print();
  }

  const cleanup = () => frame.remove();
  targetWindow.addEventListener("afterprint", cleanup, { once: true });
  sourceWindow.setTimeout(cleanup, 60_000);
}

export function TransactionReceiptInlinePrint({
  buttonClassName,
  children,
  documentClassName = "transaction-receipt-print-document hidden bg-white text-[#10251c] print:block",
  documentTestId = "transaction-receipt-print-document",
  disabledReason,
  label = "Cetak Nota",
  rootId
}: TransactionReceiptInlinePrintProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const isDisabled = Boolean(disabledReason);
  const disabledDescriptionId = disabledReason ? `${rootId}-disabled-reason` : undefined;

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
    if (disabledReason) {
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

    if (root && shouldUseIsolatedReceiptPrintFrame()) {
      await printReceiptElementInIsolatedFrame(root);
      clearPrintSheet();
      return;
    }

    window.print();
  }, [clearPrintSheet, disabledReason, rootId]);

  return (
    <>
      <span className="inline-flex flex-col gap-1">
        <button
          aria-describedby={disabledDescriptionId}
          className={cn(
            buttonClassName,
            isDisabled &&
              "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 shadow-none saturate-[0.82] blur-[0.65px] hover:bg-slate-100 hover:text-slate-400 active:scale-100"
          )}
          disabled={isDisabled}
          onClick={() => void handlePrint()}
          title={disabledReason ?? undefined}
          type="button"
        >
          <Printer className="size-4" />
          {label}
        </button>
        {disabledReason ? (
          <span className="max-w-[18rem] text-[0.72rem] font-semibold leading-5 text-muted-foreground" id={disabledDescriptionId}>
            {disabledReason}
          </span>
        ) : null}
      </span>
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
