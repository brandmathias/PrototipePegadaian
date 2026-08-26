import { getBlacklistBlockedUntil } from "./restrictions";

const DAY_MS = 24 * 60 * 60 * 1000;

export const WANEA_REAL_BUYER_EMAILS = [
  "lazuardi@gmail.com",
  "anindita@gmail.com",
  "rendra@gmail.com",
  "savera@gmail.com",
  "mahesa@gmail.com"
] as const;

export type WaneaRealBuyerEmail = (typeof WANEA_REAL_BUYER_EMAILS)[number];

export const WANEA_REAL_BUYER_IDENTITIES: Record<
  WaneaRealBuyerEmail,
  { name: string; nationalId: string; phoneNumber: string }
> = {
  "lazuardi@gmail.com": {
    name: "Lazuardi Prabaswara",
    nationalId: "3174201703980011",
    phoneNumber: "081268354179"
  },
  "anindita@gmail.com": {
    name: "Anindita Niskala",
    nationalId: "3174212907010012",
    phoneNumber: "082174692853"
  },
  "rendra@gmail.com": {
    name: "Rendra Arkadipa",
    nationalId: "3174222105940013",
    phoneNumber: "085239176485"
  },
  "savera@gmail.com": {
    name: "Savera Kirandari",
    nationalId: "3174230508020014",
    phoneNumber: "081386425709"
  },
  "mahesa@gmail.com": {
    name: "Mahesa Dananjaya",
    nationalId: "3174242601970015",
    phoneNumber: "085742968137"
  }
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
  bidderEmail: WaneaRealBuyerEmail;
  submittedAt: Date;
};

export type WaneaRealViolationIncident = {
  appraisalValue: number;
  auctionEndsAt: Date;
  auctionStartsAt: Date;
  basePrice: number;
  bidderEmails: WaneaRealBuyerEmail[];
  bids: ScenarioBid[];
  blockedUntil: Date;
  buyerEmail: WaneaRealBuyerEmail;
  customerNumber: string;
  description: string;
  dueDate: Date;
  finalPrice: number;
  ids: Record<
    "barang" | "pemasaran" | "transaksi" | "violation" | "media" | "historyIncoming" | "historyMarketed" | "historyWaiting" | "historyFailed",
    string
  >;
  itemCode: string;
  itemEnteredAt: Date;
  itemName: string;
  iteration: 1;
  level: 1 | 2;
  media: ScenarioMedia;
  ownerName: string;
  specifications: Record<string, string>;
  unitName: "UPC Wanea";
  violationOccurredAt: Date;
  winnerBid: number;
};

function date(value: string) {
  return new Date(value);
}

function ids(sequence: number) {
  const suffix = String(sequence).padStart(12, "0");
  return {
    barang: `91000000-0000-4000-8000-${suffix}`,
    pemasaran: `92000000-0000-4000-8000-${suffix}`,
    transaksi: `93000000-0000-4000-8000-${suffix}`,
    violation: `94000000-0000-4000-8000-${suffix}`,
    media: `95000000-0000-4000-8000-${suffix}`,
    historyIncoming: `96000000-0000-4000-8000-${suffix}`,
    historyMarketed: `97000000-0000-4000-8000-${suffix}`,
    historyWaiting: `98000000-0000-4000-8000-${suffix}`,
    historyFailed: `99000000-0000-4000-8000-${suffix}`
  };
}

