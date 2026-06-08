"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileImage,
  FileText,
  Gavel,
  LoaderCircle,
  MessageSquareText,
  Paperclip,
  Send,
  ShieldAlert,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Textarea } from "@/components/ui/textarea";
import { AdminSelect } from "@/components/admin/admin-select";
import { cn } from "@/lib/utils";

type AdminReviewAttachment = {
  id: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
};

type AdminReviewCase = {
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
  hasRecommendation: boolean;
  crossUnitSignal: string;
  incident: {
    id: string;
    note: string;
    occurredAt: string;
    auctionMode: string;
    transactionStatus: string;
    amount: number | null;
    paymentDeadline: string | null;
    itemCode: string;
    itemCategory: string;
    itemCondition: string;
    itemImageUrl: string | null;
    itemImageAlt: string | null;
  };
  attachments: AdminReviewAttachment[];
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

const currency = new Intl.NumberFormat("id-ID", {
  currency: "IDR",
  maximumFractionDigits: 0,
  style: "currency"
});

function formatMoney(value: number | null) {
  if (value === null) return "-";

  return currency.format(value);
}

function formatRecommendation(value: string | null) {
  if (!value) return "Belum ada rekomendasi admin unit.";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "BU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function isImageAttachment(item: AdminReviewAttachment) {
  return item.mimeType.startsWith("image/");
}

function isPdfAttachment(item: AdminReviewAttachment) {
  return item.mimeType === "application/pdf" || /\.pdf$/i.test(item.fileName);
}

function attachmentLabel(item: AdminReviewAttachment) {
  if (isImageAttachment(item)) return "Gambar";
  if (isPdfAttachment(item)) return "PDF";

  return item.mimeType || "Lampiran";
}

function ReviewFact({
  label,
  value,
  valueClassName,
  className
}: {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[0.9rem] border border-[#dfe8e3] bg-white px-3 py-2 shadow-[0_14px_30px_-28px_rgba(8,69,50,0.26)] sm:px-3.5",
        className
      )}
    >
      <div className="flex h-[3.35rem] flex-col justify-center gap-1">
        <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-black/38">{label}</p>
        <div className="flex min-h-0 items-center">
          <p
            className={cn(
              "min-w-0 max-w-full truncate whitespace-nowrap text-[0.9rem] font-black leading-none tracking-tight text-[#15231d]",
              valueClassName
            )}
            title={value}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewStatusPill({ hasRecommendation }: { hasRecommendation: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-[0.85rem] px-5 text-center text-[0.72rem] font-black uppercase tracking-[0.08em] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
        hasRecommendation
          ? "border border-[#c7e6d4] bg-[#e9f6ef] text-[#0a6a49]"
          : "border border-[#ffd28a] bg-[#f59e0b] text-white shadow-[0_16px_30px_-24px_rgba(245,158,11,0.7)]"
      )}
    >
      {hasRecommendation ? "Rekomendasi Terkirim" : "Tindakan Diperlukan"}
    </span>
  );
}

