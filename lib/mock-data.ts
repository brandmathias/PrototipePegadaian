import type {
  AdminAuctionStatus,
  AdminBlacklistStatus,
  AdminInventoryStatus,
  AdminTransactionStatus
} from "@/lib/admin";

export type AuctionMode = "fixed_price" | "vickrey";

export type Lot = {
  id: string;
  code: string;
  name: string;
  category: string;
  mode: AuctionMode;
  price: number;
  location: string;
  unitName: string;
  city: string;
  condition: string;
  status: string;
  description: string;
  countdown?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankBranch?: string;
  unitAddress?: string;
  specs: Array<{ label: string; value: string }>;
};

export const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

export const categories = [
  "Semua",
  "Perhiasan",
  "Elektronik",
  "Kendaraan",
  "Logam Mulia",
  "Lainnya"
];

export const publicLots: Lot[] = [
  {
    id: "lot-001",
    code: "LEL-GLD-00129",
    name: "Kalung Emas 18K Model Figaro Italy",
    category: "Perhiasan",
    mode: "fixed_price",
    price: 12450000,
    location: "CP Sudirman, Jakarta",
    unitName: "Pegadaian CP Sudirman",
    city: "Jakarta",
    condition: "Baik",
    status: "Tersedia",
    description:
      "Kalung emas dengan kilau terawat, pengunci aman, dan hasil appraisal internal unit. Cocok untuk pembelian langsung maupun koleksi.",
    specs: [
      { label: "Berat", value: "14.5 gram" },
      { label: "Karat", value: "18K" },
      { label: "Tanggal Masuk", value: "12 Oktober 2024" },
      { label: "Dokumen", value: "Sertifikat appraisal Pegadaian" }
    ]
  },
  {
    id: "lot-002",
    code: "LEL-ELC-00391",
    name: "MacBook Pro 14 inci M2 Pro 16/512",
    category: "Elektronik",
    mode: "vickrey",
    price: 18200000,
    location: "UPC Malioboro, Yogyakarta",
    unitName: "Pegadaian UPC Malioboro",
    city: "Yogyakarta",
    condition: "Baik",
    status: "Lelang Aktif",
    countdown: "2 hari 04 jam",
    description:
      "Laptop performa tinggi dengan kondisi mulus, baterai prima, dan unit telah lulus pengecekan fungsi dasar.",
    specs: [
      { label: "Processor", value: "Apple M2 Pro" },
      { label: "RAM", value: "16 GB" },
      { label: "Penyimpanan", value: "512 GB SSD" },
      { label: "Batas Lelang", value: "24 April 2026, 16.00 WITA" }
    ]
  },
  {
    id: "lot-003",
    code: "LEL-VEH-00077",
    name: "Toyota Fortuner VRZ 2021 AT Diesel",
    category: "Kendaraan",
    mode: "fixed_price",
    price: 345000000,
    location: "CP Basuki Rahmat, Surabaya",
    unitName: "Pegadaian CP Basuki Rahmat",
    city: "Surabaya",
    condition: "Cukup",
    status: "Tersedia",
    description:
      "Kendaraan unit lelang dengan riwayat servis internal tersedia. Cocok untuk pembeli yang mencari aset bernilai tinggi.",
    specs: [
      { label: "Tahun", value: "2021" },
      { label: "Transmisi", value: "Automatic" },
      { label: "Bahan Bakar", value: "Diesel" },
      { label: "Odometer", value: "38.100 km" }
    ]
  },
  {
    id: "lot-004",
    code: "LEL-GOLD-00014",
    name: "Logam Mulia Antam 10 gram Sertifikat Asli",
    category: "Logam Mulia",
    mode: "fixed_price",
    price: 11100000,
    location: "CP Medan Baru, Medan",
    unitName: "Pegadaian CP Medan Baru",
    city: "Medan",
    condition: "Baik",
    status: "Tersedia",
    description:
      "Logam mulia dengan sertifikat asli dan permukaan mulus. Ditampilkan sebagai produk fixed price paling cepat bergerak.",
    specs: [
      { label: "Berat", value: "10 gram" },
      { label: "Produsen", value: "Antam" },
      { label: "Sertifikat", value: "Ada" },
      { label: "Segel", value: "Utuh" }
    ]
  },
  {
    id: "lot-005",
    code: "LEL-MISC-00991",
    name: "Headphone Studio Wireless Noise Cancelling",
    category: "Elektronik",
    mode: "vickrey",
    price: 3150000,
    location: "UPC Panakkukang, Makassar",
    unitName: "Pegadaian UPC Panakkukang",
    city: "Makassar",
    condition: "Baik",
    status: "Lelang Aktif",
    countdown: "7 jam 20 menit",
    description:
      "Perangkat audio kondisi prima dengan paket lengkap. Digunakan sebagai contoh lot Vickrey yang mendekati deadline.",
    specs: [
      { label: "Baterai", value: "32 jam" },
      { label: "Warna", value: "Midnight Black" },
      { label: "Aksesori", value: "Box + kabel original" },
      { label: "Batas Lelang", value: "21 April 2026, 23.30 WITA" }
    ]
  },
  {
    id: "lot-006",
    code: "LEL-JWL-00457",
    name: "Cincin Berlian Solitaire 1.2 ct",
    category: "Perhiasan",
    mode: "vickrey",
    price: 27800000,
    location: "CP Diponegoro, Bandung",
    unitName: "Pegadaian CP Diponegoro",
    city: "Bandung",
    condition: "Baik",
    status: "Lelang Aktif",
    countdown: "5 hari 12 jam",
    description:
      "Perhiasan unggulan dengan detail appraisal dan dokumentasi foto lengkap. Diposisikan sebagai hero lot editorial.",
    specs: [
      { label: "Batu", value: "Diamond 1.2 ct" },
      { label: "Ring Size", value: "16" },
      { label: "Material", value: "White gold" },
      { label: "Batas Lelang", value: "27 April 2026, 10.00 WITA" }
    ]
  }
];

