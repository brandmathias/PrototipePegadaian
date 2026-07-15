import Image from "next/image";
import {
  CheckCircle2,
  CircleX,
  Clock3,
  Crown,
  ReceiptText,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type VickreyRankingStatusKind =
  | "lost"
  | "none"
  | "payment"
  | "settled"
  | "violation"
  | "winner";

export type VickreyRankingRow = {
  amountLabel: string;
  bidderImage?: string | null;
  bidderName: string;
  id: string;
  rank: number;
  statusKind: VickreyRankingStatusKind;
  statusLabel: string;
  submittedAtLabel: string;
};

type VickreyRankingTableProps = {
  emptyMessage?: string;
  markerTestIdPrefix?: string;
  rowTestIdPrefix?: string;
  rows: VickreyRankingRow[];
  testIdPrefix: string;
  title: string;
  totalParticipants: number;
};

const PODIUM_MEDALS = {
  1: "/media/ranking/peringkat-1.webp",
  2: "/media/ranking/peringkat-2.webp",
  3: "/media/ranking/peringkat-3.webp",
} as const;

const PODIUM_ROW_TONES = {
  1: "border-[#e7a91d] border-l-[6px] bg-[#fff7db] shadow-[0_18px_44px_-34px_rgba(169,105,0,0.62)]",
  2: "border-[#aeb7c5] border-l-[6px] bg-[#f3f6f9] shadow-[0_18px_44px_-34px_rgba(71,84,103,0.46)]",
  3: "border-[#ef8247] border-l-[6px] bg-[#fff0df] shadow-[0_18px_44px_-34px_rgba(167,69,18,0.48)]",
} as const;

const PODIUM_AVATAR_TONES = {
  1: "border-[#e7a91d] bg-[#fff2c2] ring-[#f6cf70]",
  2: "border-[#98a2b3] bg-[#eef1f5] ring-[#cfd5de]",
  3: "border-[#ed7a3a] bg-[#fff0e7] ring-[#f5b08a]",
} as const;

const STATUS_STYLES = {
  lost: {
    Icon: CircleX,
    className: "border-[#d8e1e8] bg-[#f6f8fa] text-[#29406f]",
  },
  none: {
    Icon: CircleX,
    className: "border-[#e1e7e4] bg-[#f8faf9] text-[#667085]",
  },
  payment: {
    Icon: ReceiptText,
    className: "border-[#cfd8e6] bg-[#f8faff] text-[#23396e]",
  },
  settled: {
    Icon: CheckCircle2,
    className: "border-[#b7dfc7] bg-[#ecf9f1] text-[#006747]",
  },
  violation: {
    Icon: X,
    className: "border-[#fecaca] bg-[#fff1f2] text-[#c81e1e]",
  },
  winner: {
    Icon: Trophy,
    className: "border-[#f3cf65] bg-[#fff6d8] text-[#8f5a00]",
  },
} as const;

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.length
    ? parts.map((part) => part[0]?.toUpperCase() ?? "").join("")
    : "-";
}

function RankingMarker({
  markerTestIdPrefix,
  rank,
}: {
  markerTestIdPrefix: string;
  rank: number;
}) {
  const medal = PODIUM_MEDALS[rank as keyof typeof PODIUM_MEDALS];

  return (
    <span
      className="grid place-items-center"
      data-testid={`${markerTestIdPrefix}-marker-${rank}`}
    >
      {medal ? (
        <Image
          alt={`Peringkat ${rank}`}
          className="size-16 object-contain drop-shadow-[0_8px_10px_rgba(77,50,5,0.16)] md:size-20"
          height={160}
          sizes="(max-width: 767px) 64px, 80px"
          src={medal}
          width={160}
        />
      ) : (
        <span className="grid size-11 place-items-center rounded-full border border-[#8bd6b9] bg-white text-base font-black text-[#08724f] shadow-[0_10px_24px_-18px_rgba(0,103,71,0.5)]">
          {rank}
        </span>
      )}
    </span>
  );
}

