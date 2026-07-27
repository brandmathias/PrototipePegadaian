import {
  getWaneaRealExpectedRestrictions,
  getWaneaRealScenarioDurationHours,
  WANEA_REAL_VIOLATION_SCENARIO,
  validateWaneaRealViolationScenario
} from "./wanea-real-violation-scenario";

type Identity = { id: string };
type BuyerIdentity = Identity & { nationalId: string | null };

export type WaneaRealViolationSeedContext = {
  admin: Identity;
  unit: Identity;
  usersByEmail: Map<string, BuyerIdentity>;
};

function required<T extends Identity>(values: Map<string, T>, key: string, label: string) {
  const value = values.get(key);
  if (!value) throw new Error(`${label} ${key} tidak ditemukan.`);
  return value;
}

function blacklistId(email: string) {
  const sequence = email === "rendra@gmail.com" ? 101 : email === "anindita@gmail.com" ? 102 : null;
  if (!sequence) throw new Error(`Blacklist untuk ${email} tidak dikenal.`);
  return `9a000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function bidId(incident: number, bid: number) {
  return `9b0${incident}${bid}00-0000-4000-8000-${String(incident * 10 + bid).padStart(12, "0")}`;
}

function category(name: string) {
  return /emas batangan/i.test(name) ? "Logam Mulia" : "Perhiasan";
}

export function buildWaneaRealViolationSeedRows(context: WaneaRealViolationSeedContext) {
  validateWaneaRealViolationScenario();
  const barang: Array<Record<string, unknown>> = [];
  const mediaBarang: Array<Record<string, unknown>> = [];
  const pemasaran: Array<Record<string, unknown>> = [];
  const bids: Array<Record<string, unknown>> = [];
  const transaksi: Array<Record<string, unknown>> = [];
  const pelanggaranUser: Array<Record<string, unknown>> = [];
  const riwayatStatusBarang: Array<Record<string, unknown>> = [];
  const blacklistActionLogs: Array<Record<string, unknown>> = [];

  WANEA_REAL_VIOLATION_SCENARIO.forEach((incident, offset) => {
    const buyer = required(context.usersByEmail, incident.buyerEmail, "Buyer");
    const sequence = offset + 1;
    barang.push({ id: incident.ids.barang, unitId: context.unit.id, code: incident.itemCode, name: incident.itemName, category: category(incident.itemName), condition: "Baik", description: incident.description, specifications: incident.specifications, appraisalValue: incident.appraisalValue, ownerName: incident.ownerName, customerNumber: incident.customerNumber, pawnedAt: incident.itemEnteredAt, dueDate: incident.dueDate, status: "gagal", createdByUserId: context.admin.id, createdAt: incident.itemEnteredAt, updatedAt: incident.violationOccurredAt });
    mediaBarang.push({ id: incident.ids.media, barangId: incident.ids.barang, type: "foto", url: incident.media.publicPath, fileName: incident.media.publicPath.split("/").at(-1), sizeBytes: incident.media.sizeBytes, sortOrder: 0, createdAt: incident.itemEnteredAt });
    pemasaran.push({ id: incident.ids.pemasaran, barangId: incident.ids.barang, mode: "vickrey", basePrice: incident.basePrice, durationDays: Math.floor(getWaneaRealScenarioDurationHours(incident) / 24), durationSeconds: Math.round(getWaneaRealScenarioDurationHours(incident) * 3600), startsAt: incident.auctionStartsAt, endsAt: incident.auctionEndsAt, winnerId: buyer.id, finalPrice: incident.finalPrice, iteration: incident.iteration, status: "gagal", createdByUserId: context.admin.id, createdAt: incident.auctionStartsAt, updatedAt: incident.violationOccurredAt });
    incident.bids.forEach((bid, bidOffset) => {
      const bidder = required(context.usersByEmail, bid.bidderEmail, "Bidder");
      bids.push({ id: bidId(sequence, bidOffset + 1), pemasaranId: incident.ids.pemasaran, userId: bidder.id, nominal: bid.amount, createdAt: bid.submittedAt });
    });
    transaksi.push({ id: incident.ids.transaksi, pemasaranId: incident.ids.pemasaran, userId: buyer.id, type: "vickrey", amount: incident.finalPrice, paymentMethod: "langsung", status: "gagal", paymentDeadline: incident.violationOccurredAt, createdAt: incident.auctionEndsAt, updatedAt: incident.violationOccurredAt });
    pelanggaranUser.push({ id: incident.ids.violation, userId: buyer.id, pemasaranId: incident.ids.pemasaran, transaksiId: incident.ids.transaksi, unitId: context.unit.id, note: "Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam.", escalationEligible: true, createdAt: incident.violationOccurredAt, updatedAt: incident.violationOccurredAt });
    riwayatStatusBarang.push(
      { id: incident.ids.historyIncoming, barangId: incident.ids.barang, oldStatus: null, newStatus: "jaminan", changedByUserId: context.admin.id, note: "Barang hasil input gadai dicatat sebagai barang jaminan unit.", createdAt: incident.itemEnteredAt },
      { id: incident.ids.historyMarketed, barangId: incident.ids.barang, oldStatus: "jaminan", newStatus: "dipasarkan", changedByUserId: context.admin.id, note: "Barang ditayangkan melalui Lelang Tertutup pada iterasi 1.", createdAt: incident.auctionStartsAt },
      { id: incident.ids.historyWaiting, barangId: incident.ids.barang, oldStatus: "dipasarkan", newStatus: "menunggu_pembayaran", changedByUserId: null, note: "Lelang Tertutup selesai dan pemenang diberikan batas pembayaran 24 jam.", createdAt: incident.auctionEndsAt },
      { id: incident.ids.historyFailed, barangId: incident.ids.barang, oldStatus: "menunggu_pembayaran", newStatus: "gagal", changedByUserId: null, note: "Pemenang Lelang Tertutup tidak menyelesaikan pembayaran dalam 24 jam sehingga sesi dinyatakan gagal.", createdAt: incident.violationOccurredAt }
    );
    blacklistActionLogs.push({ id: `9c000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`, blacklistId: blacklistId(incident.buyerEmail), targetUserId: buyer.id, action: "blokir_otomatis", note: `Sistem otomatis memblokir buyer selama ${incident.level === 1 ? 7 : 30} hari karena tidak membayar hasil Lelang Tertutup.`, createdAt: incident.violationOccurredAt });
  });

  const blacklists = getWaneaRealExpectedRestrictions().map((restriction) => {
    const buyer = required(context.usersByEmail, restriction.buyerEmail, "Buyer");
    const latest = [...WANEA_REAL_VIOLATION_SCENARIO].reverse().find((incident) => incident.buyerEmail === restriction.buyerEmail);
    if (!latest) throw new Error(`Milestone terakhir ${restriction.buyerEmail} tidak ditemukan.`);
    return { id: blacklistId(restriction.buyerEmail), unitId: context.unit.id, userId: buyer.id, nationalId: buyer.nationalId, totalViolations: restriction.level, isActive: true, blockedAt: latest.violationOccurredAt, blockedUntil: restriction.blockedUntil, updatedAt: latest.violationOccurredAt };
  });

  return { barang, mediaBarang, pemasaran, bids, transaksi, pelanggaranUser, riwayatStatusBarang, blacklists, blacklistActionLogs, suspendedUserIds: [] as string[] };
}
