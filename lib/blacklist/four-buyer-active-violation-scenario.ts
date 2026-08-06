import { getBlacklistBlockedUntil } from "./restrictions";

const DAY_MS = 24 * 60 * 60 * 1000;

export const FOUR_BUYER_ACTIVE_EMAILS = [
  "lazuardi@gmail.com",
  "ilham@gmail.com",
  "savera@gmail.com",
  "mahesa@gmail.com"
] as const;

export type FourBuyerActiveEmail = (typeof FOUR_BUYER_ACTIVE_EMAILS)[number];

export const FOUR_BUYER_ACTIVE_IDENTITIES: Record<FourBuyerActiveEmail, { name: string }> = {
  "lazuardi@gmail.com": { name: "Lazuardi Prabaswara" },
  "ilham@gmail.com": { name: "Ilham Ramadhan" },
  "savera@gmail.com": { name: "Savera Kirandari" },
  "mahesa@gmail.com": { name: "Mahesa Dananjaya" }
};

type ScenarioMedia = {
  credit: string;
  license: string;
  publicPath: string;
  sizeBytes: number;
  sourceUrl: string;
};

type ScenarioBid = {
  amount: number;
  bidderEmail: FourBuyerActiveEmail;
  submittedAt: Date;
};

export type FourBuyerActiveViolationIncident = {
  appraisalValue: number;
  auctionEndsAt: Date;
  auctionStartsAt: Date;
  basePrice: number;
  bidderEmails: FourBuyerActiveEmail[];
  bids: ScenarioBid[];
  blockedUntil: Date;
  buyerEmail: FourBuyerActiveEmail;
  customerNumber: string;
  description: string;
  dueDate: Date;
  finalPrice: number;
  ids: Record<"barang" | "pemasaran" | "transaksi" | "violation" | "media" | "historyIncoming" | "historyMarketed" | "historyWaiting" | "historyFailed", string>;
  itemCode: string;
  itemEnteredAt: Date;
  itemName: string;
  iteration: 1;
  level: 1;
  media: ScenarioMedia;
  ownerName: string;
  specifications: Record<string, string>;
  unitName: "UPC Wanea" | "UPC Ranotana" | "UPC Sarinah";
  violationOccurredAt: Date;
  winnerBid: number;
};

type IncidentInput = Omit<FourBuyerActiveViolationIncident, "bidderEmails" | "blockedUntil" | "finalPrice" | "winnerBid">;

function date(value: string) {
  return new Date(value);
}

function ids(sequence: number) {
  const suffix = String(sequence).padStart(12, "0");
  return {
    barang: `a7100000-0000-4000-8000-${suffix}`,
    pemasaran: `a7200000-0000-4000-8000-${suffix}`,
    transaksi: `a7300000-0000-4000-8000-${suffix}`,
    violation: `a7400000-0000-4000-8000-${suffix}`,
    media: `a7500000-0000-4000-8000-${suffix}`,
    historyIncoming: `a7600000-0000-4000-8000-${suffix}`,
    historyMarketed: `a7700000-0000-4000-8000-${suffix}`,
    historyWaiting: `a7800000-0000-4000-8000-${suffix}`,
    historyFailed: `a7900000-0000-4000-8000-${suffix}`
  };
}

function incident(input: IncidentInput): FourBuyerActiveViolationIncident {
  const bids = [...input.bids].sort((left, right) => right.amount - left.amount);
  return {
    ...input,
    bids,
    bidderEmails: bids.map((bid) => bid.bidderEmail),
    winnerBid: bids[0]?.amount ?? 0,
    finalPrice: bids[1]?.amount ?? input.basePrice,
    blockedUntil: getBlacklistBlockedUntil(input.violationOccurredAt, 1, "days")
  };
}

