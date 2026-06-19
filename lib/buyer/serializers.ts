import { getCountdownState } from "@/lib/countdown";
import { getBarangSpecificationRows } from "@/lib/admin-unit/specifications";
import { resolveAdminUnitCategoryLabel } from "@/lib/catalog/categories";
import type { BuyerBid, BuyerBidStatus, BuyerTransaction } from "@/lib/contracts/buyer";
import type { Lot, LotInsights } from "@/lib/contracts/catalog";
import { formatAppDateTime } from "@/lib/timezone";

type AccountShape = {
  bankName: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;
  branchName?: string | null;
} | null;

type PublicLotShape = {
  marketingId: string;
  marketingMode: string;
  marketingPrice: string | null;
  marketingBasePrice: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  itemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  condition: string;
  description: string;
  specifications?: unknown;
  unitName: string;
  unitAddress: string;
  updatedAt?: Date | null;
  account?: AccountShape;
  insights?: LotInsights;
  media?: Array<{
    id: string;
    type: string;
    url: string;
    fileName: string | null;
  }>;
};

type BuyerTransactionShape = {
  id: string;
  pemasaranId: string;
  type: string;
  amount: string;
  paymentMethod: string | null;
  status: string;
  proofUrl: string | null;
  rejectionReason?: string | null;
  referenceNumber: string | null;
  paymentDeadline: Date | null;
  verifiedAt: Date | null;
  handoverProofUrl?: string | null;
  handoverProofUploadedAt?: Date | null;
  handoverProofUploadedBy?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  lotName: string;
  lotId: string;
  imageUrl?: string | null;
  unitName: string;
  unitAddress: string;
  account?: AccountShape;
};

type BuyerBidShape = {
  pemasaranId: string;
  lotName: string;
  imageUrl?: string | null;
  unitName: string;
  bidAmount: string | null;
  bidHash?: string | null;
  encryptedBidPayload?: string | null;
  revealedAt?: Date | null;
  basePrice: string | null;
  finalPrice?: string | null;
  paymentAmount?: string | null;
  paymentDeadline?: Date | null;
  transactionStatus?: string | null;
  endsAt: Date | null;
  revealEndsAt?: Date | null;
  marketingStatus: string;
  winnerId: string | null;
  transactionId?: string | null;
  userId: string;
};

