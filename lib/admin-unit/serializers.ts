import type { InferSelectModel } from "drizzle-orm";

import type { LotInsights } from "@/lib/contracts/catalog";
import type { barang, bids, pemasaran, transaksi } from "@/lib/db/schema/admin";
import { formatAppDateTime } from "@/lib/timezone";
import { getHandoverAutoCompleteDeadline } from "@/lib/transactions/handover-finalization";

type BarangRow = InferSelectModel<typeof barang>;
type PemasaranRow = InferSelectModel<typeof pemasaran>;
type TransaksiRow = InferSelectModel<typeof transaksi>;
type AdminBidRow = InferSelectModel<typeof bids>;
type AdminSafeBidRow = Pick<AdminBidRow, "id" | "userId" | "createdAt" | "revealedAt"> &
  Partial<Pick<AdminBidRow, "pemasaranId" | "bidHash" | "nominal" | "salt">>;

type AdminPemasaranMedia = {
  id: string;
  type: string;
  url: string;
  fileName?: string;
};

type AdminPemasaranTransaction = {
  id?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  buyerNationalId?: string | null;
  paymentMethod?: string | null;
  status?: string | null;
  proofUrl?: string | null;
  verifiedBy?: string | null;
  handoverProofUrl?: string | null;
  handoverProofUploadedAt?: Date | string | null;
  handoverProofUploadedBy?: string | null;
  reference?: string | null;
  soldAt?: Date | string | null;
  paymentDeadline?: Date | string | null;
  completedAt?: Date | string | null;
  completionSource?: string | null;
  transactionCreatedAt?: Date | string | null;
};

function toDateLabel(value: Date | null | undefined) {
  if (!value) {
    return "-";
  }
  return value.toISOString().slice(0, 10);
}

function toDateTimeLabel(value: Date | null | undefined) {
  return formatAppDateTime(value);
}

function toNumber(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function upper(value: string | null | undefined) {
  return String(value ?? "").toUpperCase();
}

function splitLegacyProofValue(value: string | null | undefined) {
  if (!value) {
    return { proofUrl: "", reference: null };
  }

  const match = value.match(/^(.*)\s+\(([^)]+)\)$/);
  if (!match) {
    return { proofUrl: value, reference: null };
  }

  return {
    proofUrl: match[1],
    reference: match[2]
  };
}

function formatPaymentMethod(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  if (value === "transfer") {
    return "TRANSFER_BANK";
  }
  if (value === "langsung") {
    return "BAYAR_LANGSUNG";
  }
  return upper(value);
}

