"use client";

import { useEffect, useRef, type SVGProps } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle } from "lucide-react";

interface FixedPricePaymentModalProps {
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
}

const FOCUSABLE_ELEMENTS =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function FixedPricePaymentModal({
  loading = false,
  onClose,
  onConfirm,
  open
}: FixedPricePaymentModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const loadingRef = useRef(loading);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  loadingRef.current = loading;

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => cancelButtonRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!loadingRef.current) {
          event.preventDefault();
          onClose();
        }
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS) ?? []
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElementRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto overscroll-contain bg-[#071712]/70 p-4 backdrop-blur-[2px]"
      data-testid="fixed-price-payment-backdrop"
    >
      <div
        aria-busy={loading}
        aria-describedby="fixed-price-payment-description"
        aria-labelledby="fixed-price-payment-title"
        aria-modal="true"
        className="modal-viewport toast-enter relative my-auto w-full max-w-[720px] overflow-hidden rounded-[20px] bg-white px-6 pb-7 pt-7 shadow-[0_28px_80px_rgba(0,0,0,0.30)] outline-none sm:rounded-[26px] sm:px-10 sm:pb-10 sm:pt-9 lg:px-12"
        ref={dialogRef}
        role="dialog"
      >
        <button
          aria-label="Tutup konfirmasi pembayaran"
          className="absolute right-5 top-5 grid size-10 place-items-center rounded-full text-[#006B49] transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#F1F8F4] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B49] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50 sm:right-7 sm:top-7"
          disabled={loading}
          onClick={onClose}
          type="button"
        >
          <CloseIcon className="size-7" />
        </button>

        <div className="flex flex-col items-center">
          <div aria-hidden="true" className="mt-5 flex h-[112px] items-center justify-center sm:h-[130px]">
            <div className="relative">
              <CartIcon className="size-[86px] text-[#006B49] sm:size-24" />
              <div className="absolute right-0.5 top-[3px] grid size-11 place-items-center rounded-full bg-[#E5A821] text-2xl font-bold leading-none text-white shadow-[0_6px_14px_rgba(229,168,33,0.25)]">
                !
              </div>
              <SparkleIcon className="absolute -left-8 top-[55px] size-7 text-[#E5A821]" />
              <SparkleIcon className="absolute -right-7 -top-2 size-7 text-[#E5A821]" />
            </div>
          </div>

          <div className="mx-auto mt-5 max-w-[590px] text-center sm:mt-7">
            <h2
              className="text-[27px] font-bold leading-tight tracking-[-0.02em] text-[#006B49] sm:text-[34px]"
              id="fixed-price-payment-title"
            >
              Lanjutkan Pembayaran?
            </h2>
            <div
              className="mt-5 space-y-1 text-[15px] leading-7 text-[#26332E] sm:text-[17px]"
              id="fixed-price-payment-description"
            >
              <p>Barang ini dijual dengan harga tetap.</p>
              <p>Apakah Anda yakin ingin melanjutkan pembayaran?</p>
            </div>
          </div>

          <div className="mt-9 grid w-full grid-cols-1 gap-3 min-[500px]:grid-cols-2 sm:gap-4">
            <button
              className="flex h-[58px] items-center justify-center whitespace-nowrap rounded-xl border-[1.5px] border-[#006B49] bg-white px-6 text-[17px] font-semibold text-[#006B49] transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#F4FAF7] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B49] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
              disabled={loading}
              onClick={onClose}
              ref={cancelButtonRef}
              type="button"
            >
              Tidak
            </button>
            <button
              className="group flex h-[58px] items-center justify-center gap-3 whitespace-nowrap rounded-xl bg-[#006B49] px-6 text-[17px] font-semibold text-white shadow-[0_8px_20px_rgba(0,107,73,0.16)] transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#005B3E] hover:shadow-[0_10px_24px_rgba(0,107,73,0.22)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B49] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
              disabled={loading}
              onClick={onConfirm}
              type="button"
            >
              {loading ? (
                <>
                  <LoaderCircle className="button-spinner size-5" />
                  <span>Menyiapkan Pembayaran</span>
                </>
              ) : (
                <>
                  <span>Ya, Lanjutkan</span>
                  <ArrowRightIcon className="size-5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="6"
      viewBox="0 0 96 96"
      {...props}
    >
      <path d="M16 20h11l8 42h37l9-29H32" />
      <circle cx="42" cy="76" fill="currentColor" r="5" stroke="none" />
      <circle cx="69" cy="76" fill="currentColor" r="5" stroke="none" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" {...props}>
      <path d="M12 2c.8 6.6 3.4 9.2 10 10-6.6.8-9.2 3.4-10 10-.8-6.6-3.4-9.2-10-10 6.6-.8 9.2-3.4 10-10Z" />
    </svg>
  );
}
