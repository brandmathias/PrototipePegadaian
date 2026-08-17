import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { serializeAdminBarang } from "@/lib/admin-unit/serializers";
import { resolveViolationItemMedia } from "@/lib/blacklist/violation-item-media";
import { formatSbgCode } from "@/lib/barang/sbg-code";
import {
  ADMIN_BARANG_MEDIA_LIMIT,
  validateAdminBarangPayload,
  validateAdminBarangMediaList,
  validatePerpanjanganPayload,
  validateTebusPayload
} from "@/lib/admin-unit/validation";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/auth";
import { barang, bids, mediaBarang, pemasaran, riwayatPerpanjangan, riwayatStatusBarang, transaksi, units } from "@/lib/db/schema";
import { formatAppDateTime } from "@/lib/timezone";

function toUtcDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);
}

function isLikelyImageMedia(media: { type: string; url: string }) {
  return media.type !== "video" && !/\.(mp4|mov|webm|mkv)$/i.test(media.url);
}

async function assertBarangForUnit(barangId: string, unitId: string) {
  const [row] = await db
    .select()
    .from(barang)
    .where(and(eq(barang.id, barangId), eq(barang.unitId, unitId)))
    .limit(1);

  if (!row) {
    throw new Error("Barang tidak ditemukan di unit Anda.");
  }

  return row;
}

type AdminBarangUpdateInput = Parameters<typeof validateAdminBarangPayload>[0] & {
  correctionOnly?: unknown;
  marketingPrice?: unknown;
};

type AdminBarangMediaChangesInput = {
  addMedia?: unknown;
  deleteMediaIds?: unknown;
};

async function recordStatusChange(input: {
  barangId: string;
  oldStatus?: string | null;
  newStatus: string;
  userId: string;
  note?: string;
}) {
  await db.insert(riwayatStatusBarang).values({
    id: crypto.randomUUID(),
    barangId: input.barangId,
    oldStatus: input.oldStatus ?? null,
    newStatus: input.newStatus,
    changedByUserId: input.userId,
    note: input.note ?? ""
  });
}

export type AdminBarangHistoryEntry = {
  id: string;
  barangId: string;
  barangCode: string;
  barangName: string;
  category: string;
  condition: string;
  description: string | null;
  specifications: unknown;
  ownerName: string;
  customerNumber: string;
  actionKey:
    | "input_baru"
    | "perpanjangan"
    | "ditebus"
    | "dipasarkan"
    | "terjual"
    | "gagal";
  actionLabel: string;
  actionTone: "default" | "success" | "warning" | "danger";
  note: string;
  actorName: string;
  actorRole: string | null;
  createdAt: string;
  createdAtLabel: string;
};

type AdminBarangTimelineSourceRow = {
  barangId: string;
  barangCode: string;
  barangName: string;
  category: string;
  condition: string;
  description: string | null;
  specifications: unknown;
  ownerName: string;
  customerNumber: string;
};

type AdminBarangMarketingTimelineRow = AdminBarangTimelineSourceRow & {
  marketingId: string;
  mode: string;
  status: string;
  iteration: number | null;
  createdAt: Date;
  updatedAt: Date | null;
  endsAt: Date | null;
  actorName: string | null;
  actorRole: string | null;
  bidCount: number;
};

type AdminBarangTransactionTimelineRow = AdminBarangTimelineSourceRow & {
  marketingId: string;
  type: string;
  status: string;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt: Date | null;
  completedAt: Date | null;
  paymentDeadline: Date | null;
  actorName: string | null;
  actorRole: string | null;
};

function mapStatusHistoryAction(oldStatus: string | null, newStatus: string) {
  if (!oldStatus) {
    return {
      actionKey: "input_baru" as const,
      actionLabel: "Barang Masuk",
      actionTone: "default" as const
    };
  }

  if (oldStatus === newStatus) {
    return null;
  }

  if (newStatus === "dipasarkan") {
    return {
      actionKey: "dipasarkan" as const,
      actionLabel: "Dipasarkan",
      actionTone: "success" as const
    };
  }

  if (newStatus === "terjual") {
    return {
      actionKey: "terjual" as const,
      actionLabel: "Terjual",
      actionTone: "success" as const
    };
  }

  if (newStatus === "gagal") {
    return {
      actionKey: "gagal" as const,
      actionLabel: "Gagal",
      actionTone: "danger" as const
    };
  }

  if (newStatus === "ditebus") {
    return {
      actionKey: "ditebus" as const,
      actionLabel: "Ditebus",
      actionTone: "warning" as const
    };
  }

  return null;
}

function formatMarketingModeLabel(mode: string | null | undefined) {
  const normalized = String(mode ?? "").toLowerCase();

  if (normalized === "fixed_price") {
    return "Harga Tetap";
  }

  if (normalized === "vickrey") {
    return "Lelang Tertutup";
  }

  return "pemasaran";
}

function appendSentencePeriod(value: string) {
  return `${value.trim().replace(/[.!?]+$/u, "")}.`;
}

type RepairRelistHistoryNote = {
  iteration: string;
  marketingId: string;
  reason: string | undefined;
  transactionId: string;
};

