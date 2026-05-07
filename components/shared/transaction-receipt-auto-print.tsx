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
  useEffect(() => {
    if (mode !== "print" && mode !== "download") {
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    let previewFrame: HTMLIFrameElement | null = null;
    let previewWindow: Window | null = null;

    const run = async () => {
      const root = document.getElementById("transaction-receipt-document");

      if (!root) {
        return;
      }

      await waitForReceiptAssets(root);

      if (cancelled) {
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
        return;
      }

      const blob = pdf.output("blob");
      objectUrl = window.URL.createObjectURL(blob);
      previewWindow = window.open(objectUrl, "_blank");

      if (previewWindow) {
        window.setTimeout(() => {
          try {
            previewWindow?.focus();
            previewWindow?.print();
          } catch {
            // Fall back to the iframe flow below when the popup is not ready yet.
          }
        }, 800);
        return;
      }

      previewFrame = document.createElement("iframe");
      previewFrame.style.position = "fixed";
      previewFrame.style.right = "0";
      previewFrame.style.bottom = "0";
      previewFrame.style.width = "0";
      previewFrame.style.height = "0";
      previewFrame.style.border = "0";
      previewFrame.src = objectUrl;
      previewFrame.onload = () => {
        window.setTimeout(() => {
          previewFrame?.contentWindow?.focus();
          previewFrame?.contentWindow?.print();
        }, 250);
      };
      document.body.appendChild(previewFrame);
    };

    void run();

    return () => {
      cancelled = true;
      previewFrame?.remove();
      previewWindow?.close();
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileName, mode]);

  return null;
}
