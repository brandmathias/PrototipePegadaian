import type { BuyerBid, BuyerBidStatus, BuyerTransaction, Lot } from "@/lib/mock-data";

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
  unitName: string;
  unitAddress: string;
  account?: AccountShape;
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
  createdAt: Date;
  lotName: string;
  lotId: string;
  unitName: string;
  unitAddress: string;
  account?: AccountShape;
};

type BuyerBidShape = {
  pemasaranId: string;
  lotName: string;
  unitName: string;
  bidAmount: string;
  basePrice: string | null;
  endsAt: Date | null;
  marketingStatus: string;
  winnerId: string | null;
  transactionId?: string | null;
  userId: string;
};

function toNumber(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function toDateTimeLabel(value: Date | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Makassar"
  }).format(value);
}

function getCountdown(endsAt: Date | null | undefined) {
  if (!endsAt) {
    return undefined;
  }

  const diffMs = endsAt.getTime() - Date.now();
  if (diffMs <= 0) {
    return "Menunggu hasil";
  }

  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;

  if (days > 0) {
    return `${days} hari ${restHours} jam`;
  }

  return `${Math.max(1, hours)} jam`;
}

function toTransactionStatus(status: string): BuyerTransaction["status"] {
  if (status === "bukti_diunggah") return "BUKTI_DIUNGGAH";
  if (status === "menunggu_konfirmasi_langsung") return "MENUNGGU_KONFIRMASI_LANGSUNG";
  if (status === "lunas") return "LUNAS";
  if (status === "gagal") return "GAGAL";
  if (status === "ditolak_bukti") return "DITOLAK_BUKTI";
  return "MENUNGGU_PEMBAYARAN";
}

function getPaymentNotes(row: BuyerTransactionShape) {
  if (row.status === "ditolak_bukti") {
    return [
      "Bukti sebelumnya belum bisa diverifikasi admin.",
      row.rejectionReason ?? "Silakan unggah ulang bukti pembayaran yang lebih jelas.",
      "Pastikan nominal dan nomor referensi transfer sesuai transaksi."
    ];
  }

  if (row.status === "bukti_diunggah") {
    return [
      "Bukti transfer sudah diterima sistem.",
      "Admin unit akan mencocokkan bukti dengan mutasi rekening secara manual.",
      "Nota akan tersedia setelah pembayaran diverifikasi."
    ];
  }

  if (row.paymentMethod === "langsung") {
    return [
      "Datang ke unit Pegadaian sesuai alamat yang tertera.",
      "Tunjukkan nomor pengajuan kepada petugas.",
      "Admin unit akan mengonfirmasi pembayaran setelah transaksi offline selesai."
    ];
  }

  if (row.type === "vickrey") {
    return [
      "Anda memenangkan lelang Vickrey dan perlu menyelesaikan pembayaran dalam 24 jam.",
      "Nominal bayar mengikuti harga final sesuai mekanisme Vickrey.",
      "Unggah bukti transfer agar admin unit dapat memverifikasi pembayaran."
    ];
  }

  return [
    "Transaksi fixed price sudah dibuat.",
    "Transfer sesuai total pembayaran ke rekening unit.",
    "Unggah bukti pembayaran dari halaman ini sebelum batas waktu berakhir."
  ];
}

export function serializePublicLot(row: PublicLotShape): Lot {
  const isVickrey = row.marketingMode === "vickrey";
  const price = toNumber(isVickrey ? row.marketingBasePrice : row.marketingPrice);

  return {
    id: row.marketingId,
    code: row.itemCode,
    name: row.itemName,
    category: row.category,
    mode: isVickrey ? "vickrey" : "fixed_price",
    price,
    location: row.unitAddress,
    unitName: row.unitName,
    city: row.unitName,
    condition: row.condition,
    status: isVickrey ? "Lelang aktif" : "Tersedia",
    description: row.description,
    countdown: isVickrey ? getCountdown(row.endsAt) : undefined,
    bankName: row.account?.bankName ?? undefined,
    bankAccountNumber: row.account?.accountNumber ?? undefined,
    bankAccountHolder: row.account?.accountHolderName ?? undefined,
    bankBranch: row.account?.branchName ?? undefined,
    unitAddress: row.unitAddress,
    specs: [
      { label: "Kode barang", value: row.itemCode },
      { label: "Kategori", value: row.category },
      { label: "Kondisi", value: row.condition },
      {
        label: isVickrey ? "Batas lelang" : "Harga tetap",
        value: isVickrey ? toDateTimeLabel(row.endsAt) : "Siap dibeli"
      }
    ]
  };
}

export function serializeBuyerTransaction(row: BuyerTransactionShape): BuyerTransaction {
  const isVickrey = row.type === "vickrey";
  const method = row.paymentMethod === "langsung" ? "BAYAR_LANGSUNG" : "TRANSFER_BANK";

  return {
    id: row.id,
    lotId: row.pemasaranId,
    kind: isVickrey ? "VICKREY_WIN" : "FIXED_PRICE",
    title: row.lotName,
    amount: toNumber(row.amount),
    status: toTransactionStatus(row.status),
    method,
    unit: row.unitName,
    unitAddress: row.unitAddress,
    createdAt: toDateTimeLabel(row.createdAt),
    deadline: row.status === "lunas" ? "Selesai" : toDateTimeLabel(row.paymentDeadline),
    reference: row.referenceNumber ?? "-",
    applicationNumber: `${isVickrey ? "PGJ-VIC" : "PGJ-FP"}-${row.id.slice(0, 8).toUpperCase()}`,
    paymentLabel: method === "BAYAR_LANGSUNG" ? "Bayar langsung di unit" : "Transfer bank ke rekening unit",
    paymentNotes: getPaymentNotes(row),
    bankName: row.account?.bankName ?? undefined,
    bankAccountNumber: row.account?.accountNumber ?? undefined,
    bankAccountHolder: row.account?.accountHolderName ?? undefined,
    bankBranch: row.account?.branchName ?? undefined,
    paymentProof: row.proofUrl ?? undefined,
    winnerContext: isVickrey
      ? "Pemenang Vickrey membayar harga final yang dihitung sistem."
      : undefined,
    verifiedAt: toDateTimeLabel(row.verifiedAt),
    receiptNumber: row.status === "lunas" ? `INV/${row.id.slice(0, 8).toUpperCase()}` : undefined
  };
}

export function serializeBuyerBid(row: BuyerBidShape): BuyerBid {
  let status: BuyerBidStatus = "BID_TERCATAT";
  const ended = row.endsAt ? row.endsAt.getTime() <= Date.now() : row.marketingStatus !== "aktif";

  if (row.marketingStatus === "selesai") {
    status = row.winnerId === row.userId ? "MENANG" : "TIDAK_MENANG";
  } else if (ended) {
    status = "MENUNGGU_HASIL";
  }

  return {
    lotId: row.pemasaranId,
    lot: row.lotName,
    unit: row.unitName,
    status,
    closing: toDateTimeLabel(row.endsAt),
    bidAmount: toNumber(row.bidAmount),
    basePrice: toNumber(row.basePrice),
    note:
      status === "MENANG"
        ? "Bid Anda menjadi pemenang dan transaksi pembayaran sudah dibuat."
        : status === "TIDAK_MENANG"
          ? "Bid tidak menjadi pemenang sesi ini."
          : "Bid tertutup tersimpan dan menunggu hasil lelang.",
    linkedTransactionId: row.transactionId ?? undefined
  };
}
