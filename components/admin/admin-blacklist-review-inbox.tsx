"use client";

import { useState, useTransition } from "react";
import { ClipboardCheck, LoaderCircle, Send, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Textarea } from "@/components/ui/textarea";

type AdminReviewCase = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  itemName: string;
  unitName: string;
  status: string;
  submittedAt: string;
  hasRecommendation: boolean;
  crossUnitSignal: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Makassar"
  }).format(new Date(value));
}

export function AdminBlacklistReviewInbox({ cases }: { cases: AdminReviewCase[] }) {
  const router = useRouter();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState("LANJUTKAN_REVIEW");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ title: string; description?: string; variant: "error" | "success" } | null>(
    null
  );

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

      setSelectedCaseId(null);
      setNote("");
      setFeedback({
        title: "Rekomendasi tersimpan",
        description: "Superadmin tetap dapat memutuskan final tanpa menunggu rekomendasi tambahan.",
        variant: "success"
      });
      router.refresh();
    });
  }

  return (
    <section className="rounded-[1.8rem] border border-black/8 bg-white p-5 shadow-[0_24px_72px_-56px_rgba(8,69,50,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0a6a49]/62">
            Intake Review Lokal
          </p>
          <h2 className="mt-2 font-headline text-2xl font-black tracking-[-0.03em] text-[#122018]">
            Pengajuan review dari buyer
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/56">
            Admin unit hanya memberi konteks dan rekomendasi. Keputusan final tetap berada di superadmin.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#eff7f2] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0a6a49]">
          <ShieldAlert className="size-4" />
          {cases.length} pengajuan
        </span>
      </div>

      {feedback ? <InlineFeedback className="mt-5" {...feedback} /> : null}

      <div className="mt-5 grid gap-3">
        {cases.length === 0 ? (
          <div className="rounded-[1.2rem] border border-dashed border-black/10 bg-[#fbfbf8] p-6 text-sm font-semibold text-black/52">
            Belum ada pengajuan review insiden untuk unit ini.
          </div>
        ) : (
          cases.map((item) => (
            <article className="rounded-[1.25rem] border border-black/8 bg-[#fbfbf8] p-4" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-headline text-lg font-black text-[#122018]">{item.buyerName}</p>
                  <p className="mt-1 text-sm font-semibold text-black/48">{item.buyerEmail}</p>
                  <p className="mt-2 text-sm text-black/58">{item.itemName}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#0a6a49] ring-1 ring-black/6">
                  {item.status.replaceAll("_", " ")}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-black/56 md:grid-cols-3">
                <p>{formatDate(item.submittedAt)}</p>
                <p>{item.crossUnitSignal}</p>
                <p>{item.hasRecommendation ? "Rekomendasi sudah ada" : "Belum ada rekomendasi"}</p>
              </div>
              {selectedCaseId === item.id ? (
                <div className="mt-4 space-y-3 rounded-[1rem] bg-white p-4 ring-1 ring-black/6">
                  <select
                    className="h-11 w-full rounded-xl bg-[#f4f5f0] px-4 text-sm font-semibold text-[#122018] outline-none ring-1 ring-black/6"
                    value={recommendation}
                    onChange={(event) => setRecommendation(event.target.value)}
                  >
                    <option value="LANJUTKAN_REVIEW">Lanjutkan review superadmin</option>
                    <option value="PERTIMBANGKAN_CABUT">Pertimbangkan pencabutan</option>
                    <option value="PERTAHANKAN_BLACKLIST">Pertahankan blacklist</option>
                  </select>
                  <Textarea
                    placeholder="Catatan konteks lokal untuk superadmin..."
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <Button className="rounded-full" disabled={isPending} type="button" onClick={() => submitRecommendation(item.id)}>
                    {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Simpan Rekomendasi
                  </Button>
                </div>
              ) : (
                <Button className="mt-4 rounded-full" size="sm" variant="secondary" type="button" onClick={() => setSelectedCaseId(item.id)}>
                  <ClipboardCheck className="size-4" />
                  Beri Rekomendasi
                </Button>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
