"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, FileText, LoaderCircle, ShieldCheck, ShieldX, X } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  BLACKLIST_REVIEW_APPROVAL_REASONS,
  BLACKLIST_REVIEW_REJECTION_REASONS,
  type BlacklistReviewDecision
} from "@/lib/blacklist/review";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Textarea } from "@/components/ui/textarea";

type SuperadminReviewCase = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  itemName: string;
  unitName: string;
  status: string;
  submittedAt: string;
  buyerStatement: string;
  adminRecommendation: string | null;
  adminRecommendationNote: string | null;
  level: number;
  lockedAccount: boolean;
  hasAdminRecommendation: boolean;
  priorityScore: number;
  attachments: Array<{
    id: string;
    fileUrl: string;
    fileName: string;
    mimeType: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Makassar"
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function isTerminalStatus(status: string) {
  return status === "DISETUJUI" || status === "DITOLAK";
}

function getReasonOptions(decision: BlacklistReviewDecision) {
  return decision === "DISETUJUI" ? BLACKLIST_REVIEW_APPROVAL_REASONS : BLACKLIST_REVIEW_REJECTION_REASONS;
}

export function BlacklistReviewQueue({ cases }: { cases: SuperadminReviewCase[] }) {
  const router = useRouter();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [decision, setDecision] = useState<BlacklistReviewDecision>("DISETUJUI");
  const [reasonCode, setReasonCode] = useState<string>(BLACKLIST_REVIEW_APPROVAL_REASONS[0].code);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ title: string; description?: string; variant: "error" | "success" } | null>(
    null
  );
  const pendingCases = cases.filter((item) => !isTerminalStatus(item.status));
  const terminalCases = cases.length - pendingCases.length;
  const reasonOptions = useMemo(() => getReasonOptions(decision), [decision]);
  const selectedCase = cases.find((item) => item.id === selectedCaseId) ?? null;

  useEffect(() => {
    if (!selectedCase || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedCase]);

  function updateDecision(nextDecision: BlacklistReviewDecision) {
    setDecision(nextDecision);
    setReasonCode(getReasonOptions(nextDecision)[0].code);
  }

  function closeDecisionDialog() {
    if (isPending) {
      return;
    }

    setSelectedCaseId(null);
    setNote("");
  }

  function submitDecision(caseId: string) {
    setFeedback(null);
    startTransition(async () => {
      const response = await fetch(`/api/superadmin/blacklist-review/${caseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reasonCode, note })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFeedback({
          title: "Keputusan belum tersimpan",
          description: payload.message ?? "Periksa kembali hasil keputusan dan alasan yang dipilih.",
          variant: "error"
        });
        return;
      }

      setSelectedCaseId(null);
      setNote("");
      setFeedback({
        title: "Keputusan review tersimpan",
        description:
          decision === "DISETUJUI"
            ? "Pembatasan untuk insiden ini dicabut dan akumulasi pelanggaran disesuaikan."
            : "Blacklist tetap berlaku dan alasan penolakan tersimpan untuk buyer.",
        variant: "success"
      });
      router.refresh();
    });
  }

  const decisionDialog =
    selectedCase && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[150] overflow-y-auto px-4 py-6 sm:px-6 lg:py-8">
            <button
              aria-label="Tutup panel keputusan"
              className="fixed inset-0 bg-[#07131e]/62 backdrop-blur-[5px]"
              onClick={closeDecisionDialog}
              type="button"
            />
            <section
              aria-labelledby="superadmin-review-decision-title"
              aria-modal="true"
              className="relative z-[151] mx-auto w-full max-w-3xl"
              role="dialog"
            >
              <div className="overflow-hidden rounded-[1.35rem] border border-[#d8e4de] bg-white shadow-[0_42px_118px_-46px_rgba(3,21,14,0.84),0_18px_38px_-28px_rgba(8,69,50,0.24)]">
                <div className="flex items-start justify-between gap-4 border-b border-[#edf2ee] px-5 py-5 sm:px-6">
                  <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary/60">
                      Panel Superadmin
                    </p>
                    <h2
                      className="mt-2 font-headline text-2xl font-extrabold tracking-tight text-foreground"
                      id="superadmin-review-decision-title"
                    >
                      Putuskan Review Buyer
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Tinjau keterangan buyer, rekomendasi admin unit, dan lampiran sebelum menyimpan keputusan final.
                    </p>
                  </div>
                  <button
                    aria-label="Tutup"
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-surface-low hover:text-foreground active:scale-[0.98]"
                    onClick={closeDecisionDialog}
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="max-h-[calc(100dvh-11rem)] overflow-y-auto p-5 sm:p-6">
                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                    <div>
                      <p className="text-lg font-bold text-foreground">{selectedCase.buyerName}</p>
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">{selectedCase.buyerEmail}</p>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {selectedCase.itemName} | {selectedCase.unitName}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-primary ring-1 ring-border/70">
                        {formatStatus(selectedCase.status)}
                      </span>
                      {selectedCase.lockedAccount ? (
                        <span className="rounded-full bg-tertiary-container/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-tertiary-container">
                          Akun terkunci
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                    <p>Diajukan {formatDate(selectedCase.submittedAt)}</p>
                    <p>Level akumulasi {selectedCase.level}</p>
                    <p>Prioritas {selectedCase.priorityScore}</p>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1rem] bg-surface-low/60 p-4 text-sm leading-6 text-muted-foreground ring-1 ring-border/70">
                      <p className="font-semibold text-foreground">Keterangan buyer</p>
                      <p className="mt-1">{selectedCase.buyerStatement}</p>
                    </div>
                    <div className="rounded-[1rem] bg-surface-low/60 p-4 text-sm leading-6 text-muted-foreground ring-1 ring-border/70">
                      <p className="font-semibold text-foreground">Rekomendasi admin unit</p>
                      <p className="mt-1">
                        {selectedCase.adminRecommendation
                          ? formatStatus(selectedCase.adminRecommendation)
                          : "Belum ada rekomendasi admin unit."}
                      </p>
                      {selectedCase.adminRecommendationNote ? (
                        <p className="mt-2">{selectedCase.adminRecommendationNote}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedCase.attachments.length === 0 ? (
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground ring-1 ring-border/70">
                        Tidak ada lampiran
                      </span>
                    ) : (
                      selectedCase.attachments.map((attachment) => (
                        <a
                          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary ring-1 ring-border/70 transition hover:bg-primary/5"
                          href={attachment.fileUrl}
                          key={attachment.id}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <FileText className="size-3.5" />
                          {attachment.fileName}
                        </a>
                      ))
                    )}
                  </div>

                  <div className="mt-6 space-y-3 rounded-[1rem] bg-white p-4 ring-1 ring-border/70">
                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        className="h-11 w-full rounded-xl border border-border/70 bg-white px-4 text-sm font-semibold text-foreground outline-none"
                        value={decision}
                        onChange={(event) => updateDecision(event.target.value as BlacklistReviewDecision)}
                      >
                        <option value="DISETUJUI">Setujui pencabutan</option>
                        <option value="DITOLAK">Tolak pencabutan</option>
                      </select>
                      <select
                        className="h-11 w-full rounded-xl border border-border/70 bg-white px-4 text-sm font-semibold text-foreground outline-none"
                        value={reasonCode}
                        onChange={(event) => setReasonCode(event.target.value)}
                      >
                        {reasonOptions.map((reason) => (
                          <option key={reason.code} value={reason.code}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Textarea
                      disabled={isPending}
                      placeholder="Catatan tambahan opsional untuk audit internal..."
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={isPending} type="button" onClick={() => submitDecision(selectedCase.id)}>
                        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                        Simpan Keputusan
                      </Button>
                      <Button disabled={isPending} type="button" variant="secondary" onClick={closeDecisionDialog}>
                        Batal
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>,
          document.body
        )
      : null;

  return (
    <>
    {decisionDialog}
    <section className="rounded-[1.8rem] border border-border/70 bg-white p-5 shadow-[0_24px_72px_-56px_rgba(8,69,50,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary/62">
            Review & pelanggaran
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
            Antrean keputusan superadmin
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Satu case hanya bisa diputus sekali. Alasan keputusan wajib dipilih, sedangkan catatan tambahan opsional.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-primary">
            <ShieldCheck className="size-4" />
            {pendingCases.length} menunggu
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-high px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            <CheckCircle2 className="size-4" />
            {terminalCases} final
          </span>
        </div>
      </div>

      {feedback ? <InlineFeedback className="mt-5" {...feedback} /> : null}

      <div className="mt-5 grid gap-3">
        {cases.length === 0 ? (
          <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-surface-low/60 p-6 text-sm font-semibold text-muted-foreground">
            Belum ada pengajuan review insiden yang perlu diputus.
          </div>
        ) : (
          cases.map((item) => {
            const terminal = isTerminalStatus(item.status);

            return (
              <article className="rounded-[1.25rem] border border-border/70 bg-surface-low/50 p-4" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-foreground">{item.buyerName}</p>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">{item.buyerEmail}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.itemName} | {item.unitName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-primary ring-1 ring-border/70">
                      {formatStatus(item.status)}
                    </span>
                    {item.lockedAccount ? (
                      <span className="rounded-full bg-tertiary-container/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-tertiary-container">
                        Akun terkunci
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                  <p>Diajukan {formatDate(item.submittedAt)}</p>
                  <p>Level akumulasi {item.level}</p>
                  <p>Prioritas {item.priorityScore}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.attachments.length === 0 ? (
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground ring-1 ring-border/70">
                      Tidak ada lampiran
                    </span>
                  ) : (
                    item.attachments.map((attachment) => (
                      <a
                        className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary ring-1 ring-border/70 transition hover:bg-primary/5"
                        href={attachment.fileUrl}
                        key={attachment.id}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <FileText className="size-3.5" />
                        {attachment.fileName}
                      </a>
                    ))
                  )}
                </div>

                <Button
                  aria-label={terminal ? "Case sudah final" : "Putuskan Case"}
                  className="mt-4"
                  disabled={terminal}
                  size="sm"
                  type="button"
                  variant={terminal ? "secondary" : "default"}
                  onClick={() => setSelectedCaseId(item.id)}
                >
                  <ShieldX className="size-4" />
                  {terminal ? "Sudah final" : "Tinjau Sekarang"}
                </Button>
              </article>
            );
          })
        )}
      </div>
    </section>
    </>
  );
}