function parseRepairRelistHistoryNote(note: string | null | undefined): RepairRelistHistoryNote | null {
  const value = String(note ?? "").trim();
  const repairRelistMatch = value.match(
    /^Repair DB(?:\s+production)?:\s*bukti pembayaran harga tetap transaksi\s+(\S+)\s+sudah ditolak,\s+tetapi pemasaran\s+(\S+)\s+masih aktif\.\s+Alasan:\s*(.*?)\.\s+Barang dipasarkan ulang otomatis ke iterasi\s+(\d+)\.?$/iu
  );

  if (!repairRelistMatch) {
    return null;
  }

  return {
    transactionId: repairRelistMatch[1],
    marketingId: repairRelistMatch[2],
    reason: repairRelistMatch[3]?.trim(),
    iteration: repairRelistMatch[4]
  };
}

function formatRejectedRelistHistoryNote(repairNote: RepairRelistHistoryNote) {
  const reasonText =
    repairNote.reason && repairNote.reason !== "-" ? ` Alasan: ${appendSentencePeriod(repairNote.reason)}` : "";

  return `Bukti pembayaran harga tetap ditolak admin unit.${reasonText}`;
}

function formatMarketingPublishedHistoryNote(
  input: { mode?: string | null },
  options: { relisted?: boolean } = {}
) {
  const modeLabel = formatMarketingModeLabel(input.mode);
  return `Barang dipublikasikan${options.relisted ? " kembali" : ""} ke katalog sebagai sesi ${modeLabel}.`;
}

function isGenericCatalogPublishNote(note: string | null | undefined) {
  return /^Barang dipublikasikan ke katalog\.?$/iu.test(String(note ?? "").trim());
}

function normalizeHistoryNote(note: string | null | undefined) {
  const value = String(note ?? "").trim();
  const legacyCollateralDeadline = /^Barang hasil input gadai dicatat sebagai barang jaminan unit dengan jatuh tempo (.+?)\.?$/iu.exec(value);

  if (legacyCollateralDeadline) {
    const deadline = new Date(legacyCollateralDeadline[1]);

    if (!Number.isNaN(deadline.getTime())) {
      return `Barang hasil input gadai dicatat sebagai barang jaminan unit. Jatuh tempo pada ${formatAppDateTime(deadline)}.`;
    }
  }
  const repairRelistNote = parseRepairRelistHistoryNote(value);

  if (repairRelistNote) {
    return formatRejectedRelistHistoryNote(repairRelistNote);
  }

  return value
    .replace(/\s+Barang otomatis dipasarkan ulang ke katalog pada iterasi berikutnya\.?$/iu, "")
    .replace(/\s+Barang dipasarkan ulang otomatis ke iterasi\s+\d+\.?$/iu, "")
    .replace(/\s+iterasi\s+\d+(?=\.)/giu, "")
    .replace(/\bVickrey Auction\b/giu, "Lelang Tertutup")
    .replace(/\bVickrey\b/giu, "Lelang Tertutup");
}

function normalizeHistoryActorName(actorName: string | null | undefined) {
  const value = String(actorName ?? "").trim();

  if (!value || /^repair db(?:\s+production)?$/iu.test(value)) {
    return "Sistem Otomatis";
  }

  return value;
}

function normalizeHistoryNoteForComparison(note: string) {
  return normalizeHistoryNote(note).toLowerCase().replace(/\s+/gu, " ").trim();
}

function createSyntheticHistoryEntry(
  source: AdminBarangTimelineSourceRow,
  input: {
    id: string;
    actionKey: AdminBarangHistoryEntry["actionKey"];
    actionLabel: string;
    actionTone: AdminBarangHistoryEntry["actionTone"];
    note: string;
    actorName?: string | null;
    actorRole?: string | null;
    createdAt: Date;
  }
): AdminBarangHistoryEntry {
  return {
    id: input.id,
    barangId: source.barangId,
    barangCode: source.barangCode,
    barangName: source.barangName,
    category: source.category,
    condition: source.condition,
    description: source.description,
    specifications: source.specifications,
    ownerName: source.ownerName,
    customerNumber: source.customerNumber,
    actionKey: input.actionKey,
    actionLabel: input.actionLabel,
    actionTone: input.actionTone,
    note: normalizeHistoryNote(input.note),
    actorName: normalizeHistoryActorName(input.actorName),
    actorRole: input.actorRole ?? null,
    createdAt: input.createdAt.toISOString(),
    createdAtLabel: formatAppDateTime(input.createdAt)
  };
}

function hasNearbyHistoryEntry(
  entries: AdminBarangHistoryEntry[],
  candidate: Pick<AdminBarangHistoryEntry, "actionKey" | "barangId" | "createdAt">
) {
  const candidateTime = new Date(candidate.createdAt).getTime();

  return entries.some((entry) => {
    if (entry.barangId !== candidate.barangId || entry.actionKey !== candidate.actionKey) {
      return false;
    }

    const entryTime = new Date(entry.createdAt).getTime();

    return Math.abs(entryTime - candidateTime) <= 60_000;
  });
}

