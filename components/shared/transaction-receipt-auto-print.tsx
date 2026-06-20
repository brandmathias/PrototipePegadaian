"use client";

import { useEffect } from "react";

async function waitForReceiptAssets(root: HTMLElement) {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );

  await new Promise((resolve) => window.setTimeout(resolve, 120));
}

async function createReceiptPdf(root: HTMLElement) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf")
  ]);

  const canvas = await html2canvas(root, {
    backgroundColor: "#ffffff",
    logging: false,
    scale: Math.min(window.devicePixelRatio || 1.5, 2),
    useCORS: true
  });

  const pdf = new jsPDF({
    compress: true,
    format: "a4",
    orientation: "portrait",
    unit: "mm"
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const horizontalMargin = 0;
  const verticalMargin = 0;
  const maxWidth = pageWidth - horizontalMargin * 2;
  const maxHeight = pageHeight - verticalMargin * 2;
  const imageAspectRatio = canvas.width / canvas.height;

  let renderWidth = maxWidth;
  let renderHeight = renderWidth / imageAspectRatio;

  if (renderHeight > maxHeight) {
    renderHeight = maxHeight;
    renderWidth = renderHeight * imageAspectRatio;
  }

  const x = horizontalMargin;
  const y = verticalMargin;

  pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, renderWidth, renderHeight, undefined, "FAST");

  return pdf;
}

export function TransactionReceiptAutoPrint({
  fileName,
  mode
}: {
  fileName?: string;
  mode?: string;
}) {
  const isAutoOutput = mode === "print" || mode === "download";

  useEffect(() => {
    if (!isAutoOutput) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      const root = document.getElementById("transaction-receipt-document");

      if (!root) {
        return;
      }

      await waitForReceiptAssets(root);

      if (cancelled) {
        return;
      }

      if (mode === "print") {
        window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          window.print();
        }, 120);
        return;
      }

      const pdf = await createReceiptPdf(root);

      if (cancelled) {
        return;
      }

      const safeFileName = fileName || "nota-transaksi";

      if (mode === "download") {
        pdf.save(`${safeFileName}.pdf`);
        window.setTimeout(() => {
          window.close();
        }, 120);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [fileName, isAutoOutput, mode]);

  if (!isAutoOutput) {
    return null;
  }

  return (
    <>
      <style id="transaction-receipt-auto-output-style">{`
        @media screen {
          body:has(#transaction-receipt-auto-output) {
            margin: 0 !important;
            overflow: hidden !important;
            background: #eef3ef !important;
          }

          body:has(#transaction-receipt-auto-output) .buyer-experience-root,
          body:has(#transaction-receipt-auto-output) .buyer-motion-main,
          body:has(#transaction-receipt-auto-output) [data-admin-shell="true"],
          body:has(#transaction-receipt-auto-output) [data-admin-shell="true"] > div {
            min-height: 100dvh !important;
            background: #eef3ef !important;
          }

          body:has(#transaction-receipt-auto-output) .buyer-experience-root > :not(.buyer-motion-main),
          body:has(#transaction-receipt-auto-output) [data-admin-shell="true"] > aside,
          body:has(#transaction-receipt-auto-output) [data-admin-shell="true"] > button,
          body:has(#transaction-receipt-auto-output) [data-admin-shell="true"] > div > header,
          body:has(#transaction-receipt-auto-output) .print\\:hidden:not(.transaction-receipt-output-cover) {
            display: none !important;
          }

          body:has(#transaction-receipt-auto-output) [data-admin-shell="true"] {
            padding-left: 0 !important;
          }

          body:has(#transaction-receipt-auto-output) .buyer-motion-main,
          body:has(#transaction-receipt-auto-output) [data-admin-shell="true"] main {
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
          }

          body:has(#transaction-receipt-auto-output) .receipt-auto-output-stage {
            position: fixed !important;
            inset: 0 !important;
            z-index: 2147483000 !important;
            display: grid !important;
            place-items: center !important;
            width: 100vw !important;
            height: 100dvh !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #eef3ef !important;
          }

          body:has(#transaction-receipt-auto-output) .receipt-auto-output-stage::after {
            content: "";
            position: fixed;
            inset: 0;
            z-index: 3;
            background: #eef3ef;
          }

          body:has(#transaction-receipt-auto-output) #transaction-receipt-document {
            position: relative !important;
            z-index: 1 !important;
          }
        }
      `}</style>
      <div
        aria-live="polite"
        className="transaction-receipt-output-cover fixed inset-0 z-[2147483001] grid place-items-center bg-[#eef3ef] px-6 text-center text-[#0b4f37] print:hidden"
      >
        <div className="rounded-xl border border-[#cbd9cc] bg-white px-4 py-3 shadow-[0_18px_42px_-34px_rgba(8,69,50,0.45)]">
          <p className="text-sm font-semibold">Menyiapkan nota...</p>
        </div>
      </div>
      <div className="sr-only" id="transaction-receipt-auto-output">
        Menyiapkan nota untuk cetak.
      </div>
    </>
  );
}
