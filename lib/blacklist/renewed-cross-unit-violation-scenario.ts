import { createHash } from "node:crypto";

import { getBlacklistBlockedUntil } from "./restrictions";

const DAY_MS = 24 * 60 * 60 * 1000;

export const RENEWED_CROSS_UNIT_EMAILS = [
  "bagus@gmail.com",
  "kirana@gmail.com",
  "adrian@gmail.com",
  "viona@gmail.com",
  "rangga@gmail.com"
] as const;

export type RenewedCrossUnitEmail = (typeof RENEWED_CROSS_UNIT_EMAILS)[number];

export const RENEWED_CROSS_UNIT_IDENTITIES: Record<
  RenewedCrossUnitEmail,
  { name: string; nationalId: string }
> = {
  "bagus@gmail.com": { name: "Bagus Santoso", nationalId: "3174151103960006" },
  "kirana@gmail.com": { name: "Kirana Dewanti", nationalId: "3174162807010007" },
  "adrian@gmail.com": { name: "Adrian Maulana", nationalId: "3174171905940008" },
  "viona@gmail.com": { name: "Viona Kartika", nationalId: "3174180308020009" },
  "rangga@gmail.com": { name: "Rangga Saputra", nationalId: "3174192501970010" }
};

type ScenarioMedia = {
  credit: string;
  license: string;
  publicPath: string;
  sizeBytes: number;
  sourceUrl: string;
};

type ScenarioBid = { amount: number; bidderEmail: RenewedCrossUnitEmail; submittedAt: Date };

export type RenewedCrossUnitViolationIncident = {
  appraisalValue: number;
  auctionEndsAt: Date;
  auctionStartsAt: Date;
  basePrice: number;
  bidderEmails: RenewedCrossUnitEmail[];
  bids: ScenarioBid[];
  blockedUntil: Date;
  buyerEmail: "bagus@gmail.com" | "kirana@gmail.com";
  customerNumber: string;
  description: string;
  dueDate: Date;
  finalPrice: number;
  ids: Record<"barang" | "pemasaran" | "transaksi" | "violation" | "media" | "historyIncoming" | "historyMarketed" | "historyWaiting" | "historyFailed", string>;
  itemCode: string;
  itemEnteredAt: Date;
  itemName: string;
  level: 1 | 2 | 3;
  media: ScenarioMedia;
  ownerName: string;
  specifications: Record<string, string>;
  unitAdminEmail: string;
  unitName: "UPC Sarinah" | "UPC Ranotana";
  violationOccurredAt: Date;
  winnerBid: number;
};

function date(value: string) {
  return new Date(value);
}

function ids(sequence: number) {
  const suffix = String(sequence).padStart(12, "0");
  return {
    barang: `71000000-0000-4000-8000-${suffix}`,
    pemasaran: `72000000-0000-4000-8000-${suffix}`,
    transaksi: `73000000-0000-4000-8000-${suffix}`,
    violation: `74000000-0000-4000-8000-${suffix}`,
    media: `75000000-0000-4000-8000-${suffix}`,
    historyIncoming: `76000000-0000-4000-8000-${suffix}`,
    historyMarketed: `77000000-0000-4000-8000-${suffix}`,
    historyWaiting: `78000000-0000-4000-8000-${suffix}`,
    historyFailed: `79000000-0000-4000-8000-${suffix}`
  };
}

function incident(input: Omit<RenewedCrossUnitViolationIncident, "bidderEmails" | "blockedUntil" | "finalPrice" | "winnerBid">): RenewedCrossUnitViolationIncident {
  const bids = [...input.bids].sort((left, right) => right.amount - left.amount);
  return {
    ...input,
    bids,
    bidderEmails: bids.map((bid) => bid.bidderEmail),
    winnerBid: bids[0]?.amount ?? 0,
    finalPrice: bids[1]?.amount ?? input.basePrice,
    blockedUntil: getBlacklistBlockedUntil(input.violationOccurredAt, input.level, "days")
  };
}