function toIsoOrNull(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function serializeAdminBarang(
  row: BarangRow,
  extra?: { marketingIteration?: number | null; marketingMode?: string | null; mediaCount?: number; previewImageUrl?: string | null }
) {
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
    ownerName: row.ownerName,
    customerNumber: row.customerNumber,
    description: row.description,
    specifications: row.specifications ?? {},
    marketingIteration: extra?.marketingIteration ?? null,
    marketingMode: extra?.marketingMode ?? null,
    mediaSummary: `${extra?.mediaCount ?? 0} media`,
    previewImageUrl: extra?.previewImageUrl ?? null,
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
    return "Edit detail bila perlu, evaluasi harga dasar, lalu lelang lagi atau pilih strategi pemasaran ulang.";
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
    lotCode?: string | null;
    lotCategory?: string | null;
    lotCondition?: string | null;
    lotDescription?: string | null;
    lotAppraisalValue?: string | number | null;
    lotSpecifications?: unknown;
    unitName?: string | null;
    unitAddress?: string | null;
    media?: AdminPemasaranMedia[];
    bidCount?: number;
    winnerName?: string | null;
    transaction?: AdminPemasaranTransaction | null;
    insights?: LotInsights | null;
    participantPreviews?: Array<{
      bidderId: string;
      bidderName?: string | null;
      bidderImage?: string | null;
      submittedAt?: Date | null;
      submittedAtLabel?: string | null;
    }>;
    bids?: Array<{
      bid: AdminSafeBidRow;
      bidderName?: string | null;
    }>;
  } = { lotName: "-" }
) {
  const isVickrey = row.mode === "vickrey";
  const media = (extra.media ?? []).map((item) => ({
    id: item.id,
    type: item.type === "video" ? "video" : "foto",
    url: item.url,
    fileName: item.fileName ?? ""
  }));
  const primaryMedia = media[0] ?? null;
  const ended = row.endsAt ? row.endsAt.getTime() <= Date.now() : true;
  const revealEnded = row.revealEndsAt ? row.revealEndsAt.getTime() <= Date.now() : ended;
  const hasSettledResult = row.status !== "aktif" || Boolean(row.winnerId) || Boolean(extra.transaction?.id);
  const visibility = (() => {
    if (!isVickrey) {
      return undefined;
    }
    if (!ended) {
      return "TERKUNCI";
    }
    if (!hasSettledResult && !revealEnded) {
      return "MENUNGGU_REVEAL";
    }
    return "HASIL_DIBUKA";
  })();
  const sortedBids = [...(extra.bids ?? [])].sort((left, right) => {
    if (visibility === "HASIL_DIBUKA") {
      const amountDiff = toNumber(right.bid.nominal) - toNumber(left.bid.nominal);
      if (amountDiff !== 0) {
        return amountDiff;
      }
    }

    return left.bid.createdAt.getTime() - right.bid.createdAt.getTime();
  });
  const revealedBidCount = sortedBids.filter((entry) => Boolean(entry.bid.revealedAt)).length;
  const pendingRevealCount = Math.max((extra.bidCount ?? sortedBids.length) - revealedBidCount, 0);
  const lotSpecifications =
    extra.lotSpecifications && typeof extra.lotSpecifications === "object" && !Array.isArray(extra.lotSpecifications)
      ? (extra.lotSpecifications as Record<string, string>)
      : {};
  const bidEntries =
    visibility !== "TERKUNCI"
      ? sortedBids.map((entry, index) => {
          const rank = index + 1;
          const isWinner = row.winnerId && entry.bid.userId === row.winnerId;
          return {
            id: entry.bid.id,
            bidderId: entry.bid.userId,
            bidderName: entry.bidderName ?? "Peserta",
            submittedAt: entry.bid.createdAt.toISOString(),
            submittedAtLabel: toDateTimeLabel(entry.bid.createdAt),
            isRevealed: Boolean(entry.bid.revealedAt),
            rank,
            isWinner: Boolean(isWinner),
            determinesFinalPrice: visibility === "HASIL_DIBUKA" && Boolean(row.winnerId) && rank === 2,
            ...(visibility === "HASIL_DIBUKA"
              ? { amount: entry.bid.nominal != null ? toNumber(entry.bid.nominal) : null }
              : {})
          };
        })
      : [];
  const transactionStatus = extra.transaction?.status ? upper(extra.transaction.status) : null;
  const transactionNote = (() => {
    if (row.mode === "fixed_price") {
      if (extra.transaction?.status === "lunas" || extra.transaction?.status === "selesai") {
        return "Pembayaran sudah terverifikasi dan barang siap dinyatakan terjual.";
      }
      if (extra.transaction) {
        return "Pembeli sudah mulai proses pembayaran dan menunggu verifikasi admin.";
      }
      return "Belum ada transaksi pembeli pada sesi harga tetap ini.";
    }

    if (visibility === "TERKUNCI") {
      return "Nominal bid belum dapat dibuka sebelum waktu penutupan terlewati.";
    }
    if (visibility === "MENUNGGU_REVEAL") {
      return "Deadline sudah lewat. Sistem menunggu buyer reveal nominal sebelum pemenang dihitung.";
    }
    if (transactionStatus === "MENUNGGU_PEMBAYARAN") {
      return "Pemenang sudah ditentukan dan sedang berada dalam batas pembayaran 24 jam.";
    }
    if (transactionStatus === "MENUNGGU_KONFIRMASI_LANGSUNG") {
      return "Pemenang sudah ditentukan dan diarahkan untuk membayar langsung di unit.";
    }
    if (transactionStatus === "BUKTI_DIUNGGAH") {
      return "Pemenang sudah mengirim tindak lanjut pembayaran dan menunggu keputusan admin.";
    }
    if (transactionStatus === "LUNAS" || transactionStatus === "SELESAI") {
      return "Pembayaran pemenang sudah terverifikasi dan nota dapat diproses dari transaksi.";
    }
    if (!row.winnerId) {
      return "Sesi berakhir tanpa transaksi pemenang. Barang dapat disiapkan untuk pemasaran ulang.";
    }
    return "Hasil pemasaran dapat ditinjau oleh admin unit.";
  })();

  return {
    id: row.id,
    lotId: row.barangId,
    lot: extra.lotName,
    code: extra.lotCode ?? "-",
    category: extra.lotCategory ?? "-",
    condition: extra.lotCondition ?? "-",
    description: extra.lotDescription ?? "",
    unitName: extra.unitName ?? null,
    unitAddress: extra.unitAddress ?? null,
    appraisalValue: toNumber(extra.lotAppraisalValue),
    specifications: lotSpecifications,
    status: upper(row.status),
    iteration: row.iteration,
    media,
    primaryMedia,
    startsAt: row.startsAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ending: toDateLabel(row.endsAt),
    endingAt: row.endsAt?.toISOString(),
    revealDeadline: row.revealEndsAt ? toDateTimeLabel(row.revealEndsAt) : null,
    revealDeadlineAt: row.revealEndsAt?.toISOString() ?? null,
    participants: extra.bidCount ?? 0,
    revealedBidCount,
    pendingRevealCount,
    mode: row.mode === "fixed_price" ? "FIXED_PRICE" : "VICKREY_AUCTION",
    price: row.mode === "fixed_price" ? toNumber(row.price) : null,
    transactionId: extra.transaction?.id ?? null,
    transactionStatus,
    buyerName: extra.transaction?.buyerName ?? null,
    buyerEmail: extra.transaction?.buyerEmail ?? null,
    buyerPhone: extra.transaction?.buyerPhone ?? null,
    buyerNationalId: extra.transaction?.buyerNationalId ?? null,
    paymentMethod: formatPaymentMethod(extra.transaction?.paymentMethod),
    proofUrl: extra.transaction?.proofUrl ?? null,
    verifiedBy: extra.transaction?.verifiedBy ?? null,
    handoverProofUrl: extra.transaction?.handoverProofUrl ?? null,
    handoverProofUploadedAt: toIsoOrNull(extra.transaction?.handoverProofUploadedAt),
    handoverProofUploadedBy: extra.transaction?.handoverProofUploadedBy ?? null,
    reference: extra.transaction?.reference ?? null,
    soldAt: toIsoOrNull(extra.transaction?.soldAt),
    paymentDeadline: toIsoOrNull(extra.transaction?.paymentDeadline),
    completedAt: toIsoOrNull(extra.transaction?.completedAt),
    completionSource: extra.transaction?.completionSource ?? null,
    handoverAutoCompleteAt: toIsoOrNull(
      extra.transaction?.status === "lunas"
        ? getHandoverAutoCompleteDeadline(extra.transaction?.handoverProofUploadedAt)
        : null,
    ),
    transactionCreatedAt: toIsoOrNull(extra.transaction?.transactionCreatedAt),
    insights: extra.insights ?? null,
    basePrice: row.mode === "fixed_price" ? null : toNumber(row.basePrice ?? row.price),
    finalPrice: row.mode === "fixed_price" ? null : visibility === "HASIL_DIBUKA" ? toNumber(row.finalPrice) || null : null,
    winner: row.mode === "fixed_price" ? null : visibility === "HASIL_DIBUKA" ? extra.winnerName ?? null : null,
    visibility: row.mode === "fixed_price" ? undefined : visibility,
    participantPreviews: extra.participantPreviews?.map((entry) => ({
      bidderId: entry.bidderId,
      bidderName: entry.bidderName ?? "Peserta",
      bidderImage: entry.bidderImage ?? null,
      submittedAtLabel: entry.submittedAtLabel ?? (entry.submittedAt ? toDateTimeLabel(entry.submittedAt) : null)
    })),
    bids: row.mode === "fixed_price" ? undefined : bidEntries,
    note: transactionNote
  };
}