function RankingAvatar({ row }: { row: VickreyRankingRow }) {
  const podiumTone =
    PODIUM_AVATAR_TONES[row.rank as keyof typeof PODIUM_AVATAR_TONES] ??
    "border-[#d4ded9] bg-[#f1f5f3] ring-[#e0e8e4]";

  return (
    <span
      className={cn(
        "relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 text-sm font-black uppercase tracking-[0.04em] text-[#14213d] shadow-[0_14px_26px_-20px_rgba(15,23,42,0.58)] ring-1 md:size-14 md:text-base",
        podiumTone,
      )}
    >
      {row.bidderImage ? (
        <Image
          alt={`Foto peserta ${row.bidderName}`}
          className="object-cover"
          fill
          sizes="(max-width: 767px) 48px, 56px"
          src={row.bidderImage}
        />
      ) : (
        getInitials(row.bidderName)
      )}
    </span>
  );
}

function RankingRow({
  markerTestIdPrefix,
  row,
  testIdPrefix,
}: {
  markerTestIdPrefix: string;
  row: VickreyRankingRow;
  testIdPrefix: string;
}) {
  const isPodium = row.rank >= 1 && row.rank <= 3;
  const rowTone = isPodium
    ? PODIUM_ROW_TONES[row.rank as keyof typeof PODIUM_ROW_TONES]
    : "border-[#dfe8e3] bg-white hover:border-[#bcd9cb] hover:bg-[#fbfdfc]";
  const amountTone =
    row.rank === 1
      ? "text-[#a56600]"
      : row.rank === 2
        ? "text-[#344054]"
        : row.rank === 3
          ? "text-[#b2420c]"
          : "text-[#17366e]";
  const clockTone =
    row.rank === 1
      ? "border-[#e7b94f] text-[#c47b00]"
      : row.rank === 2
        ? "border-[#aeb7c5] text-[#34466f]"
        : row.rank === 3
          ? "border-[#ef9a73] text-[#d83b16]"
          : "border-[#9fd7bf] text-[#08724f]";
  const timeTone =
    row.rank === 1
      ? "text-[#a56600]"
      : row.rank === 2
        ? "text-[#243a71]"
        : row.rank === 3
          ? "text-[#c52d18]"
          : "text-[#08724f]";
  const [submittedDate, ...submittedTimeParts] =
    row.submittedAtLabel.split(",");
  const submittedTime = submittedTimeParts.join(",").trim();
  const status = STATUS_STYLES[row.statusKind];
  const StatusIcon = status.Icon;

  return (
    <article
      className={cn(
        "grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-3 font-jakarta transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none md:grid-cols-[6rem_minmax(0,1.35fr)_minmax(8.75rem,0.92fr)_minmax(8rem,0.78fr)_minmax(10.5rem,0.9fr)] md:gap-x-4 md:gap-y-0 md:px-4",
        isPodium ? "md:min-h-[5.75rem]" : "md:min-h-[4rem]",
        rowTone,
      )}
      data-testid={`${testIdPrefix}-row-${row.rank}`}
    >
      <div
        className={cn(
          "col-start-1 row-span-4 row-start-1 self-center md:col-auto md:row-auto",
        )}
      >
        <RankingMarker
          markerTestIdPrefix={markerTestIdPrefix}
          rank={row.rank}
        />
      </div>

      <div className="col-span-2 col-start-2 flex min-w-0 items-center gap-3 md:col-auto md:col-span-1">
        <RankingAvatar row={row} />
        <p className="min-w-0 text-[0.94rem] font-black leading-5 text-[#101d3b] md:text-base">
          {row.bidderName}
        </p>
      </div>

      <div className="col-span-2 col-start-2 flex min-w-0 items-center gap-2 text-[0.74rem] font-semibold text-[#34466f] md:col-auto md:col-span-1 md:text-[0.78rem]">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border bg-white/75 md:size-9",
            clockTone,
          )}
        >
          <Clock3 className="size-4 md:size-[1.1rem]" />
        </span>
        <span className="flex min-w-0 flex-col leading-[1.28]">
          <span className="whitespace-nowrap">{submittedDate.trim()}</span>
          {submittedTime ? (
            <span
              className={cn(
                "whitespace-nowrap text-[0.8rem] font-black md:text-[0.84rem]",
                timeTone,
              )}
            >
              {submittedTime}
            </span>
          ) : null}
        </span>
      </div>

      <p
        className={cn(
          "col-start-2 whitespace-nowrap font-black leading-5 [font-variant-numeric:tabular-nums] md:col-auto md:col-span-1 md:text-right md:text-[1.08rem]",
          isPodium ? "text-base" : "text-[0.92rem]",
          isPodium && "col-span-2",
          !isPodium &&
            "row-start-3 justify-self-start md:row-auto md:justify-self-auto",
          amountTone,
        )}
      >
        {row.amountLabel}
      </p>

      <div
        className={cn(
          "flex md:col-auto md:col-span-1 md:justify-center",
          isPodium && "col-span-2 col-start-2",
          !isPodium &&
            "col-span-2 col-start-2 row-start-4 justify-self-start md:row-auto md:justify-self-auto",
        )}
      >
        {row.statusKind === "none" && row.statusLabel === "-" ? (
          <span className="font-black text-[#667085]">-</span>
        ) : (
          <span
            className={cn(
              "inline-flex max-w-full items-center justify-center gap-1.5 rounded-full border py-1.5 font-black uppercase leading-4 tracking-[0.025em]",
              isPodium ? "px-3 text-[0.64rem]" : "px-2 text-[0.58rem]",
              status.className,
            )}
          >
            <StatusIcon className="size-3.5 shrink-0" />
            <span className="min-w-0 text-center">{row.statusLabel}</span>
          </span>
        )}
      </div>
    </article>
  );
}