function toNumber(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function toDateTimeLabel(value: Date | null | undefined) {
  return formatAppDateTime(value);
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function toTransactionStatus(status: string): BuyerTransaction["status"] {
  if (status === "bukti_diunggah") return "BUKTI_DIUNGGAH";
  if (status === "menunggu_konfirmasi_langsung") return "MENUNGGU_KONFIRMASI_LANGSUNG";
  if (status === "lunas") return "LUNAS";
  if (status === "selesai") return "SELESAI";
  if (status === "gagal") return "GAGAL";
  if (status === "ditolak_bukti") return "DITOLAK_BUKTI";
  return "MENUNGGU_PEMBAYARAN";
}

function splitLegacyProofValue(value: string | null | undefined) {
  if (!value) {
    return { proofUrl: undefined, reference: undefined };
  }

  const match = value.match(/^(.*)\s+\(([^)]+)\)$/);
  if (!match) {
    return { proofUrl: value, reference: undefined };
  }

  return {
    proofUrl: match[1],
    reference: match[2]
  };
}

function getPaymentNotes(row: BuyerTransactionShape) {
  if (row.status === "selesai") {
    return [
      "Pembelian sudah ditandai selesai oleh pembeli.",
      "Nota digital tetap tersedia untuk dicetak atau disimpan.",
      "Hubungi unit jika membutuhkan bantuan setelah transaksi selesai."
    ];
  }

  if (row.status === "lunas") {
    return [
      "Pembayaran sudah diverifikasi admin unit.",
      row.handoverProofUrl
        ? "Bukti serah-terima barang sudah tersedia. Tekan Pembelian Selesai setelah barang dan nota sudah Anda terima."
        : "Menunggu admin unit mengunggah bukti serah-terima barang sebelum Pembelian Selesai dapat dikonfirmasi.",
      "Nota digital tersedia selama transaksi menunggu penyelesaian buyer."
    ];
  }

  if (row.status === "ditolak_bukti") {
    return [
      "Bukti pembayaran ditolak admin unit.",
      row.rejectionReason ?? "Bukti pembayaran tidak disetujui admin unit.",
      "Transaksi dibatalkan dan barang kembali tersedia di katalog jika belum terjual."
    ];
  }

  if (row.status === "bukti_diunggah") {
    return [
      "Bukti transfer sudah diterima sistem.",
      "Admin unit akan mencocokkan bukti dengan mutasi rekening secara manual.",
      "Nota akan tersedia setelah pembayaran diverifikasi."
    ];
  }

  if (row.type === "vickrey" && row.paymentMethod === "langsung") {
    return [
      "Anda memenangkan Lelang Tertutup dan pembayaran hanya dapat diselesaikan langsung di unit.",
      "Datang ke unit terkait sesuai alamat yang tertera dan tunjukkan nomor pengajuan.",
      "Admin unit akan memverifikasi pembayaran langsung setelah dana diterima."
    ];
  }

  if (row.paymentMethod === "langsung") {
    return [
      "Datang ke unit terkait sesuai alamat yang tertera.",
      "Tunjukkan nomor pengajuan kepada petugas.",
      "Admin unit akan mengonfirmasi pembayaran setelah transaksi offline selesai."
    ];
  }

  if (row.type === "vickrey") {
    return [
      "Anda memenangkan Lelang Tertutup dan perlu menyelesaikan pembayaran dalam 24 jam.",
      "Nominal bayar mengikuti harga akhir sesuai mekanisme lelang.",
      "Unggah bukti transfer agar admin unit dapat memverifikasi pembayaran."
    ];
  }

  return [
    "Transaksi harga tetap sudah dibuat.",
    "Transfer sesuai total pembayaran ke rekening unit.",
    "Unggah bukti pembayaran dari halaman detail transaksi agar admin unit dapat memverifikasi."
  ];
}

export function serializePublicLot(row: PublicLotShape): Lot {
  const isVickrey = row.marketingMode === "vickrey";
  const price = toNumber(isVickrey ? row.marketingBasePrice : row.marketingPrice);
  const categoryLabel = resolveAdminUnitCategoryLabel({
    category: row.category,
    itemName: row.itemName,
    specifications: row.specifications
  });

  return {
    id: row.marketingId,
    code: row.itemCode,
    name: row.itemName,
    category: categoryLabel,
    mode: isVickrey ? "vickrey" : "fixed_price",
    price,
    location: row.unitAddress,
    unitName: row.unitName,
    city: row.unitName,
    condition: row.condition,
    status: isVickrey ? "Lelang aktif" : "Tersedia",
    description: row.description,
    updatedAt: row.updatedAt?.toISOString(),
    countdown: isVickrey
      ? getCountdownState(row.endsAt, { expiredLabel: "Menunggu hasil" }).label
      : undefined,
    endsAt: isVickrey ? row.endsAt?.toISOString() : undefined,
    bankName: row.account?.bankName ?? undefined,
    bankAccountNumber: row.account?.accountNumber ?? undefined,
    bankAccountHolder: row.account?.accountHolderName ?? undefined,
    bankBranch: row.account?.branchName ?? undefined,
    unitAddress: row.unitAddress,
    insights: row.insights ?? {
      likes: 0,
      participants: 0,
      views: 0
    },
    media:
      row.media?.map((item) => ({
        id: item.id,
        type: item.type === "video" ? "video" : "foto",
        url: item.url,
        fileName: item.fileName || row.itemName
      })) ?? [],
    specs: getBarangSpecificationRows(row.category, row.specifications, row.itemName)
  };
}

export function serializeBuyerTransaction(row: BuyerTransactionShape): BuyerTransaction {
  const isVickrey = row.type === "vickrey";
  const method = row.paymentMethod === "langsung" ? "BAYAR_LANGSUNG" : "TRANSFER_BANK";
  const proof = splitLegacyProofValue(row.proofUrl);
  const status = toTransactionStatus(row.status);
  const hasFinalReceipt = row.status === "lunas" || row.status === "selesai";
  const isFixedPriceWaitingPayment = !isVickrey && status === "MENUNGGU_PEMBAYARAN";
  const deadlineLabel =
    status === "BUKTI_DIUNGGAH"
      ? "Menunggu verifikasi admin"
      : status === "DITOLAK_BUKTI"
        ? "Dibatalkan"
        : hasFinalReceipt
          ? "Selesai"
          : isFixedPriceWaitingPayment
            ? "Unggah bukti pembayaran"
          : getCountdownState(row.paymentDeadline, {
              expiredLabel: "Waktu pembayaran berakhir"
            }).label;
  const deadlineAt =
    status === "BUKTI_DIUNGGAH" || status === "DITOLAK_BUKTI" || hasFinalReceipt || isFixedPriceWaitingPayment
      ? undefined
      : row.paymentDeadline?.toISOString();

  return {
    id: row.id,
    lotId: row.pemasaranId,
    kind: isVickrey ? "VICKREY_WIN" : "FIXED_PRICE",
    title: row.lotName,
    imageUrl: row.imageUrl ?? undefined,
    amount: toNumber(row.amount),
    status,
    method,
    unit: row.unitName,
    unitAddress: row.unitAddress,
    createdAt: toDateTimeLabel(row.createdAt),
    deadline: deadlineLabel,
    deadlineAt,
    reference: row.referenceNumber ?? proof.reference ?? "-",
    applicationNumber: `${isVickrey ? "PGJ-VIC" : "PGJ-FP"}-${row.id.slice(0, 8).toUpperCase()}`,
    paymentLabel: method === "BAYAR_LANGSUNG" ? "Bayar langsung di unit" : "Transfer bank ke rekening unit",
    paymentNotes: getPaymentNotes(row),
    bankName: row.account?.bankName ?? undefined,
    bankAccountNumber: row.account?.accountNumber ?? undefined,
    bankAccountHolder: row.account?.accountHolderName ?? undefined,
    bankBranch: row.account?.branchName ?? undefined,
    paymentProof: proof.proofUrl,
    rejectionReason: row.rejectionReason ?? undefined,
    winnerContext: isVickrey ? "Harga akhir mengikuti mekanisme lelang dan dihitung otomatis oleh sistem." : undefined,
    verifiedAt: toDateTimeLabel(row.verifiedAt),
    completedAt:
      row.status === "selesai"
        ? toDateTimeLabel(row.updatedAt ?? row.verifiedAt ?? row.createdAt)
        : undefined,
    receiptNumber: hasFinalReceipt ? `INV/${row.id.slice(0, 8).toUpperCase()}` : undefined,
    handoverProof: row.handoverProofUrl
      ? {
          fileUrl: row.handoverProofUrl,
          uploadedAt: toDateTimeLabel(row.handoverProofUploadedAt),
          uploadedBy: row.handoverProofUploadedBy ?? "Admin Unit",
          location: row.unitName
        }
      : undefined
  };
}

export function serializeBuyerBid(row: BuyerBidShape): BuyerBid {
  let status: BuyerBidStatus = "BID_TERCATAT";
  const ended = row.endsAt ? row.endsAt.getTime() <= Date.now() : row.marketingStatus !== "aktif";
  const revealEnded = row.revealEndsAt ? row.revealEndsAt.getTime() <= Date.now() : false;
  const transactionStatus = row.transactionStatus ? toTransactionStatus(row.transactionStatus) : undefined;
  const isWinner = row.winnerId === row.userId;
  const hasWinner = Boolean(row.winnerId);
  const finalPrice = row.finalPrice != null ? toNumber(row.finalPrice) : undefined;
  const paymentAmount = row.paymentAmount != null ? toNumber(row.paymentAmount) : undefined;
  const isRevealed = row.bidAmount != null;
  const isEscrowed = Boolean(row.encryptedBidPayload);
  const canReveal = ended && !isRevealed && !isEscrowed && row.marketingStatus === "aktif" && !revealEnded;
  const revealDeadline = row.revealEndsAt ? toDateTimeLabel(row.revealEndsAt) : undefined;
  const revealDeadlineAt = row.revealEndsAt?.toISOString();

  if (transactionStatus === "GAGAL" && isWinner) {
    status = "GAGAL";
  } else if (row.marketingStatus === "selesai" || (row.marketingStatus === "gagal" && hasWinner)) {
    status = isWinner ? "MENANG" : "TIDAK_MENANG";
  } else if (ended) {
    status = "MENUNGGU_HASIL";
  }

  let note = "Hash bid tertutup tersimpan. Reveal nominal setelah deadline agar bid bisa ikut settlement.";
  if (status === "GAGAL") {
    note = "Pembayaran Lelang Tertutup gagal karena melewati batas waktu. Akses lelang dapat dibatasi sesuai aturan.";
  } else if (status === "MENANG") {
    note = `Anda memenangkan Lelang Tertutup. Harga akhir mengikuti mekanisme lelang: ${formatRupiah(paymentAmount ?? finalPrice ?? toNumber(row.basePrice))}.`;
  } else if (status === "TIDAK_MENANG") {
    note = "Bid tidak menjadi pemenang sesi ini.";
  } else if (canReveal) {
    note = `Deadline lewat. Reveal nominal sebelum ${revealDeadline ?? "batas reveal"} agar bid ikut penentuan pemenang.`;
  } else if (isEscrowed && !ended) {
    note = "Bid terenkripsi tersimpan. Sistem akan membuka escrow otomatis saat deadline lelang berakhir.";
  } else if (isEscrowed) {
    note = "Deadline sudah lewat. Sistem sedang membuka escrow dan menghitung hasil Lelang Tertutup otomatis.";
  } else if (isRevealed) {
    note = "Bid sudah direveal dan menunggu penentuan hasil Lelang Tertutup.";
  } else if (ended && revealEnded) {
    note = "Periode reveal selesai. Bid belum direveal, sehingga tidak ikut penentuan pemenang.";
  }

  return {
    lotId: row.pemasaranId,
    lot: row.lotName,
    imageUrl: row.imageUrl ?? undefined,
    unit: row.unitName,
    status,
    closing: toDateTimeLabel(row.endsAt),
    closingAt: row.endsAt?.toISOString(),
    revealDeadline,
    revealDeadlineAt,
    ...(isRevealed ? { bidAmount: toNumber(row.bidAmount) } : {}),
    basePrice: toNumber(row.basePrice),
    finalPrice,
    paymentAmount,
    transactionStatus,
    paymentDeadline: row.paymentDeadline ? toDateTimeLabel(row.paymentDeadline) : undefined,
    paymentDeadlineAt: row.paymentDeadline?.toISOString(),
    note,
    linkedTransactionId: row.transactionId ?? undefined,
    bidHash: row.bidHash ?? undefined,
    isRevealed,
    escrowed: isEscrowed,
    canReveal
  };
}