export const RENEWED_CROSS_UNIT_VIOLATION_SCENARIO: RenewedCrossUnitViolationIncident[] = [
  incident({
    ids: ids(61), buyerEmail: "bagus@gmail.com", level: 1, unitName: "UPC Sarinah", unitAdminEmail: "bagas.prakoso@pegadaian.co.id",
    itemCode: "SBG-1188800000000061", itemName: "Cincin Emas Solitaire 22K 4,85 Gram",
    description: "Cincin emas kuning 22 karat bergaya solitaire dengan batu zircon bening pada dudukan empat kuku. Lingkar cincin simetris, batu terpasang rapat, dan permukaan memiliki jejak pemakaian halus yang wajar.",
    specifications: { "Jenis Barang": "Cincin solitaire", "Kadar Emas": "22K / 91,6%", Berat: "4,85 gram", Ukuran: "17", "Batu Utama": "Zircon bening", Kondisi: "Baik, gores mikro pemakaian" },
    appraisalValue: 11_800_000, basePrice: 10_600_000, ownerName: "Dimas Prabowo", customerNumber: "081389415672",
    itemEnteredAt: date("2026-04-10T09:00:00+07:00"), auctionStartsAt: date("2026-04-20T09:00:00+07:00"), auctionEndsAt: date("2026-04-20T10:00:00+07:00"), violationOccurredAt: date("2026-04-21T10:00:00+07:00"), dueDate: date("2026-08-08T09:00:00+07:00"),
    bids: [
      { bidderEmail: "bagus@gmail.com", amount: 11_550_000, submittedAt: date("2026-04-20T09:12:00+07:00") }, { bidderEmail: "kirana@gmail.com", amount: 11_200_000, submittedAt: date("2026-04-20T09:24:00+07:00") }, { bidderEmail: "adrian@gmail.com", amount: 10_950_000, submittedAt: date("2026-04-20T09:37:00+07:00") }, { bidderEmail: "viona@gmail.com", amount: 10_750_000, submittedAt: date("2026-04-20T09:49:00+07:00") }, { bidderEmail: "rangga@gmail.com", amount: 10_650_000, submittedAt: date("2026-04-20T09:54:00+07:00") }
    ],
    media: { publicPath: "/media/violation-items/cincin-emas-solitaire-22k.webp", sourceUrl: "https://www.pexels.com/photo/gold-ring-with-diamonds-9838994/", credit: "Alberta Studios / Pexels", license: "Pexels License", sizeBytes: 49_888 }
  }),
  incident({
    ids: ids(62), buyerEmail: "kirana@gmail.com", level: 1, unitName: "UPC Ranotana", unitAdminEmail: "andika.pratama@pegadaian.co.id",
    itemCode: "SBG-1179300000000062", itemName: "Gelang Emas Bangle Polos 22K 9,80 Gram",
    description: "Gelang bangle emas kuning 22 karat berbentuk oval dengan engsel dan pengunci pengaman. Struktur gelang utuh, engsel bergerak lancar, serta terdapat gores sangat ringan akibat penggunaan normal.",
    specifications: { "Jenis Barang": "Gelang bangle", "Kadar Emas": "22K / 91,6%", Berat: "9,80 gram", Diameter: "6,1 cm", Pengunci: "Engsel dengan pengaman", Kondisi: "Baik" },
    appraisalValue: 23_900_000, basePrice: 21_600_000, ownerName: "Nabila Azzahra", customerNumber: "082191684350",
    itemEnteredAt: date("2026-04-21T10:00:00+07:00"), auctionStartsAt: date("2026-05-01T10:00:00+07:00"), auctionEndsAt: date("2026-05-01T11:00:00+07:00"), violationOccurredAt: date("2026-05-02T11:00:00+07:00"), dueDate: date("2026-08-19T10:00:00+07:00"),
    bids: [
      { bidderEmail: "kirana@gmail.com", amount: 23_650_000, submittedAt: date("2026-05-01T10:11:00+07:00") }, { bidderEmail: "adrian@gmail.com", amount: 23_150_000, submittedAt: date("2026-05-01T10:23:00+07:00") }, { bidderEmail: "bagus@gmail.com", amount: 22_950_000, submittedAt: date("2026-05-01T10:30:00+07:00") }, { bidderEmail: "viona@gmail.com", amount: 22_700_000, submittedAt: date("2026-05-01T10:36:00+07:00") }, { bidderEmail: "rangga@gmail.com", amount: 22_150_000, submittedAt: date("2026-05-01T10:48:00+07:00") }
    ],
    media: { publicPath: "/media/violation-items/gelang-emas-bangle-polos-22k.webp", sourceUrl: "https://www.pexels.com/photo/photo-of-a-gold-bracelet-12194316/", credit: "Melike B / Pexels", license: "Pexels License", sizeBytes: 56_438 }
  }),
  incident({
    ids: ids(63), buyerEmail: "kirana@gmail.com", level: 2, unitName: "UPC Ranotana", unitAdminEmail: "andika.pratama@pegadaian.co.id",
    itemCode: "SBG-1179300000000063", itemName: "Kalung Emas Rantai Singapura 22K 7,20 Gram",
    description: "Kalung emas kuning 22 karat model rantai Singapura dengan putaran mata rantai rapat dan pengunci lobster. Rantai tidak putus, pengunci berfungsi baik, dan kilap emas masih merata.",
    specifications: { "Jenis Barang": "Kalung rantai Singapura", "Kadar Emas": "22K / 91,6%", Berat: "7,20 gram", Panjang: "45 cm", Pengunci: "Lobster clasp", Kondisi: "Baik" },
    appraisalValue: 17_600_000, basePrice: 15_900_000, ownerName: "Rizky Ananda", customerNumber: "085318764529",
    itemEnteredAt: date("2026-05-21T11:00:00+07:00"), auctionStartsAt: date("2026-05-31T11:00:00+07:00"), auctionEndsAt: date("2026-05-31T12:00:00+07:00"), violationOccurredAt: date("2026-06-01T12:00:00+07:00"), dueDate: date("2026-09-18T11:00:00+07:00"),
    bids: [
      { bidderEmail: "kirana@gmail.com", amount: 17_300_000, submittedAt: date("2026-05-31T11:10:00+07:00") }, { bidderEmail: "bagus@gmail.com", amount: 16_950_000, submittedAt: date("2026-05-31T11:22:00+07:00") }, { bidderEmail: "adrian@gmail.com", amount: 16_600_000, submittedAt: date("2026-05-31T11:34:00+07:00") }, { bidderEmail: "viona@gmail.com", amount: 16_200_000, submittedAt: date("2026-05-31T11:45:00+07:00") }, { bidderEmail: "rangga@gmail.com", amount: 16_050_000, submittedAt: date("2026-05-31T11:53:00+07:00") }
    ],
    media: { publicPath: "/media/violation-items/kalung-emas-rantai-singapura-22k.webp", sourceUrl: "https://www.pexels.com/photo/close-up-photo-of-gold-necklace-14111399/", credit: "The Glorious Studio / Pexels", license: "Pexels License", sizeBytes: 20_494 }
  }),
  incident({
    ids: ids(64), buyerEmail: "bagus@gmail.com", level: 2, unitName: "UPC Sarinah", unitAdminEmail: "bagas.prakoso@pegadaian.co.id",
    itemCode: "SBG-1188800000000064", itemName: "Laptop 14 Inci Intel Core i5 Generasi ke-11",
    description: "Laptop 14 inci dengan prosesor Intel Core i5 generasi ke-11, memori 8 GB, dan SSD 512 GB. Layar, papan ketik, kamera, port USB, Wi-Fi, serta pengisian daya telah diperiksa berfungsi normal.",
    specifications: { Prosesor: "Intel Core i5 generasi ke-11", Memori: "8 GB DDR4", Penyimpanan: "SSD 512 GB", Layar: "14 inci Full HD", Kelengkapan: "Adaptor pengisi daya", Kondisi: "Baik, gores ringan pada penutup" },
    appraisalValue: 8_600_000, basePrice: 7_650_000, ownerName: "Fauzan Akbar", customerNumber: "081226857419",
    itemEnteredAt: date("2026-07-04T23:40:00+07:00"), auctionStartsAt: date("2026-07-14T23:40:00+07:00"), auctionEndsAt: date("2026-07-14T23:45:00+07:00"), violationOccurredAt: date("2026-07-15T23:45:00+07:00"), dueDate: date("2026-11-01T23:40:00+07:00"),
    bids: [
      { bidderEmail: "bagus@gmail.com", amount: 8_400_000, submittedAt: date("2026-07-14T23:40:35+07:00") }, { bidderEmail: "kirana@gmail.com", amount: 8_150_000, submittedAt: date("2026-07-14T23:41:25+07:00") }, { bidderEmail: "adrian@gmail.com", amount: 7_950_000, submittedAt: date("2026-07-14T23:42:15+07:00") }, { bidderEmail: "viona@gmail.com", amount: 7_800_000, submittedAt: date("2026-07-14T23:43:05+07:00") }, { bidderEmail: "rangga@gmail.com", amount: 7_700_000, submittedAt: date("2026-07-14T23:44:00+07:00") }
    ],
    media: { publicPath: "/media/violation-items/laptop-14-inci-core-i5.webp", sourceUrl: "https://www.pexels.com/photo/gray-laptop-computer-1279109/", credit: "Caio / Pexels", license: "Pexels License", sizeBytes: 32_444 }
  }),
  incident({
    ids: ids(65), buyerEmail: "kirana@gmail.com", level: 3, unitName: "UPC Ranotana", unitAdminEmail: "andika.pratama@pegadaian.co.id",
    itemCode: "SBG-1179300000000065", itemName: "Gelang Emas Bangle Zircon 22K 8,65 Gram",
    description: "Gelang bangle emas kuning 22 karat berhias susunan batu zircon kecil pada bagian muka. Pengunci rapat, engsel stabil, seluruh batu terpasang, dan permukaan memperlihatkan tanda pemakaian ringan.",
    specifications: { "Jenis Barang": "Gelang bangle berhias zircon", "Kadar Emas": "22K / 91,6%", Berat: "8,65 gram", Diameter: "6 cm", "Batu Hias": "Zircon bening", Kondisi: "Baik, bekas pakai ringan" },
    appraisalValue: 21_100_000, basePrice: 19_000_000, ownerName: "Salsabila Putri", customerNumber: "081379254618",
    itemEnteredAt: date("2026-07-05T00:01:00+07:00"), auctionStartsAt: date("2026-07-15T00:01:00+07:00"), auctionEndsAt: date("2026-07-15T00:05:00+07:00"), violationOccurredAt: date("2026-07-16T00:05:00+07:00"), dueDate: date("2026-11-02T00:01:00+07:00"),
    bids: [
      { bidderEmail: "kirana@gmail.com", amount: 20_850_000, submittedAt: date("2026-07-15T00:01:30+07:00") }, { bidderEmail: "adrian@gmail.com", amount: 20_450_000, submittedAt: date("2026-07-15T00:02:10+07:00") }, { bidderEmail: "viona@gmail.com", amount: 20_000_000, submittedAt: date("2026-07-15T00:03:00+07:00") }, { bidderEmail: "rangga@gmail.com", amount: 19_500_000, submittedAt: date("2026-07-15T00:04:00+07:00") }
    ],
    media: { publicPath: "/media/violation-items/gelang-emas-bangle-zircon-22k.webp", sourceUrl: "https://www.pexels.com/photo/a-beautiful-gold-bangle-bracelet-12194323/", credit: "Melike B / Pexels", license: "Pexels License", sizeBytes: 31_404 }
  })
];

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

