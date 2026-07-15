import {
  createRenewedScenarioBidHash,
  getRenewedExpectedFinalRestrictions,
  getRenewedScenarioDurationHours,
  RENEWED_CROSS_UNIT_VIOLATION_SCENARIO,
  validateRenewedCrossUnitViolationScenario
} from "./renewed-cross-unit-violation-scenario";

type Identity = { id: string };
type BuyerIdentity = Identity & { nationalId: string | null };

export type RenewedCrossUnitViolationSeedContext = {
  adminsByEmail: Map<string, Identity>;
  unitsByName: Map<string, Identity>;
  usersByEmail: Map<string, BuyerIdentity>;
};

function required<T extends Identity>(values: Map<string, T>, key: string, label: string) {
  const value = values.get(key);
  if (!value) throw new Error(`${label} ${key} tidak ditemukan.`);
  return value;
}

function blacklistId(email: string) {
  return `81000000-0000-4000-8000-${String(email === "bagus@gmail.com" ? 1 : 2).padStart(12, "0")}`;
}

function bidId(incident: number, bid: number) {
  return `820${incident}${bid}00-0000-4000-8000-${String(incident * 10 + bid).padStart(12, "0")}`;
}

export function buildRenewedCrossUnitViolationSeedRows(context: RenewedCrossUnitViolationSeedContext) {
  validateRenewedCrossUnitViolationScenario();
  const barang: Array<Record<string, unknown>> = [];
  const mediaBarang: Array<Record<string, unknown>> = [];
  const pemasaran: Array<Record<string, unknown>> = [];
  const bids: Array<Record<string, unknown>> = [];
  const transaksi: Array<Record<string, unknown>> = [];
  const pelanggaranUser: Array<Record<string, unknown>> = [];
  const riwayatStatusBarang: Array<Record<string, unknown>> = [];
  const blacklistActionLogs: Array<Record<string, unknown>> = [];

  RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.forEach((entry, offset) => {
    const sequence = offset + 1;
    const buyer = required(context.usersByEmail, entry.buyerEmail, "Buyer");
    const unit = required(context.unitsByName, entry.unitName, "Unit");
    const admin = required(context.adminsByEmail, entry.unitAdminEmail, "Admin unit");
    barang.push({ id: entry.ids.barang, unitId: unit.id, code: entry.itemCode, name: entry.itemName, category: /laptop/i.test(entry.itemName) ? "Elektronik" : "Perhiasan", condition: "Baik", description: entry.description, specifications: entry.specifications, appraisalValue: entry.appraisalValue, ownerName: entry.ownerName, customerNumber: entry.customerNumber, pawnedAt: entry.itemEnteredAt, dueDate: entry.dueDate, status: "gagal", createdByUserId: admin.id, createdAt: entry.itemEnteredAt, updatedAt: entry.violationOccurredAt });
    mediaBarang.push({ id: entry.ids.media, barangId: entry.ids.barang, type: "foto", url: entry.media.publicPath, fileName: entry.media.publicPath.split("/").at(-1), sizeBytes: entry.media.sizeBytes, sortOrder: 0, createdAt: entry.itemEnteredAt });
    pemasaran.push({ id: entry.ids.pemasaran, barangId: entry.ids.barang, mode: "vickrey", basePrice: entry.basePrice, durationDays: Math.floor(getRenewedScenarioDurationHours(entry) / 24), durationSeconds: Math.round(getRenewedScenarioDurationHours(entry) * 3600), startsAt: entry.auctionStartsAt, endsAt: entry.auctionEndsAt, revealEndsAt: new Date(entry.auctionEndsAt.getTime() + 10 * 60 * 1000), winnerId: buyer.id, finalPrice: entry.finalPrice, iteration: 1, status: "gagal", createdByUserId: admin.id, createdAt: entry.auctionStartsAt, updatedAt: entry.violationOccurredAt });
    entry.bids.forEach((bid, bidOffset) => {
      const bidder = required(context.usersByEmail, bid.bidderEmail, "Bidder");
      const salt = `lintas-unit-baru-${sequence}-${bidOffset + 1}`;
      bids.push({ id: bidId(sequence, bidOffset + 1), pemasaranId: entry.ids.pemasaran, userId: bidder.id, bidHash: createRenewedScenarioBidHash({ pemasaranId: entry.ids.pemasaran, userId: bidder.id, amount: bid.amount, salt }), encryptedBidPayload: null, nominal: bid.amount, salt, revealedAt: entry.auctionEndsAt, createdAt: bid.submittedAt });
    });
    transaksi.push({ id: entry.ids.transaksi, pemasaranId: entry.ids.pemasaran, userId: buyer.id, type: "vickrey", amount: entry.finalPrice, paymentMethod: "langsung", status: "gagal", paymentDeadline: entry.violationOccurredAt, createdAt: entry.auctionEndsAt, updatedAt: entry.violationOccurredAt });
    pelanggaranUser.push({ id: entry.ids.violation, userId: buyer.id, pemasaranId: entry.ids.pemasaran, transaksiId: entry.ids.transaksi, unitId: unit.id, note: "Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam.", escalationEligible: true, createdAt: entry.violationOccurredAt, updatedAt: entry.violationOccurredAt });
    riwayatStatusBarang.push(
      { id: entry.ids.historyIncoming, barangId: entry.ids.barang, oldStatus: null, newStatus: "jaminan", changedByUserId: admin.id, note: "Barang hasil input gadai dicatat sebagai barang jaminan unit.", createdAt: entry.itemEnteredAt },
      { id: entry.ids.historyMarketed, barangId: entry.ids.barang, oldStatus: "jaminan", newStatus: "dipasarkan", changedByUserId: admin.id, note: "Barang ditayangkan melalui Lelang Tertutup pada iterasi 1.", createdAt: entry.auctionStartsAt },
      { id: entry.ids.historyWaiting, barangId: entry.ids.barang, oldStatus: "dipasarkan", newStatus: "menunggu_pembayaran", changedByUserId: null, note: "Lelang Tertutup selesai dan pemenang diberikan batas pembayaran 24 jam.", createdAt: entry.auctionEndsAt },
      { id: entry.ids.historyFailed, barangId: entry.ids.barang, oldStatus: "menunggu_pembayaran", newStatus: "gagal", changedByUserId: null, note: "Pemenang Lelang Tertutup tidak menyelesaikan pembayaran dalam 24 jam sehingga sesi dinyatakan gagal.", createdAt: entry.violationOccurredAt }
    );
    blacklistActionLogs.push({ id: `83000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`, blacklistId: blacklistId(entry.buyerEmail), targetUserId: buyer.id, action: "blokir_otomatis", note: entry.level === 3 ? "Sistem otomatis menonaktifkan akun buyer selama 365 hari karena mencapai Level 3." : `Sistem otomatis memblokir buyer selama ${entry.level === 1 ? 7 : 30} hari karena tidak membayar hasil Lelang Tertutup.`, createdAt: entry.violationOccurredAt });
  });

  const blacklists = getRenewedExpectedFinalRestrictions().map((restriction) => {
    const buyer = required(context.usersByEmail, restriction.buyerEmail, "Buyer");
    const unit = required(context.unitsByName, restriction.unitName, "Unit");
    const latest = [...RENEWED_CROSS_UNIT_VIOLATION_SCENARIO].reverse().find((entry) => entry.buyerEmail === restriction.buyerEmail);
    if (!latest) throw new Error(`Milestone ${restriction.buyerEmail} tidak ditemukan.`);
    return { id: blacklistId(restriction.buyerEmail), unitId: unit.id, userId: buyer.id, nationalId: buyer.nationalId, totalViolations: restriction.level, isActive: true, blockedAt: latest.violationOccurredAt, blockedUntil: restriction.blockedUntil, updatedAt: latest.violationOccurredAt };
  });

  return { barang, mediaBarang, pemasaran, bids, transaksi, pelanggaranUser, riwayatStatusBarang, blacklists, blacklistActionLogs, suspendedUserIds: blacklists.filter((entry) => entry.totalViolations >= 3).map((entry) => entry.userId) };
}