function hasDuplicateHistoryEntry(
  entries: AdminBarangHistoryEntry[],
  candidate: Pick<AdminBarangHistoryEntry, "actionKey" | "barangId" | "createdAt" | "note">
) {
  const candidateTime = new Date(candidate.createdAt).getTime();
  const candidateNote = normalizeHistoryNoteForComparison(candidate.note);

  return entries.some((entry) => {
    if (entry.barangId !== candidate.barangId || entry.actionKey !== candidate.actionKey) {
      return false;
    }

    if (normalizeHistoryNoteForComparison(entry.note) !== candidateNote) {
      return false;
    }

    const entryTime = new Date(entry.createdAt).getTime();

    return Math.abs(entryTime - candidateTime) <= 60_000;
  });
}

function getNextMarketingStartById(rows: AdminBarangMarketingTimelineRow[]) {
  const groupedRows = rows.reduce((map, row) => {
    const collection = map.get(row.barangId) ?? [];
    collection.push(row);
    map.set(row.barangId, collection);
    return map;
  }, new Map<string, AdminBarangMarketingTimelineRow[]>());
  const nextMarketingStartById = new Map<string, Date | null>();

  for (const collection of groupedRows.values()) {
    const sortedRows = [...collection].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());

    sortedRows.forEach((row, index) => {
      nextMarketingStartById.set(row.marketingId, sortedRows[index + 1]?.createdAt ?? null);
    });
  }

  return nextMarketingStartById;
}

function getPreviousMarketingById(rows: AdminBarangMarketingTimelineRow[]) {
  const groupedRows = rows.reduce((map, row) => {
    const collection = map.get(row.barangId) ?? [];
    collection.push(row);
    map.set(row.barangId, collection);
    return map;
  }, new Map<string, AdminBarangMarketingTimelineRow[]>());
  const previousMarketingById = new Map<string, AdminBarangMarketingTimelineRow | null>();

  for (const collection of groupedRows.values()) {
    const sortedRows = [...collection].sort((left, right) => {
      const iterationDelta = Number(left.iteration ?? 0) - Number(right.iteration ?? 0);
      return iterationDelta || left.createdAt.getTime() - right.createdAt.getTime();
    });

    sortedRows.forEach((row, index) => {
      previousMarketingById.set(row.marketingId, sortedRows[index - 1] ?? null);
    });
  }

  return previousMarketingById;
}

function hasStatusFailureForMarketingWindow(
  entries: AdminBarangHistoryEntry[],
  row: AdminBarangMarketingTimelineRow,
  nextMarketingStartedAt: Date | null | undefined
) {
  const startedAt = row.createdAt.getTime();
  const nextStartedAt = nextMarketingStartedAt?.getTime() ?? Number.POSITIVE_INFINITY;

  return entries.some((entry) => {
    if (entry.barangId !== row.barangId || entry.actionKey !== "gagal") {
      return false;
    }

    const entryTime = new Date(entry.createdAt).getTime();

    return entryTime >= startedAt && entryTime <= nextStartedAt;
  });
}

function getRejectedFixedPriceTransactionTime(transaction: AdminBarangTransactionTimelineRow | undefined) {
  if (!transaction || transaction.type !== "fixed_price" || transaction.status !== "ditolak_bukti") {
    return null;
  }

  return transaction.verifiedAt ?? transaction.updatedAt ?? transaction.createdAt;
}

function getRejectedFixedPriceRelistTimelineTime(marketingCreatedAt: Date, rejectedAt: Date) {
  const marketingTime = marketingCreatedAt.getTime();
  const rejectedTime = rejectedAt.getTime();

  if (marketingTime > rejectedTime && marketingTime - rejectedTime <= 60_000) {
    return marketingCreatedAt;
  }

  return new Date(rejectedTime + 1);
}

function getMarketingPublishContext(
  row: AdminBarangMarketingTimelineRow,
  previousMarketingById: Map<string, AdminBarangMarketingTimelineRow | null>,
  latestTransactionByMarketingId: Map<string, AdminBarangTransactionTimelineRow>
) {
  if (row.mode !== "fixed_price") {
    return {
      actorName: row.actorName,
      actorRole: row.actorRole,
      createdAt: row.createdAt,
      relisted: false
    };
  }

  const previousMarketing = previousMarketingById.get(row.marketingId);
  if (!previousMarketing || previousMarketing.mode !== "fixed_price") {
    return {
      actorName: row.actorName,
      actorRole: row.actorRole,
      createdAt: row.createdAt,
      relisted: false
    };
  }

  const rejectedTransaction = latestTransactionByMarketingId.get(previousMarketing.marketingId);
  const rejectedAt = getRejectedFixedPriceTransactionTime(rejectedTransaction);

  if (!rejectedAt) {
    return {
      actorName: row.actorName,
      actorRole: row.actorRole,
      createdAt: row.createdAt,
      relisted: false
    };
  }

  return {
    actorName: null,
    actorRole: null,
    createdAt: getRejectedFixedPriceRelistTimelineTime(row.createdAt, rejectedAt),
    relisted: true
  };
}

