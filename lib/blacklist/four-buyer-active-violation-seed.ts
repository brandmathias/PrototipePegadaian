import {
  FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO,
  getFourBuyerActiveRestrictions,
  validateFourBuyerActiveViolationScenario,
  type FourBuyerActiveEmail
} from "./four-buyer-active-violation-scenario";

type Identity = { id: string };
type BuyerIdentity = Identity & { nationalId: string };

export type FourBuyerActiveViolationSeedContext = {
  adminsByUnitName: Map<string, Identity>;
  unitsByName: Map<string, Identity>;
  usersByEmail: Map<string, BuyerIdentity>;
};

function required<T>(values: Map<string, T>, key: string, label: string) {
  const value = values.get(key);
  if (!value) throw new Error(`${label} ${key} tidak ditemukan.`);
  return value;
}

function category(itemName: string) {
  if (/laptop/i.test(itemName)) return "Elektronik";
  if (/logam mulia/i.test(itemName)) return "Logam Mulia";
  return "Perhiasan";
}

function blacklistId(email: FourBuyerActiveEmail) {
  const sequence = FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.findIndex(
    (entry) => entry.buyerEmail === email
  ) + 1;
  return `a7b00000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function bidId(incidentIndex: number, bidIndex: number) {
  return `a7c${incidentIndex}${bidIndex}000-0000-4000-8000-${String(incidentIndex * 10 + bidIndex).padStart(12, "0")}`;
}

export function buildFourBuyerActiveViolationSeedRows(context: FourBuyerActiveViolationSeedContext) {
  validateFourBuyerActiveViolationScenario();

  const barang: Array<Record<string, unknown>> = [];
  const mediaBarang: Array<Record<string, unknown>> = [];
  const pemasaran: Array<Record<string, unknown>> = [];
  const bids: Array<Record<string, unknown>> = [];
  const transaksi: Array<Record<string, unknown>> = [];
  const pelanggaranUser: Array<Record<string, unknown>> = [];
  const riwayatStatusBarang: Array<Record<string, unknown>> = [];
  const blacklists: Array<Record<string, unknown>> = [];
  const blacklistActionLogs: Array<Record<string, unknown>> = [];

  for (const [offset, entry] of FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.entries()) {
    const sequence = offset + 1;
    const buyer = required(context.usersByEmail, entry.buyerEmail, "Buyer");
    const unit = required(context.unitsByName, entry.unitName, "Unit");
    const admin = required(context.adminsByUnitName, entry.unitName, "Admin unit");

    barang.push({
      id: entry.ids.barang,
      unitId: unit.id,
      code: entry.itemCode,
      name: entry.itemName,
      category: category(entry.itemName),
      condition: "Baik",
      description: entry.description,
      specifications: entry.specifications,
      appraisalValue: entry.appraisalValue,
      ownerName: entry.ownerName,
      customerNumber: entry.customerNumber,
      pawnedAt: entry.itemEnteredAt,
      dueDate: entry.dueDate,
      status: "gagal",
      createdByUserId: admin.id,
      createdAt: entry.itemEnteredAt,
      updatedAt: entry.violationOccurredAt
    });
    mediaBarang.push({
      id: entry.ids.media,
      barangId: entry.ids.barang,
      type: "foto",
      url: entry.media.publicPath,
      fileName: entry.media.publicPath.split("/").at(-1),
      sizeBytes: entry.media.sizeBytes,
      sortOrder: 0,
      createdAt: entry.itemEnteredAt
    });
    pemasaran.push({
      id: entry.ids.pemasaran,
      barangId: entry.ids.barang,
      mode: "vickrey",
      basePrice: entry.basePrice,
      durationDays: 0,
      durationSeconds: 3_600,
      startsAt: entry.auctionStartsAt,
      endsAt: entry.auctionEndsAt,
      winnerId: buyer.id,
      finalPrice: entry.finalPrice,
      iteration: entry.iteration,
      status: "gagal",
      createdByUserId: admin.id,
      createdAt: entry.auctionStartsAt,
      updatedAt: entry.violationOccurredAt
    });
    entry.bids.forEach((bid, bidOffset) => {
      bids.push({
        id: bidId(sequence, bidOffset + 1),
        pemasaranId: entry.ids.pemasaran,
        userId: required(context.usersByEmail, bid.bidderEmail, "Bidder").id,
        nominal: bid.amount,
        createdAt: bid.submittedAt
      });
    });
    transaksi.push({
      id: entry.ids.transaksi,
      pemasaranId: entry.ids.pemasaran,
      userId: buyer.id,
      type: "vickrey",
      amount: entry.finalPrice,
      paymentMethod: "langsung",
      status: "gagal",
      paymentDeadline: entry.violationOccurredAt,
      createdAt: entry.auctionEndsAt,
      updatedAt: entry.violationOccurredAt
    });
    pelanggaranUser.push({
      id: entry.ids.violation,
      userId: buyer.id,
      pemasaranId: entry.ids.pemasaran,
      transaksiId: entry.ids.transaksi,
      unitId: unit.id,
      note: "Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam.",
      escalationEligible: true,
      createdAt: entry.violationOccurredAt,
      updatedAt: entry.violationOccurredAt
    });
    riwayatStatusBarang.push(
      { id: entry.ids.historyIncoming, barangId: entry.ids.barang, oldStatus: null, newStatus: "jaminan", changedByUserId: admin.id, note: "Barang hasil input gadai dicatat sebagai barang jaminan unit.", createdAt: entry.itemEnteredAt },
      { id: entry.ids.historyMarketed, barangId: entry.ids.barang, oldStatus: "jaminan", newStatus: "dipasarkan", changedByUserId: admin.id, note: "Barang ditayangkan melalui Lelang Tertutup pada iterasi 1.", createdAt: entry.auctionStartsAt },
      { id: entry.ids.historyWaiting, barangId: entry.ids.barang, oldStatus: "dipasarkan", newStatus: "menunggu_pembayaran", changedByUserId: null, note: "Lelang Tertutup selesai dan pemenang diberi batas pembayaran 24 jam.", createdAt: entry.auctionEndsAt },
      { id: entry.ids.historyFailed, barangId: entry.ids.barang, oldStatus: "menunggu_pembayaran", newStatus: "gagal", changedByUserId: null, note: "Pemenang Lelang Tertutup tidak menyelesaikan pembayaran sehingga sesi dinyatakan gagal.", createdAt: entry.violationOccurredAt }
    );
    blacklists.push({
      id: blacklistId(entry.buyerEmail),
      unitId: unit.id,
      userId: buyer.id,
      nationalId: buyer.nationalId,
      totalViolations: 1,
      isActive: true,
      blockedAt: entry.violationOccurredAt,
      blockedUntil: entry.blockedUntil,
      updatedAt: entry.violationOccurredAt
    });
    blacklistActionLogs.push({
      id: `a7d00000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
      blacklistId: blacklistId(entry.buyerEmail),
      targetUserId: buyer.id,
      action: "blokir_otomatis",
      note: "Sistem otomatis memblokir buyer selama 7 hari karena tidak membayar hasil Lelang Tertutup.",
      createdAt: entry.violationOccurredAt
    });
  }

  const restrictionByEmail = new Map(
    getFourBuyerActiveRestrictions().map((restriction) => [restriction.buyerEmail, restriction])
  );
  if (restrictionByEmail.size !== blacklists.length) throw new Error("Pembatasan skenario tidak lengkap.");

  return { barang, mediaBarang, pemasaran, bids, transaksi, pelanggaranUser, riwayatStatusBarang, blacklists, blacklistActionLogs };
}
