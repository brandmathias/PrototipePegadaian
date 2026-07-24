import {
  CROSS_UNIT_VIOLATION_SCENARIO,
  getExpectedFinalRestrictions,
  getScenarioDurationHours,
  validateCrossUnitViolationScenario
} from "./cross-unit-violation-scenario";

type SeedIdentity = { id: string };
type SeedBuyerIdentity = SeedIdentity & { nationalId: string | null };

export type CrossUnitViolationSeedContext = {
  adminsByEmail: Map<string, SeedIdentity>;
  unitsByName: Map<string, SeedIdentity>;
  usersByEmail: Map<string, SeedBuyerIdentity>;
};

function requireIdentity<T extends SeedIdentity>(
  values: Map<string, T>,
  key: string,
  label: string
) {
  const value = values.get(key);
  if (!value) throw new Error(`${label} ${key} tidak ditemukan.`);
  return value;
}

function getItemCategory(name: string) {
  if (/macbook/i.test(name)) return "Elektronik";
  if (/jam tangan/i.test(name)) return "Jam Tangan";
  if (/logam mulia/i.test(name)) return "Logam Mulia";
  return "Perhiasan";
}

function getBidId(incidentIndex: number, bidIndex: number) {
  const head = `5${incidentIndex}${bidIndex}${"0".repeat(5)}`;
  const tail = `${incidentIndex}${bidIndex}`.padStart(12, "0");
  return `${head}-0000-4000-8000-${tail}`;
}