function getSameMomentTimelineOrder(entry: AdminBarangHistoryEntry) {
  if (entry.actionKey === "dipasarkan" && /\bdipublikasikan kembali\b/iu.test(entry.note)) {
    return 0;
  }

  const actionOrder: Record<AdminBarangHistoryEntry["actionKey"], number> = {
    gagal: 1,
    terjual: 2,
    ditebus: 3,
    perpanjangan: 4,
    dipasarkan: 5,
    input_baru: 6
  };

  return actionOrder[entry.actionKey];
}

function findNearbyMarketingRow(
  rows: AdminBarangMarketingTimelineRow[],
  input: Pick<AdminBarangHistoryEntry, "barangId"> & { createdAt: Date }
) {
  const inputTime = input.createdAt.getTime();

  return rows
    .filter((row) => row.barangId === input.barangId)
    .map((row) => ({
      distance: Math.abs(row.createdAt.getTime() - inputTime),
      row
    }))
    .filter((candidate) => candidate.distance <= 60_000)
    .sort((left, right) => left.distance - right.distance)[0]?.row;
}

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

function alignStaleInitialHistoryDates(
  entries: AdminBarangHistoryEntry[],
  marketingRows: AdminBarangMarketingTimelineRow[]
) {
  const firstMarketingAtByBarang = new Map<string, Date>();

  for (const row of marketingRows) {
    const current = firstMarketingAtByBarang.get(row.barangId);
    if (!current || row.createdAt < current) {
      firstMarketingAtByBarang.set(row.barangId, row.createdAt);
    }
  }

  return entries.map((entry) => {
    if (entry.actionKey !== "input_baru") {
      return entry;
    }

    const firstMarketingAt = firstMarketingAtByBarang.get(entry.barangId);
    const inputAt = new Date(entry.createdAt);
    if (
      !firstMarketingAt ||
      firstMarketingAt.getTime() - inputAt.getTime() <= TEN_DAYS_MS
    ) {
      return entry;
    }

    const alignedAt = new Date(firstMarketingAt.getTime() - TEN_DAYS_MS);
    return {
      ...entry,
      createdAt: alignedAt.toISOString(),
      createdAtLabel: formatAppDateTime(alignedAt)
    };
  });
}

export async function listAdminBarang(unitId: string) {
  const rows = await db
    .select()
    .from(barang)
    .where(and(eq(barang.unitId, unitId), inArray(barang.status, ["gadai", "jaminan"])))
    .orderBy(desc(barang.createdAt));
  const inventoryRows = rows.filter((item) => ["gadai", "jaminan"].includes(item.status));

  if (inventoryRows.length === 0) {
    return [];
  }

  const ids = inventoryRows.map((item) => item.id);
  const mediaCounts = await db
    .select({
      barangId: mediaBarang.barangId,
      count: sql<number>`count(*)`
    })
    .from(mediaBarang)
    .where(inArray(mediaBarang.barangId, ids))
    .groupBy(mediaBarang.barangId);
  const mediaRows = await db
    .select({
      barangId: mediaBarang.barangId,
      type: mediaBarang.type,
      url: mediaBarang.url,
      sortOrder: mediaBarang.sortOrder
    })
    .from(mediaBarang)
    .where(inArray(mediaBarang.barangId, ids))
    .orderBy(mediaBarang.barangId, mediaBarang.sortOrder);
  const activeMarketing = await db
    .select()
    .from(pemasaran)
    .where(and(inArray(pemasaran.barangId, ids), eq(pemasaran.status, "aktif")));

  const mediaMap = new Map(mediaCounts.map((row) => [row.barangId, Number(row.count)]));
  const marketingMap = new Map(activeMarketing.map((row) => [row.barangId, row.mode]));
  const previewImageMap = new Map<string, string>();

  for (const media of mediaRows) {
    if (!isLikelyImageMedia(media) || previewImageMap.has(media.barangId)) {
      continue;
    }

    previewImageMap.set(media.barangId, media.url);
  }

  return inventoryRows.map((row) =>
    serializeAdminBarang(row, {
      mediaCount: mediaMap.get(row.id) ?? 0,
      marketingMode: marketingMap.get(row.id) ?? null,
      previewImageUrl: previewImageMap.get(row.id) ?? null
    })
  );
}