export const landingStats = [
  { label: "Barang aktif", value: "1.284+" },
  { label: "Unit terhubung", value: "142" },
  { label: "Lelang hidup", value: "219" },
  { label: "Transaksi terverifikasi", value: "12.8K" }
];

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

export const userSummary = {
  name: "Raras Maheswari",
  unit: "Pembeli terverifikasi",
  accountId: "USR-2026-118",
  email: "raras.maheswari@contoh.id",
  phone: "0812-9918-4410",
  nikMasked: "7371********2204",
  address: "Jl. Puri Kencana No. 18, Makassar",
  memberSince: "14 Januari 2026",
  verificationStatus: "Terverifikasi",
  blacklist: {
    active: false,
    violations: 0,
    until: "-",
    reason: "Tidak ada pembatasan aktif. Akun dapat mengikuti fixed price dan lelang."
  },
  metrics: [
    { label: "Transaksi aktif", value: "4", accent: "primary" },
    { label: "Perlu ditindaklanjuti", value: "3", accent: "secondary" },
    { label: "Lelang yang diikuti", value: "2", accent: "neutral" },
    { label: "Nota siap diunduh", value: "1", accent: "primary" }
  ],
  highlights: [
    "Unggah bukti transfer maksimal 24 jam setelah transaksi dibuat.",
    "Pemenang Vickrey membayar harga penawar tertinggi kedua atau harga dasar bila hanya ada satu penawar.",
    "Keterlambatan pembayaran lelang dapat berujung pada blacklist otomatis."
  ]
};

export const userTransactions: BuyerTransaction[] = [
  {
    id: "TRX-2026-0051",
    lotId: "lot-004",
    kind: "FIXED_PRICE",
    title: "Logam Mulia Antam 10 gram Sertifikat Asli",
    amount: 11100000,
    status: "MENUNGGU_PEMBAYARAN",
    method: "TRANSFER_BANK",
    unit: "Pegadaian CP Medan Baru",
    unitAddress: "Jl. Gajah Mada No. 88, Medan Baru",
    createdAt: "21 April 2026, 09.10 WITA",
    deadline: "22 April 2026, 09.10 WITA",
    reference: "FP-2026-0051",
    applicationNumber: "PGJ-FP-2026-0051",
    paymentLabel: "Transfer bank ke rekening unit",
    paymentNotes: [
      "Transaksi pembelian sudah dibuat dan menunggu pembayaran Anda.",
      "Lakukan transfer ke rekening unit, lalu unggah bukti pembayaran di halaman ini.",
      "Admin unit akan memeriksa bukti transfer sebelum status berubah menjadi lunas."
    ],
    bankName: "Bank Mandiri",
    bankAccountNumber: "10200-9988-5511",
    bankAccountHolder: "PT Pegadaian (Persero) CP Medan Baru",
    bankBranch: "Cabang Medan Baru"
  },
  {
    id: "TRX-2026-0045",
    lotId: "lot-001",
    kind: "FIXED_PRICE",
    title: "Kalung Emas 18K Model Figaro Italy",
    amount: 12450000,
    status: "BUKTI_DIUNGGAH",
    method: "TRANSFER_BANK",
    unit: "Pegadaian CP Sudirman",
    unitAddress: "Jl. Jend. Sudirman No. 45, Jakarta Pusat",
    createdAt: "21 April 2026, 10.35 WITA",
    deadline: "22 April 2026, 18.00 WITA",
    reference: "FP-2026-0045",
    applicationNumber: "PGJ-FP-2026-0045",
    paymentLabel: "Transfer bank sudah dilakukan",
    paymentNotes: [
      "Bukti transfer telah diunggah dan sedang menunggu verifikasi admin unit.",
      "Jangan melakukan pembayaran ulang selama status masih diproses.",
      "Setelah diverifikasi, sistem akan membuka nota digital."
    ],
    bankName: "BRI",
    bankAccountNumber: "0123-4567-8901-234",
    bankAccountHolder: "PT Pegadaian (Persero) CP Sudirman",
    bankBranch: "Cabang Sudirman",
    paymentProof: "bukti-transfer-kalung-emas.pdf"
  },
  {
    id: "TRX-2026-0039",
    lotId: "lot-003",
    kind: "FIXED_PRICE",
    title: "Toyota Fortuner VRZ 2021 AT Diesel",
    amount: 345000000,
    status: "MENUNGGU_KONFIRMASI_LANGSUNG",
    method: "BAYAR_LANGSUNG",
    unit: "Pegadaian CP Basuki Rahmat",
    unitAddress: "Jl. Basuki Rahmat No. 119, Surabaya",
    createdAt: "20 April 2026, 14.00 WITA",
    deadline: "23 April 2026, 15.00 WITA",
    reference: "FP-2026-0039",
    applicationNumber: "PGJ-FP-2026-0039",
    paymentLabel: "Bayar langsung di unit Pegadaian",
    paymentNotes: [
      "Datang ke unit sesuai alamat yang tertera untuk menyelesaikan pembayaran.",
      "Tunjukkan nomor pengajuan kepada admin unit saat tiba di lokasi.",
      "Status akan berubah lunas setelah admin mengonfirmasi pembayaran langsung."
    ]
  },
  {
    id: "TRX-2026-0033",
    lotId: "lot-002",
    kind: "VICKREY_WIN",
    title: "MacBook Pro 14 inci M2 Pro 16/512",
    amount: 18850000,
    status: "MENUNGGU_PEMBAYARAN",
    method: "TRANSFER_BANK",
    unit: "Pegadaian UPC Malioboro",
    unitAddress: "Jl. Malioboro No. 17, Yogyakarta",
    createdAt: "21 April 2026, 08.45 WITA",
    deadline: "22 April 2026, 08.45 WITA",
    reference: "VIC-2026-0033",
    applicationNumber: "PGJ-VIC-2026-0033",
    paymentLabel: "Pemenang lelang Vickrey",
    paymentNotes: [
      "Anda memenangkan lelang tertutup dan wajib menyelesaikan pembayaran dalam 24 jam.",
      "Nominal yang dibayar mengikuti harga penawar tertinggi kedua sesuai PRD.",
      "Jika gagal membayar sampai batas waktu, transaksi menjadi gagal dan akun dapat masuk blacklist."
    ],
    bankName: "BNI",
    bankAccountNumber: "9880-2211-6633",
    bankAccountHolder: "PT Pegadaian (Persero) UPC Malioboro",
    bankBranch: "Cabang Yogyakarta",
    winnerContext: "Pemenang Vickrey membayar harga penawar tertinggi kedua."
  },
  {
    id: "TRX-2026-0027",
    lotId: "lot-004",
    kind: "FIXED_PRICE",
    title: "Logam Mulia Antam 10 gram",
    amount: 11100000,
    status: "LUNAS",
    method: "TRANSFER_BANK",
    unit: "Pegadaian CP Medan Baru",
    unitAddress: "Jl. Gajah Mada No. 88, Medan Baru",
    createdAt: "18 April 2026, 13.20 WITA",
    deadline: "Selesai",
    reference: "FP-2026-0027",
    applicationNumber: "PGJ-FP-2026-0027",
    paymentLabel: "Pembayaran selesai dan diverifikasi",
    paymentNotes: [
      "Transaksi fixed price telah diverifikasi admin unit.",
      "Nota digital siap diunduh sebagai bukti penyelesaian transaksi."
    ],
    bankName: "Mandiri",
    bankAccountNumber: "10200-9988-5511",
    bankAccountHolder: "PT Pegadaian (Persero) CP Medan Baru",
    bankBranch: "Cabang Medan Baru",
    paymentProof: "bukti-transfer-antam.jpg",
    verifiedAt: "19 April 2026, 11.50 WITA",
    receiptNumber: "INV/2026/FP/0027"
  }
];