export const FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO: FourBuyerActiveViolationIncident[] = [
  incident({
    ids: ids(1),
    buyerEmail: "mahesa@gmail.com",
    level: 1,
    unitName: "UPC Wanea",
    itemCode: "SBG-1178700000000901",
    itemName: "Logam Mulia Emas Batangan 10 Gram Bersertifikat",
    description: "Emas batangan 10 gram berkadar 999,9 dalam kemasan assay card. Nomor seri dan kadar terbaca jelas, segel kemasan utuh, serta sudut kartu hanya memperlihatkan bekas penyimpanan ringan.",
    specifications: {
      "Jenis Barang": "Emas batangan bersertifikat",
      Kadar: "999,9 / 24K",
      Berat: "10 gram",
      Kemasan: "Assay card tersegel",
      Kondisi: "Segel utuh, bekas simpan ringan"
    },
    appraisalValue: 25_400_000,
    basePrice: 22_100_000,
    ownerName: "Fikri Ramadhan",
    customerNumber: "081245709638",
    itemEnteredAt: date("2026-07-22T08:30:00+07:00"),
    auctionStartsAt: date("2026-08-01T08:30:00+07:00"),
    auctionEndsAt: date("2026-08-01T09:30:00+07:00"),
    violationOccurredAt: date("2026-08-02T09:30:00+07:00"),
    dueDate: date("2026-11-22T08:30:00+07:00"),
    bids: [
      { bidderEmail: "mahesa@gmail.com", amount: 23_900_000, submittedAt: date("2026-08-01T08:42:00+07:00") },
      { bidderEmail: "lazuardi@gmail.com", amount: 23_250_000, submittedAt: date("2026-08-01T08:51:00+07:00") },
      { bidderEmail: "ilham@gmail.com", amount: 22_900_000, submittedAt: date("2026-08-01T09:03:00+07:00") },
      { bidderEmail: "savera@gmail.com", amount: 22_600_000, submittedAt: date("2026-08-01T09:17:00+07:00") }
    ],
    media: {
      publicPath: "/media/violation-items/emas-batangan-10-gram-bersertifikat.webp",
      sourceUrl: "https://www.pexels.com/photo/close-up-photo-of-gold-bars-8442318/",
      credit: "Zlataky.cz / Pexels",
      license: "Pexels License",
      sizeBytes: 67_662
    },
    iteration: 1
  }),
  incident({
    ids: ids(2),
    buyerEmail: "ilham@gmail.com",
    level: 1,
    unitName: "UPC Ranotana",
    itemCode: "SBG-1178800000000902",
    itemName: "Laptop 14 Inci Intel Core i5 Generasi 11 RAM 16GB",
    description: "Laptop kerja 14 inci dengan prosesor Intel Core i5 generasi ke-11, memori 16GB, dan SSD 512GB. Layar menampilkan warna normal, keyboard lengkap, port pengisian berfungsi, serta bodi memiliki gores pemakaian ringan.",
    specifications: {
      Prosesor: "Intel Core i5 Generasi 11",
      Memori: "16GB RAM",
      Penyimpanan: "SSD 512GB",
      Layar: "14 inci Full HD",
      Konektivitas: "Wi-Fi, Bluetooth, USB-C, HDMI",
      Kondisi: "Baik, gores pemakaian ringan"
    },
    appraisalValue: 8_650_000,
    basePrice: 6_950_000,
    ownerName: "Dimas Pratama",
    customerNumber: "085298714630",
    itemEnteredAt: date("2026-07-23T10:00:00+07:00"),
    auctionStartsAt: date("2026-08-02T10:00:00+07:00"),
    auctionEndsAt: date("2026-08-02T11:00:00+07:00"),
    violationOccurredAt: date("2026-08-03T11:00:00+07:00"),
    dueDate: date("2026-11-23T10:00:00+07:00"),
    bids: [
      { bidderEmail: "ilham@gmail.com", amount: 7_600_000, submittedAt: date("2026-08-02T10:13:00+07:00") },
      { bidderEmail: "lazuardi@gmail.com", amount: 7_250_000, submittedAt: date("2026-08-02T10:31:00+07:00") },
      { bidderEmail: "savera@gmail.com", amount: 7_100_000, submittedAt: date("2026-08-02T10:46:00+07:00") }
    ],
    media: {
      publicPath: "/media/violation-items/laptop-14-inci-core-i5.webp",
      sourceUrl: "https://www.pexels.com/photo/gray-laptop-computer-1279109/",
      credit: "Caio / Pexels",
      license: "Pexels License",
      sizeBytes: 32_444
    },
    iteration: 1
  }),
  incident({
    ids: ids(3),
    buyerEmail: "lazuardi@gmail.com",
    level: 1,
    unitName: "UPC Sarinah",
    itemCode: "SBG-1178600000000903",
    itemName: "Gelang Emas Bangle Zircon 22K 8,60 Gram",
    description: "Gelang bangle emas kuning 22 karat dengan aksen batu zircon bening. Engsel dan pengunci bekerja baik, susunan batu lengkap, serta permukaan gelang menunjukkan jejak pemakaian halus tanpa penyok.",
    specifications: {
      "Jenis Barang": "Gelang bangle dengan zircon",
      "Kadar Emas": "22K / 91,6%",
      Berat: "8,60 gram",
      Diameter: "58 mm",
      Pengunci: "Engsel pengait",
      Kondisi: "Baik, jejak pemakaian halus"
    },
    appraisalValue: 12_800_000,
    basePrice: 10_400_000,
    ownerName: "Nabila Putri Ananda",
    customerNumber: "082173864159",
    itemEnteredAt: date("2026-07-24T14:00:00+07:00"),
    auctionStartsAt: date("2026-08-03T14:00:00+07:00"),
    auctionEndsAt: date("2026-08-03T15:00:00+07:00"),
    violationOccurredAt: date("2026-08-04T15:00:00+07:00"),
    dueDate: date("2026-11-24T14:00:00+07:00"),
    bids: [
      { bidderEmail: "lazuardi@gmail.com", amount: 11_400_000, submittedAt: date("2026-08-03T14:18:00+07:00") },
      { bidderEmail: "savera@gmail.com", amount: 11_050_000, submittedAt: date("2026-08-03T14:39:00+07:00") }
    ],
    media: {
      publicPath: "/media/violation-items/gelang-emas-bangle-zircon-22k.webp",
      sourceUrl: "https://www.pexels.com/photo/a-beautiful-gold-bangle-bracelet-12194323/",
      credit: "Melike B / Pexels",
      license: "Pexels License",
      sizeBytes: 31_404
    },
    iteration: 1
  })
];