function ReviewAttachmentLink({ attachment }: { attachment: AdminReviewAttachment }) {
  const image = isImageAttachment(attachment);

  return (
    <a
      className="group block overflow-hidden rounded-[0.95rem] border border-[#dfe8e3] bg-white text-left shadow-[0_16px_36px_-32px_rgba(15,23,42,0.34)] transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#0a6a49]/28 hover:bg-[#f8fcf9] active:scale-[0.99]"
      href={attachment.fileUrl}
      rel="noreferrer"
      target="_blank"
    >
      {image ? (
        <div className="relative h-36 overflow-hidden bg-[#edf2ef]">
          <img
            alt={`Bukti pendukung ${attachment.fileName}`}
            className="h-full w-full object-cover transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            src={attachment.fileUrl}
          />
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-[0.82rem]",
              image ? "bg-[#e9f6ef] text-[#0a6a49]" : "bg-[#f5f4ee] text-[#536159]"
            )}
          >
            {image ? <FileImage className="size-4.5" /> : <FileText className="size-4.5" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[#15231d]">{attachment.fileName}</p>
            <p className="mt-0.5 text-[0.68rem] font-black uppercase tracking-[0.12em] text-black/38">
              {attachmentLabel(attachment)}
            </p>
          </div>
        </div>
        <ExternalLink className="size-4 shrink-0 text-[#0a6a49] transition group-hover:-translate-y-[1px] group-hover:translate-x-[1px]" />
      </div>
    </a>
  );
}

const reviewRecommendationOptions = [
  { value: "LANJUTKAN_REVIEW", label: "Lanjutkan review superadmin" },
  { value: "PERTIMBANGKAN_CABUT", label: "Pertimbangkan pencabutan" },
  { value: "PERTAHANKAN_BLACKLIST", label: "Pertahankan blacklist" }
];

export function AdminBlacklistReviewInbox({ cases }: { cases: AdminReviewCase[] }) {
  const router = useRouter();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState("LANJUTKAN_REVIEW");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ title: string; description?: string; variant: "error" | "success" } | null>(
    null
  );
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

  useEffect(() => {
    if (!selectedCase) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeReviewDialog();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCase]);

  function openReviewDialog(item: AdminReviewCase) {
    setFeedback(null);
    setSelectedCaseId(item.id);
    setRecommendation(item.adminRecommendation ?? "LANJUTKAN_REVIEW");
    setNote(item.adminRecommendationNote ?? "");
  }

  function closeReviewDialog() {
    setSelectedCaseId(null);
    setRecommendation("LANJUTKAN_REVIEW");
    setNote("");
  }

  function submitRecommendation(caseId: string) {
    setFeedback(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/blacklist-review/${caseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation, note })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFeedback({
          title: "Rekomendasi belum tersimpan",
          description: payload.message ?? "Periksa kembali pilihan rekomendasi.",
          variant: "error"
        });
        return;
      }

      closeReviewDialog();
      setFeedback({
        title: "Rekomendasi tersimpan",
        description: "Superadmin akan menerima konteks buyer, bukti pendukung, dan rekomendasi unit dalam satu alur review.",
        variant: "success"
      });
      router.refresh();
    });
  }

  const reviewDialog =
    selectedCase && typeof document !== "undefined"
      ? createPortal(
          <div className="scrollbar-none fixed inset-0 z-[150] overflow-y-auto overscroll-contain px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] print:hidden sm:px-6 sm:py-6 lg:py-8">
            <button
              aria-label="Tutup pop up review blacklist"
              className="fixed inset-0 bg-[#07131e]/66 backdrop-blur-[5px]"
              onClick={closeReviewDialog}
              type="button"
            />
            <section
              aria-labelledby="admin-blacklist-review-dialog-title"
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
                  submitRecommendation(selectedCase.id);
                }}
              >
                <div className="relative shrink-0 rounded-t-[1.45rem] bg-white px-5 pb-7 pt-10 sm:px-7 sm:pb-8 sm:pt-11">
                  <button
                    aria-label="Tutup"
                    className="absolute right-4 top-4 grid size-10 place-items-center rounded-lg text-slate-400 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-100 hover:text-slate-700 active:scale-[0.97] sm:right-7 sm:top-7 sm:size-9"
                    onClick={closeReviewDialog}
                    type="button"
                  >
                    <X className="size-4.5" strokeWidth={2.2} />
                  </button>

                  <div className="space-y-2 text-center">
                    <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#0a6a49]/62">
                      Review Insiden Blacklist
                    </p>
                    <h2
                      className="mx-auto max-w-[42rem] font-headline text-[1.55rem] font-black leading-tight tracking-tight text-[#15231d] sm:text-[1.78rem]"
                      id="admin-blacklist-review-dialog-title"
                    >
                      Tinjau Pengajuan Review Buyer
                    </h2>
                    <p className="mx-auto max-w-[40rem] text-[0.9rem] font-semibold leading-7 text-slate-500">
                      Baca kronologi buyer, cek bukti pendukung, lalu kirim rekomendasi admin unit ke superadmin.
                    </p>
                  </div>
                </div>

                <div className="scrollbar-none min-h-0 overflow-y-auto px-4 py-4 sm:px-7 sm:py-5">
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
                    <div className="space-y-4">
                      <section className="overflow-hidden rounded-[1.05rem] border border-[#cce6da] bg-white shadow-[0_22px_54px_-44px_rgba(8,69,50,0.38)]">
                        <div className="grid gap-0 md:grid-cols-[17rem_minmax(0,1fr)]">
                          <div className="relative min-h-56 overflow-hidden bg-[#edf2ef] md:min-h-full">
                            {selectedCase.incident.itemImageUrl ? (
                              <img
                                alt={selectedCase.incident.itemImageAlt ?? `Foto barang ${selectedCase.itemName}`}
                                className="h-full min-h-56 w-full object-cover"
                                src={selectedCase.incident.itemImageUrl}
                              />
                            ) : (
                              <div className="grid h-full min-h-56 place-items-center bg-[linear-gradient(135deg,#eef6f1,#fafaf7)] text-[#0a6a49]">
                                <FileImage className="size-10" />
                              </div>
                            )}
                            <div className="absolute left-3 top-3 rounded-full bg-white/94 px-3 py-1.5 text-[0.66rem] font-black uppercase tracking-[0.12em] text-[#0a6a49] shadow-[0_14px_28px_-22px_rgba(15,23,42,0.45)]">
                              Foto Barang
                            </div>
                          </div>
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
                                  {selectedCase.incident.itemCode} | {selectedCase.unitName} | {formatStatus(selectedCase.incident.auctionMode)}
                                </p>
                              </div>
                              <div className="grid size-16 shrink-0 place-items-center rounded-full bg-[#fff4db] font-headline text-lg font-black text-[#b45309] ring-1 ring-[#f3d99d]">
                                {getInitials(selectedCase.buyerName)}
                              </div>
                            </div>
                            <div className="mt-5 grid grid-cols-[minmax(0,1.42fr)_minmax(7.6rem,0.88fr)] gap-3">
                              <ReviewFact
                                label="Nominal"
                                value={formatMoney(selectedCase.incident.amount)}
                                className="px-3.5 sm:px-4"
                                valueClassName="font-headline text-[0.86rem] [font-variant-numeric:tabular-nums]"
                              />
                              <ReviewFact
                                label="Status"
                                value={formatStatus(selectedCase.incident.transactionStatus)}
                                valueClassName="text-[0.88rem]"
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="rounded-[1rem] border border-[#f5d48e] bg-[#fffbf2] p-4 shadow-[0_18px_40px_-34px_rgba(180,83,9,0.28)]">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="grid size-10 shrink-0 place-items-center rounded-[0.82rem] bg-[#fff4db] text-[#b45309] ring-1 ring-[#f3d99d]">
                                <Gavel className="size-5" />
                              </span>
                              <div>
                                <p className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-[#b45309]">
                                  Pelanggaran Terkait
                                </p>
                                <p className="mt-1 text-sm font-black leading-6 text-[#15231d]">
                                  {formatStatus(selectedCase.incident.transactionStatus)} pada {formatDate(selectedCase.incident.occurredAt)}
                                </p>
                              </div>
                            </div>
                            <p className="mt-4 text-sm font-semibold leading-7 text-[#6f4c16]">
                              {selectedCase.incident.note}
                            </p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:w-80 lg:grid-cols-1">
                            <ReviewFact
                              label="Deadline Pembayaran"
                              value={selectedCase.incident.paymentDeadline ? formatDate(selectedCase.incident.paymentDeadline) : "-"}
                            />
                            <ReviewFact
                              label="Kategori & Kondisi"
                              value={`${formatStatus(selectedCase.incident.itemCategory)} | ${formatStatus(selectedCase.incident.itemCondition)}`}
                            />
                          </div>
                        </div>
                      </section>

                      <section className="relative overflow-hidden rounded-[1rem] border border-[#dfe8e3] bg-white p-4 shadow-[0_18px_40px_-34px_rgba(8,69,50,0.28)]">
                        <div className="absolute right-4 top-4 rounded-full bg-[#eff7f2] px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.12em] text-[#0a6a49]">
                          {formatStatus(selectedCase.status)}
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

                    </div>

                    <aside className="flex min-h-full flex-col gap-4 rounded-[1.05rem] border border-[#dfe8e3] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)] p-4 shadow-[0_20px_54px_-44px_rgba(8,69,50,0.35)]">
                      <div className="rounded-[0.95rem] border border-[#e0eadf] bg-white px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="grid size-10 place-items-center rounded-[0.82rem] bg-[#f5f4ee] text-[#0a6a49]">
                              <Paperclip className="size-5" />
                            </span>
                            <div>
                              <p className="font-headline text-[0.95rem] font-black leading-tight text-[#15231d]">
                                Bukti Pendukung
                              </p>
                              <p className="mt-1 text-xs font-bold text-[#64756e]">
                                {selectedCase.attachments.length} lampiran buyer
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3">
                          {selectedCase.attachments.length === 0 ? (
                            <div className="rounded-[0.9rem] border border-dashed border-[#ccd8d2] bg-[#f8faf9] px-4 py-6 text-[0.85rem] font-semibold text-[#64756e]">
                              Buyer belum mengunggah lampiran untuk insiden ini.
                            </div>
                          ) : (
                            selectedCase.attachments.map((attachment) => (
                              <ReviewAttachmentLink attachment={attachment} key={attachment.id} />
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-[0.95rem] border border-[#fde3b2] bg-[#fff8eb] px-4 py-4 shadow-[0_16px_34px_-30px_rgba(214,126,22,0.7)]">
                        <div className="flex items-center gap-2 text-[0.78rem] font-black uppercase leading-4 tracking-[0.045em] text-[#b45309]">
                          <span className="size-3 shrink-0 rounded-full bg-[#f59e0b] ring-4 ring-[#fff0cf]" />
                          Rekomendasi Saat Ini
                        </div>
                        <p className="mt-4 text-[0.9rem] font-black leading-6 text-[#15231d]">
                          {formatRecommendation(selectedCase.adminRecommendation)}
                        </p>
                        <p className="mt-2 text-[0.84rem] font-semibold leading-6 text-[#6f4c16]">
                          {selectedCase.adminRecommendationNote || "Belum ada catatan rekomendasi untuk superadmin."}
                        </p>
                      </div>

                      <div className="mt-auto rounded-[0.95rem] border border-[#e5ebee] bg-white p-4">
                        <label
                          className="block font-headline text-[0.9rem] font-black leading-tight text-[#15231d]"
                          htmlFor="admin-blacklist-review-recommendation"
                        >
                          Arah Rekomendasi
                        </label>
                        <AdminSelect
                          ariaLabel="Arah rekomendasi blacklist review"
                          className="mt-3 [&_.admin-select-trigger]:h-11 [&_.admin-select-trigger]:rounded-[0.88rem] [&_.admin-select-trigger]:border-[#d6e2dc] [&_.admin-select-trigger]:bg-[#f8faf9] [&_.admin-select-trigger]:px-4 [&_.admin-select-trigger]:text-sm [&_.admin-select-trigger]:font-black [&_.admin-select-trigger]:text-[#15231d] [&_.admin-select-trigger]:shadow-none [&_.admin-select-trigger[aria-expanded='true']]:border-[#006747] [&_.admin-select-trigger[aria-expanded='true']]:bg-white [&_.admin-select-trigger[aria-expanded='true']]:shadow-[0_0_0_4px_rgba(189,232,208,0.55)] [&_.admin-select-trigger[data-active='true']]:border-[#cfe1d8] [&_.admin-select-trigger[data-active='true']]:bg-white [&_.admin-select-trigger[data-active='true']]:text-[#15231d] [&_.admin-select-icon]:text-[#15231d] [&_.admin-select-menu]:border-[#cfe1d8] [&_.admin-select-menu]:bg-white [&_.admin-select-menu]:shadow-[0_24px_52px_-32px_rgba(15,23,42,0.24)] [&_.admin-select-option]:min-h-[2.75rem] [&_.admin-select-option]:rounded-[0.8rem] [&_.admin-select-option]:px-3 [&_.admin-select-option]:text-sm [&_.admin-select-option]:font-black [&_.admin-select-option]:text-[#15231d] [&_.admin-select-option:hover]:bg-[#eef7f1] [&_.admin-select-option[data-active='true']]:bg-[#e7f5ed] [&_.admin-select-check]:text-[#006747]"
                          id="admin-blacklist-review-recommendation"
                          options={reviewRecommendationOptions}
                          value={recommendation}
                          onValueChange={setRecommendation}
                        />

                        <label
                          className="mt-4 block font-headline text-[0.9rem] font-black leading-tight text-[#15231d]"
                          htmlFor="admin-blacklist-review-note"
                        >
                          Catatan Unit
                        </label>
                        <Textarea
                          className="mt-3 min-h-32 rounded-[0.88rem]"
                          id="admin-blacklist-review-note"
                          placeholder="Tulis konteks lokal, hasil pengecekan bukti, atau alasan rekomendasi..."
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                        />
                      </div>

                      <section className="rounded-[0.95rem] border border-[#dfe8e3] bg-[#fbfdfb] p-4 text-[0.84rem] leading-6 text-[#52625b]">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#006747]" />
                          <p className="font-semibold">
                            {selectedCase.crossUnitSignal}. Rekomendasi unit membantu superadmin membaca konteks lokal
                            tanpa mengubah keputusan final.
                          </p>
                        </div>
                      </section>
                    </aside>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-3 border-t border-[#edf2ee] bg-[#fbfdfb] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <div className="flex items-center gap-2 text-[0.82rem] font-semibold leading-6 text-[#52625b]">
                    <CheckCircle2 className="size-5 shrink-0 text-[#006747]" />
                    Rekomendasi unit akan menjadi konteks pendamping untuk keputusan superadmin.
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                      className="min-h-12 w-full rounded-[0.82rem] border-[#dbe4df] bg-white px-9 text-[0.92rem] font-bold text-[#26342e] shadow-[0_14px_30px_-28px_rgba(15,23,42,0.32)] hover:bg-[#f6faf8] sm:w-auto"
                      onClick={closeReviewDialog}
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
                      Simpan Rekomendasi
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
    <section className="rounded-[1.8rem] border border-black/8 bg-white p-5 shadow-[0_24px_72px_-56px_rgba(8,69,50,0.45)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-black tracking-[-0.035em] text-[#122018]">
            Pengajuan review dari buyer
          </h2>
          <p className="mt-2 max-w-2xl text-base font-semibold leading-7 text-[#64748b]">
            Admin unit hanya memberi konteks dan rekomendasi.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#eff7f2] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0a6a49]">
          <ShieldAlert className="size-4" />
          {cases.length} pengajuan
        </span>
      </div>

      {feedback ? <InlineFeedback className="mt-5" {...feedback} /> : null}

      <div className="mt-6 grid gap-4">
        {cases.length === 0 ? (
          <div className="rounded-[1.2rem] border border-dashed border-black/10 bg-[#fbfbf8] p-6 text-sm font-semibold text-black/52">
            Belum ada pengajuan review insiden untuk unit ini.
          </div>
        ) : (
          cases.map((item) => (
            <article
              className="relative overflow-hidden rounded-[1.05rem] border border-[#e1e7e3] bg-white shadow-[0_24px_58px_-46px_rgba(15,23,42,0.42)]"
              key={item.id}
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 w-2",
                  item.hasRecommendation ? "bg-[#0a6a49]" : "bg-[#f59e0b]"
                )}
              />
              <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(15rem,1.1fr)_minmax(16rem,1fr)_auto_auto] lg:items-center lg:px-7">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid size-16 shrink-0 place-items-center rounded-full bg-[#fff4db] font-headline text-lg font-black text-[#b45309] ring-1 ring-[#f3d99d]">
                    {getInitials(item.buyerName)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-headline text-xl font-black tracking-tight text-[#15231d]">
                      {item.buyerName}
                    </h3>
                    <p className="mt-1 truncate text-sm font-semibold text-[#64748b]">{item.buyerEmail}</p>
                  </div>
                </div>

                <div className="min-w-0 border-[#e5e7eb] lg:border-l lg:pl-7">
                  <p className="text-sm font-semibold text-[#64748b]">
                    Barang: <span className="font-black text-[#15231d]">{item.itemName}</span>
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#64748b]">
                    <span className="grid size-6 place-items-center rounded-full bg-[#fff1f2] text-[#ef4444]">
                      <AlertCircle className="size-4" />
                    </span>
                    {formatDate(item.submittedAt)}
                  </p>
                </div>

                <div className="border-[#e5e7eb] lg:border-l lg:pl-7">
                  <ReviewStatusPill hasRecommendation={item.hasRecommendation} />
                </div>

                <Button
                  className="group h-14 justify-between rounded-[0.85rem] bg-[#006747] px-7 text-[0.98rem] font-black text-white shadow-[0_20px_36px_-25px_rgba(0,103,71,0.86)] transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99] lg:min-w-60"
                  type="button"
                  onClick={() => openReviewDialog(item)}
                >
                  Tinjau Sekarang
                  <span className="grid size-8 place-items-center rounded-full bg-white/12 transition group-hover:translate-x-1">
                    <ArrowRight className="size-5" />
                  </span>
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      {reviewDialog}
    </section>
  );
}