export const bidHistory: BuyerBid[] = [
  {
    lotId: "lot-002",
    lot: "MacBook Pro 14 inci M2 Pro 16/512",
    unit: "UPC Malioboro, Yogyakarta",
    status: "MENANG",
    closing: "24 April 2026, 16.00 WITA",
    bidAmount: 19400000,
    basePrice: 18200000,
    note: "Bid dinyatakan menang dan sudah dipindahkan ke workflow transaksi.",
    linkedTransactionId: "TRX-2026-0033"
  },
  {
    lotId: "lot-005",
    lot: "Headphone Studio Wireless Noise Cancelling",
    unit: "UPC Panakkukang, Makassar",
    status: "MENUNGGU_HASIL",
    closing: "21 April 2026, 23.30 WITA",
    bidAmount: 3525000,
    basePrice: 3150000,
    note: "Bid tersimpan dan akan dibuka setelah batas lelang berakhir."
  },
  {
    lotId: "lot-006",
    lot: "Cincin Berlian Solitaire 1.2 ct",
    unit: "CP Diponegoro, Bandung",
    status: "BID_TERCATAT",
    closing: "27 April 2026, 10.00 WITA",
    bidAmount: 28600000,
    basePrice: 27800000,
    note: "Penawaran tertutup sudah masuk dan dapat dilihat pada riwayat bid."
  },
  {
    lotId: "lot-002",
    lot: "MacBook Pro 14 inci M2 Pro 16/512",
    unit: "UPC Malioboro, Yogyakarta",
    status: "TIDAK_MENANG",
    closing: "16 April 2026, 14.00 WITA",
    bidAmount: 18450000,
    basePrice: 18200000,
    note: "Bid sebelumnya tidak menang dan tidak menimbulkan transaksi."
  }
];

export function getBidHistoryByLotId(lotId: string) {
  return bidHistory.find((item) => item.lotId === lotId);
}

export const adminSummary = {
  unitName: "Admin Unit Manado",
  subtitle: "Ringkasan workflow admin unit hari ini",
  unitCode: "ADM-MND-01",
  activeBank: "BRI 0123-4567-8901-234",
  metrics: [
    { label: "Barang Gadai", value: "2", detail: "1 mendekati jatuh tempo" },
    { label: "Barang Jaminan", value: "2", detail: "Siap dipasarkan" },
    { label: "Transaksi Aktif", value: "4", detail: "Butuh tindakan admin" },
    { label: "Blacklist Aktif", value: "2", detail: "1 bisa diperpanjang" }
  ]
};

