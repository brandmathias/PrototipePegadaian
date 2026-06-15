"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Clock3,
  Gavel,
  LoaderCircle,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  X
} from "lucide-react";

import { DirectPaymentDisclaimer } from "@/components/buyer/direct-payment-disclaimer";
import { LiveCountdown } from "@/components/buyer/live-countdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getBuyerTransactionsHref } from "@/lib/buyer/transaction-links";
import type { Lot } from "@/lib/contracts/catalog";
import { currency } from "@/lib/formatters/currency";
import { formatAppDate } from "@/lib/timezone";

type VickreyBidFormProps = {
  lot: Lot;
  buyerId?: string | null;
  existingBidAmount?: number;
  existingBidStatus?: string;
  hasExistingBid?: boolean;
  isBlacklisted?: boolean;
  blacklistUntil?: Date | null;
  blacklistViolations?: number;
  serverNow?: string;
  triggerClassName?: string;
  triggerLabel?: string;
  variant?: "page" | "trigger";
};

const VICKREY_TERMS = [
  "Penawaran yang dikirim bersifat final, mengikat, dan tidak dapat dibatalkan.",
  "Nominal penawaran minimal sama dengan harga dasar yang tercantum pada sesi lelang.",
  "Jika menang, buyer wajib menyelesaikan pembayaran langsung di unit maksimal 24 jam setelah hasil lelang diumumkan.",
  "Jika pembayaran tidak diselesaikan tepat waktu, transaksi dapat dibatalkan dan akun dikenakan pembatasan sesuai jumlah pelanggaran.",
  "Buyer wajib memastikan data akun dan nomor kontak aktif agar proses konfirmasi hasil lelang dapat berjalan lancar."
];

const VIOLATION_LEVELS = [
  {
    duration: "7 hari",
    impact: "Tidak bisa ikut Lelang Tertutup.",
    label: "Level 1"
  },
  {
    duration: "30 hari",
    impact: "Tidak bisa ikut Lelang Tertutup dan tidak bisa membuat pembelian Harga Tetap baru.",
    label: "Level 2"
  },
  {
    duration: "365 hari",
    impact: "Akun dibatasi penuh dan memerlukan review admin untuk reaktivasi.",
    label: "Level 3+"
  }
];

