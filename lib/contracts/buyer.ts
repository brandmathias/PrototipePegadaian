export type BuyerTransactionKind = "FIXED_PRICE" | "VICKREY_WIN";

export type BuyerTransactionStatus =
  | "MENUNGGU_VERIFIKASI"
  | "BUKTI_DIUNGGAH"
  | "DITOLAK_BUKTI"
  | "MENUNGGU_KONFIRMASI_LANGSUNG"
  | "MENUNGGU_PEMBAYARAN"
  | "LUNAS"
  | "GAGAL";

export type BuyerPaymentMethod = "TRANSFER_BANK" | "BAYAR_LANGSUNG";

export type BuyerTransaction = {
  id: string;
  lotId: string;
  kind: BuyerTransactionKind;
  title: string;
  amount: number;
  status: BuyerTransactionStatus;
  method: BuyerPaymentMethod;
  unit: string;
  unitAddress: string;
  createdAt: string;
  deadline: string;
  deadlineAt?: string;
  reference: string;
  applicationNumber: string;
  paymentLabel: string;
  paymentNotes: string[];
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankBranch?: string;
  paymentProof?: string;
  winnerContext?: string;
  verifiedAt?: string;
  receiptNumber?: string;
};

export type BuyerBidStatus =
  | "BID_TERCATAT"
  | "MENUNGGU_HASIL"
  | "MENANG"
  | "TIDAK_MENANG";

export type BuyerBid = {
  lotId: string;
  lot: string;
  unit: string;
  status: BuyerBidStatus;
  closing: string;
  bidAmount: number;
  basePrice: number;
  note: string;
  linkedTransactionId?: string;
};