function getBlacklistId(email: string) {
  const sequence =
    email === "yoga@gmail.com" ? 1 : email === "tiara@gmail.com" ? 2 : 3;
  return `61000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function getActionLogId(incidentIndex: number) {
  return `62000000-0000-4000-8000-${String(incidentIndex).padStart(12, "0")}`;
}

export function buildCrossUnitViolationSeedRows(context: CrossUnitViolationSeedContext) {
  validateCrossUnitViolationScenario();

  const barang = [] as Array<Record<string, unknown>>;
  const mediaBarang = [] as Array<Record<string, unknown>>;
  const pemasaran = [] as Array<{
    basePrice: number;
    barangId: string;
    createdAt: Date;
    createdByUserId: string;
    durationDays: number;
    durationSeconds: number;
    endsAt: Date;
    finalPrice: number;
    id: string;
    iteration: number;
    mode: string;
    startsAt: Date;
    status: string;
    updatedAt: Date;
    winnerId: string;
  }>;
  const bids = [] as Array<{
    createdAt: Date;
    id: string;
    nominal: number;
    pemasaranId: string;
    userId: string;
  }>;
  const transaksi = [] as Array<Record<string, unknown>>;
  const pelanggaranUser = [] as Array<Record<string, unknown>>;
  const riwayatStatusBarang = [] as Array<{
    barangId: string;
    changedByUserId: string | null;
    createdAt: Date;
    id: string;
    newStatus: string;
    note: string;
    oldStatus: string | null;
  }>;
  const blacklistActionLogs = [] as Array<Record<string, unknown>>;

  CROSS_UNIT_VIOLATION_SCENARIO.forEach((incident, incidentOffset) => {
    const incidentIndex = incidentOffset + 1;
    const buyer = requireIdentity(context.usersByEmail, incident.buyerEmail, "Buyer");
    const unit = requireIdentity(context.unitsByName, incident.unitName, "Unit");
    const admin = requireIdentity(context.adminsByEmail, incident.unitAdminEmail, "Admin unit");

    barang.push({
      id: incident.ids.barang,
      unitId: unit.id,
      code: incident.itemCode,
      name: incident.itemName,
      category: getItemCategory(incident.itemName),
      condition: "Baik",
      description: incident.description,
      specifications: incident.specifications,
      appraisalValue: incident.appraisalValue,
      ownerName: incident.ownerName,
      customerNumber: incident.customerNumber,
      pawnedAt: incident.itemEnteredAt,
      dueDate: incident.dueDate,
      status: "gagal",
      createdByUserId: admin.id,
      createdAt: incident.itemEnteredAt,
      updatedAt: incident.violationOccurredAt
    });

    mediaBarang.push({
      id: incident.ids.media,
      barangId: incident.ids.barang,
      type: "foto",
      url: incident.media.publicPath,
      fileName: incident.media.publicPath.split("/").at(-1) ?? "foto-barang.webp",
      sizeBytes: incident.media.sizeBytes,
      sortOrder: 0,
      createdAt: incident.itemEnteredAt
    });

    pemasaran.push({
      id: incident.ids.pemasaran,
      barangId: incident.ids.barang,
      mode: "vickrey",
      basePrice: incident.basePrice,
      durationDays: Math.floor(getScenarioDurationHours(incident) / 24),
      durationSeconds: Math.round(getScenarioDurationHours(incident) * 60 * 60),
      startsAt: incident.auctionStartsAt,
      endsAt: incident.auctionEndsAt,
      winnerId: buyer.id,
      finalPrice: incident.finalPrice,
      iteration: 1,
      status: "gagal",
      createdByUserId: admin.id,
      createdAt: incident.auctionStartsAt,
      updatedAt: incident.violationOccurredAt
    });

    incident.bids.forEach((bid, bidOffset) => {
      const bidder = requireIdentity(context.usersByEmail, bid.bidderEmail, "Bidder");
      const bidIndex = bidOffset + 1;
      bids.push({
        id: getBidId(incidentIndex, bidIndex),
        pemasaranId: incident.ids.pemasaran,
        userId: bidder.id,
        nominal: bid.amount,
        createdAt: bid.submittedAt
      });
    });

    transaksi.push({
      id: incident.ids.transaksi,
      pemasaranId: incident.ids.pemasaran,
      userId: buyer.id,
      type: "vickrey",
      amount: incident.finalPrice,
      paymentMethod: "langsung",
      status: "gagal",
      paymentDeadline: incident.violationOccurredAt,
      createdAt: incident.auctionEndsAt,
      updatedAt: incident.violationOccurredAt
    });

    pelanggaranUser.push({
      id: incident.ids.violation,
      userId: buyer.id,
      pemasaranId: incident.ids.pemasaran,
      transaksiId: incident.ids.transaksi,
      unitId: unit.id,
      note: "Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam.",
      escalationEligible: true,
      createdAt: incident.violationOccurredAt,
      updatedAt: incident.violationOccurredAt
    });

    riwayatStatusBarang.push(
      {
        id: incident.ids.historyIncoming,
        barangId: incident.ids.barang,
        oldStatus: null,
        newStatus: "jaminan",
        changedByUserId: admin.id,
        note: "Barang hasil input gadai dicatat sebagai barang jaminan unit.",
        createdAt: incident.itemEnteredAt
      },
      {
        id: incident.ids.historyMarketed,
        barangId: incident.ids.barang,
        oldStatus: "jaminan",
        newStatus: "dipasarkan",
        changedByUserId: admin.id,
        note: "Barang ditayangkan melalui Lelang Tertutup pada iterasi 1.",
        createdAt: incident.auctionStartsAt
      },
      {
        id: incident.ids.historyWaiting,
        barangId: incident.ids.barang,
        oldStatus: "dipasarkan",
        newStatus: "menunggu_pembayaran",
        changedByUserId: null,
        note: "Lelang Tertutup selesai dan pemenang diberikan batas pembayaran 24 jam.",
        createdAt: incident.auctionEndsAt
      },
      {
        id: incident.ids.historyFailed,
        barangId: incident.ids.barang,
        oldStatus: "menunggu_pembayaran",
        newStatus: "gagal",
        changedByUserId: null,
        note: "Pemenang Lelang Tertutup tidak menyelesaikan pembayaran dalam 24 jam sehingga sesi dinyatakan gagal.",
        createdAt: incident.violationOccurredAt
      }
    );

    const blacklistId = getBlacklistId(incident.buyerEmail);
    blacklistActionLogs.push({
      id: getActionLogId(incidentIndex),
      blacklistId,
      targetUserId: buyer.id,
      action: "blokir_otomatis",
      note:
        incident.level === 3
          ? "Sistem otomatis menonaktifkan akun buyer selama 365 hari karena mencapai Level 3."
          : `Sistem otomatis memblokir buyer selama ${incident.level === 1 ? 7 : 30} hari karena tidak membayar hasil Lelang Tertutup.`,
      createdAt: incident.violationOccurredAt
    });
  });

  const blacklists = getExpectedFinalRestrictions().map((restriction) => {
    const buyer = requireIdentity(context.usersByEmail, restriction.buyerEmail, "Buyer");
    const unit = requireIdentity(context.unitsByName, restriction.unitName, "Unit");
    const latestIncident = [...CROSS_UNIT_VIOLATION_SCENARIO]
      .reverse()
      .find((incident) => incident.buyerEmail === restriction.buyerEmail);
    if (!latestIncident) throw new Error(`Milestone terakhir ${restriction.buyerEmail} tidak ditemukan.`);

    return {
      id: getBlacklistId(restriction.buyerEmail),
      unitId: unit.id,
      userId: buyer.id,
      nationalId: buyer.nationalId,
      totalViolations: restriction.level,
      isActive: true,
      blockedAt: latestIncident.violationOccurredAt,
      blockedUntil: restriction.blockedUntil,
      updatedAt: latestIncident.violationOccurredAt
    };
  });

  return {
    barang,
    mediaBarang,
    pemasaran,
    bids,
    transaksi,
    pelanggaranUser,
    riwayatStatusBarang,
    blacklists,
    blacklistActionLogs,
    suspendedUserIds: blacklists
      .filter((blacklist) => blacklist.totalViolations >= 3)
      .map((blacklist) => blacklist.userId)
  };
}