export async function listAdminBarangHistory(
  unitId: string,
  limit?: number,
  barangId?: string
): Promise<AdminBarangHistoryEntry[]> {
  const historyWhere = barangId
    ? and(eq(barang.unitId, unitId), eq(barang.id, barangId))
    : eq(barang.unitId, unitId);
  const marketingCreator = alias(users, "marketing_creator");
  const transactionVerifier = alias(users, "transaction_verifier");

  const [statusRows, extensionRows, marketingRows, transactionRows] = await Promise.all([
    db
      .select({
        id: riwayatStatusBarang.id,
        barangId: barang.id,
        barangCode: barang.code,
        barangName: barang.name,
        category: barang.category,
        condition: barang.condition,
        description: barang.description,
        specifications: barang.specifications,
        ownerName: barang.ownerName,
        customerNumber: barang.customerNumber,
        oldStatus: riwayatStatusBarang.oldStatus,
        newStatus: riwayatStatusBarang.newStatus,
        note: riwayatStatusBarang.note,
        createdAt: riwayatStatusBarang.createdAt,
        actorName: users.name,
        actorRole: users.role
      })
      .from(riwayatStatusBarang)
      .innerJoin(barang, eq(barang.id, riwayatStatusBarang.barangId))
      .leftJoin(users, eq(users.id, riwayatStatusBarang.changedByUserId))
      .where(historyWhere)
      .orderBy(desc(riwayatStatusBarang.createdAt)),
    db
      .select({
        id: riwayatPerpanjangan.id,
        barangId: barang.id,
        barangCode: barang.code,
        barangName: barang.name,
        category: barang.category,
        condition: barang.condition,
        description: barang.description,
        specifications: barang.specifications,
        ownerName: barang.ownerName,
        customerNumber: barang.customerNumber,
        note: riwayatPerpanjangan.note,
        createdAt: riwayatPerpanjangan.createdAt,
        actorName: users.name,
        actorRole: users.role
      })
      .from(riwayatPerpanjangan)
      .innerJoin(barang, eq(barang.id, riwayatPerpanjangan.barangId))
      .leftJoin(users, eq(users.id, riwayatPerpanjangan.extendedByUserId))
      .where(historyWhere)
      .orderBy(desc(riwayatPerpanjangan.createdAt)),
    db
      .select({
        marketingId: pemasaran.id,
        barangId: barang.id,
        barangCode: barang.code,
        barangName: barang.name,
        category: barang.category,
        condition: barang.condition,
        description: barang.description,
        specifications: barang.specifications,
        ownerName: barang.ownerName,
        customerNumber: barang.customerNumber,
        mode: pemasaran.mode,
        status: pemasaran.status,
        iteration: pemasaran.iteration,
        createdAt: pemasaran.createdAt,
        updatedAt: pemasaran.updatedAt,
        endsAt: pemasaran.endsAt,
        actorName: marketingCreator.name,
        actorRole: marketingCreator.role,
        bidCount: sql<number>`count(${bids.id})`
      })
      .from(pemasaran)
      .innerJoin(barang, eq(barang.id, pemasaran.barangId))
      .leftJoin(marketingCreator, eq(marketingCreator.id, pemasaran.createdByUserId))
      .leftJoin(bids, eq(bids.pemasaranId, pemasaran.id))
      .where(historyWhere)
      .groupBy(pemasaran.id, barang.id, marketingCreator.name, marketingCreator.role)
      .orderBy(desc(pemasaran.createdAt)),
    db
      .select({
        marketingId: pemasaran.id,
        barangId: barang.id,
        barangCode: barang.code,
        barangName: barang.name,
        category: barang.category,
        condition: barang.condition,
        description: barang.description,
        specifications: barang.specifications,
        ownerName: barang.ownerName,
        customerNumber: barang.customerNumber,
        type: transaksi.type,
        status: transaksi.status,
        rejectionReason: transaksi.rejectionReason,
        createdAt: transaksi.createdAt,
        updatedAt: transaksi.updatedAt,
        verifiedAt: transaksi.verifiedAt,
        completedAt: transaksi.completedAt,
        paymentDeadline: transaksi.paymentDeadline,
        actorName: transactionVerifier.name,
        actorRole: transactionVerifier.role
      })
      .from(transaksi)
      .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
      .innerJoin(barang, eq(barang.id, pemasaran.barangId))
      .leftJoin(transactionVerifier, eq(transactionVerifier.id, transaksi.verifiedByUserId))
      .where(historyWhere)
      .orderBy(desc(transaksi.createdAt))
  ]);

  const latestTransactionByMarketingId = transactionRows.reduce((map, row) => {
    if (!map.has(row.marketingId)) {
      map.set(row.marketingId, row);
    }

    return map;
  }, new Map<string, AdminBarangTransactionTimelineRow>());
  const previousMarketingById = getPreviousMarketingById(marketingRows);
  const normalizedStatusRows: AdminBarangHistoryEntry[] = [];

  for (const row of statusRows) {
    const action = mapStatusHistoryAction(row.oldStatus, row.newStatus);
    if (!action) {
      continue;
    }

    const repairRelistNote = parseRepairRelistHistoryNote(row.note);
    if (repairRelistNote) {
      continue;
    }

    const publishedMarketing =
      action.actionKey === "dipasarkan" && isGenericCatalogPublishNote(row.note)
        ? findNearbyMarketingRow(marketingRows, {
            barangId: row.barangId,
            createdAt: row.createdAt
          })
        : null;
    const entry = {
      id: row.id,
      barangId: row.barangId,
      barangCode: row.barangCode,
      barangName: row.barangName,
      category: row.category,
      condition: row.condition,
      description: row.description,
      specifications: row.specifications,
      ownerName: row.ownerName,
      customerNumber: row.customerNumber,
      actionKey: action.actionKey,
      actionLabel: action.actionLabel,
      actionTone: action.actionTone,
      note: publishedMarketing ? formatMarketingPublishedHistoryNote(publishedMarketing) : normalizeHistoryNote(row.note),
      actorName: normalizeHistoryActorName(row.actorName),
      actorRole: row.actorRole,
      createdAt: row.createdAt.toISOString(),
      createdAtLabel: formatAppDateTime(row.createdAt)
    };

    if (!hasDuplicateHistoryEntry(normalizedStatusRows, entry)) {
      normalizedStatusRows.push(entry);
    }
  }

  const normalizedExtensionRows = extensionRows.map((row) => ({
    id: row.id,
    barangId: row.barangId,
    barangCode: row.barangCode,
    barangName: row.barangName,
    category: row.category,
    condition: row.condition,
    description: row.description,
    specifications: row.specifications,
    ownerName: row.ownerName,
    customerNumber: row.customerNumber,
    actionKey: "perpanjangan" as const,
    actionLabel: "Diperpanjang",
    actionTone: "warning" as const,
    note: normalizeHistoryNote(row.note || "Tanggal jatuh tempo barang diperpanjang sebelum pemasaran."),
    actorName: normalizeHistoryActorName(row.actorName),
    actorRole: row.actorRole,
    createdAt: row.createdAt.toISOString(),
    createdAtLabel: formatAppDateTime(row.createdAt)
  }));

  const timelineEntries = [...normalizedStatusRows, ...normalizedExtensionRows];
  const nextMarketingStartById = getNextMarketingStartById(marketingRows);

  for (const row of marketingRows) {
    const publishContext = getMarketingPublishContext(row, previousMarketingById, latestTransactionByMarketingId);
    const marketingEntry = createSyntheticHistoryEntry(row, {
      id: `marketing-${row.marketingId}`,
      actionKey: "dipasarkan",
      actionLabel: "Dipasarkan",
      actionTone: "success",
      note: formatMarketingPublishedHistoryNote(row, {
        relisted: publishContext.relisted
      }),
      actorName: publishContext.actorName,
      actorRole: publishContext.actorRole,
      createdAt: publishContext.createdAt
    });

    if (!hasNearbyHistoryEntry(timelineEntries, marketingEntry)) {
      timelineEntries.push(marketingEntry);
    }

    const transaction = latestTransactionByMarketingId.get(row.marketingId);

    if (transaction && ["lunas", "selesai"].includes(transaction.status)) {
      const soldEntry = createSyntheticHistoryEntry(row, {
        id: `transaction-sold-${row.marketingId}`,
        actionKey: "terjual",
        actionLabel: "Terjual",
        actionTone: "success",
        note:
          transaction.type === "vickrey"
            ? "Pemenang Lelang Tertutup menyelesaikan pembayaran dan barang tercatat terjual."
            : "Pembayaran harga tetap disetujui admin unit sehingga barang tercatat terjual.",
        actorName: transaction.actorName,
        actorRole: transaction.actorRole,
        createdAt: transaction.verifiedAt ?? transaction.completedAt ?? transaction.updatedAt ?? transaction.createdAt
      });

      if (!hasNearbyHistoryEntry(timelineEntries, soldEntry)) {
        timelineEntries.push(soldEntry);
      }

      continue;
    }

    if (transaction?.status === "ditolak_bukti") {
      const nextMarketingStartedAt = nextMarketingStartById.get(row.marketingId);

      if (hasStatusFailureForMarketingWindow(timelineEntries, row, nextMarketingStartedAt)) {
        continue;
      }

      const failedEntry = createSyntheticHistoryEntry(row, {
        id: `transaction-failed-${row.marketingId}`,
        actionKey: "gagal",
        actionLabel: "Gagal",
        actionTone: "danger",
        note: transaction.rejectionReason
          ? `Verifikasi bukti pembayaran harga tetap ditolak admin unit. Alasan: ${appendSentencePeriod(transaction.rejectionReason)}`
          : "Verifikasi bukti pembayaran harga tetap ditolak admin unit.",
        actorName: transaction.actorName,
        actorRole: transaction.actorRole,
        createdAt: transaction.verifiedAt ?? transaction.updatedAt ?? transaction.createdAt
      });

      if (!hasNearbyHistoryEntry(timelineEntries, failedEntry)) {
        timelineEntries.push(failedEntry);
      }

      continue;
    }

    if (row.status !== "gagal") {
      continue;
    }

    const nextMarketingStartedAt = nextMarketingStartById.get(row.marketingId);

    if (hasStatusFailureForMarketingWindow(timelineEntries, row, nextMarketingStartedAt)) {
      continue;
    }

    const failedEntry = createSyntheticHistoryEntry(row, {
      id: `marketing-failed-${row.marketingId}`,
      actionKey: "gagal",
      actionLabel: "Gagal",
      actionTone: "danger",
      note:
        row.mode === "vickrey"
          ? row.bidCount > 0
            ? "Pemenang Lelang Tertutup tidak menyelesaikan pembayaran dalam 24 jam sehingga sesi dinyatakan gagal."
            : "Sesi Lelang Tertutup berakhir tanpa penawar sehingga barang masuk status gagal."
          : "Sesi Harga Tetap ditutup sebagai pemasaran gagal dan membutuhkan tindak lanjut unit.",
      actorName: transaction?.actorName,
      actorRole: transaction?.actorRole,
      createdAt: transaction?.paymentDeadline ?? transaction?.updatedAt ?? row.updatedAt ?? row.endsAt ?? row.createdAt
    });

    if (!hasNearbyHistoryEntry(timelineEntries, failedEntry)) {
      timelineEntries.push(failedEntry);
    }
  }

  const sortedHistory = alignStaleInitialHistoryDates(
    timelineEntries,
    marketingRows
  ).sort((left, right) => {
    const timeDelta = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    return timeDelta || getSameMomentTimelineOrder(left) - getSameMomentTimelineOrder(right);
  });

  return typeof limit === "number" ? sortedHistory.slice(0, limit) : sortedHistory;
}

