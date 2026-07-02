export type BuyerTransactionKind = "FIXED_PRICE" | "VICKREY_WIN";

export type BuyerTransactionStatus =
  | "MENUNGGU_VERIFIKASI"
  | "BUKTI_DIUNGGAH"
  | "DITOLAK_BUKTI"
  | "MENUNGGU_KONFIRMASI_LANGSUNG"
  | "MENUNGGU_PEMBAYARAN"
  | "LUNAS"
  | "SELESAI"
  | "GAGAL";

export type BuyerPaymentMethod = "TRANSFER_BANK" | "BAYAR_LANGSUNG";

export type BuyerBankAccount = {
  id?: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  isActive?: boolean;
};

export type BuyerHandoverProof = {
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  location: string;
};

export type BuyerTransaction = {
  id: string;
  lotId: string;
  kind: BuyerTransactionKind;
  title: string;
  imageUrl?: string;
  category?: string;
  condition?: string;
  specs?: Array<{ label: string; value: string }>;
  amount: number;
  status: BuyerTransactionStatus;
  method: BuyerPaymentMethod;
  unit: string;
  unitAddress: string;
  createdAt: string;
  createdAtRaw?: string;
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
  bankAccounts?: BuyerBankAccount[];
  paymentProof?: string;
  rejectionReason?: string;
  winnerContext?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  completedAt?: string;
  completionSource?: "BUYER" | "AUTO_HANDOVER_GRACE";
  receiptNumber?: string;
  handoverProof?: BuyerHandoverProof;
  handoverAutoCompleteAt?: string;
  handoverAutoCompleteAtRaw?: string;
};

export type BuyerBidStatus =
  | "BID_TERCATAT"
  | "MENUNGGU_HASIL"
  | "MENANG"
  | "TIDAK_MENANG"
  | "GAGAL";

export type BuyerBid = {
  lotId: string;
  lot: string;
  imageUrl?: string;
  unit: string;
  status: BuyerBidStatus;
  closing: string;
  closingAt?: string;
  createdAtRaw?: string;
  revealDeadline?: string;
  revealDeadlineAt?: string;
  bidAmount?: number;
  basePrice: number;
  finalPrice?: number;
  paymentAmount?: number;
  transactionStatus?: BuyerTransactionStatus;
  paymentDeadline?: string;
  paymentDeadlineAt?: string;
  note: string;
  linkedTransactionId?: string;
  bidHash?: string;
  isRevealed?: boolean;
  escrowed?: boolean;
  canReveal?: boolean;
};

export type BuyerBidVerification = {
  lotId: string;
  lot: string;
  unit: string;
  closing: string;
  bidAmount?: number;
  bidHash: string;
  computedHash?: string;
  salt?: string;
  algorithm: "SHA-256";
  formula: string;
  isMatch: boolean;
  canVerify: boolean;
  canReveal: boolean;
  isRevealed: boolean;
};