export const adminInventory: Array<{
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  status: AdminInventoryStatus;
  date: string;
  condition: string;
  receivedAt: string;
  ownerName: string;
  customerNumber: string;
  description: string;
  appraisalValue: number;
  loanValue: number;
  pawnedAt: string;
  dueDate: string;
  marketingMode?: "FIXED_PRICE" | "VICKREY_AUCTION";
  marketingIteration?: number;
  mediaSummary: string;
  nextAction: string;
}> = [
  {
    id: "lot-101",
    code: "GDI-MND-2026-001",
    name: "Kalung Emas 24K 10 gram",
    category: "Perhiasan",
    price: 9250000,
    appraisalValue: 9250000,
    loanValue: 7500000,
    status: "GADAI",
    date: "12 April 2026",
    condition: "baik",
    receivedAt: "12 April 2026",
    pawnedAt: "12 April 2026",
    dueDate: "24 April 2026",
    ownerName: "Dewi Lestari",
    customerNumber: "NAS-884201",
    description: "Kalung emas hasil appraisal unit dengan kondisi baik dan dokumen internal lengkap.",
    mediaSummary: "3 foto, 0 video",
    nextAction: "Dapat diperpanjang atau ditebus selama masih berstatus GADAI."
  },
  {
    id: "lot-102",
    code: "GDI-MND-2026-002",
    name: "Sepeda Motor Honda Vario 160",
    category: "Kendaraan",
    price: 21600000,
    appraisalValue: 21600000,
    loanValue: 16400000,
    status: "GADAI",
    date: "2 April 2026",
    condition: "cukup",
    receivedAt: "2 April 2026",
    pawnedAt: "2 April 2026",
    dueDate: "18 April 2026",
    ownerName: "Andri Saputra",
    customerNumber: "NAS-880194",
    description: "Barang gadai sudah melewati jatuh tempo dan siap dikonfirmasi menjadi jaminan.",
    mediaSummary: "4 foto, 1 video",
    nextAction: "Konfirmasi barang menjadi JAMINAN karena jatuh tempo sudah terlewati."
  },
  {
    id: "lot-103",
    code: "JMN-MND-2026-003",
    name: "Laptop ASUS ROG G15",
    category: "Elektronik",
    price: 18400000,
    appraisalValue: 18400000,
    loanValue: 14000000,
    status: "JAMINAN",
    date: "15 April 2026",
    condition: "baik",
    receivedAt: "15 April 2026",
    pawnedAt: "20 Maret 2026",
    dueDate: "5 April 2026",
    ownerName: "Rian Mahendra",
    customerNumber: "NAS-772194",
    description: "Laptop gaming dengan charger original dan dokumen internal lengkap. Sudah resmi menjadi milik Pegadaian dan siap dipasarkan.",
    mediaSummary: "5 foto, 1 video",
    nextAction: "Pilih mode pemasaran dan publikasikan ke katalog."
  },
  {
    id: "lot-104",
    code: "JMN-MND-2026-004",
    name: "Cincin Berlian Solitaire 1.2 ct",
    category: "Perhiasan",
    price: 27800000,
    appraisalValue: 27800000,
    loanValue: 20400000,
    status: "JAMINAN",
    date: "11 April 2026",
    condition: "baik",
    receivedAt: "11 April 2026",
    pawnedAt: "15 Maret 2026",
    dueDate: "30 Maret 2026",
    ownerName: "Nina Paramitha",
    customerNumber: "NAS-559204",
    description: "Perhiasan unggulan dengan dokumentasi foto lengkap. Menunggu keputusan admin untuk dipasarkan sebagai fixed price atau Vickrey.",
    mediaSummary: "5 foto, 0 video",
    nextAction: "Pilih mode pemasaran dan konfigurasi harga atau durasi lelang."
  },
  {
    id: "lot-105",
    code: "PMS-MND-2026-005",
    name: "MacBook Pro 14 inci M2 Pro 16/512",
    category: "Elektronik",
    price: 18200000,
    appraisalValue: 18200000,
    loanValue: 14500000,
    status: "DIPASARKAN",
    date: "16 April 2026",
    condition: "baik",
    receivedAt: "16 April 2026",
    pawnedAt: "10 Maret 2026",
    dueDate: "25 Maret 2026",
    ownerName: "Lestari Wijaya",
    customerNumber: "NAS-990017",
    description: "Barang sedang dipasarkan dengan mode Vickrey Auction dan countdown aktif di katalog publik.",
    marketingMode: "VICKREY_AUCTION",
    marketingIteration: 1,
    mediaSummary: "5 foto, 1 video",
    nextAction: "Pantau sesi lelang sampai deadline. Nominal bid tetap tersembunyi sebelum deadline."
  },
  {
    id: "lot-106",
    code: "PMS-MND-2026-006",
    name: "Logam Mulia Antam 10 gram",
    category: "Logam Mulia",
    price: 11100000,
    appraisalValue: 11100000,
    loanValue: 8500000,
    status: "DIPASARKAN",
    date: "17 April 2026",
    condition: "baik",
    receivedAt: "17 April 2026",
    pawnedAt: "11 Maret 2026",
    dueDate: "27 Maret 2026",
    ownerName: "Rika Febriani",
    customerNumber: "NAS-111204",
    description: "Barang fixed price aktif di katalog publik dan menunggu penyelesaian transaksi pembeli.",
    marketingMode: "FIXED_PRICE",
    marketingIteration: 1,
    mediaSummary: "4 foto, 0 video",
    nextAction: "Pantau transaksi fixed price dan verifikasi pembayaran yang masuk."
  },
  {
    id: "lot-107",
    code: "LEL-MND-2026-007",
    name: "Headphone Studio Wireless Noise Cancelling",
    category: "Elektronik",
    price: 3150000,
    appraisalValue: 3150000,
    loanValue: 2400000,
    status: "MENUNGGU_PEMBAYARAN",
    date: "20 April 2026",
    condition: "baik",
    receivedAt: "20 April 2026",
    pawnedAt: "3 Maret 2026",
    dueDate: "17 Maret 2026",
    ownerName: "Gilang Pradana",
    customerNumber: "NAS-337812",
    description: "Sesi lelang sudah selesai. Sistem menentukan pemenang dan sekarang menunggu pembayaran dalam 24 jam.",
    marketingMode: "VICKREY_AUCTION",
    marketingIteration: 1,
    mediaSummary: "4 foto, 1 video",
    nextAction: "Pantau batas waktu 24 jam dan verifikasi pembayaran bila bukti masuk."
  },
  {
    id: "lot-108",
    code: "GGL-MND-2026-008",
    name: "Kamera Mirrorless Sony A6400",
    category: "Elektronik",
    price: 11300000,
    appraisalValue: 11300000,
    loanValue: 8600000,
    status: "GAGAL",
    date: "19 April 2026",
    condition: "baik",
    receivedAt: "19 April 2026",
    pawnedAt: "25 Februari 2026",
    dueDate: "12 Maret 2026",
    ownerName: "Nina Paramitha",
    customerNumber: "NAS-559204",
    description: "Sesi pemasaran sebelumnya gagal sehingga barang siap untuk re-listing dengan konfigurasi baru.",
    marketingMode: "VICKREY_AUCTION",
    marketingIteration: 2,
    mediaSummary: "5 foto, 1 video",
    nextAction: "Konfigurasi ulang harga/mode lalu aktifkan ulang pemasaran."
  },
  {
    id: "lot-109",
    code: "TRJ-MND-2026-009",
    name: "Kalung Berlian 5 ct",
    category: "Perhiasan",
    price: 28750000,
    appraisalValue: 28750000,
    loanValue: 21000000,
    status: "TERJUAL",
    date: "10 April 2026",
    condition: "baik",
    receivedAt: "10 April 2026",
    pawnedAt: "14 Februari 2026",
    dueDate: "1 Maret 2026",
    ownerName: "Siska Amalia",
    customerNumber: "NAS-412009",
    description: "Transaksi selesai diverifikasi. Nota sudah dicetak dan barang berada pada terminal state TERJUAL.",
    marketingMode: "FIXED_PRICE",
    marketingIteration: 1,
    mediaSummary: "4 foto, 0 video",
    nextAction: "Tidak ada aksi lanjutan. Barang berada di terminal state."
  },
  {
    id: "lot-110",
    code: "TBS-MND-2026-010",
    name: "Gelang Emas 17 gram",
    category: "Perhiasan",
    price: 14800000,
    appraisalValue: 14800000,
    loanValue: 11000000,
    status: "DITEBUS",
    date: "8 April 2026",
    condition: "baik",
    receivedAt: "8 April 2026",
    pawnedAt: "1 Maret 2026",
    dueDate: "15 April 2026",
    ownerName: "Rahma Hapsari",
    customerNumber: "NAS-771220",
    description: "Nasabah telah melakukan penebusan. Barang keluar dari workflow pemasaran dan tersimpan untuk audit.",
    mediaSummary: "2 foto, 0 video",
    nextAction: "Tidak ada aksi lanjutan. Barang berada di terminal state."
  }
];