export function serializeAdminTransaction(
  row: TransaksiRow & {
    buyerName?: string;
    buyerEmail?: string | null;
    buyerPhone?: string | null;
    buyerNationalId?: string | null;
    buyerAddress?: string | null;
    lotName?: string;
    lotId?: string;
    imageUrl?: string | null;
    unitName?: string | null;
    unitAddress?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    verifiedByName?: string | null;
    handoverProofUploadedByName?: string | null;
  }
) {
  const proof = splitLegacyProofValue(row.proofUrl);
  const hasHandoverProof = Boolean(row.handoverProofUrl);
  const printableReceipt = (row.status === "lunas" || row.status === "selesai") && hasHandoverProof;
  const verifiedAt = row.verifiedAt ?? (row.status === "ditolak_bukti" ? row.updatedAt : null);
  const handoverAutoCompleteAt =
    row.status === "lunas"
      ? getHandoverAutoCompleteDeadline(row.handoverProofUploadedAt)
      : null;

  return {
    id: row.id,
    lotId: row.lotId ?? "-",
    buyer: row.buyerName ?? "-",
    buyerEmail: row.buyerEmail ?? "-",
    buyerPhone: row.buyerPhone ?? "-",
    buyerNationalId: row.buyerNationalId ?? "-",
    buyerAddress: row.buyerAddress ?? "-",
    lot: row.lotName ?? "-",
    imageUrl: row.imageUrl ?? undefined,
    status: upper(row.status),
    method: row.paymentMethod === "langsung" ? "BAYAR_LANGSUNG" : "TRANSFER_BANK",
    total: toNumber(row.amount),
    reference: row.referenceNumber ?? proof.reference ?? "-",
    unit: row.unitName ?? "-",
    unitAddress: row.unitAddress ?? "-",
    deadline: toDateLabel(row.paymentDeadline),
    deadlineAt: row.paymentDeadline?.toISOString(),
    proofFile: proof.proofUrl,
    handoverProofFile: row.handoverProofUrl ?? "",
    handoverProofUploadedAt: toDateTimeLabel(row.handoverProofUploadedAt),
    handoverProofUploadedBy: hasHandoverProof ? row.handoverProofUploadedByName ?? "Admin Unit" : "-",
    handoverAutoCompleteAt: handoverAutoCompleteAt ? toDateTimeLabel(handoverAutoCompleteAt) : null,
    handoverAutoCompleteAtRaw: handoverAutoCompleteAt?.toISOString() ?? null,
    verifiedBy: row.verifiedByName ?? undefined,
    rejectionReason: row.rejectionReason,
    pemasaranMode: row.type === "fixed_price" ? "Harga Tetap" : "Lelang Tertutup",
    bankName: row.bankName ?? "-",
    accountNumber: row.accountNumber ?? "-",
    accountName: row.accountName ?? "-",
    createdAt: toDateTimeLabel(row.createdAt),
    verifiedAt: toDateTimeLabel(verifiedAt),
    completedAt: row.status === "selesai" ? toDateTimeLabel(row.completedAt ?? row.updatedAt) : undefined,
    completionSource: row.completionSource ?? null,
    receiptNumber: printableReceipt ? `PEG-${row.createdAt.getFullYear()}${String(row.createdAt.getMonth() + 1).padStart(2, "0")}${String(row.createdAt.getDate()).padStart(2, "0")}-${row.id.slice(0, 3).toUpperCase()}` : undefined,
    printableReceipt
  };
}
