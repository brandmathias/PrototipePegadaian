import { CheckCircle2, Clock3, FileText, ShieldAlert, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type BuyerSafeBlacklistReviewCase = {
  id: string;
  incidentId: string;
  status: string;
  submittedAt: string;
  summary: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    uploadedAt: string;
  }>;
};

function getStatusStyle(status: string) {
  if (status === "DISETUJUI") {
    return {
      icon: CheckCircle2,
      label: "Review disetujui",
      shell: "border-primary/20 bg-primary/[0.06] text-primary"
    };
  }

  if (status === "DITOLAK") {
    return {
      icon: XCircle,
      label: "Review ditolak",
      shell: "border-destructive/20 bg-destructive/[0.05] text-destructive"
    };
  }

  if (status === "DITINJAU_SUPERADMIN") {
    return {
      icon: ShieldAlert,
      label: "Direview superadmin",
      shell: "border-amber-200 bg-amber-50 text-amber-800"
    };
  }

  return {
    icon: Clock3,
    label: status === "DITINJAU_ADMIN_UNIT" ? "Ditinjau admin unit" : "Terkirim",
    shell: "border-[#d7ddd4] bg-[#f7f8f4] text-[#0a6a49]"
  };
}

export function BlacklistHelpCaseStatus({
  caseData,
  className,
  publicView = false
}: {
  caseData: BuyerSafeBlacklistReviewCase;
  className?: string;
  publicView?: boolean;
}) {
  const status = getStatusStyle(caseData.status);
  const StatusIcon = status.icon;

  return (
    <section
      className={cn(
        "rounded-[1.5rem] border border-black/8 bg-white p-5 shadow-[0_24px_64px_-52px_rgba(8,69,50,0.42)]",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0a6a49]/62">
            Status Review Insiden
          </p>
          <h2 className="mt-2 font-headline text-2xl font-black tracking-[-0.03em] text-[#122018]">
            {status.label}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/58">{caseData.summary}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em]",
            status.shell
          )}
        >
          <StatusIcon className="size-4" />
          {caseData.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1rem] bg-[#f8f7f3] p-4 ring-1 ring-black/5">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/38">ID Insiden</p>
          <p className="mt-1 break-all text-sm font-bold text-[#122018]">{caseData.incidentId}</p>
        </div>
        <div className="rounded-[1rem] bg-[#f8f7f3] p-4 ring-1 ring-black/5">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/38">Tanggal Kirim</p>
          <p className="mt-1 text-sm font-bold text-[#122018]">
            {new Intl.DateTimeFormat("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Makassar"
            }).format(new Date(caseData.submittedAt))}
          </p>
        </div>
      </div>

      {!publicView && caseData.attachments?.length ? (
        <div className="mt-5 rounded-[1.15rem] border border-black/8 bg-[#fbfbf8] p-4">
          <p className="text-sm font-black text-[#122018]">Lampiran yang dikirim</p>
          <div className="mt-3 grid gap-2">
            {caseData.attachments.map((attachment) => (
              <a
                className="flex items-center gap-3 rounded-[0.95rem] bg-white px-3 py-2 text-sm font-semibold text-[#0a6a49] ring-1 ring-black/6 transition duration-300 hover:-translate-y-0.5 hover:bg-[#f2f8f4]"
                href={attachment.fileUrl}
                key={attachment.id}
                target="_blank"
              >
                <FileText className="size-4" />
                <span className="min-w-0 truncate">{attachment.fileName || attachment.fileUrl}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