function createClientSalt() {
  const browserCrypto = globalThis.crypto;

  if (browserCrypto.randomUUID) {
    return browserCrypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  browserCrypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function VickreyBidForm({
  lot,
  buyerId,
  existingBidAmount,
  existingBidStatus,
  hasExistingBid: hasExistingBidProp = false,
  isBlacklisted = false,
  blacklistUntil,
  blacklistViolations = 0,
  serverNow,
  triggerClassName,
  triggerLabel = "Ikut Lelang",
  variant = "page"
}: VickreyBidFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const termsModalOverlayRef = useRef<HTMLDivElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isHydrated, setIsHydrated] = useState(false);
  const [acceptedBidTerms, setAcceptedBidTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsModalChecked, setTermsModalChecked] = useState(false);
  const hasExistingBid = hasExistingBidProp || typeof existingBidAmount === "number";
  const [bidAmount, setBidAmount] = useState(
    typeof existingBidAmount === "number" ? String(existingBidAmount) : String(lot.price)
  );

  const numericBid = Number(bidAmount || 0);
  const invalidBid = Number.isNaN(numericBid) || numericBid < lot.price;
  const blocked = isBlacklisted;
  const bidLocked = hasExistingBid;

  function resetTermsModalScroll() {
    const overlay = termsModalOverlayRef.current;
    if (!overlay) {
      return;
    }

    if (typeof overlay.scrollTo === "function") {
      overlay.scrollTo({ top: 0 });
      return;
    }

    overlay.scrollTop = 0;
  }

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isTermsModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    resetTermsModalScroll();
    const frame = window.requestAnimationFrame(resetTermsModalScroll);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsTermsModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTermsModalOpen]);

  const helperText = useMemo(() => {
    if (blocked) {
      const untilLabel = blacklistUntil ? formatAppDate(blacklistUntil) : "batas waktu belum tersedia";
      return `Akun sedang dibatasi sampai ${untilLabel}. Selama masa blacklist aktif, Anda tidak dapat ikut Lelang Tertutup.`;
    }

    if (hasExistingBid) {
      if (typeof existingBidAmount === "number") {
        return `Bid Anda sudah terkunci sebesar ${currency.format(existingBidAmount)} dan saat ini tercatat dengan status ${existingBidStatus?.toLowerCase()}.`;
      }

      return "Bid terenkripsi Anda sudah terkunci. Setelah deadline, sistem membuka escrow otomatis untuk menghitung pemenang.";
    }

    if (invalidBid) {
      return `Nominal penawaran minimal harus sama atau lebih tinggi dari harga dasar ${currency.format(lot.price)}.`;
    }

    return "Penawaran bersifat tertutup dan baru dibuka sistem setelah sesi lelang berakhir.";
  }, [blacklistUntil, blocked, existingBidAmount, existingBidStatus, hasExistingBid, invalidBid, lot.price]);

  function openTermsModal() {
    setTermsModalChecked(false);
    setIsTermsModalOpen(true);
  }

  function handleConfirmBid() {
    if (!buyerId) {
      router.push(`/login?next=${encodeURIComponent(`/katalog/${lot.id}`)}`);
      return;
    }

    if (!acceptedBidTerms) {
      openTermsModal();
      return;
    }

    handleSubmitBid();
  }

  function handleAcceptTermsAndSubmit() {
    setAcceptedBidTerms(true);
    setTermsModalChecked(true);
    setIsTermsModalOpen(false);
    handleSubmitBid();
  }

  function handleSubmitBid() {
    startTransition(async () => {
      if (!buyerId) {
        router.push(`/login?next=${encodeURIComponent(`/katalog/${lot.id}`)}`);
        return;
      }

      const salt = createClientSalt();
      const normalizedAmount = String(Number(numericBid));
      const bidHash = await sha256Hex(`${lot.id}:${buyerId}:${normalizedAmount}:${salt}`);
      const response = await fetch(`/api/user/bid/${lot.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount: Number(normalizedAmount), bidHash, salt })
      });

      const payload = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/katalog/${lot.id}`)}`);
        return;
      }

      if (!response.ok) {
        toast({
          title: "Bid belum bisa dikirim",
          description: payload.message ?? "Periksa kembali nominal bid Anda.",
          variant: "error",
          scope: "buyer"
        });
        return;
      }

      localStorage.setItem(
        `pegadaian:vickrey-reveal:${buyerId}:${lot.id}`,
        JSON.stringify({
          amount: numericBid,
          bidHash,
          lotId: lot.id,
          lotName: lot.name,
          salt,
          storedAt: new Date().toISOString()
        })
      );

      toast({
        title: "Bid tertutup tersimpan",
        description: "Nominal dikunci sebagai escrow terenkripsi. Sistem akan membuka otomatis setelah deadline.",
        variant: "success",
        scope: "buyer"
      });
      router.push(getBuyerTransactionsHref({ tab: "bids", lotId: lot.id }));
      router.refresh();
    });
  }

  const termsModal =
    isTermsModalOpen && typeof document !== "undefined" ? createPortal(
      <div
        className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto overscroll-contain bg-foreground/55 px-3 py-3 backdrop-blur-sm sm:px-5 sm:py-4"
        data-vickrey-terms-overlay="true"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setIsTermsModalOpen(false);
          }
        }}
        ref={termsModalOverlayRef}
      >
        <section
          aria-labelledby="vickrey-terms-title"
          aria-modal="true"
          className="w-full max-w-lg overflow-hidden rounded-[1.45rem] border border-white/70 bg-white shadow-[0_34px_90px_-42px_rgba(0,34,18,0.68)]"
          role="dialog"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-[#076236] to-[#b28a15] px-4 py-3 text-primary-foreground sm:px-5">
            <div className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-white/14 blur-2xl" />
            <div className="pointer-events-none absolute right-20 top-10 h-20 w-40 rounded-full bg-tertiary-container/35 blur-3xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <ShieldAlert aria-hidden="true" className="size-4.5" />
                </span>
                <div>
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-primary-foreground/72">
                    Ruang Agunan
                  </p>
                  <h3
                    className="mt-0.5 font-headline text-[1.12rem] font-extrabold leading-tight tracking-tight sm:text-[1.28rem]"
                    id="vickrey-terms-title"
                  >
                    Syarat & Ketentuan Penawaran
                  </h3>
                  <p className="mt-1 max-w-[30rem] text-[0.78rem] leading-5 text-primary-foreground/84">
                    Konfirmasi terakhir sebelum bid tertutup Anda dikirim ke sistem.
                  </p>
                </div>
              </div>
              <button
                aria-label="Tutup syarat dan ketentuan"
                className="interactive-tap inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/12 text-primary-foreground transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                onClick={() => setIsTermsModalOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>

          <div className="bg-[#fbfaf5] p-4 sm:p-5">
            <div className="rounded-[1.35rem] border border-primary/15 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <p className="text-sm font-bold text-foreground">
                Baca dan cermati syarat dan ketentuan di bawah ini.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Dengan melanjutkan, Anda menyatakan memahami kewajiban pembayaran dan konsekuensi jika memenangkan lelang.
              </p>
            </div>

            <DirectPaymentDisclaimer
              className="mt-4"
              context="bid"
              unitAddress={lot.unitAddress ?? lot.location}
              unitName={lot.unitName}
            />

            <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-foreground">
              {VICKREY_TERMS.map((term, index) => (
                <li
                  className="grid grid-cols-[2rem_1fr] gap-3 rounded-[1.2rem] border border-border/70 bg-white px-4 py-3"
                  key={term}
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="pt-1">{term}</span>
                </li>
              ))}
            </ol>

            <div className="mt-4 flex items-start gap-3 rounded-[1.25rem] border border-tertiary-container/35 bg-tertiary-container/[0.1] p-4 text-sm text-foreground">
              <LockKeyhole aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-tertiary-container" />
              <div className="space-y-1">
                <p className="font-bold">Status Pelanggaran Anda saat ini: {blacklistViolations}x</p>
                <p className="leading-relaxed text-muted-foreground">
                  Pemenang yang tidak menyelesaikan pembayaran dalam 24 jam akan masuk pembatasan bertingkat.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-border/75 bg-white p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
                <p className="text-sm font-bold text-foreground">Level pembatasan jika pembayaran gagal</p>
              </div>
              <div className="mt-3 divide-y divide-border/70 overflow-hidden rounded-[1rem] border border-border/70">
                {VIOLATION_LEVELS.map((level) => (
                  <div
                    className="grid gap-2 bg-surface-lowest px-3 py-3 text-sm sm:grid-cols-[5rem_4.5rem_1fr] sm:items-center"
                    key={level.label}
                  >
                    <span className="font-bold text-primary">{level.label}</span>
                    <span className="w-fit rounded-full bg-tertiary-container/12 px-3 py-1 text-xs font-bold text-tertiary-container">
                      {level.duration}
                    </span>
                    <span className="leading-relaxed text-muted-foreground">{level.impact}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-primary/15 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <label
                className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-muted-foreground"
                htmlFor="vickrey-terms-bid-amount"
              >
                Nominal penawaran
              </label>
              <Input
                autoComplete="off"
                className="mt-3 h-11 rounded-[0.95rem] bg-surface-low text-base font-semibold"
                disabled={bidLocked || isPending}
                id="vickrey-terms-bid-amount"
                min={lot.price}
                name="modalBidAmount"
                onChange={(event) => setBidAmount(event.target.value)}
                placeholder="Masukkan nominal bid"
                type="number"
                value={bidAmount}
              />
              <div className="mt-3 grid gap-2 rounded-[1rem] bg-primary/[0.04] px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    Harga dasar {currency.format(lot.price)}
                  </span>
                  <span className="text-xs font-bold text-primary">Bid tertutup</span>
                </div>
                <p className="font-headline text-[1.85rem] font-extrabold leading-none tracking-tight text-primary">
                  {currency.format(Number.isNaN(numericBid) ? 0 : numericBid)}
                </p>
                <p
                  className={`text-xs font-semibold leading-relaxed ${invalidBid ? "text-[#9f1239]" : "text-muted-foreground"}`}
                  role={invalidBid ? "alert" : undefined}
                >
                  {invalidBid
                    ? helperText
                    : "Nominal ini akan dikunci sebagai bid tertutup setelah Anda menyetujui syarat lelang."}
                </p>
              </div>
            </div>

            <label
              className="mt-4 flex cursor-pointer items-start gap-3 rounded-[1.25rem] border border-border/75 bg-white p-4 text-sm leading-relaxed text-muted-foreground transition hover:border-primary/35"
              htmlFor="vickrey-terms-modal-check"
            >
              <input
                checked={termsModalChecked}
                className="mt-1 size-5 shrink-0 accent-primary"
                id="vickrey-terms-modal-check"
                onChange={(event) => setTermsModalChecked(event.target.checked)}
                type="checkbox"
              />
              <span>
                Saya telah membaca dan menyetujui syarat lelang ini, termasuk kewajiban
                pembayaran langsung di unit yang tertera jika saya menang.
              </span>
            </label>
          </div>

          <footer className="border-t border-border/70 bg-white/95 px-5 py-4">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                onClick={() => setIsTermsModalOpen(false)}
                type="button"
                variant="secondary"
              >
                Kembali
              </Button>
              <Button
                className="min-w-[13rem]"
                disabled={!termsModalChecked || isPending || blocked || invalidBid || bidLocked}
                onClick={handleAcceptTermsAndSubmit}
                type="button"
              >
                {isPending ? (
                  <>
                    <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
                    {"Mengirim\u2026"}
                  </>
                ) : (
                  "Setujui dan Kirim Bid"
                )}
              </Button>
            </div>
          </footer>
        </section>
      </div>,
      document.body
    ) : null;

  if (variant === "trigger") {
    return (
      <>
        <Button
          className={triggerClassName}
          disabled={!isHydrated || blocked || invalidBid || isPending || bidLocked}
          onClick={handleConfirmBid}
          type="button"
          variant="default"
        >
          {!isHydrated ? (
            "Menyiapkan\u2026"
          ) : bidLocked ? (
            "Bid sudah terkunci"
          ) : isPending ? (
            <>
              <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
              {"Mengirim\u2026"}
            </>
          ) : (
            <>
              {triggerLabel}
              <Gavel className="size-4" />
            </>
          )}
        </Button>
        {termsModal}
      </>
    );
  }

  return (
    <>
      <Card className="overflow-hidden border border-border/70 bg-white">
        <CardHeader className="space-y-3 border-b border-border/60 bg-surface-low/60">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-secondary">
            Lelang Tertutup
          </p>
          <CardTitle>Masukkan penawaran tertutup Anda</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sesuai PRD, bid tertinggi memenangkan lelang, tetapi harga yang dibayar mengikuti
            penawar tertinggi kedua. Jika hanya ada satu penawar, pembayaran tetap mengikuti
            harga dasar.
          </p>
        </CardHeader>

        <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="space-y-5">
            <div className="rounded-[1.75rem] border border-border/70 bg-surface-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Ringkasan sesi lelang
              </p>
              <h3 className="mt-3 text-xl font-bold text-foreground">{lot.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {lot.code} | {lot.unitName}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  Harga dasar {currency.format(lot.price)}
                </div>
                {lot.countdown || lot.endsAt ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-tertiary-container/10 px-4 py-2 text-sm font-semibold text-tertiary-container">
                    <Clock3 className="size-4 text-[#d72b43]" />
                    <LiveCountdown
                      expiredLabel="Menunggu hasil"
                      fallbackLabel={lot.countdown}
                      serverNow={serverNow}
                      targetAt={lot.endsAt}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-primary/10 bg-primary/[0.03] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 size-5 text-primary" />
                <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <p className="font-semibold text-foreground">Yang perlu Anda perhatikan</p>
                  <p>Penawaran tidak terlihat peserta lain selama sesi masih berjalan.</p>
                  <p>Bid yang sudah dikonfirmasi tidak dapat diubah atau dibatalkan.</p>
                  <p>Pemenang wajib menyelesaikan pembayaran langsung di unit maksimal 24 jam setelah hasil keluar.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[1.75rem] border border-border/70 bg-white p-5">
              <label
                className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
                htmlFor="bid-amount"
              >
                Nominal penawaran
              </label>
              <div className="mt-3">
                <Input
                  autoComplete="off"
                  id="bid-amount"
                  disabled={bidLocked}
                  min={lot.price}
                  name="bidAmount"
                  onChange={(event) => setBidAmount(event.target.value)}
                  placeholder="Masukkan nominal bid"
                  type="number"
                  value={bidAmount}
                />
              </div>
              <div className="mt-4 rounded-2xl bg-surface-low p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Ringkasan bid
                </p>
                <p className="mt-3 font-headline text-4xl font-extrabold tracking-tight text-primary">
                  {currency.format(Number.isNaN(numericBid) ? 0 : numericBid)}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Sistem menyimpan nominal sebagai escrow terenkripsi dan hanya membukanya otomatis
                  saat deadline berakhir. Hash tetap dipakai sebagai bukti integritas.
                </p>
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border/70 p-4">
                {blocked || invalidBid ? (
                  <AlertTriangle className="mt-0.5 size-5 text-tertiary-container" />
                ) : (
                  <Gavel className="mt-0.5 size-5 text-primary" />
                )}
                <p className="text-sm leading-relaxed text-muted-foreground">{helperText}</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border/70 bg-surface-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Setelah bid tersimpan
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    1
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Anda bisa memantau status bid dari halaman transaksi buyer.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    2
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Jika menang, sistem membuat transaksi pembayaran secara otomatis.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    3
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Jika tidak menang, riwayat bid tetap tersimpan sebagai arsip pribadi Anda.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="min-w-[14rem]"
                disabled={!isHydrated || blocked || invalidBid || isPending || bidLocked}
                onClick={handleConfirmBid}
              >
                {!isHydrated ? (
                  "Menyiapkan\u2026"
                ) : bidLocked ? (
                  "Bid sudah terkunci"
                ) : isPending ? (
                  <>
                    <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
                    {"Mengirim\u2026"}
                  </>
                ) : (
                  "Konfirmasi Bid Tertutup"
                )}
              </Button>
              <Link href={getBuyerTransactionsHref({ tab: "bids", lotId: lot.id })}>
                <Button variant="secondary">Lihat Transaksi</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {termsModal}
    </>
  );
}