export const adminTransactions: Array<{
  id: string;
  lotId: string;
  buyer: string;
  lot: string;
  submittedAt: string;
  status: AdminTransactionStatus;
  method: "TRANSFER_BANK" | "BAYAR_LANGSUNG";
  total: number;
  reference: string;
  deadline: string;
  pemasaranMode: "FIXED_PRICE" | "VICKREY_AUCTION";
  accountName: string;
  accountNumber: string;
  bankName: string;
  proofFile?: string;
  rejectionReason?: string;
  printableReceipt: boolean;
}> = [
  {
    id: "TRX-MND-00421",
    lotId: "lot-106",
    buyer: "Budi Santoso",
    lot: "Cincin Emas 10 gram",
    submittedAt: "21 April 2026, 10.30",
    status: "BUKTI_DIUNGGAH",
    method: "TRANSFER_BANK",
    total: 12500000,
    reference: "-",
    deadline: "22 April 2026, 18.00 WITA",
    pemasaranMode: "FIXED_PRICE",
    accountName: "PT Pegadaian (Persero) Unit Manado",
    accountNumber: "0123-4567-8901-234",
    bankName: "BRI",
    proofFile: "bukti-budi-santoso.pdf",
    printableReceipt: false
  },
  {
    id: "TRX-MND-00418",
    lotId: "lot-106",
    buyer: "Lestari Wijaya",
    lot: "Laptop ASUS ROG G15",
    submittedAt: "21 April 2026, 09.15",
    status: "MENUNGGU_KONFIRMASI_LANGSUNG",
    method: "BAYAR_LANGSUNG",
    total: 18400000,
    reference: "-",
    deadline: "22 April 2026, 17.00 WITA",
    pemasaranMode: "FIXED_PRICE",
    accountName: "PT Pegadaian (Persero) Unit Manado",
    accountNumber: "0123-4567-8901-234",
    bankName: "BRI",
    printableReceipt: false
  },
  {
    id: "TRX-MND-00417",
    lotId: "lot-107",
    buyer: "Rifki Nugroho",
    lot: "MacBook Pro 14 inci M2 Pro 16/512",
    submittedAt: "21 April 2026, 08.45",
    status: "MENUNGGU_PEMBAYARAN",
    method: "TRANSFER_BANK",
    total: 18200000,
    reference: "-",
    deadline: "22 April 2026, 08.45 WITA",
    pemasaranMode: "VICKREY_AUCTION",
    accountName: "PT Pegadaian (Persero) Unit Manado",
    accountNumber: "0123-4567-8901-234",
    bankName: "BRI",
    printableReceipt: false
  },
  {
    id: "TRX-MND-00416",
    lotId: "lot-106",
    buyer: "Siska Amalia",
    lot: "Logam Mulia Antam 10 gram",
    submittedAt: "20 April 2026, 11.20",
    status: "DITOLAK_BUKTI",
    method: "TRANSFER_BANK",
    total: 11100000,
    reference: "-",
    deadline: "21 April 2026, 11.20 WITA",
    pemasaranMode: "FIXED_PRICE",
    accountName: "PT Pegadaian (Persero) Unit Manado",
    accountNumber: "0123-4567-8901-234",
    bankName: "BRI",
    proofFile: "upload-bukti-siska.jpg",
    rejectionReason: "Nominal transfer tidak sesuai total bayar dan foto bukti terpotong.",
    printableReceipt: false
  },
  {
    id: "TRX-MND-00415",
    lotId: "lot-109",
    buyer: "Andi Pratama",
    lot: "Sepeda Motor Vario 150",
    submittedAt: "20 April 2026, 16.10",
    status: "LUNAS",
    method: "TRANSFER_BANK",
    total: 21600000,
    reference: "REF-MND-8821",
    deadline: "Selesai",
    pemasaranMode: "FIXED_PRICE",
    accountName: "PT Pegadaian (Persero) Unit Manado",
    accountNumber: "0123-4567-8901-234",
    bankName: "BRI",
    proofFile: "transfer-andi-pratama.pdf",
    printableReceipt: true
  }
];

