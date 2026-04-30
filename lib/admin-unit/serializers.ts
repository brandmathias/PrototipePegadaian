import type { InferSelectModel } from "drizzle-orm";

import type { barang, bids, pemasaran, transaksi } from "@/lib/db/schema/admin";

type BarangRow = InferSelectModel<typeof barang>;
type PemasaranRow = InferSelectModel<typeof pemasaran>;
type TransaksiRow = InferSelectModel<typeof transaksi>;
type AdminBidRow = InferSelectModel<typeof bids>;

const witaDateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Makassar"
});

function toDateLabel(value: Date | null | undefined) {
  if (!value) {
    return "-";
  }
  return value.toISOString().slice(0, 10);
}

function toDateTimeLabel(value: Date | null | undefined) {
  if (!value) {
    return "-";
  }
  return witaDateTime.format(value);
}

function toNumber(value: string | null | undefined) {
  return Number(value ?? 0);
}

function upper(value: string | null | undefined) {
  return String(value ?? "").toUpperCase();
}

export function serializeAdminBarang(row: BarangRow, extra?: { marketingMode?: string | null; mediaCount?: number }) {
  const displayStatus = row.status === "gadai" ? "jaminan" : row.status;

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    status: upper(displayStatus),
    date: toDateLabel(row.createdAt),
    condition: row.condition,
    receivedAt: toDateLabel(row.createdAt),
    pawnedAt: toDateLabel(row.pawnedAt),
    dueDate: toDateLabel(row.dueDate),
    appraisalValue: toNumber(row.appraisalValue),
    loanValue: toNumber(row.loanValue),
    ownerName: row.ownerName,
    customerNumber: row.customerNumber,
    description: row.description,
    marketingMode: extra?.marketingMode ?? null,
    mediaSummary: `${extra?.mediaCount ?? 0} media`,
    redeemedAt: toDateLabel(row.redeemedAt),
    redemptionReference: row.redemptionReference ?? "-",
    nextAction: getBarangNextAction(displayStatus)
  };
}

function getBarangNextAction(status: string) {
  if (status === "jaminan") {
    return "Lengkapi media dan strategi penjualan, lalu tayangkan barang ke katalog.";
  }
  if (status === "gagal") {
    return "Tinjau kembali harga atau mode pemasaran sebelum ditayangkan ulang.";
  }
  if (status === "menunggu_pembayaran") {
    return "Pantau batas waktu pembayaran pemenang.";
  }
  return "Data barang sudah berada pada tahap akhir atau sedang aktif berjalan.";
}

export function serializeAdminPemasaran(
  row: PemasaranRow,
  extra: {
    lotName: string;
    bidCount?: number;
    winnerName?: string | null;
    bids?: Array<{
      bid: AdminBidRow;
      bidderName?: string | null;
    }>;
  } = { lotName: "-" }
) {
  const isVickrey = row.mode === "vickrey";
  const ended = row.endsAt ? row.endsAt.getTime() <= Date.now() : true;
  const visibility = isVickrey && !ended ? "TERKUNCI" : "HASIL_DIBUKA";
  const sortedBids = [...(extra.bids ?? [])].sort((left, right) => {
    const nominalGap = toNumber(right.bid.nominal) - toNumber(left.bid.nominal);
    if (nominalGap !== 0) {
      return nominalGap;
    }
    return left.bid.createdAt.getTime() - right.bid.createdAt.getTime();
  });
  const bidEntries =
    visibility === "HASIL_DIBUKA"
      ? sortedBids.map((entry, index) => {
          const rank = index + 1;
          const isWinner = row.winnerId && entry.bid.userId === row.winnerId;
          const isFinalPriceReference =
            sortedBids.length > 1 ? rank === 2 : sortedBids.length === 1 && rank === 1;

          return {
            id: entry.bid.id,
            bidderId: entry.bid.userId,
            bidderName: entry.bidderName ?? "Peserta",
            nominal: toNumber(entry.bid.nominal),
            submittedAt: entry.bid.createdAt.toISOString(),
            submittedAtLabel: toDateTimeLabel(entry.bid.createdAt),
            rank,
            isWinner: Boolean(isWinner),
            determinesFinalPrice: Boolean(isFinalPriceReference)
          };
        })
      : [];

  return {
    id: row.id,
    lotId: row.barangId,
    lot: extra.lotName,
    status: upper(row.status),
    ending: toDateLabel(row.endsAt),
    endingAt: row.endsAt?.toISOString(),
    participants: extra.bidCount ?? 0,
    mode: row.mode === "fixed_price" ? "FIXED_PRICE" : "VICKREY_AUCTION",
    basePrice: toNumber(row.basePrice ?? row.price),
    finalPrice: visibility === "HASIL_DIBUKA" ? toNumber(row.finalPrice) || null : null,
    winner: visibility === "HASIL_DIBUKA" ? extra.winnerName ?? null : null,
    visibility,
    bids: bidEntries,
    note:
      visibility === "TERKUNCI"
        ? "Nominal bid belum dapat dibuka sebelum waktu penutupan terlewati."
        : "Hasil pemasaran dapat ditinjau oleh admin unit."
  };
}

export function serializeAdminTransaction(
  row: TransaksiRow & {
    buyerName?: string;
    lotName?: string;
    lotId?: string;
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
  }
) {
  return {
    id: row.id,
    lotId: row.lotId ?? "-",
    buyer: row.buyerName ?? "-",
    lot: row.lotName ?? "-",
    status: upper(row.status),
    method: row.paymentMethod === "langsung" ? "BAYAR_LANGSUNG" : "TRANSFER_BANK",
    total: toNumber(row.amount),
    reference: row.referenceNumber ?? "-",
    deadline: toDateLabel(row.paymentDeadline),
    deadlineAt: row.paymentDeadline?.toISOString(),
    proofFile: row.proofUrl ?? "",
    rejectionReason: row.rejectionReason,
    pemasaranMode: row.type === "fixed_price" ? "Fixed Price" : "Vickrey",
    bankName: row.bankName ?? "-",
    accountNumber: row.accountNumber ?? "-",
    accountName: row.accountName ?? "-"
  };
}
