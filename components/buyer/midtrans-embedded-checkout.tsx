"use client";

import { useEffect, useId, useState } from "react";
import { AlertTriangle, ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/toast";

type SnapCallbacks = {
  embed: (
    token: string,
    options: {
      embedId: string;
      hideCloseButton?: boolean;
      onClose?: () => void;
      onError?: () => void;
      onPending?: () => void;
      onSuccess?: () => void;
    }
  ) => void;
  hide?: () => void;
  show?: () => void;
};

declare global {
  interface Window {
    snap?: SnapCallbacks;
  }
}

let snapScriptPromise: Promise<void> | null = null;

function ensureSnapScript({ clientKey, isProduction }: { clientKey: string; isProduction: boolean }) {
  if (window.snap) {
    return Promise.resolve();
  }

  if (snapScriptPromise) {
    return snapScriptPromise;
  }

  const scriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  snapScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);
    const script = existingScript ?? document.createElement("script");

    const handleLoad = () => {
      if (window.snap) {
        resolve();
      } else {
        reject(new Error("Snap JS belum tersedia setelah script dimuat."));
      }
    };

    if (existingScript) {
      if (window.snap) {
        resolve();
      } else {
        script.addEventListener("load", handleLoad, { once: true });
        script.addEventListener("error", () => reject(new Error("Snap JS tidak dapat dimuat.")), { once: true });
      }
      return;
    }

    script.src = scriptUrl;
    script.async = true;
    script.dataset.clientKey = clientKey;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("Snap JS tidak dapat dimuat.")), { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    snapScriptPromise = null;
    throw error;
  });

  return snapScriptPromise;
}

