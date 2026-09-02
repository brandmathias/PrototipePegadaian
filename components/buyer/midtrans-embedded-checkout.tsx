"use client";

import { useEffect, useId, useState } from "react";
import { AlertTriangle, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { FixedPriceBuyButton } from "@/components/buyer/fixed-price-buy-button";
import { useToast } from "@/components/ui/toast";

type SnapCallbacks = {
  embed: (
    token: string,
    options: {
      embedId: string;
      onClose?: () => void;
      onError?: () => void;
      onPending?: () => void;
      onSuccess?: () => void;
    }
  ) => void;
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

export function MidtransEmbeddedCheckout({ lotId }: { lotId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const embedId = `midtrans-snap-${useId().replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim() ?? "";
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  const [error, setError] = useState<string | null>(
    clientKey ? null : "Client Key Midtrans belum dikonfigurasi."
  );
  const [status, setStatus] = useState<"loading" | "embedded" | "closed" | "error">(
    clientKey ? "loading" : "error"
  );
  const [showRedirectFallback, setShowRedirectFallback] = useState(!clientKey);

  useEffect(() => {
    let cancelled = false;

    async function mountCheckout() {
      if (!clientKey) {
        return;
      }

      try {
        const response = await fetch(`/api/user/beli/${lotId}`, { method: "POST" });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message ?? "Checkout Midtrans belum dapat dibuat.");
        }

        const token = payload?.data?.snapToken;

        if (!token) {
          throw new Error("Token checkout Midtrans belum diterima.");
        }

        await ensureSnapScript({ clientKey, isProduction });

        if (cancelled || !window.snap) {
          return;
        }

        setStatus("embedded");
        window.snap.embed(token, {
          embedId,
          onClose: () => setStatus("closed"),
          onError: () => {
            setError("Checkout Midtrans mengalami kendala. Anda dapat mencoba melalui halaman Snap.");
            setShowRedirectFallback(true);
            setStatus("error");
          },
          onPending: () => router.refresh(),
          onSuccess: () => router.refresh()
        });
      } catch (checkoutError) {
        if (cancelled) {
          return;
        }

        const message = checkoutError instanceof Error ? checkoutError.message : "Checkout Midtrans belum dapat dimuat.";
        setError(message);
        setShowRedirectFallback(message.includes("Snap JS"));
        setStatus("error");
        toast({
          title: "Checkout Midtrans belum tampil",
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
  }, [clientKey, embedId, isProduction, lotId, router, toast]);

  if (status === "loading") {
    return (
      <div className="grid min-h-[34rem] place-items-center rounded-[1.5rem] border border-[#dbe8df] bg-[linear-gradient(145deg,#f8fbf8,#ffffff)] p-8 text-center">
        <div className="grid justify-items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
            <LoaderCircle className="size-7 animate-spin" />
          </span>
          <div>
            <p className="font-headline text-lg font-black text-[#13211c]">Menyiapkan checkout Midtrans</p>
            <p className="mt-1 text-sm leading-6 text-[#62655f]">Metode pembayaran akan muncul di card ini.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="grid min-h-[34rem] content-center gap-5 rounded-[1.5rem] border border-[#f1d9b2] bg-[linear-gradient(145deg,#fffaf1,#ffffff)] p-6 text-center md:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#fff0ce] text-[#b7791f]">
          <AlertTriangle className="size-6" />
        </span>
        <div>
          <p className="font-headline text-lg font-black text-[#13211c]">Checkout belum dapat ditampilkan</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#62655f]">{error}</p>
        </div>
        {showRedirectFallback ? (
          <FixedPriceBuyButton
            buttonLabel="Buka Checkout Midtrans"
            className="mx-auto h-12 w-full max-w-md rounded-full bg-[#006747] text-sm font-black text-white shadow-[0_18px_32px_-22px_rgba(0,103,71,0.74)] transition-[transform,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.98]"
            lotId={lotId}
            openCheckout
          />
        ) : null}
        <div className="mx-auto flex max-w-md items-start gap-3 rounded-xl border border-primary/10 bg-white px-4 py-3 text-left text-sm leading-6 text-[#62655f]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>Status pembayaran tetap diverifikasi otomatis melalui notifikasi server Midtrans.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[#dbe8df] bg-white shadow-[0_18px_40px_-34px_rgba(8,69,50,0.3)]">
      <div className="flex items-center justify-between gap-4 border-b border-[#edf1ed] bg-[#f8fbf8] px-5 py-4">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary">Checkout Midtrans</p>
          <p className="mt-1 text-sm font-bold text-[#13211c]">Pilih metode pembayaran</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e6f4ea] px-3 py-1.5 text-xs font-black text-[#006747]">
          <ShieldCheck className="size-3.5" /> Aman
        </span>
      </div>
      <div className="min-h-[34rem] bg-white p-3 sm:p-5">
        <div id={embedId} className="min-h-[32rem]" />
      </div>
      {status === "closed" ? (
        <div className="border-t border-[#edf1ed] bg-[#fffaf1] px-5 py-3 text-center text-sm font-semibold text-[#8b6a1d]">
          Checkout ditutup. Status pembayaran tetap akan diperbarui otomatis jika pembayaran sudah dilakukan.
        </div>
      ) : null}
    </div>
  );
}