export const adminAuctions: Array<{
  id: string;
  lotId: string;
  lot: string;
  status: AdminAuctionStatus;
  ending: string;
  participants: number;
  mode: "FIXED_PRICE" | "VICKREY_AUCTION";
  visibility: "TERSEMBUNYI" | "HASIL_DIBUKA";
  finalPrice?: number;
  winner?: string;
  note: string;
}> = [
  {
    id: "AUC-MND-019",
    lotId: "lot-105",
    lot: "MacBook Pro 14 inci M2 Pro 16/512",
    status: "AKTIF",
    ending: "24 April 2026, 16.00 WITA",
    participants: 12,
    mode: "VICKREY_AUCTION",
    visibility: "TERSEMBUNYI",
    note: "Sesi lelang masih berjalan. Nominal bid tidak boleh ditampilkan sebelum deadline."
  },
  {
    id: "AUC-MND-017",
    lotId: "lot-107",
    lot: "Cincin Berlian Solitaire 1.2 ct",
    status: "SELESAI",
    ending: "27 April 2026, 10.00 WITA",
    participants: 8,
    mode: "VICKREY_AUCTION",
    visibility: "HASIL_DIBUKA",
    finalPrice: 28400000,
    winner: "Rifki Nugroho",
    note: "Deadline telah berakhir. Sistem sudah membuka hasil Vickrey dan membuat transaksi pemenang."
  },
  {
    id: "AUC-MND-011",
    lotId: "lot-108",
    lot: "Headphone Studio Wireless Noise Cancelling",
    status: "GAGAL",
    ending: "21 April 2026, 23.30 WITA",
    participants: 5,
    mode: "VICKREY_AUCTION",
    visibility: "HASIL_DIBUKA",
    note: "Sesi lelang gagal karena pemenang tidak menyelesaikan pembayaran dalam 24 jam."
  }
];

export const adminBlacklist: Array<{
  userId: string;
  name: string;
  violations: number;
  until: string;
  unit: string;
  status: AdminBlacklistStatus;
  reason: string;
  lastIncident: string;
  activeAuctionRestriction: string;
  history: Array<{ date: string; action: string; note: string }>;
}> = [
  {
    userId: "usr-dimas",
    name: "Dimas Aditya",
    violations: 1,
    until: "30 April 2026",
    unit: "Manado",
    status: "AKTIF",
    reason: "Tidak menyelesaikan pembayaran lelang dalam batas waktu.",
    lastIncident: "18 April 2026",
    activeAuctionRestriction: "Tidak dapat ikut lelang Vickrey sampai masa blokir selesai.",
    history: [
      {
        date: "18 April 2026",
        action: "blokir_otomatis",
        note: "Pemenang Vickrey tidak membayar dalam 24 jam."
      }
    ]
  },
  {
    userId: "usr-nadia",
    name: "Nadia Putri",
    violations: 2,
    until: "21 Mei 2026",
    unit: "Manado",
    status: "AKTIF",
    reason: "Mengulang pelanggaran pada dua sesi lelang berturut-turut.",
    lastIncident: "20 April 2026",
    activeAuctionRestriction: "Masih dapat membeli fixed price, tetapi tidak bisa submit bid.",
    history: [
      {
        date: "15 Maret 2026",
        action: "blokir_otomatis",
        note: "Pemenang lelang Sony A6400 tidak menyelesaikan pembayaran."
      },
      {
        date: "20 April 2026",
        action: "perpanjang_manual",
        note: "Masa blokir diperpanjang 30 hari karena pelanggaran kedua."
      }
    ]
  },
  {
    userId: "usr-yoga",
    name: "Yoga Prabowo",
    violations: 1,
    until: "Selesai",
    unit: "Manado",
    status: "TIDAK_AKTIF",
    reason: "Pernah terlambat menyelesaikan pembayaran, masa blokir telah berakhir.",
    lastIncident: "2 Maret 2026",
    activeAuctionRestriction: "Tidak ada pembatasan aktif.",
    history: [
      {
        date: "2 Maret 2026",
        action: "blokir_otomatis",
        note: "Pemenang lelang tidak membayar sesuai batas waktu."
      }
    ]
  }
];

