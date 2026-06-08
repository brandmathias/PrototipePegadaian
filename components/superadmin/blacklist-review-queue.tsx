"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  Gavel,
  Info,
  LoaderCircle,
  MessageSquareText,
  Paperclip,
  Send,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  BLACKLIST_REVIEW_APPROVAL_REASONS,
  BLACKLIST_REVIEW_REJECTION_REASONS,
  type BlacklistReviewDecision
} from "@/lib/blacklist/review";
import { AdminSelect } from "@/components/admin/admin-select";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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

function isImageAttachment(attachment: SuperadminReviewCase["attachments"][number]) {
  return attachment.mimeType.startsWith("image/");
}

function isVideoAttachment(attachment: SuperadminReviewCase["attachments"][number]) {
  return attachment.mimeType.startsWith("video/");
}

function isPdfAttachment(attachment: SuperadminReviewCase["attachments"][number]) {
  return attachment.mimeType === "application/pdf" || /\.pdf$/i.test(attachment.fileName);
}

function getAttachmentKind(attachment: SuperadminReviewCase["attachments"][number]) {
  if (isImageAttachment(attachment)) return "Gambar";
  if (isVideoAttachment(attachment)) return "Video";
  if (isPdfAttachment(attachment)) return "PDF";
  return "File";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getLevelTone(level: number) {
  if (level >= 3) {
    return {
      avatar: "bg-rose-50 text-rose-700 ring-rose-100",
      ribbon: "bg-red-500",
      text: "text-red-600"
    };
  }

  if (level === 2) {
    return {
      avatar: "bg-orange-50 text-orange-700 ring-orange-100",
      ribbon: "bg-orange-500",
      text: "text-orange-600"
    };
  }

  return {
    avatar: "bg-amber-50 text-amber-700 ring-amber-100",
    ribbon: "bg-amber-400",
    text: "text-amber-600"
  };
}

function matchesReviewQuery(item: SuperadminReviewCase, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    item.buyerName,
    item.buyerEmail,
    item.itemName,
    item.unitName,
    item.status,
    String(item.level)
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

function ReviewFact({
  className,
  label,
  value
}: {
  className?: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className={cn("rounded-[0.92rem] bg-white px-3.5 py-3 ring-1 ring-[#dce8e1]", className)}>
      <p className="text-[0.64rem] font-black uppercase tracking-[0.15em] text-[#0a6a49]/58">
        {label}
      </p>
      <p className="mt-1 text-sm font-black leading-5 text-[#15231d]">
        {value}
      </p>
    </div>
  );
}

function ReviewAttachmentLink({
  attachment
}: {
  attachment: SuperadminReviewCase["attachments"][number];
}) {
  const attachmentKind = getAttachmentKind(attachment);

  return (
    <article className="group overflow-hidden rounded-[0.95rem] border border-[#dde8e2] bg-white shadow-[0_16px_34px_-30px_rgba(15,23,42,0.32)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#b8d8c6] hover:shadow-[0_22px_44px_-34px_rgba(0,103,71,0.42)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#f8faf9]">
        <span className="absolute left-3 top-3 z-10 rounded-full bg-white/92 px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.12em] text-[#006747] shadow-[0_10px_24px_-18px_rgba(15,23,42,0.5)] ring-1 ring-[#dce8e1]">
          {attachmentKind}
        </span>
        {isImageAttachment(attachment) ? (
          <img
            alt={`Bukti ${attachment.fileName}`}
            className="h-full w-full object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025]"
            src={attachment.fileUrl}
          />
        ) : null}
        {isVideoAttachment(attachment) ? (
          <video
            className="h-full w-full bg-black object-contain"
            controls
            preload="metadata"
            src={attachment.fileUrl}
          />
        ) : null}
        {isPdfAttachment(attachment) ? (
          <iframe
            className="h-full w-full bg-white"
            src={attachment.fileUrl}
            title={`Preview ${attachment.fileName}`}
          />
        ) : null}
        {!isImageAttachment(attachment) && !isVideoAttachment(attachment) && !isPdfAttachment(attachment) ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center text-[#64756e]">
            <span className="grid size-12 place-items-center rounded-[0.9rem] bg-[#eef7f1] text-[#006747]">
              <FileText className="size-5" />
            </span>
            <span className="text-sm font-bold">Preview file tidak tersedia</span>
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <span className="min-w-0 truncate text-sm font-black text-[#15231d]">{attachment.fileName}</span>
        <a
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[0.72rem] bg-[#eef7f1] px-3 py-2 text-xs font-black text-[#006747] transition duration-300 hover:bg-[#dff1e7]"
          href={attachment.fileUrl}
          rel="noreferrer"
          target="_blank"
        >
          Buka file
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </article>
  );
}

export function BlacklistReviewQueue({
  cases,
  query = ""
}: {
  cases: SuperadminReviewCase[];
  query?: string;
}) {
  const router = useRouter();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showAllCases, setShowAllCases] = useState(false);
  const [decision, setDecision] = useState<BlacklistReviewDecision>("DISETUJUI");
  const [reasonCode, setReasonCode] = useState<string>(BLACKLIST_REVIEW_APPROVAL_REASONS[0].code);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ title: string; description?: string; variant: "error" | "success" } | null>(
    null
  );
  const pendingCases = cases
    .filter((item) => !isTerminalStatus(item.status))
    .filter((item) => matchesReviewQuery(item, query));
  const terminalCases = cases.filter((item) => isTerminalStatus(item.status)).length;
  const visibleCases = showAllCases ? pendingCases : pendingCases.slice(0, 3);
  const hiddenCaseCount = Math.max(pendingCases.length - visibleCases.length, 0);
  const reasonOptions = useMemo(() => getReasonOptions(decision), [decision]);
  const selectedCase = cases.find((item) => item.id === selectedCaseId) ?? null;
  const adminSelectClassName =
    "mt-3 [&_.admin-select-trigger]:h-11 [&_.admin-select-trigger]:rounded-[0.88rem] [&_.admin-select-trigger]:border-[#d6e2dc] [&_.admin-select-trigger]:bg-[#f8faf9] [&_.admin-select-trigger]:px-4 [&_.admin-select-trigger]:text-sm [&_.admin-select-trigger]:font-black [&_.admin-select-trigger]:text-[#15231d] [&_.admin-select-trigger]:shadow-none [&_.admin-select-trigger[aria-expanded='true']]:border-[#006747] [&_.admin-select-trigger[aria-expanded='true']]:bg-white [&_.admin-select-trigger[aria-expanded='true']]:shadow-[0_0_0_4px_rgba(189,232,208,0.55)] [&_.admin-select-trigger[data-active='true']]:border-[#cfe1d8] [&_.admin-select-trigger[data-active='true']]:bg-white [&_.admin-select-trigger[data-active='true']]:text-[#15231d] [&_.admin-select-icon]:text-[#15231d] [&_.admin-select-menu]:border-[#cfe1d8] [&_.admin-select-menu]:bg-white [&_.admin-select-menu]:shadow-[0_24px_52px_-32px_rgba(15,23,42,0.24)] [&_.admin-select-option]:min-h-[2.75rem] [&_.admin-select-option]:rounded-[0.8rem] [&_.admin-select-option]:px-3 [&_.admin-select-option]:text-sm [&_.admin-select-option]:font-black [&_.admin-select-option]:text-[#15231d] [&_.admin-select-option:hover]:bg-[#eef7f1] [&_.admin-select-option[data-active='true']]:bg-[#e7f5ed] [&_.admin-select-check]:text-[#006747]";

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
          <div className="scrollbar-none fixed inset-0 z-[150] overflow-y-auto overscroll-contain px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] print:hidden sm:px-6 sm:py-6 lg:py-8">
            <button
              aria-label="Tutup panel keputusan"
              className="fixed inset-0 bg-[#07131e]/66 backdrop-blur-[5px]"
              onClick={closeDecisionDialog}
              type="button"
            />
            <section
              aria-labelledby="superadmin-review-decision-title"
              aria-modal="true"
              className="relative z-[151] mx-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[72rem] flex-col overflow-visible pt-8 sm:max-h-[calc(100dvh-2.5rem)] sm:pt-9"
              role="dialog"
            >
              <div className="pointer-events-none absolute left-1/2 top-8 z-20 -translate-x-1/2 -translate-y-1/2 sm:top-9">
                <div className="grid size-16 place-items-center rounded-full border-[5px] border-white bg-[#006747] text-white shadow-[0_18px_30px_-18px_rgba(0,103,71,0.7)]">
                  <ShieldAlert className="size-6" strokeWidth={2.2} />
                </div>
              </div>

              <form
                className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] border border-[#d8e4de] bg-white shadow-[0_42px_118px_-46px_rgba(3,21,14,0.84),0_18px_38px_-28px_rgba(8,69,50,0.24)]"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitDecision(selectedCase.id);
                }}
              >
                <div className="relative shrink-0 rounded-t-[1.45rem] bg-white px-5 pb-7 pt-10 sm:px-7 sm:pb-8 sm:pt-11">
                  <button
                    aria-label="Tutup"
                    className="absolute right-4 top-4 grid size-10 place-items-center rounded-lg text-slate-400 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-100 hover:text-slate-700 active:scale-[0.97] sm:right-7 sm:top-7 sm:size-9"
                    onClick={closeDecisionDialog}
                    type="button"
                  >
                    <X className="size-4.5" strokeWidth={2.2} />
                  </button>

                  <div className="space-y-2 text-center">
                    <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#0a6a49]/62">
                      Panel Keputusan Superadmin
                    </p>
                    <h2
                      className="mx-auto max-w-[42rem] font-headline text-[1.55rem] font-black leading-tight tracking-tight text-[#15231d] sm:text-[1.78rem]"
                      id="superadmin-review-decision-title"
                    >
                      Putuskan Review Buyer
                    </h2>
                    <p className="mx-auto max-w-[42rem] text-[0.9rem] font-semibold leading-7 text-slate-500">
                      Baca kronologi buyer, cek bukti pendukung, lihat rekomendasi admin unit, lalu simpan keputusan final superadmin.
                    </p>
                  </div>
                </div>

                <div className="scrollbar-none min-h-0 overflow-y-auto px-4 py-4 sm:px-7 sm:py-5">
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
                    <div className="space-y-4">
                      <section className="overflow-hidden rounded-[1.05rem] border border-[#cce6da] bg-white shadow-[0_22px_54px_-44px_rgba(8,69,50,0.38)]">
                        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_88%_32%,rgba(46,196,125,0.16),transparent_29%),linear-gradient(135deg,#fbfffd_0%,#eef9f3_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#0a6a49]/62">
                                Barang Lelang Terkait
                              </p>
                              <h3 className="mt-2 font-headline text-2xl font-black leading-tight tracking-tight text-[#15231d]">
                                {selectedCase.itemName}
                              </h3>
                              <p className="mt-1 text-sm font-semibold text-[#64756e]">
                                {selectedCase.unitName} | {formatStatus(selectedCase.status)}
                              </p>
                            </div>
                            <div className="grid size-16 shrink-0 place-items-center rounded-full bg-[#fff4db] font-headline text-lg font-black text-[#b45309] ring-1 ring-[#f3d99d]">
                              {getInitials(selectedCase.buyerName)}
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <ReviewFact label="Level Akumulasi" value={`Level ${selectedCase.level}`} />
                            <ReviewFact label="Prioritas" value={selectedCase.priorityScore} />
                            <ReviewFact label="Diajukan" value={formatDate(selectedCase.submittedAt)} />
                          </div>
                        </div>
                      </section>

                      <section className="relative overflow-hidden rounded-[1rem] border border-[#dfe8e3] bg-white p-4 shadow-[0_18px_40px_-34px_rgba(8,69,50,0.28)]">
                        <div className="absolute right-4 top-4 rounded-full bg-[#eff7f2] px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.12em] text-[#0a6a49]">
                          {selectedCase.lockedAccount ? "Akun Terkunci" : "Akun Aktif"}
                        </div>
                        <div className="flex min-w-0 items-center gap-3 pr-28">
                          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#fff4db] font-headline text-sm font-black text-[#b45309] ring-1 ring-[#f3d99d]">
                            {getInitials(selectedCase.buyerName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-[#0a6a49]/62">
                              Buyer Pengaju Review
                            </p>
                            <p className="mt-1 truncate text-base font-black text-[#15231d]">{selectedCase.buyerName}</p>
                            <p className="mt-0.5 truncate text-sm font-semibold text-[#64756e]">{selectedCase.buyerEmail}</p>
                          </div>
                        </div>
                        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#64756e]">
                          <Clock3 className="size-4" />
                          Pengajuan dikirim {formatDate(selectedCase.submittedAt)}
                        </p>
                      </section>

                      <section className="rounded-[1rem] border border-[#dfe8e3] bg-white p-4 shadow-[0_18px_40px_-34px_rgba(8,69,50,0.28)]">
                        <div className="flex items-start gap-3">
                          <span className="grid size-11 shrink-0 place-items-center rounded-[0.85rem] bg-[#eaf5ee] text-[#0a6a49]">
                            <MessageSquareText className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-headline text-[0.95rem] font-black leading-tight text-[#15231d]">
                              Keterangan Buyer
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-7 text-[#52625b]">
                              {selectedCase.buyerStatement || "Buyer belum menuliskan keterangan tambahan."}
                            </p>
                          </div>
                        </div>
                      </section>

                      <section className="rounded-[1rem] border border-[#f5d48e] bg-[#fffbf2] p-4 shadow-[0_18px_40px_-34px_rgba(180,83,9,0.28)]">
                        <div className="flex items-start gap-3">
                          <span className="grid size-11 shrink-0 place-items-center rounded-[0.85rem] bg-[#fff4db] text-[#b45309] ring-1 ring-[#f3d99d]">
                            <Gavel className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-headline text-[0.95rem] font-black leading-tight text-[#15231d]">
                              Rekomendasi Admin Unit
                            </p>
                            <p className="mt-2 text-sm font-black leading-6 text-[#6f4c16]">
                              {selectedCase.adminRecommendation
                                ? formatStatus(selectedCase.adminRecommendation)
                                : "Belum ada rekomendasi admin unit."}
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-7 text-[#6f4c16]">
                              {selectedCase.adminRecommendationNote || "Superadmin dapat memutuskan berdasarkan keterangan buyer dan bukti yang tersedia."}
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>

                    <aside className="flex min-h-full flex-col gap-4 rounded-[1.05rem] border border-[#dfe8e3] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)] p-4 shadow-[0_20px_54px_-44px_rgba(8,69,50,0.35)]">
                      <div className="rounded-[0.95rem] border border-[#e0eadf] bg-white px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="grid size-10 place-items-center rounded-[0.82rem] bg-[#f5f4ee] text-[#0a6a49]">
                            <Paperclip className="size-5" />
                          </span>
                          <div>
                            <p className="font-headline text-[0.95rem] font-black leading-tight text-[#15231d]">
                              Bukti Pendukung Buyer
                            </p>
                            <p className="mt-1 text-xs font-bold text-[#64756e]">
                              {selectedCase.attachments.length} lampiran review
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3">
                          {selectedCase.attachments.length === 0 ? (
                            <div className="rounded-[0.9rem] border border-dashed border-[#ccd8d2] bg-[#f8faf9] px-4 py-6 text-[0.85rem] font-semibold text-[#64756e]">
                              Tidak ada lampiran.
                            </div>
                          ) : (
                            selectedCase.attachments.map((attachment) => (
                              <ReviewAttachmentLink attachment={attachment} key={attachment.id} />
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-[0.95rem] border border-[#e0eadf] bg-white p-4">
                        <label
                          className="block font-headline text-[0.9rem] font-black leading-tight text-[#15231d]"
                          htmlFor="superadmin-review-decision"
                        >
                          Keputusan Final
                        </label>
                        <AdminSelect
                          ariaLabel="Keputusan final review blacklist buyer"
                          className={adminSelectClassName}
                          id="superadmin-review-decision"
                          options={[
                            { label: "Setujui pencabutan", value: "DISETUJUI" },
                            { label: "Tolak pencabutan", value: "DITOLAK" }
                          ]}
                          value={decision}
                          onValueChange={(value) => updateDecision(value as BlacklistReviewDecision)}
                        />

                        <label
                          className="mt-4 block font-headline text-[0.9rem] font-black leading-tight text-[#15231d]"
                          htmlFor="superadmin-review-reason"
                        >
                          Alasan Keputusan
                        </label>
                        <AdminSelect
                          ariaLabel="Alasan keputusan review blacklist buyer"
                          className={adminSelectClassName}
                          id="superadmin-review-reason"
                          options={reasonOptions.map((reason) => ({
                            label: reason.label,
                            value: reason.code
                          }))}
                          value={reasonCode}
                          onValueChange={setReasonCode}
                        />

                        <label
                          className="mt-4 block font-headline text-[0.9rem] font-black leading-tight text-[#15231d]"
                          htmlFor="superadmin-review-note"
                        >
                          Catatan Audit
                        </label>
                        <Textarea
                          className="mt-3 min-h-32 rounded-[0.88rem]"
                          disabled={isPending}
                          id="superadmin-review-note"
                          placeholder="Catatan tambahan opsional untuk audit internal..."
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                        />
                      </div>

                      <section className="mt-auto rounded-[0.95rem] border border-[#dfe8e3] bg-[#fbfdfb] p-4 text-[0.84rem] leading-6 text-[#52625b]">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#006747]" />
                          <p className="font-semibold">
                            Keputusan superadmin bersifat final untuk kasus ini dan akan memperbarui status pembatasan buyer.
                          </p>
                        </div>
                      </section>
                    </aside>
                </div>
                </div>

                <div className="flex shrink-0 flex-col gap-3 border-t border-[#edf2ee] bg-[#fbfdfb] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <div className="flex items-center gap-2 text-[0.82rem] font-semibold leading-6 text-[#52625b]">
                    <CheckCircle2 className="size-5 shrink-0 text-[#006747]" />
                    Simpan keputusan setelah bukti dan rekomendasi admin unit sudah ditinjau.
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                      className="min-h-12 w-full rounded-[0.82rem] border-[#dbe4df] bg-white px-9 text-[0.92rem] font-bold text-[#26342e] shadow-[0_14px_30px_-28px_rgba(15,23,42,0.32)] hover:bg-[#f6faf8] sm:w-auto"
                      disabled={isPending}
                      onClick={closeDecisionDialog}
                      type="button"
                      variant="secondary"
                    >
                      Kembali
                    </Button>
                    <Button
                      className="min-h-12 w-full rounded-[0.82rem] bg-[#006747] px-7 text-[0.92rem] font-black text-white shadow-[0_18px_34px_-22px_rgba(0,103,71,0.72)] transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99] sm:w-auto"
                      disabled={isPending}
                      type="submit"
                    >
                      {isPending ? <LoaderCircle className="size-4.5 animate-spin" /> : <Send className="size-4.5" />}
                      Simpan Keputusan
                    </Button>
                  </div>
                </div>
              </form>
            </section>
          </div>,
          document.body
        )
      : null;

  return (
    <>
    {decisionDialog}
    <section className="overflow-hidden rounded-[1.35rem] border border-[#d8e4de] bg-white shadow-[0_26px_76px_-62px_rgba(8,69,50,0.44)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2ee] px-4 py-4 sm:px-5">
        <div>
          <p className="sr-only">Antrean keputusan superadmin</p>
          <h2 className="font-headline text-lg font-black tracking-[-0.02em] text-[#13211c]">
            Antrean Keputusan
          </h2>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Antrean keputusan superadmin untuk review buyer lintas unit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#e7f4ed] px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#005f3e] ring-1 ring-[#cfe7d8]">
            <ShieldCheck className="size-3.5" />
            {pendingCases.length} pengajuan
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#f3f4f6] px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em] text-slate-500 ring-1 ring-slate-200">
            <CheckCircle2 className="size-3.5" />
            {terminalCases} final
          </span>
        </div>
      </div>

      {feedback ? <InlineFeedback className="mt-5" {...feedback} /> : null}

      <div className="divide-y divide-[#edf2ee]">
        {pendingCases.length === 0 ? (
          <div className="m-4 rounded-[1.1rem] border border-dashed border-[#d8e4de] bg-[#f8faf8] p-6 text-sm font-semibold text-muted-foreground">
            Belum ada pengajuan review insiden yang perlu diputus.
          </div>
        ) : (
          visibleCases.map((item) => {
            const tone = getLevelTone(item.level);

            return (
              <article
                className="group relative grid gap-4 px-4 py-4 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbfcfb] md:grid-cols-[minmax(15rem,1.15fr)_minmax(13rem,0.9fr)_minmax(12rem,0.75fr)_auto] md:items-center sm:px-5"
                key={item.id}
              >
                <span className={cn("absolute inset-y-4 left-3 w-1 rounded-full md:left-4", tone.ribbon)} />
                <div className="min-w-0 pl-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-full text-sm font-black ring-1",
                        tone.avatar
                      )}
                    >
                      {getInitials(item.buyerName || "Buyer")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-headline text-sm font-black tracking-[-0.01em] text-[#111827]">
                        {item.buyerName}
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-[#42526b]">
                        {item.buyerEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 pl-4 md:pl-0">
                  <p className="truncate text-sm font-bold text-[#344054]">
                    {item.itemName}
                    <span className="font-semibold text-[#667085]"> | {item.unitName}</span>
                  </p>
                  <p className={cn("mt-2 flex items-center gap-1.5 text-xs font-semibold", tone.text)}>
                    <Clock3 className="size-3.5" />
                    {formatDate(item.submittedAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pl-4 md:justify-center md:pl-0">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.72rem] font-black ring-1",
                      item.hasAdminRecommendation
                        ? "bg-blue-50 text-blue-700 ring-blue-100"
                        : "bg-slate-50 text-slate-500 ring-slate-200"
                    )}
                  >
                    {item.hasAdminRecommendation ? (
                      <MessageSquareText className="size-3.5" />
                    ) : (
                      <Info className="size-3.5" />
                    )}
                    {item.hasAdminRecommendation ? "Mendapatkan Rekomendasi" : "Tidak Ada Rekomendasi"}
                  </span>
                  {item.attachments.map((attachment) => (
                    <span className="sr-only" key={attachment.id}>
                      {attachment.fileName}
                    </span>
                  ))}
                </div>

                <Button
                  aria-label="Putuskan Case"
                  className="ml-4 h-10 rounded-lg px-5 shadow-[0_18px_34px_-26px_rgba(0,74,35,0.48)] md:ml-0"
                  size="sm"
                  type="button"
                  onClick={() => setSelectedCaseId(item.id)}
                >
                  <ShieldX className="size-4" />
                  Tinjau Sekarang
                </Button>
              </article>
            );
          })
        )}
      </div>
      {hiddenCaseCount > 0 || showAllCases ? (
        <button
          className="flex w-full items-center justify-center gap-2 border-t border-[#edf2ee] bg-[#fbfcfb] px-4 py-3 text-sm font-black text-[#005f3e] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f4faf6] active:scale-[0.995]"
          type="button"
          onClick={() => setShowAllCases((value) => !value)}
        >
          {showAllCases ? "Tampilkan Lebih Sedikit" : `Lihat Lainnya (${hiddenCaseCount})`}
          <ChevronDown className={cn("size-4 transition-transform duration-500", showAllCases && "rotate-180")} />
        </button>
      ) : null}
    </section>
    </>
  );
}