export function createRenewedScenarioBidHash(input: { amount: number; pemasaranId: string; salt: string; userId: string }) {
  return createHash("sha256").update(`${input.pemasaranId}:${input.userId}:${input.amount}:${input.salt}`).digest("hex");
}

export function validateRenewedCrossUnitViolationScenario() {
  const ordered = [...RENEWED_CROSS_UNIT_VIOLATION_SCENARIO].sort((left, right) => left.auctionStartsAt.getTime() - right.auctionStartsAt.getTime());
  const lastWin = new Map<string, RenewedCrossUnitViolationIncident>();
  for (const [index, current] of ordered.entries()) {
    assert(current.auctionStartsAt.getTime() - current.itemEnteredAt.getTime() === 10 * DAY_MS, `${current.itemName}: barang harus masuk H-10.`);
    assert(current.auctionEndsAt > current.auctionStartsAt, `${current.itemName}: sesi lelang tidak valid.`);
    assert(current.violationOccurredAt.getTime() - current.auctionEndsAt.getTime() === DAY_MS, `${current.itemName}: batas bayar harus 24 jam.`);
    assert(current.bids.every((bid) => bid.submittedAt >= current.auctionStartsAt && bid.submittedAt < current.auctionEndsAt), `${current.itemName}: bid di luar sesi.`);
    assert(current.bids[0]?.bidderEmail === current.buyerEmail, `${current.itemName}: target harus penawar tertinggi.`);
    assert(current.bids.every((bid) => bid.amount >= current.basePrice), `${current.itemName}: bid di bawah harga dasar.`);
    const previousGlobal = ordered[index - 1];
    assert(!previousGlobal || current.auctionStartsAt >= previousGlobal.auctionEndsAt, `${current.itemName}: sesi lelang bertabrakan.`);
    for (const bidderEmail of current.bidderEmails) {
      const previous = lastWin.get(bidderEmail);
      assert(!previous || current.auctionStartsAt >= previous.blockedUntil, `${current.itemName}: ${bidderEmail} masih dibatasi atau belum menuntaskan kewajiban sebelumnya.`);
    }
    const previousTarget = lastWin.get(current.buyerEmail);
    assert(!previousTarget ? current.level === 1 : current.level === Math.min(previousTarget.level + 1, 3), `${current.buyerEmail}: level tidak berurutan.`);
    assert(!previousTarget || current.violationOccurredAt >= previousTarget.blockedUntil, `${current.buyerEmail}: pelanggaran baru mendahului akhir pembatasan.`);
    assert(current.media.publicPath.startsWith("/media/violation-items/") && current.media.publicPath.endsWith(".webp"), `${current.itemName}: media tidak valid.`);
    assert(!/\b(dummy|demo|test|uji)\b/i.test([current.itemName, current.description, ...Object.values(current.specifications)].join(" ")), `${current.itemName}: salinan publik tidak boleh menyebut data uji.`);
    lastWin.set(current.buyerEmail, current);
  }
}

export function getRenewedExpectedFinalRestrictions() {
  return [
    { buyerEmail: "bagus@gmail.com", level: 2 as const, unitName: "UPC Sarinah" as const, blockedUntil: date("2026-08-14T23:45:00+07:00") },
    { buyerEmail: "kirana@gmail.com", level: 3 as const, unitName: "UPC Ranotana" as const, blockedUntil: date("2027-07-16T00:05:00+07:00") }
  ];
}

export function getRenewedScenarioDurationHours(incident: RenewedCrossUnitViolationIncident) {
  return (incident.auctionEndsAt.getTime() - incident.auctionStartsAt.getTime()) / (60 * 60 * 1000);
}