export function VickreyRankingTable({
  emptyMessage = "Belum ada peserta yang mengirim penawaran.",
  markerTestIdPrefix,
  rows,
  rowTestIdPrefix,
  testIdPrefix,
  title,
  totalParticipants,
}: VickreyRankingTableProps) {
  const resolvedMarkerTestIdPrefix = markerTestIdPrefix ?? testIdPrefix;
  const resolvedRowTestIdPrefix = rowTestIdPrefix ?? testIdPrefix;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[#dfe7e2] bg-white p-2 font-jakarta shadow-[0_24px_58px_-44px_rgba(8,69,50,0.38)] sm:p-3"
      data-testid={testIdPrefix}
    >
      <div className="flex items-center gap-2.5 px-2 py-2.5 sm:px-3">
        <Crown
          className="size-5 shrink-0 text-[#e5a315]"
          strokeWidth={2.1}
        />
        <h3 className="text-sm font-black uppercase tracking-[0.035em] text-[#086844] sm:text-base">
          {title}
        </h3>
      </div>

      <div
        className="hidden grid-cols-[6rem_minmax(0,1.35fr)_minmax(8.75rem,0.92fr)_minmax(8rem,0.78fr)_minmax(10.5rem,0.9fr)] items-center gap-4 rounded-lg bg-[#076a47] px-4 py-2.5 font-jakarta text-[0.68rem] font-black uppercase tracking-[0.035em] text-white md:grid"
        data-testid={`${testIdPrefix}-desktop-header`}
      >
        <span className="text-center">Peringkat</span>
        <span>Nama Peserta</span>
        <span>Waktu Penawaran</span>
        <span className="text-right">Nominal Penawaran</span>
        <span className="text-center">Status</span>
      </div>

      <div className="mt-2 space-y-2" role="list">
        {rows.length ? (
          rows.map((row) => (
            <RankingRow
              key={row.id}
              markerTestIdPrefix={resolvedMarkerTestIdPrefix}
              row={row}
              testIdPrefix={resolvedRowTestIdPrefix}
            />
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-[#dce6e1] bg-[#fafcfb] px-4 py-8 text-center text-sm font-semibold leading-6 text-[#52655d]">
            {emptyMessage}
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 border-t border-[#edf2ee] px-2 pb-1 pt-3 text-xs font-black text-[#40558b] sm:px-3">
        <UsersRound className="size-4 shrink-0 text-[#08724f]" />
        <span>Total {totalParticipants} peserta</span>
      </div>
    </section>
  );
}