export function getAdminInventoryById(id: string) {
  return adminInventory.find((item) => item.id === id) ?? adminInventory[0];
}

export function getAdminTransactionById(id: string) {
  return adminTransactions.find((transaction) => transaction.id === id) ?? adminTransactions[0];
}

export function getAdminAuctionById(id: string) {
  return adminAuctions.find((auction) => auction.id === id) ?? adminAuctions[0];
}

export function getAdminBlacklistByUserId(userId: string) {
  return adminBlacklist.find((entry) => entry.userId === userId) ?? adminBlacklist[0];
}

export const superAdminSummary = {
  headline: "Pantau seluruh unit, admin, rekening, dan risiko operasional dari satu control center.",
  metrics: [
    { label: "Total Unit", value: "142", detail: "137 aktif, 5 perlu perhatian" },
    { label: "Admin Aktif", value: "428", detail: "12 akun baru minggu ini" },
    { label: "Barang Dipasarkan", value: "24.591", detail: "Lintas fixed price & Vickrey" },
    { label: "Transaksi Pending", value: "318", detail: "Butuh tindak lanjut unit" },
    { label: "Blacklist Aktif", value: "87", detail: "11 perlu review lebih awal" }
  ],
  priorities: [
    {
      title: "Unit dengan rekening belum sinkron",
      detail: "5 unit belum memakai rekening aktif yang tervalidasi.",
      href: "/superadmin/unit",
      action: "Tinjau unit"
    },
    {
      title: "Blacklist perlu peninjauan",
      detail: "11 akun sudah mendekati akhir masa blokir dan menunggu keputusan.",
      href: "/superadmin/blacklist",
      action: "Buka blacklist"
    },
    {
      title: "Admin unit baru belum aktif penuh",
      detail: "7 admin baru masih menunggu penempatan atau aktivasi akun.",
      href: "/superadmin/admin",
      action: "Kelola admin"
    }
  ],
  spotlight: [
    { label: "Unit aktif nasional", value: "137 unit", tone: "emerald" },
    { label: "Rekening aktif tervalidasi", value: "142 rekening", tone: "sky" },
    { label: "Lelang aktif lintas unit", value: "219 sesi", tone: "amber" }
  ]
};

export const superAdminUnits = [
  {
    id: "unit-alpha-central",
    code: "P-JKT-001",
    name: "Pegadaian CP Sudirman",
    city: "Jakarta Pusat",
    address: "Jl. Jend. Sudirman No. 45, Jakarta Pusat",
    status: "Aktif",
    adminCount: 4,
    inventoryCount: 218,
    activeAuctions: 18,
    pendingTransactions: 12,
    blacklistCount: 3,
    activeBankId: "acc-jkt-001",
    accounts: [
      {
        id: "acc-jkt-001",
        bankName: "Bank Rakyat Indonesia (BRI)",
        accountNumber: "0012-8877-1234",
        accountHolder: "PT Pegadaian (Persero) CP Sudirman",
        branch: "Jakarta Sudirman",
        status: "AKTIF"
      },
      {
        id: "acc-jkt-002",
        bankName: "Bank Mandiri",
        accountNumber: "1020-8877-6621",
        accountHolder: "PT Pegadaian (Persero) Wilayah Sudirman",
        branch: "Jakarta Pusat",
        status: "CADANGAN"
      }
    ]
  },
  {
    id: "unit-beta-port",
    code: "P-SBY-042",
    name: "Pegadaian CP Basuki Rahmat",
    city: "Surabaya",
    address: "Jl. Basuki Rahmat No. 119, Surabaya",
    status: "Perlu Review",
    adminCount: 3,
    inventoryCount: 164,
    activeAuctions: 11,
    pendingTransactions: 19,
    blacklistCount: 5,
    activeBankId: "acc-sby-001",
    accounts: [
      {
        id: "acc-sby-001",
        bankName: "Bank Mandiri",
        accountNumber: "1230-9921-6611",
        accountHolder: "PT Pegadaian (Persero) CP Basuki Rahmat",
        branch: "Surabaya Basuki Rahmat",
        status: "AKTIF"
      },
      {
        id: "acc-sby-002",
        bankName: "Bank Negara Indonesia (BNI)",
        accountNumber: "0037-7788-1100",
        accountHolder: "PT Pegadaian (Persero) Wilayah Surabaya",
        branch: "Surabaya Tunjungan",
        status: "NONAKTIF"
      }
    ]
  },
  {
    id: "unit-gamma-highland",
    code: "P-BDG-011",
    name: "Pegadaian CP Diponegoro",
    city: "Bandung",
    address: "Jl. Diponegoro No. 81, Bandung",
    status: "Aktif",
    adminCount: 5,
    inventoryCount: 201,
    activeAuctions: 22,
    pendingTransactions: 8,
    blacklistCount: 2,
    activeBankId: "acc-bdg-001",
    accounts: [
      {
        id: "acc-bdg-001",
        bankName: "Bank Negara Indonesia (BNI)",
        accountNumber: "0037-7788-1100",
        accountHolder: "PT Pegadaian (Persero) CP Diponegoro",
        branch: "Bandung Diponegoro",
        status: "AKTIF"
      },
      {
        id: "acc-bdg-002",
        bankName: "Bank Syariah Indonesia (BSI)",
        accountNumber: "7210-1199-2200",
        accountHolder: "PT Pegadaian (Persero) CP Diponegoro",
        branch: "Bandung Merdeka",
        status: "CADANGAN"
      }
    ]
  }
];