export async function getAdminBarangById(unitId: string, barangId: string) {
  const row = await assertBarangForUnit(barangId, unitId);
  const media = await db.select().from(mediaBarang).where(eq(mediaBarang.barangId, barangId)).orderBy(mediaBarang.sortOrder);
  const resolvedMedia = media.length
    ? media
    : resolveViolationItemMedia({ itemName: row.name, media: [] });
  const [activeMarketing] = await db
    .select()
    .from(pemasaran)
    .where(and(eq(pemasaran.barangId, barangId), eq(pemasaran.status, "aktif")))
    .limit(1);
  const [latestMarketing] = await db
    .select()
    .from(pemasaran)
    .where(eq(pemasaran.barangId, barangId))
    .orderBy(desc(pemasaran.iteration), desc(pemasaran.createdAt))
    .limit(1);

  return {
    ...serializeAdminBarang(row, {
      mediaCount: resolvedMedia.length,
      marketingIteration: latestMarketing?.iteration ?? null,
      marketingMode: activeMarketing?.mode ?? latestMarketing?.mode ?? null,
      previewImageUrl: resolvedMedia.find(isLikelyImageMedia)?.url ?? null
    }),
    activeMarketingId: activeMarketing?.mode === "fixed_price" ? activeMarketing.id : null,
    marketingPrice: activeMarketing?.mode === "fixed_price" ? Number(activeMarketing.price ?? 0) : null,
    media: resolvedMedia
  };
}