export function getFourBuyerActiveRestrictions() {
  return FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.map((entry) => ({
    buyerEmail: entry.buyerEmail,
    blockedUntil: entry.blockedUntil,
    level: entry.level,
    unitName: entry.unitName
  }));
}

export function validateFourBuyerActiveViolationScenario() {
  const emails = new Set(FOUR_BUYER_ACTIVE_EMAILS);
  const codes = new Set<string>();
  const previouslyRestricted = new Map<FourBuyerActiveEmail, Date>();

  for (const entry of FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO) {
    if (!codes.add(entry.itemCode)) throw new Error(`Kode barang duplikat: ${entry.itemCode}.`);
    if (entry.auctionStartsAt.getTime() - entry.itemEnteredAt.getTime() !== 10 * DAY_MS) {
      throw new Error(`Riwayat H-10 ${entry.itemName} tidak valid.`);
    }
    if (entry.violationOccurredAt.getTime() - entry.auctionEndsAt.getTime() !== DAY_MS) {
      throw new Error(`Batas pembayaran ${entry.itemName} tidak valid.`);
    }
    if (!emails.has(entry.buyerEmail) || entry.bids[0]?.bidderEmail !== entry.buyerEmail) {
      throw new Error(`Pemenang ${entry.itemName} tidak valid.`);
    }
    if (new Set(entry.bidderEmails).size !== entry.bidderEmails.length) {
      throw new Error(`Peserta ${entry.itemName} duplikat.`);
    }
    for (const bidder of entry.bidderEmails) {
      const blockedUntil = previouslyRestricted.get(bidder);
      if (blockedUntil && entry.auctionStartsAt < blockedUntil) {
        throw new Error(`Buyer ${bidder} mengikuti lelang saat pembatasan masih aktif.`);
      }
    }
    previouslyRestricted.set(entry.buyerEmail, entry.blockedUntil);
  }

  if (new Set(FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.map((entry) => entry.unitName)).size !== 3) {
    throw new Error("Skenario harus memakai tiga UPC berbeda.");
  }
}