export function MidtransEmbeddedCheckout({ compact = false, transactionId }: { compact?: boolean; transactionId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const embedId = `midtrans-snap-${useId().replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "embedded" | "closed" | "error">("loading");
  const checkoutHeightClass = compact ? "h-0 min-h-0 flex-1" : "min-h-[34rem]";
  const snapHeightClass = compact ? "h-full min-h-0" : "min-h-[32rem]";

  useEffect(() => {
    let cancelled = false;

    async function mountCheckout() {
      try {
        const configResponse = await fetch("/api/payments/midtrans/config");
        const configPayload = await configResponse.json().catch(() => ({}));

        if (!configResponse.ok) {
          throw new Error(configPayload.message ?? "Layanan pembayaran belum dikonfigurasi.");
        }

        const clientKey = configPayload?.data?.clientKey?.trim();
        if (!clientKey) {
          throw new Error("Layanan pembayaran belum dikonfigurasi.");
        }

        const isProduction = configPayload?.data?.isProduction === true;
        const response = await fetch(`/api/user/transaksi/${transactionId}/midtrans`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message ?? "Pembayaran belum dapat dibuat.");
        }

        const token = payload?.data?.snapToken;

        if (!token) {
          throw new Error("Pembayaran belum dapat diproses.");
        }

        await ensureSnapScript({ clientKey, isProduction });

        if (cancelled || !window.snap) {
          return;
        }

        setStatus("embedded");
        window.snap.embed(token, {
          embedId,
          hideCloseButton: true,
          onClose: () => setStatus("closed"),
          onError: () => {
            setError("Pembayaran mengalami kendala. Muat ulang halaman untuk mencoba lagi.");
            setStatus("error");
          },
          onPending: () => router.refresh(),
          onSuccess: () => router.refresh()
        });
      } catch (checkoutError) {
        if (cancelled) {
          return;
        }

        const message = checkoutError instanceof Error ? checkoutError.message : "Pembayaran belum dapat dimuat.";
        setError(message);
        setStatus("error");
        toast({
          title: "Pembayaran belum tampil",
          description: message,
          variant: "error",
          scope: "buyer"
        });
      }
    }

    void mountCheckout();

    return () => {
      cancelled = true;
    };
  }, [embedId, router, toast, transactionId]);

  const hideCheckout = () => {
    window.snap?.hide?.();
    setStatus("closed");
  };

  const resumeCheckout = () => {
    window.snap?.show?.();
    setStatus("embedded");
  };

  if (status === "error") {
    return (
      <div className={`grid ${checkoutHeightClass} content-center gap-5 rounded-[1.5rem] border border-[#f1d9b2] bg-[linear-gradient(145deg,#fffaf1,#ffffff)] p-6 text-center md:p-8`}>
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#fff0ce] text-[#b7791f]">
          <AlertTriangle className="size-6" />
        </span>
        <div>
          <p className="font-headline text-lg font-black text-[#13211c]">Pembayaran belum dapat ditampilkan</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#62655f]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
        className={`overflow-hidden rounded-[1.5rem] border border-[#dbe8df] bg-white shadow-[0_18px_40px_-34px_rgba(8,69,50,0.3)] ${compact ? "flex h-0 min-h-0 flex-1 flex-col" : ""}`}
      data-testid="midtrans-checkout-shell"
    >
      <div className={`flex items-center justify-between gap-4 border-b border-[#edf1ed] bg-[#f8fbf8] ${compact ? "px-4 py-3" : "px-5 py-4"}`}>
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary">Pembayaran Transfer</p>
          <p className="mt-1 text-sm font-bold text-[#13211c]">Pilih metode pembayaran</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label="Kembali dari pembayaran"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe8df] bg-white px-3 py-1.5 text-xs font-bold text-[#426053] transition-[transform,background-color,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#b7d9c2] hover:bg-[#f2faf4] hover:text-[#006747] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={status === "loading"}
            onClick={hideCheckout}
            type="button"
          >
            <ArrowLeft className="size-3.5" /> Kembali
          </button>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e6f4ea] px-3 py-1.5 text-xs font-black text-[#006747]">
            <ShieldCheck className="size-3.5" /> Aman
          </span>
        </div>
      </div>
      <div className={`relative ${checkoutHeightClass} bg-white ${compact ? "p-2.5 sm:p-3" : "p-3 sm:p-5"}`}>
        <div
          className={`midtrans-snap-container ${snapHeightClass} w-full [&>iframe]:!h-full [&>iframe]:!max-w-none [&>iframe]:!w-full`}
          id={embedId}
        />
        {status === "loading" ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[linear-gradient(145deg,#f8fbf8,#ffffff)] p-8 text-center">
            <div className="grid justify-items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
                <LoaderCircle className="size-7 animate-spin" />
              </span>
              <div>
                <p className="font-headline text-lg font-black text-[#13211c]">Menyiapkan pembayaran</p>
                <p className="mt-1 text-sm leading-6 text-[#62655f]">Metode pembayaran akan muncul di sini.</p>
              </div>
            </div>
          </div>
        ) : null}
        {status === "closed" ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[linear-gradient(145deg,#f8fbf8,#ffffff)] p-8 text-center">
            <div className="grid max-w-sm justify-items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
                <ArrowLeft className="size-6" />
              </span>
              <div>
                <p className="font-headline text-lg font-black text-[#13211c]">Pembayaran disembunyikan</p>
                <p className="mt-1 text-sm leading-6 text-[#62655f]">Anda dapat melanjutkan pembayaran kapan saja.</p>
              </div>
              <button
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-black text-white shadow-[0_14px_26px_-18px_rgba(0,103,71,0.7)] transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#005b3e] active:scale-[0.97]"
                onClick={resumeCheckout}
                type="button"
              >
                Lanjutkan pembayaran
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {status === "closed" ? (
        <div className="border-t border-[#edf1ed] bg-[#fffaf1] px-5 py-3 text-center text-sm font-semibold text-[#8b6a1d]">
          Pembayaran ditutup. Status akan diperbarui jika pembayaran sudah dilakukan.
        </div>
      ) : null}
    </div>
  );
}