export async function createAdminBarang(
  unitId: string,
  userId: string,
  input: Parameters<typeof validateAdminBarangPayload>[0] & { media?: unknown }
) {
  const payload = validateAdminBarangPayload(input);
  const media = validateAdminBarangMediaList(input.media);
  const dueDate = new Date(payload.dueAt);

  const created = await db.transaction(async (tx) => {
    const [unit] = await tx
      .select({ code: units.code })
      .from(units)
      .where(eq(units.id, unitId))
      .limit(1);

    if (!unit) {
      throw new Error("Unit barang belum ditemukan.");
    }

    const sequenceResult = await tx.execute<{ value: string }>(
      sql`select nextval('barang_sbg_number_seq')::text as value`,
    );
    const sequenceValue = sequenceResult.rows[0]?.value;

    if (!sequenceValue) {
      throw new Error("Nomor SBG belum dapat dibuat.");
    }

    const code = formatSbgCode(unit.code, sequenceValue);

    const [createdBarang] = await tx
      .insert(barang)
      .values({
        id: crypto.randomUUID(),
        unitId,
        code,
        name: payload.name,
        category: payload.category,
        condition: payload.condition,
        description: payload.description,
        specifications: payload.specifications,
        appraisalValue: payload.appraisalValue,
        ownerName: payload.ownerName,
        customerNumber: payload.customerNumber,
        pawnedAt: toUtcDate(payload.pawnedAt),
        dueDate,
        status: "jaminan",
        createdByUserId: userId
      })
      .returning();

    await tx.insert(riwayatStatusBarang).values({
      id: crypto.randomUUID(),
      barangId: createdBarang.id,
      oldStatus: null,
      newStatus: "jaminan",
      changedByUserId: userId,
        note: `Barang hasil input gadai dicatat sebagai barang jaminan unit. Jatuh tempo pada ${formatAppDateTime(dueDate)}.`
    });

    if (media.length > 0) {
      await tx.insert(mediaBarang).values(
        media.map((item, index) => ({
          id: crypto.randomUUID(),
          barangId: createdBarang.id,
          type: item.type,
          url: item.url,
          fileName: item.fileName,
          sizeBytes: item.sizeBytes,
          sortOrder: item.sortOrder ?? index
        }))
      );
    }

    return createdBarang;
  });

  return serializeAdminBarang(created);
}

export async function updateAdminBarang(
  unitId: string,
  barangId: string,
  _input: AdminBarangUpdateInput,
  _mediaChanges?: AdminBarangMediaChangesInput
) {
  await assertBarangForUnit(barangId, unitId);
  throw new Error("Data barang tidak dapat diubah setelah masuk ke kelola barang.");
}