function incident(
  input: Omit<WaneaRealViolationIncident, "bidderEmails" | "blockedUntil" | "finalPrice" | "winnerBid">
): WaneaRealViolationIncident {
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

export const WANEA_REAL_VIOLATION_SCENARIO: WaneaRealViolationIncident[] = [
  incident({
    ids: ids(101),
    buyerEmail: "rendra@gmail.com",
    level: 1,
    unitName: "UPC Wanea",
    iteration: 1,
    itemCode: "SBG-1178700000000101",
    itemName: "Gelang Emas Rantai Figaro 18K 12,40 Gram",
    description:
      "Gelang rantai Figaro berbahan emas kuning 18 karat dengan susunan tiga mata rantai pendek dan satu panjang. Pengunci lobster bekerja baik, sambungan rapat, dan terdapat gores pemakaian ringan yang tidak mengurangi kelayakan pakai.",
    specifications: {
      jenisEmas: "Gelang emas",
      kadarEmas: "18K / 75%",
      berat: "12,40 gram",
      bentuk: "Rantai Figaro dengan lobster clasp",
      panjang: "20 cm",
      diameter: "5 mm (lebar rantai)"
    },
    appraisalValue: 17_900_000,
    basePrice: 15_900_000,
    ownerName: "Marcelino Lasut",
    customerNumber: "081354672918",
    itemEnteredAt: date("2026-04-12T09:00:00+08:00"),
    auctionStartsAt: date("2026-04-22T09:00:00+08:00"),
    auctionEndsAt: date("2026-04-22T10:00:00+08:00"),
    violationOccurredAt: date("2026-04-23T10:00:00+08:00"),
    dueDate: date("2026-08-10T09:00:00+08:00"),
    bids: [
      { bidderEmail: "rendra@gmail.com", amount: 17_250_000, submittedAt: date("2026-04-22T09:11:00+08:00") },
      { bidderEmail: "anindita@gmail.com", amount: 16_900_000, submittedAt: date("2026-04-22T09:22:00+08:00") },
      { bidderEmail: "lazuardi@gmail.com", amount: 16_550_000, submittedAt: date("2026-04-22T09:34:00+08:00") },
      { bidderEmail: "savera@gmail.com", amount: 16_250_000, submittedAt: date("2026-04-22T09:43:00+08:00") },
      { bidderEmail: "mahesa@gmail.com", amount: 16_050_000, submittedAt: date("2026-04-22T09:52:00+08:00") }
    ],
    media: {
      publicPath: "/media/violation-items/gelang-emas-rantai-figaro-18k.webp",
      sourceUrl: "https://www.pexels.com/photo/close-up-photo-of-gold-chain-link-bracelet-12155925/",
      credit: "Duygu Kamar / Pexels",
      license: "Pexels License",
      sizeBytes: 31_966
    }
  }),
  incident({
    ids: ids(102),
    buyerEmail: "rendra@gmail.com",
    level: 2,
    unitName: "UPC Wanea",
    iteration: 1,
    itemCode: "SBG-1178700000000102",
    itemName: "Logam Mulia Emas Batangan 10 Gram Bersertifikat",
    description:
      "Emas batangan 10 gram berkadar 999,9 tersimpan dalam kemasan sertifikat. Nomor seri dan informasi kadar terbaca, segel utuh, serta kemasan menunjukkan bekas penyimpanan ringan tanpa retak.",
    specifications: {
      jenisLogam: "Emas batangan bersertifikat",
      brand: "Logam Mulia",
      kadar: "999,9 / 24K",
      berat: "10 gram",
      nomorSertifikat: "Terintegrasi pada assay card"
    },
    appraisalValue: 24_350_000,
    basePrice: 22_500_000,
    ownerName: "Muhammad Fadli Ramadhan",
    customerNumber: "081245709638",
    itemEnteredAt: date("2026-07-08T10:00:00+08:00"),
    auctionStartsAt: date("2026-07-18T10:00:00+08:00"),
    auctionEndsAt: date("2026-07-18T11:00:00+08:00"),
    violationOccurredAt: date("2026-07-19T11:00:00+08:00"),
    dueDate: date("2026-11-05T10:00:00+08:00"),
    bids: [
      { bidderEmail: "rendra@gmail.com", amount: 24_200_000, submittedAt: date("2026-07-18T10:10:00+08:00") },
      { bidderEmail: "mahesa@gmail.com", amount: 23_850_000, submittedAt: date("2026-07-18T10:21:00+08:00") },
      { bidderEmail: "anindita@gmail.com", amount: 23_450_000, submittedAt: date("2026-07-18T10:32:00+08:00") },
      { bidderEmail: "lazuardi@gmail.com", amount: 23_050_000, submittedAt: date("2026-07-18T10:43:00+08:00") },
      { bidderEmail: "savera@gmail.com", amount: 22_850_000, submittedAt: date("2026-07-18T10:51:00+08:00") }
    ],
    media: {
      publicPath: "/media/violation-items/emas-batangan-10-gram-bersertifikat.webp",
      sourceUrl: "https://www.pexels.com/photo/close-up-photo-of-gold-bars-8442318/",
      credit: "Zlataky.cz / Pexels",
      license: "Pexels License",
      sizeBytes: 67_662
    }
  }),
  incident({
    ids: ids(103),
    buyerEmail: "anindita@gmail.com",
    level: 1,
    unitName: "UPC Wanea",
    iteration: 1,
    itemCode: "SBG-1178700000000103",
    itemName: "Kalung Emas Rantai Cuban 22K 6,70 Gram",
    description:
      "Kalung emas kuning 22 karat model Cuban link dengan susunan mata rantai rapat dan kilap merata. Pengunci lobster bekerja baik, tidak ditemukan bagian putus, dan permukaan memiliki gores mikro akibat pemakaian normal.",
    specifications: {
      jenisEmas: "Kalung emas",
      kadarEmas: "22K / 91,6%",
      berat: "6,70 gram",
      bentuk: "Rantai Cuban dengan lobster clasp",
      panjang: "50 cm",
      diameter: "4 mm (lebar rantai)"
    },
    appraisalValue: 14_100_000,
    basePrice: 12_700_000,
    ownerName: "Claudia Maharani Tumbel",
    customerNumber: "081389527416",
    itemEnteredAt: date("2026-07-10T14:00:00+08:00"),
    auctionStartsAt: date("2026-07-20T14:00:00+08:00"),
    auctionEndsAt: date("2026-07-20T15:00:00+08:00"),
    violationOccurredAt: date("2026-07-21T15:00:00+08:00"),
    dueDate: date("2026-11-07T14:00:00+08:00"),
    bids: [
      { bidderEmail: "anindita@gmail.com", amount: 14_000_000, submittedAt: date("2026-07-20T14:09:00+08:00") },
      { bidderEmail: "lazuardi@gmail.com", amount: 13_650_000, submittedAt: date("2026-07-20T14:22:00+08:00") },
      { bidderEmail: "savera@gmail.com", amount: 13_300_000, submittedAt: date("2026-07-20T14:36:00+08:00") },
      { bidderEmail: "mahesa@gmail.com", amount: 12_950_000, submittedAt: date("2026-07-20T14:48:00+08:00") }
    ],
    media: {
      publicPath: "/media/violation-items/kalung-emas-rantai-cuban-22k.webp",
      sourceUrl: "https://www.pexels.com/photo/close-up-photo-of-gold-necklace-14111399/",
      credit: "The Glorious Studio / Pexels",
      license: "Pexels License",
      sizeBytes: 28_236
    }
  })
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function getWaneaRealScenarioDurationHours(incident: WaneaRealViolationIncident) {
  return (incident.auctionEndsAt.getTime() - incident.auctionStartsAt.getTime()) / (60 * 60 * 1000);
}

export function getWaneaRealExpectedRestrictions() {
  return [
    {
      buyerEmail: "anindita@gmail.com" as const,
      level: 1 as const,
      unitName: "UPC Wanea" as const,
      blockedUntil: WANEA_REAL_VIOLATION_SCENARIO[2]!.blockedUntil
    },
    {
      buyerEmail: "rendra@gmail.com" as const,
      level: 2 as const,
      unitName: "UPC Wanea" as const,
      blockedUntil: WANEA_REAL_VIOLATION_SCENARIO[1]!.blockedUntil
    }
  ];
}

export function validateWaneaRealViolationScenario() {
  const ordered = [...WANEA_REAL_VIOLATION_SCENARIO].sort(
    (left, right) => left.auctionStartsAt.getTime() - right.auctionStartsAt.getTime()
  );
  const previousByBuyer = new Map<WaneaRealBuyerEmail, WaneaRealViolationIncident>();

  ordered.forEach((incident, index) => {
    assert(
      incident.auctionStartsAt.getTime() - incident.itemEnteredAt.getTime() === 10 * DAY_MS,
      `${incident.itemName}: barang harus masuk H-10 sebelum pemasaran.`
    );
    assert(
      incident.violationOccurredAt.getTime() - incident.auctionEndsAt.getTime() === DAY_MS,
      `${incident.itemName}: batas bayar harus tepat 24 jam.`
    );
    assert(incident.iteration === 1, `${incident.itemName}: iterasi pemasaran harus dimulai dari 1.`);
    assert(incident.bids.length >= 2, `${incident.itemName}: lelang Vickrey membutuhkan minimal dua bid.`);
    assert(new Set(incident.bidderEmails).size === incident.bidderEmails.length, `${incident.itemName}: bidder duplikat.`);
    assert(incident.bidderEmails.includes(incident.buyerEmail), `${incident.itemName}: pemenang harus menjadi peserta.`);
    assert(incident.finalPrice === incident.bids[1]?.amount, `${incident.itemName}: harga akhir harus memakai bid kedua.`);
    assert(!/\b(?:dummy|demo|test|uji coba)\b/i.test(`${incident.itemName} ${incident.description}`), `${incident.itemName}: copy tidak boleh berupa data contoh.`);
    assert(incident.media.publicPath.endsWith(".webp") && incident.media.sourceUrl.startsWith("https://"), `${incident.itemName}: media tidak dapat diaudit.`);

    if (incident.level > 1) {
      const previous = previousByBuyer.get(incident.buyerEmail);
      assert(previous?.level === incident.level - 1, `${incident.buyerEmail}: milestone Level ${incident.level - 1} tidak ada.`);
      assert(incident.auctionStartsAt >= previous.blockedUntil, `${incident.buyerEmail}: masih dibatasi saat mengikuti lelang Level ${incident.level}.`);
    }

    for (const previous of ordered.slice(0, index)) {
      if (!incident.bidderEmails.includes(previous.buyerEmail)) continue;
      assert(incident.auctionStartsAt >= previous.violationOccurredAt, `${previous.buyerEmail}: masih memiliki pembayaran belum selesai.`);
      assert(incident.auctionStartsAt >= previous.blockedUntil, `${previous.buyerEmail}: masih dibatasi saat mengikuti lelang berikutnya.`);
    }

    previousByBuyer.set(incident.buyerEmail, incident);
  });
}
