import { getBlacklistBlockedUntil } from "./restrictions";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export const CROSS_UNIT_SCENARIO_EMAILS = [
  "yoga@gmail.com",
  "tiara@gmail.com",
  "reza@gmail.com",
  "ilham@gmail.com"
] as const;

export type CrossUnitScenarioEmail = (typeof CROSS_UNIT_SCENARIO_EMAILS)[number];

export const CROSS_UNIT_SCENARIO_IDENTITIES: Record<
  CrossUnitScenarioEmail,
  { name: string; nationalId: string }
> = {
  "yoga@gmail.com": {
    name: "Yoga Firmansyah",
    nationalId: "3174101801990001"
  },
  "tiara@gmail.com": {
    name: "Tiara Oktaviani",
    nationalId: "3174112308020002"
  },
  "reza@gmail.com": {
    name: "Reza Anugrah",
    nationalId: "3174142712950005"
  },
  "ilham@gmail.com": {
    name: "Ilham Ramadhan",
    nationalId: "3174120905970003"
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
  bidderEmail: CrossUnitScenarioEmail;
  submittedAt: Date;
};

export type CrossUnitViolationIncident = {
  appraisalValue: number;
  auctionEndsAt: Date;
  auctionStartsAt: Date;
  basePrice: number;
  bidderEmails: CrossUnitScenarioEmail[];
  bids: ScenarioBid[];
  blockedUntil: Date;
  buyerEmail: Exclude<CrossUnitScenarioEmail, "ilham@gmail.com">;
  customerNumber: string;
  description: string;
  dueDate: Date;
  finalPrice: number;
  ids: {
    barang: string;
    historyFailed: string;
    historyIncoming: string;
    historyMarketed: string;
    historyWaiting: string;
    media: string;
    pemasaran: string;
    transaksi: string;
    violation: string;
  };
  itemCode: string;
  itemEnteredAt: Date;
  itemName: string;
  level: 1 | 2 | 3;
  media: ScenarioMedia;
  ownerName: string;
  specifications: Record<string, string>;
  unitAdminEmail: string;
  unitName: "UPC Sarinah" | "UPC Wanea";
  violationOccurredAt: Date;
  winnerBid: number;
};

type IncidentInput = Omit<
  CrossUnitViolationIncident,
  "bidderEmails" | "blockedUntil" | "finalPrice" | "winnerBid"
>;

function scenarioDate(value: string) {
  return new Date(value);
}

function defineIncident(input: IncidentInput): CrossUnitViolationIncident {
  const bids = [...input.bids].sort((left, right) => right.amount - left.amount);
  const winnerBid = bids[0]?.amount ?? 0;
  const finalPrice = bids[1]?.amount ?? input.basePrice;

  return {
    ...input,
    bids,
    bidderEmails: bids.map((bid) => bid.bidderEmail),
    blockedUntil: getBlacklistBlockedUntil(input.violationOccurredAt, input.level, "days"),
    finalPrice,
    winnerBid
  };
}

function ids(sequence: number) {
  const suffix = String(sequence).padStart(12, "0");
  return {
    barang: `41000000-0000-4000-8000-${suffix}`,
    pemasaran: `42000000-0000-4000-8000-${suffix}`,
    transaksi: `43000000-0000-4000-8000-${suffix}`,
    violation: `44000000-0000-4000-8000-${suffix}`,
    media: `45000000-0000-4000-8000-${suffix}`,
    historyIncoming: `46000000-0000-4000-8000-${suffix}`,
    historyMarketed: `47000000-0000-4000-8000-${suffix}`,
    historyWaiting: `48000000-0000-4000-8000-${suffix}`,
    historyFailed: `49000000-0000-4000-8000-${suffix}`
  };
}

export const CROSS_UNIT_VIOLATION_SCENARIO: CrossUnitViolationIncident[] = [
  defineIncident({
    ids: ids(1),
    buyerEmail: "yoga@gmail.com",
    level: 1,
    unitName: "UPC Wanea",
    unitAdminEmail: "hendra.wijaya@pegadaian.co.id",
    itemCode: "SBG-1178700000000051",
    itemName: "Gelang Emas Rantai Figaro 18K 12,4 Gram",
    description:
      "Gelang rantai Figaro berbahan emas kuning 18 karat dengan susunan mata rantai tiga pendek dan satu panjang. Pengunci lobster berfungsi baik, sambungan rapat, dan terdapat gores pemakaian ringan yang tidak mengurangi kelayakan pakai.",
    specifications: {
      "Jenis Barang": "Gelang rantai Figaro",
      "Kadar Emas": "18K / 75%",
      Berat: "12,40 gram",
      Panjang: "20 cm",
      "Lebar Rantai": "5 mm",
      Pengunci: "Lobster clasp",
      Kondisi: "Baik, gores pemakaian ringan"
    },
    appraisalValue: 17_900_000,
    basePrice: 15_900_000,
    ownerName: "Marcelino Lasut",
    customerNumber: "081354672918",
    itemEnteredAt: scenarioDate("2026-05-14T08:00:00+07:00"),
    auctionStartsAt: scenarioDate("2026-05-24T08:00:00+07:00"),
    auctionEndsAt: scenarioDate("2026-05-24T09:00:00+07:00"),
    violationOccurredAt: scenarioDate("2026-05-25T09:00:00+07:00"),
    dueDate: scenarioDate("2026-09-11T08:00:00+07:00"),
    bids: [
      { bidderEmail: "yoga@gmail.com", amount: 17_250_000, submittedAt: scenarioDate("2026-05-24T08:12:00+07:00") },
      { bidderEmail: "tiara@gmail.com", amount: 16_900_000, submittedAt: scenarioDate("2026-05-24T08:21:00+07:00") },
      { bidderEmail: "reza@gmail.com", amount: 16_550_000, submittedAt: scenarioDate("2026-05-24T08:33:00+07:00") },
      { bidderEmail: "ilham@gmail.com", amount: 16_200_000, submittedAt: scenarioDate("2026-05-24T08:46:00+07:00") }
    ],
    media: {
      publicPath: "/media/violation-items/gelang-emas-rantai-figaro-18k.webp",
      sourceUrl: "https://www.pexels.com/photo/close-up-photo-of-gold-chain-link-bracelet-12155925/",
      credit: "Duygu Kamar / Pexels",
      license: "Pexels License",
      sizeBytes: 31_966
    }
  }),
  defineIncident({
    ids: ids(2),
    buyerEmail: "tiara@gmail.com",
    level: 1,
    unitName: "UPC Wanea",
    unitAdminEmail: "hendra.wijaya@pegadaian.co.id",
    itemCode: "SBG-1178700000000052",
    itemName: "Anting Emas Hoop Pilin 22K 4,15 Gram",
    description:
      "Sepasang anting hoop emas kuning 22 karat bermotif pilin dengan kilap merata. Kedua engsel klik mengunci sempurna, bentuk lingkaran simetris, dan permukaan hanya menunjukkan jejak pemakaian wajar.",
    specifications: {
      "Jenis Barang": "Anting hoop pilin",
      "Kadar Emas": "22K / 91,6%",
      "Berat Total": "4,15 gram",
      Diameter: "25 mm",
      "Sistem Pengunci": "Engsel klik",
      Jumlah: "1 pasang",
      Kondisi: "Baik"
    },
    appraisalValue: 8_750_000,
    basePrice: 7_850_000,
    ownerName: "Veren Monica Sondakh",
    customerNumber: "082196384725",
    itemEnteredAt: scenarioDate("2026-05-15T10:00:00+07:00"),
    auctionStartsAt: scenarioDate("2026-05-25T10:00:00+07:00"),
    auctionEndsAt: scenarioDate("2026-05-25T11:00:00+07:00"),
    violationOccurredAt: scenarioDate("2026-05-26T11:00:00+07:00"),
    dueDate: scenarioDate("2026-09-12T10:00:00+07:00"),
    bids: [
      { bidderEmail: "tiara@gmail.com", amount: 8_800_000, submittedAt: scenarioDate("2026-05-25T10:14:00+07:00") },
      { bidderEmail: "reza@gmail.com", amount: 8_450_000, submittedAt: scenarioDate("2026-05-25T10:28:00+07:00") },
      { bidderEmail: "ilham@gmail.com", amount: 8_150_000, submittedAt: scenarioDate("2026-05-25T10:43:00+07:00") }
    ],
    media: {
      publicPath: "/media/violation-items/anting-emas-hoop-pilin-22k.webp",
      sourceUrl: "https://www.pexels.com/photo/gold-hoop-earrings-12144805/",
      credit: "Duygu Kamar / Pexels",
      license: "Pexels License",
      sizeBytes: 30_668
    }
  }),
  defineIncident({
    ids: ids(3),
    buyerEmail: "yoga@gmail.com",
    level: 2,
    unitName: "UPC Sarinah",
    unitAdminEmail: "bagas.prakoso@pegadaian.co.id",
    itemCode: "SBG-1188800000000053",
    itemName: "Cincin Emas Berlian Solitaire 18K 5,25 Gram",
    description:
      "Cincin emas kuning 18 karat model solitaire dengan satu berlian utama pada dudukan enam kuku. Lingkar cincin utuh, batu terpasang kokoh, dan permukaan telah dibersihkan tanpa menghilangkan karakter pemakaian.",
    specifications: {
      "Jenis Barang": "Cincin solitaire",
      "Kadar Emas": "18K / 75%",
      Berat: "5,25 gram",
      Ukuran: "16",
      "Batu Utama": "Berlian sekitar 0,15 ct",
      "Warna Logam": "Emas kuning",
      Kondisi: "Baik"
    },
    appraisalValue: 9_400_000,
    basePrice: 8_450_000,
    ownerName: "Nadya Cahya Putri",
    customerNumber: "085874219360",
    itemEnteredAt: scenarioDate("2026-05-22T10:00:00+07:00"),
    auctionStartsAt: scenarioDate("2026-06-01T10:00:00+07:00"),
    auctionEndsAt: scenarioDate("2026-06-01T11:00:00+07:00"),
    violationOccurredAt: scenarioDate("2026-06-02T11:00:00+07:00"),
    dueDate: scenarioDate("2026-09-19T10:00:00+07:00"),
    bids: [
      { bidderEmail: "yoga@gmail.com", amount: 9_400_000, submittedAt: scenarioDate("2026-06-01T10:13:00+07:00") },
      { bidderEmail: "reza@gmail.com", amount: 9_050_000, submittedAt: scenarioDate("2026-06-01T10:29:00+07:00") },
      { bidderEmail: "ilham@gmail.com", amount: 8_700_000, submittedAt: scenarioDate("2026-06-01T10:47:00+07:00") }
    ],
    media: {
      publicPath: "/media/violation-items/cincin-emas-berlian-solitaire-18k.webp",
      sourceUrl: "https://www.pexels.com/photo/golden-ring-with-diamond-12168877/",
      credit: "Melike B / Pexels",
      license: "Pexels License",
      sizeBytes: 113_012
    }
  }),
  defineIncident({
    ids: ids(4),
    buyerEmail: "tiara@gmail.com",
    level: 2,
    unitName: "UPC Sarinah",
    unitAdminEmail: "bagas.prakoso@pegadaian.co.id",
    itemCode: "SBG-1188800000000054",
    itemName: "Logam Mulia Emas Batangan 10 Gram Bersertifikat",
    description:
      "Emas batangan 10 gram berkadar 999,9 yang tersimpan dalam kemasan sertifikat. Nomor seri dan informasi kadar terbaca, segel utuh, serta kemasan menunjukkan bekas penyimpanan ringan tanpa retak.",
    specifications: {
      "Jenis Barang": "Emas batangan bersertifikat",
      Kadar: "999,9 / 24K",
      Berat: "10 gram",
      Kemasan: "Assay card tersegel",
      Sertifikat: "Terintegrasi pada kemasan",
      Kondisi: "Segel utuh, bekas simpan ringan"
    },
    appraisalValue: 24_350_000,
    basePrice: 22_500_000,
    ownerName: "Muhammad Fadli Ramadhan",
    customerNumber: "081245709638",
    itemEnteredAt: scenarioDate("2026-05-23T12:00:00+07:00"),
    auctionStartsAt: scenarioDate("2026-06-02T12:00:00+07:00"),
    auctionEndsAt: scenarioDate("2026-06-02T13:00:00+07:00"),
    violationOccurredAt: scenarioDate("2026-06-03T13:00:00+07:00"),
    dueDate: scenarioDate("2026-09-20T12:00:00+07:00"),
    bids: [
      { bidderEmail: "tiara@gmail.com", amount: 24_200_000, submittedAt: scenarioDate("2026-06-02T12:12:00+07:00") },
      { bidderEmail: "reza@gmail.com", amount: 23_850_000, submittedAt: scenarioDate("2026-06-02T12:31:00+07:00") },
      { bidderEmail: "ilham@gmail.com", amount: 23_200_000, submittedAt: scenarioDate("2026-06-02T12:49:00+07:00") }
    ],
    media: {
      publicPath: "/media/violation-items/emas-batangan-10-gram-bersertifikat.webp",
      sourceUrl: "https://www.pexels.com/photo/close-up-photo-of-gold-bars-8442318/",
      credit: "Zlataky.cz / Pexels",
      license: "Pexels License",
      sizeBytes: 67_662
    }
  }),
  defineIncident({
    ids: ids(5),
    buyerEmail: "yoga@gmail.com",
    level: 3,
    unitName: "UPC Sarinah",
    unitAdminEmail: "bagas.prakoso@pegadaian.co.id",
    itemCode: "SBG-1188800000000055",
    itemName: "Apple MacBook Air M2 13,6 Inci 2022 Midnight",
    description:
      "MacBook Air keluaran 2022 warna Midnight dengan cip Apple M2, memori 8 GB, dan penyimpanan SSD 256 GB. Layar, papan ketik, kamera, port, serta pengisian daya berfungsi normal; terdapat gores rambut ringan pada penutup atas.",
    specifications: {
      Model: "MacBook Air 2022",
      Prosesor: "Apple M2 8-core",
      Memori: "8 GB unified memory",
      Penyimpanan: "SSD 256 GB",
      Layar: "Liquid Retina 13,6 inci",
      Baterai: "Kesehatan 89%, 163 cycle count",
      Kelengkapan: "Adaptor USB-C 30 W",
      Kondisi: "Normal, gores rambut ringan"
    },
    appraisalValue: 10_800_000,
    basePrice: 9_750_000,
    ownerName: "Keisya Amanda Putri",
    customerNumber: "082267491835",
    itemEnteredAt: scenarioDate("2026-07-04T23:56:00+07:00"),
    auctionStartsAt: scenarioDate("2026-07-14T23:56:00+07:00"),
    auctionEndsAt: scenarioDate("2026-07-15T00:00:00+07:00"),
    violationOccurredAt: scenarioDate("2026-07-16T00:00:00+07:00"),
    dueDate: scenarioDate("2026-11-01T23:56:00+07:00"),
    bids: [
      { bidderEmail: "yoga@gmail.com", amount: 10_800_000, submittedAt: scenarioDate("2026-07-14T23:56:30+07:00") },
      { bidderEmail: "tiara@gmail.com", amount: 10_450_000, submittedAt: scenarioDate("2026-07-14T23:57:15+07:00") },
      { bidderEmail: "reza@gmail.com", amount: 10_200_000, submittedAt: scenarioDate("2026-07-14T23:58:10+07:00") },
      { bidderEmail: "ilham@gmail.com", amount: 9_950_000, submittedAt: scenarioDate("2026-07-14T23:59:05+07:00") }
    ],
    media: {
      publicPath: "/media/violation-items/macbook-air-m2-2022-midnight.webp",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:M2_Macbook_Air_Midnight_model_-_1.jpg",
      credit: "KKPCW (Kyu3) / Wikimedia Commons",
      license: "CC BY-SA 4.0",
      sizeBytes: 51_914
    }
  }),
  defineIncident({
    ids: ids(6),
    buyerEmail: "tiara@gmail.com",
    level: 3,
    unitName: "UPC Wanea",
    unitAdminEmail: "hendra.wijaya@pegadaian.co.id",
    itemCode: "SBG-1178700000000056",
    itemName: "Jam Tangan Seiko 5 Automatic 6309-5320",
    description:
      "Jam tangan Seiko 5 referensi 6309-5320 dengan mesin otomatis 21 jewels, tampilan hari-tanggal, casing dan bracelet baja tahan karat. Mesin berjalan, pengaturan hari-tanggal normal, dan terdapat gores halus sesuai usia pemakaian.",
    specifications: {
      Merek: "Seiko",
      Referensi: "6309-5320",
      Mesin: "Automatic 21 jewels",
      Fitur: "Day-date",
      "Diameter Casing": "Sekitar 36 mm",
      Material: "Stainless steel",
      Kondisi: "Fungsi normal, gores halus pemakaian"
    },
    appraisalValue: 2_800_000,
    basePrice: 2_450_000,
    ownerName: "Ferdinand Runtuwene",
    customerNumber: "085219647083",
    itemEnteredAt: scenarioDate("2026-07-05T00:01:00+07:00"),
    auctionStartsAt: scenarioDate("2026-07-15T00:01:00+07:00"),
    auctionEndsAt: scenarioDate("2026-07-15T00:05:00+07:00"),
    violationOccurredAt: scenarioDate("2026-07-16T00:05:00+07:00"),
    dueDate: scenarioDate("2026-11-02T00:01:00+07:00"),
    bids: [
      { bidderEmail: "tiara@gmail.com", amount: 2_950_000, submittedAt: scenarioDate("2026-07-15T00:01:35+07:00") },
      { bidderEmail: "reza@gmail.com", amount: 2_700_000, submittedAt: scenarioDate("2026-07-15T00:02:45+07:00") },
      { bidderEmail: "ilham@gmail.com", amount: 2_550_000, submittedAt: scenarioDate("2026-07-15T00:04:05+07:00") }
    ],
    media: {
      publicPath: "/media/violation-items/seiko-5-automatic-6309-5320.webp",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Seiko_5.jpg",
      credit: "Isik / Wikimedia Commons",
      license: "CC BY-SA 4.0",
      sizeBytes: 13_622
    }
  }),
  defineIncident({
    ids: ids(7),
    buyerEmail: "reza@gmail.com",
    level: 1,
    unitName: "UPC Wanea",
    unitAdminEmail: "hendra.wijaya@pegadaian.co.id",
    itemCode: "SBG-1178700000000057",
    itemName: "Kalung Emas Rantai Cuban 22K 6,7 Gram",
    description:
      "Kalung emas kuning 22 karat model Cuban link dengan susunan mata rantai rapat dan kilap merata. Pengunci lobster bekerja baik, tidak ditemukan bagian putus, dan permukaan memiliki gores mikro akibat pemakaian normal.",
    specifications: {
      "Jenis Barang": "Kalung rantai Cuban",
      "Kadar Emas": "22K / 91,6%",
      Berat: "6,70 gram",
      Panjang: "50 cm",
      "Lebar Rantai": "Sekitar 4 mm",
      Pengunci: "Lobster clasp",
      Kondisi: "Baik, gores mikro pemakaian"
    },
    appraisalValue: 14_100_000,
    basePrice: 12_700_000,
    ownerName: "Claudia Maharani Tumbel",
    customerNumber: "081389527416",
    itemEnteredAt: scenarioDate("2026-07-05T00:06:00+07:00"),
    auctionStartsAt: scenarioDate("2026-07-15T00:06:00+07:00"),
    auctionEndsAt: scenarioDate("2026-07-15T00:10:00+07:00"),
    violationOccurredAt: scenarioDate("2026-07-16T00:10:00+07:00"),
    dueDate: scenarioDate("2026-11-02T00:06:00+07:00"),
    bids: [
      { bidderEmail: "reza@gmail.com", amount: 14_000_000, submittedAt: scenarioDate("2026-07-15T00:06:45+07:00") },
      { bidderEmail: "ilham@gmail.com", amount: 13_650_000, submittedAt: scenarioDate("2026-07-15T00:08:30+07:00") }
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

export function validateCrossUnitViolationScenario() {
  const ordered = [...CROSS_UNIT_VIOLATION_SCENARIO].sort(
    (left, right) => left.auctionStartsAt.getTime() - right.auctionStartsAt.getTime()
  );
  const previousByBuyer = new Map<string, CrossUnitViolationIncident>();

  ordered.forEach((incident, index) => {
    assert(
      incident.auctionStartsAt.getTime() - incident.itemEnteredAt.getTime() === 10 * DAY_MS,
      `${incident.itemName}: Barang Masuk harus tepat H-10 sebelum pemasaran.`
    );
    assert(
      incident.auctionEndsAt.getTime() > incident.auctionStartsAt.getTime(),
      `${incident.itemName}: waktu selesai lelang harus sesudah waktu mulai.`
    );
    assert(
      incident.violationOccurredAt.getTime() - incident.auctionEndsAt.getTime() === DAY_MS,
      `${incident.itemName}: pelanggaran harus terjadi tepat 24 jam setelah lelang selesai.`
    );
    assert(
      incident.bids.every(
        (bid) =>
          bid.submittedAt.getTime() >= incident.auctionStartsAt.getTime() &&
          bid.submittedAt.getTime() < incident.auctionEndsAt.getTime()
      ),
      `${incident.itemName}: seluruh bid harus berada di dalam sesi lelang.`
    );
    assert(
      incident.bids[0]?.bidderEmail === incident.buyerEmail,
      `${incident.itemName}: target pelanggaran harus menjadi penawar tertinggi.`
    );
    assert(
      incident.finalPrice === (incident.bids[1]?.amount ?? incident.basePrice),
      `${incident.itemName}: harga final harus mengikuti harga penawaran tertinggi kedua.`
    );
    assert(
      incident.bids.every((bid) => bid.amount >= incident.basePrice),
      `${incident.itemName}: semua bid harus memenuhi harga dasar.`
    );

    const previousGlobal = ordered[index - 1];
    if (previousGlobal) {
      assert(
        incident.auctionStartsAt.getTime() >= previousGlobal.auctionEndsAt.getTime(),
        `${incident.itemName}: sesi lelang tidak boleh bertumpuk.`
      );
    }

    for (const bidderEmail of incident.bidderEmails) {
      const previousWin = previousByBuyer.get(bidderEmail);
      if (!previousWin) continue;

      assert(
        incident.auctionStartsAt.getTime() >= previousWin.blockedUntil.getTime(),
        `${incident.itemName}: ${bidderEmail} masih berada dalam masa pembatasan.`
      );
    }

    const previousMilestone = previousByBuyer.get(incident.buyerEmail);
    if (previousMilestone) {
      assert(
        incident.level === Math.min(previousMilestone.level + 1, 3),
        `${incident.buyerEmail}: level pelanggaran tidak berurutan.`
      );
      assert(
        incident.violationOccurredAt.getTime() >= previousMilestone.blockedUntil.getTime(),
        `${incident.buyerEmail}: milestone baru terjadi sebelum pembatasan sebelumnya selesai.`
      );
    } else {
      assert(incident.level === 1, `${incident.buyerEmail}: milestone pertama harus Level 1.`);
    }

    assert(
      incident.media.publicPath.startsWith("/media/violation-items/") &&
        incident.media.publicPath.endsWith(".webp"),
      `${incident.itemName}: media harus memakai aset WebP lokal.`
    );
    assert(
      !/\b(?:dummy|demo|test|uji coba)\b/i.test(
        `${incident.itemName} ${incident.description} ${Object.values(incident.specifications).join(" ")}`
      ),
      `${incident.itemName}: copy yang terlihat pengguna tidak boleh memakai label data uji.`
    );

    previousByBuyer.set(incident.buyerEmail, incident);
  });

  return true;
}

export function getExpectedFinalRestrictions() {
  const latestByBuyer = new Map<string, CrossUnitViolationIncident>();
  for (const incident of CROSS_UNIT_VIOLATION_SCENARIO) {
    latestByBuyer.set(incident.buyerEmail, incident);
  }

  return ["yoga@gmail.com", "tiara@gmail.com", "reza@gmail.com"].map((buyerEmail) => {
    const incident = latestByBuyer.get(buyerEmail);
    if (!incident) throw new Error(`Skenario akhir ${buyerEmail} tidak ditemukan.`);

    return {
      buyerEmail,
      level: incident.level,
      unitName: incident.unitName,
      blockedUntil: incident.blockedUntil
    };
  });
}

export function getScenarioDurationHours(incident: CrossUnitViolationIncident) {
  return (incident.auctionEndsAt.getTime() - incident.auctionStartsAt.getTime()) / HOUR_MS;
}