export const superAdminAdmins = [
  {
    id: "adm-suci",
    name: "Suci Puspita",
    unitId: "unit-alpha-central",
    unit: "Pegadaian CP Sudirman",
    email: "suci.alpha@pegadaian.test",
    phone: "0812-1122-8891",
    status: "Aktif",
    lastLogin: "22 April 2026, 08.14 WITA"
  },
  {
    id: "adm-rangga",
    name: "Rangga Maulana",
    unitId: "unit-beta-port",
    unit: "Pegadaian CP Basuki Rahmat",
    email: "rangga.beta@pegadaian.test",
    phone: "0813-5577-2041",
    status: "Aktif",
    lastLogin: "22 April 2026, 07.46 WITA"
  },
  {
    id: "adm-yola",
    name: "Yola Arum",
    unitId: "unit-gamma-highland",
    unit: "Pegadaian CP Diponegoro",
    email: "yola.gamma@pegadaian.test",
    phone: "0812-9981-3391",
    status: "Nonaktif",
    lastLogin: "18 April 2026, 16.20 WITA"
  },
  {
    id: "adm-reza",
    name: "Reza Fadillah",
    unitId: "unit-gamma-highland",
    unit: "Pegadaian CP Diponegoro",
    email: "reza.diponegoro@pegadaian.test",
    phone: "0813-1020-9912",
    status: "Menunggu Penempatan",
    lastLogin: "Belum pernah login"
  }
];

export const superAdminMonitoring = [
  {
    id: "mon-001",
    unitId: "unit-alpha-central",
    unit: "Pegadaian CP Sudirman",
    scope: "Barang",
    activity: "15 barang baru dipasarkan ke katalog publik",
    status: "Normal",
    time: "10 menit lalu",
    detail: "Unit ini mencatat arus barang paling tinggi hari ini."
  },
  {
    id: "mon-002",
    unitId: "unit-beta-port",
    unit: "Pegadaian CP Basuki Rahmat",
    scope: "Transaksi",
    activity: "19 transaksi menunggu tindak lanjut admin unit",
    status: "Perlu Tindak Lanjut",
    time: "45 menit lalu",
    detail: "Perlu pengecekan beban kerja unit dan SLA verifikasi pembayaran."
  },
  {
    id: "mon-003",
    unitId: "unit-gamma-highland",
    unit: "Pegadaian CP Diponegoro",
    scope: "Lelang",
    activity: "3 sesi lelang berakhir hari ini dan seluruh hasil sudah diproses",
    status: "Selesai",
    time: "2 jam lalu",
    detail: "Unit berjalan stabil tanpa keterlambatan proses hasil lelang."
  },
  {
    id: "mon-004",
    unitId: "unit-beta-port",
    unit: "Pegadaian CP Basuki Rahmat",
    scope: "Blacklist",
    activity: "2 akun diajukan untuk evaluasi blacklist lebih lanjut",
    status: "Perlu Review",
    time: "3 jam lalu",
    detail: "Super admin perlu meninjau apakah blokir diperpanjang atau dicabut."
  }
];

export const superAdminBlacklist = [
  {
    id: "blk-001",
    name: "Budi Saputra",
    unit: "Pegadaian CP Basuki Rahmat",
    total: 1,
    until: "4 Mei 2026",
    reason: "Pemenang lelang tidak menyelesaikan pembayaran dalam 24 jam.",
    ktpMasked: "3578********1190",
    status: "Perlu Review"
  },
  {
    id: "blk-002",
    name: "Nanda Syafitri",
    unit: "Pegadaian UPC Panakkukang",
    total: 3,
    until: "30 Juni 2026",
    reason: "Pelanggaran berulang pada pembayaran hasil lelang Vickrey.",
    ktpMasked: "7371********2204",
    status: "Aktif"
  }
];

export function getSuperAdminUnitById(id: string) {
  return superAdminUnits.find((unit) => unit.id === id);
}

export function getSuperAdminAdminsByUnitId(unitId: string) {
  return superAdminAdmins.filter((admin) => admin.unitId === unitId);
}

export function getLotById(id: string) {
  return publicLots.find((lot) => lot.id === id);
}

export function getTransactionById(id: string) {
  return userTransactions.find((transaction) => transaction.id === id);
}