export async function extendAdminBarang(unitId: string, userId: string, barangId: string, input: { newDueDate?: unknown; note?: unknown }) {
  const current = await assertBarangForUnit(barangId, unitId);
  if (current.status !== "gadai" && current.status !== "jaminan") {
    throw new Error("Perpanjangan hanya bisa dilakukan sebelum barang dipasarkan.");
  }
  if (current.dueDate.getTime() <= Date.now()) {
    throw new Error("Perpanjangan tidak dapat dilakukan setelah jatuh tempo. Barang siap dipasarkan.");
  }

  const payload = validatePerpanjanganPayload(input, current.dueDate.toISOString().slice(0, 10));
  const newDueDate = toUtcDate(payload.newDueDate);

  await db.insert(riwayatPerpanjangan).values({
    id: crypto.randomUUID(),
    barangId,
    oldDueDate: current.dueDate,
    newDueDate,
    note: payload.note,
    extendedByUserId: userId
  });

  const [updated] = await db
    .update(barang)
    .set({ dueDate: newDueDate, updatedAt: new Date() })
    .where(eq(barang.id, barangId))
    .returning();

  await recordStatusChange({
    barangId,
    oldStatus: current.status,
    newStatus: current.status,
    userId,
    note: "Tanggal jatuh tempo barang diperpanjang sebelum pemasaran."
  });

  return serializeAdminBarang(updated);
}

export async function redeemAdminBarang(unitId: string, userId: string, barangId: string, input: { reference?: unknown; redeemedAt?: unknown }) {
  const current = await assertBarangForUnit(barangId, unitId);
  if (current.status !== "gadai" && current.status !== "jaminan") {
    throw new Error("Penebusan hanya bisa dicatat sebelum barang dipasarkan.");
  }
  if (current.dueDate.getTime() <= Date.now()) {
    throw new Error("Penebusan tidak dapat dilakukan setelah jatuh tempo. Barang siap dipasarkan.");
  }

  const payload = validateTebusPayload(input);
  const [updated] = await db
    .update(barang)
    .set({
      status: "ditebus",
      redeemedAt: toUtcDate(payload.redeemedAt),
      redemptionReference: payload.reference,
      updatedAt: new Date()
    })
    .where(eq(barang.id, barangId))
    .returning();

  await recordStatusChange({
    barangId,
    oldStatus: current.status,
    newStatus: "ditebus",
    userId,
    note: "Barang ditebus oleh nasabah."
  });

  return serializeAdminBarang(updated);
}

export async function convertAdminBarangToJaminan(unitId: string, userId: string, barangId: string) {
  const current = await assertBarangForUnit(barangId, unitId);
  if (current.status !== "gadai") {
    throw new Error("Hanya barang gadai yang bisa dipindahkan menjadi jaminan.");
  }

  if (current.dueDate.getTime() > Date.now()) {
    throw new Error("Barang baru bisa menjadi jaminan setelah melewati tanggal jatuh tempo.");
  }

  const [updated] = await db
    .update(barang)
    .set({ status: "jaminan", updatedAt: new Date() })
    .where(eq(barang.id, barangId))
    .returning();

  await recordStatusChange({
    barangId,
    oldStatus: current.status,
    newStatus: "jaminan",
    userId,
    note: "Barang dipindahkan menjadi aset jaminan unit."
  });

  return serializeAdminBarang(updated);
}

export async function addAdminBarangMedia(
  unitId: string,
  barangId: string,
  input: { type?: string; url?: string; fileName?: string; sizeBytes?: number; sortOrder?: number }
) {
  const [created] = await addAdminBarangMediaBatch(unitId, barangId, [input]);
  return created;
}

export async function addAdminBarangMediaBatch(
  unitId: string,
  barangId: string,
  input: Array<{ type?: string; url?: string; fileName?: string; sizeBytes?: number; sortOrder?: number }>
) {
  await assertBarangForUnit(barangId, unitId);
  const [{ count }] = await db
    .select({
      count: sql<number>`count(*)`
    })
    .from(mediaBarang)
    .where(eq(mediaBarang.barangId, barangId));

  if (Number(count) + input.length > ADMIN_BARANG_MEDIA_LIMIT) {
    throw new Error(`Maksimal ${ADMIN_BARANG_MEDIA_LIMIT} foto atau video untuk satu barang.`);
  }

  const media = validateAdminBarangMediaList(input).map((item, index) => ({
    ...item,
    sortOrder: Number(count) + index
  }));

  const created = await db
    .insert(mediaBarang)
    .values(
      media.map((item) => ({
        id: crypto.randomUUID(),
        barangId,
        type: item.type,
        url: item.url,
        fileName: item.fileName,
        sizeBytes: item.sizeBytes,
        sortOrder: item.sortOrder
      }))
    )
    .returning();

  return created;
}

export async function deleteAdminBarangMedia(unitId: string, barangId: string, mediaId: string) {
  await assertBarangForUnit(barangId, unitId);
  const [deleted] = await db
    .delete(mediaBarang)
    .where(and(eq(mediaBarang.id, mediaId), eq(mediaBarang.barangId, barangId)))
    .returning();

  if (!deleted) {
    throw new Error("Media barang tidak ditemukan.");
  }

  return deleted;
}
