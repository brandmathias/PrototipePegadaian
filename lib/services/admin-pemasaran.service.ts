import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { serializeAdminPemasaran } from "@/lib/admin-unit/serializers";
import { validatePemasaranPayload } from "@/lib/admin-unit/validation";
import { FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES } from "@/lib/buyer/fixed-price-visibility";
import type { LotInsights } from "@/lib/contracts/catalog";
import { db } from "@/lib/db/client";
import { barang, bids, mediaBarang, pemasaran, riwayatStatusBarang, transaksi, units, users } from "@/lib/db/schema";
import { processExpiredVickreyAuctions } from "@/lib/services/cron.service";
import { EMPTY_LOT_INSIGHTS, getLotStatsByIds } from "@/lib/services/public-lot-stats.service";

const transactionHandoverUploader = alias(users, "marketing_transaction_handover_uploader");
const transactionPaymentVerifier = alias(users, "marketing_transaction_payment_verifier");

type ParticipantPreview = {
  bidderId: string;
  bidderName: string;
  bidderImage?: string | null;
  submittedAt?: Date | null;
};

type AdminMarketingBidRow = {
  bid: {
    id: string;
    userId: string;
    nominal: string;
    createdAt: Date;
  };
  bidderName: string | null;
  bidderImage?: string | null;
};

type MarketingRecencyRow = {
  marketing: {
    updatedAt?: Date | null;
    createdAt?: Date | null;
    startsAt?: Date | null;
    iteration?: number | null;
  };
};

function getMarketingRecencyTimestamp(row: MarketingRecencyRow) {
  const value = row.marketing.updatedAt ?? row.marketing.createdAt ?? row.marketing.startsAt;
  const time = value instanceof Date ? value.getTime() : Number.NaN;

  return Number.isFinite(time) ? time : 0;
}

export function sortAdminMarketingRowsByRecency<T extends MarketingRecencyRow>(rows: T[]) {
  return [...rows].sort((left, right) => {
    const timeDiff = getMarketingRecencyTimestamp(right) - getMarketingRecencyTimestamp(left);
    if (timeDiff !== 0) {
      return timeDiff;
    }

    const leftIteration = Number.isFinite(left.marketing.iteration) ? Number(left.marketing.iteration) : 0;
    const rightIteration = Number.isFinite(right.marketing.iteration) ? Number(right.marketing.iteration) : 0;
    return rightIteration - leftIteration;
  });
}

type MarketingInsightRow = {
  id: string;
  mode?: string | null;
};

type AdminMarketingTransactionSummary = {
  id?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  buyerNationalId?: string | null;
  paymentMethod?: string | null;
  status?: string | null;
  proofUrl?: string | null;
  rejectionReason?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  handoverProofUrl?: string | null;
  handoverProofUploadedAt?: Date | null;
  handoverProofUploadedBy?: string | null;
  reference?: string | null;
  soldAt?: Date | null;
  paymentDeadline?: Date | null;
  completedAt?: Date | null;
  completionSource?: string | null;
  transactionCreatedAt?: Date | null;
};

const ADMIN_MARKETING_TRANSACTION_PRIORITY: Record<string, number> = {
  selesai: 5,
  lunas: 4,
  bukti_diunggah: 3,
  ditolak_bukti: 3,
  menunggu_konfirmasi_langsung: 2
};

function getAdminMarketingTransactionPriority(status?: string | null) {
  return ADMIN_MARKETING_TRANSACTION_PRIORITY[String(status ?? "").toLowerCase()] ?? 0;
}

function getAdminMarketingTransactionTime(transaction: AdminMarketingTransactionSummary) {
  const time = transaction.transactionCreatedAt instanceof Date ? transaction.transactionCreatedAt.getTime() : Number.NaN;
  return Number.isFinite(time) ? time : 0;
}

function shouldUseAdminMarketingTransaction(
  current: AdminMarketingTransactionSummary | undefined,
  candidate: AdminMarketingTransactionSummary
) {
  if (!current) {
    return true;
  }

  const priorityDiff =
    getAdminMarketingTransactionPriority(candidate.status) - getAdminMarketingTransactionPriority(current.status);

  if (priorityDiff !== 0) {
    return priorityDiff > 0;
  }

  return getAdminMarketingTransactionTime(candidate) > getAdminMarketingTransactionTime(current);
}

function normalizeMarketingInsights(insights?: LotInsights | null): LotInsights {
  return {
    likes: Number(insights?.likes ?? EMPTY_LOT_INSIGHTS.likes),
    participants: Number(insights?.participants ?? EMPTY_LOT_INSIGHTS.participants),
    views: Number(insights?.views ?? EMPTY_LOT_INSIGHTS.views)
  };
}

function sumMarketingInsights(values: Array<LotInsights | null | undefined>): LotInsights {
  return values.reduce<LotInsights>(
    (total, insights) => {
      const normalized = normalizeMarketingInsights(insights);

      return {
        likes: total.likes + normalized.likes,
        participants: total.participants + normalized.participants,
        views: total.views + normalized.views
      };
    },
    { ...EMPTY_LOT_INSIGHTS }
  );
}

function isFixedPriceMarketingMode(mode?: string | null) {
  return mode === "fixed_price" || mode === "FIXED_PRICE";
}

export function resolveMarketingPerformanceInsights(
  marketingRows: MarketingInsightRow[],
  statsByPemasaranId: Map<string, LotInsights>
) {
  const uniqueRows = Array.from(new Map(marketingRows.filter((row) => row.id).map((row) => [row.id, row])).values());
  const fixedPriceAggregate = sumMarketingInsights(
    uniqueRows
      .filter((row) => isFixedPriceMarketingMode(row.mode))
      .map((row) => statsByPemasaranId.get(row.id))
  );

  return new Map(
    uniqueRows.map((row) => [
      row.id,
      isFixedPriceMarketingMode(row.mode)
        ? fixedPriceAggregate
        : normalizeMarketingInsights(statsByPemasaranId.get(row.id))
    ])
  );
}

async function getBarangForUnit(barangId: string, unitId: string) {
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

async function getLatestMarketingForBarang(barangId: string) {
  const [row] = await db
    .select({
      id: pemasaran.id,
      mode: pemasaran.mode,
      status: pemasaran.status
    })
    .from(pemasaran)
    .where(eq(pemasaran.barangId, barangId))
    .orderBy(desc(pemasaran.createdAt))
    .limit(1);

  return row ?? null;
}

async function getFixedPriceRemarketingLockCount(pemasaranId: string) {
  const [row] = await db
    .select({
      count: sql<number>`count(*)`
    })
    .from(transaksi)
    .where(
      and(
        eq(transaksi.pemasaranId, pemasaranId),
        inArray(transaksi.status, FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES)
      )
    );

  return Number(row?.count ?? 0);
}

async function getMarketingMediaByBarangIds(barangIds: string[]) {
  if (!barangIds.length) {
    return new Map<string, Array<{ id: string; type: string; url: string; fileName?: string }>>();
  }

  const rows = await db
    .select({
      id: mediaBarang.id,
      barangId: mediaBarang.barangId,
      type: mediaBarang.type,
      url: mediaBarang.url,
      fileName: mediaBarang.fileName,
      sortOrder: mediaBarang.sortOrder,
      createdAt: mediaBarang.createdAt
    })
    .from(mediaBarang)
    .where(inArray(mediaBarang.barangId, barangIds))
    .orderBy(asc(mediaBarang.sortOrder), asc(mediaBarang.createdAt));

  return rows.reduce((map, media) => {
    const collection = map.get(media.barangId) ?? [];
    collection.push({
      id: media.id,
      type: media.type,
      url: media.url,
      fileName: media.fileName
    });
    map.set(media.barangId, collection);
    return map;
  }, new Map<string, Array<{ id: string; type: string; url: string; fileName?: string }>>());
}

async function getLatestTransactionsByPemasaranIds(pemasaranIds: string[]) {
  if (!pemasaranIds.length) {
    return new Map<string, AdminMarketingTransactionSummary>();
  }

  const rows = await db
    .select({
      id: transaksi.id,
      pemasaranId: transaksi.pemasaranId,
      status: transaksi.status,
      paymentMethod: transaksi.paymentMethod,
      proofUrl: transaksi.proofUrl,
      rejectionReason: transaksi.rejectionReason,
      verifiedBy: sql<string | null>`coalesce(
        ${transactionPaymentVerifier.name},
        (
          select actor.name
          from riwayat_status_barang history
          inner join pemasaran history_marketing on history_marketing.barang_id = history.barang_id
          inner join "user" actor on actor.id = history.changed_by_user_id
          where history_marketing.id = ${transaksi.pemasaranId}
            and ${transaksi.status} = 'ditolak_bukti'
            and history.new_status = 'gagal'
            and history.note ilike 'Verifikasi bukti pembayaran harga tetap ditolak admin unit.%'
            and history.created_at >= ${transaksi.createdAt}
          order by history.created_at desc
          limit 1
        )
      )`,
      verifiedAt: transaksi.verifiedAt,
      updatedAt: transaksi.updatedAt,
      handoverProofUrl: transaksi.handoverProofUrl,
      handoverProofUploadedAt: transaksi.handoverProofUploadedAt,
      handoverProofUploadedBy: transactionHandoverUploader.name,
      reference: transaksi.referenceNumber,
      paymentDeadline: transaksi.paymentDeadline,
      completedAt: transaksi.completedAt,
      completionSource: transaksi.completionSource,
      buyerName: users.name,
      buyerEmail: users.email,
      buyerPhone: users.phoneNumber,
      buyerNationalId: users.nationalId,
      transactionCreatedAt: transaksi.createdAt
    })
    .from(transaksi)
    .innerJoin(users, eq(users.id, transaksi.userId))
    .leftJoin(transactionPaymentVerifier, eq(transactionPaymentVerifier.id, transaksi.verifiedByUserId))
    .leftJoin(transactionHandoverUploader, eq(transactionHandoverUploader.id, transaksi.handoverProofUploadedByUserId))
    .where(inArray(transaksi.pemasaranId, pemasaranIds))
    .orderBy(desc(transaksi.createdAt));

  return rows.reduce((map, row) => {
    const candidate = {
      id: row.id,
      buyerName: row.buyerName,
      buyerEmail: row.buyerEmail,
      buyerPhone: row.buyerPhone,
      buyerNationalId: row.buyerNationalId,
      paymentMethod: row.paymentMethod,
      status: row.status,
      proofUrl: row.proofUrl,
      rejectionReason: row.rejectionReason,
      verifiedBy: row.verifiedBy,
      verifiedAt: row.verifiedAt ?? (row.status === "ditolak_bukti" ? row.updatedAt : null),
      handoverProofUrl: row.handoverProofUrl,
      handoverProofUploadedAt: row.handoverProofUploadedAt,
      handoverProofUploadedBy: row.handoverProofUploadedBy,
      reference: row.reference,
      soldAt: row.status === "lunas" || row.status === "selesai" ? row.verifiedAt : null,
      paymentDeadline: row.paymentDeadline,
      completedAt: row.completedAt,
      completionSource: row.completionSource,
      transactionCreatedAt: row.transactionCreatedAt
    };

    if (shouldUseAdminMarketingTransaction(map.get(row.pemasaranId), candidate)) {
      map.set(row.pemasaranId, candidate);
    }
    return map;
  }, new Map<string, AdminMarketingTransactionSummary>());
}

async function getParticipantPreviewsByPemasaranIds(pemasaranIds: string[]) {
  if (!pemasaranIds.length) {
    return new Map<string, ParticipantPreview[]>();
  }

  const rows = await db
    .select({
      pemasaranId: bids.pemasaranId,
      bidderId: users.id,
      bidderName: users.name,
      bidderImage: users.image,
      createdAt: bids.createdAt
    })
    .from(bids)
    .innerJoin(users, eq(users.id, bids.userId))
    .where(inArray(bids.pemasaranId, pemasaranIds))
    .orderBy(asc(bids.createdAt));

  return rows.reduce(
    (map, row) => {
      const collection = map.get(row.pemasaranId) ?? [];
      const alreadyIncluded = collection.some((entry) => entry.bidderId === row.bidderId);

      if (!alreadyIncluded && collection.length < 10) {
        collection.push({
          bidderId: row.bidderId,
          bidderName: row.bidderName ?? "Peserta",
          bidderImage: row.bidderImage ?? null,
          submittedAt: row.createdAt
        });
        map.set(row.pemasaranId, collection);
      }

      return map;
    },
    new Map<string, ParticipantPreview[]>()
  );
}

async function getBidRowsByPemasaranIds(pemasaranIds: string[]) {
  if (!pemasaranIds.length) {
    return new Map<string, AdminMarketingBidRow[]>();
  }

  const rows = await db
    .select({
      pemasaranId: bids.pemasaranId,
      bid: {
        id: bids.id,
        userId: bids.userId,
        nominal: bids.nominal,
        createdAt: bids.createdAt
      },
      bidderName: users.name,
      bidderImage: users.image
    })
    .from(bids)
    .innerJoin(users, eq(users.id, bids.userId))
    .where(inArray(bids.pemasaranId, pemasaranIds))
    .orderBy(asc(bids.createdAt));

  return rows.reduce((map, row) => {
    const collection = map.get(row.pemasaranId) ?? [];
    collection.push({
      bid: row.bid,
      bidderName: row.bidderName,
      bidderImage: row.bidderImage ?? null
    });
    map.set(row.pemasaranId, collection);
    return map;
  }, new Map<string, AdminMarketingBidRow[]>());
}

export async function publishAdminBarang(unitId: string, userId: string, barangId: string, input: Parameters<typeof validatePemasaranPayload>[0]) {
  const item = await getBarangForUnit(barangId, unitId);
  const now = new Date();
  const latestMarketing = item.status === "dipasarkan" ? await getLatestMarketingForBarang(barangId) : null;
  const canRepublishFailedMarketing = item.status === "dipasarkan" && latestMarketing?.status === "gagal";
  const canRepublishActiveFixedPrice =
    item.status === "dipasarkan" &&
    latestMarketing?.status === "aktif" &&
    latestMarketing.mode === "fixed_price" &&
    (await getFixedPriceRemarketingLockCount(latestMarketing.id)) === 0;

  if (
    item.status !== "jaminan" &&
    item.status !== "gagal" &&
    item.status !== "gadai" &&
    !canRepublishFailedMarketing &&
    !canRepublishActiveFixedPrice
  ) {
    throw new Error("Barang hanya bisa dipasarkan dari status jaminan, gagal, atau sesi Harga Tetap aktif tanpa pembayaran yang mengunci katalog.");
  }

  if ((item.status === "jaminan" || item.status === "gadai") && item.dueDate.getTime() > now.getTime()) {
    throw new Error("Barang baru dapat dipasarkan setelah durasi jatuh tempo berakhir.");
  }

  const payload = validatePemasaranPayload(input);
  let derivedDurationDays: number | null = null;
  let derivedDurationSeconds: number | null = null;
  let endsAt: Date | null = null;

  if (payload.mode === "vickrey") {
    derivedDurationDays = Math.floor(payload.totalSeconds / 86_400);
    derivedDurationSeconds = payload.totalSeconds;
    endsAt = new Date(now.getTime() + payload.totalSeconds * 1000);
  }

  const [{ nextIteration }] = await db
    .select({
      nextIteration: sql<number>`coalesce(max(${pemasaran.iteration}), 0) + 1`
    })
    .from(pemasaran)
    .where(eq(pemasaran.barangId, barangId));

  const created = await db.transaction(async (tx) => {
    if (canRepublishActiveFixedPrice && latestMarketing) {
      await tx
        .update(pemasaran)
        .set({ status: "gagal", updatedAt: now })
        .where(
          and(eq(pemasaran.id, latestMarketing.id), eq(pemasaran.status, "aktif"), eq(pemasaran.mode, "fixed_price"))
        );
    }

    const [createdMarketing] = await tx
      .insert(pemasaran)
      .values({
        id: crypto.randomUUID(),
        barangId,
        mode: payload.mode,
        price: payload.mode === "fixed_price" ? payload.price : null,
        basePrice: payload.mode === "vickrey" ? payload.price : null,
        durationDays: derivedDurationDays,
        durationSeconds: derivedDurationSeconds,
        startsAt: now,
        endsAt,
        iteration: Number(nextIteration ?? 1),
        status: "aktif",
        createdByUserId: userId,
        updatedAt: now
      })
      .returning();

    await tx.update(barang).set({ status: "dipasarkan", updatedAt: new Date() }).where(eq(barang.id, barangId));
    await tx.insert(riwayatStatusBarang).values({
      id: crypto.randomUUID(),
      barangId,
      oldStatus: item.status,
      newStatus: "dipasarkan",
      changedByUserId: userId,
      note: canRepublishActiveFixedPrice
        ? "Sesi harga tetap lama ditutup dan barang dipublikasikan ulang ke katalog sebagai sesi Harga Tetap."
        : payload.mode === "fixed_price"
          ? "Barang dipublikasikan ke katalog sebagai sesi Harga Tetap."
          : "Barang dipublikasikan ke katalog sebagai sesi Lelang Tertutup."
    });

    return createdMarketing;
  });

  return serializeAdminPemasaran(created, {
    lotName: item.name,
    lotCode: item.code,
    lotCategory: item.category,
    lotCondition: item.condition,
    lotDescription: item.description,
    lotAppraisalValue: item.appraisalValue,
    lotSpecifications: item.specifications
  });
}

export async function listAdminPemasaran(unitId: string) {
  await processExpiredVickreyAuctions();

  const rows = await db
    .select({
      marketing: pemasaran,
      item: barang,
      unitName: units.name,
      unitAddress: units.address,
      bidCount: sql<number>`count(${bids.id})`,
      winnerName: users.name
    })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(bids, eq(bids.pemasaranId, pemasaran.id))
    .leftJoin(users, eq(users.id, pemasaran.winnerId))
    .where(eq(barang.unitId, unitId))
    .groupBy(pemasaran.id, barang.id, units.id, users.name)
    .orderBy(
      desc(sql<Date>`greatest(${pemasaran.updatedAt}, ${pemasaran.createdAt})`),
      desc(pemasaran.createdAt),
      desc(pemasaran.iteration)
    );

  const sortedRows = sortAdminMarketingRowsByRecency(rows);

  const [mediaByBarangId, transactionByPemasaranId, participantPreviewsByPemasaranId, statsByPemasaranId] = await Promise.all([
    getMarketingMediaByBarangIds(sortedRows.map((row) => row.item.id)),
    getLatestTransactionsByPemasaranIds(sortedRows.map((row) => row.marketing.id)),
    getParticipantPreviewsByPemasaranIds(sortedRows.map((row) => row.marketing.id)),
    getLotStatsByIds(sortedRows.map((row) => row.marketing.id))
  ]);

  return sortedRows.map((row) =>
    serializeAdminPemasaran(row.marketing, {
      lotName: row.item.name,
      lotCode: row.item.code,
      lotCategory: row.item.category,
      lotCondition: row.item.condition,
      lotDescription: row.item.description,
      lotAppraisalValue: row.item.appraisalValue,
      lotSpecifications: row.item.specifications,
      unitName: row.unitName,
      unitAddress: row.unitAddress,
      media: mediaByBarangId.get(row.item.id) ?? [],
      bidCount: Number(row.bidCount ?? 0),
      insights: statsByPemasaranId.get(row.marketing.id) ?? null,
      winnerName: row.winnerName ?? null,
      transaction: transactionByPemasaranId.get(row.marketing.id) ?? null,
      participantPreviews: participantPreviewsByPemasaranId.get(row.marketing.id) ?? []
    })
  );
}

export async function getAdminPemasaranById(unitId: string, pemasaranId: string) {
  await processExpiredVickreyAuctions();

  const [row] = await db
    .select({
      marketing: pemasaran,
      item: barang,
      unitName: units.name,
      unitAddress: units.address,
      bidCount: sql<number>`count(${bids.id})`,
      winnerName: users.name
    })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(bids, eq(bids.pemasaranId, pemasaran.id))
    .leftJoin(users, eq(users.id, pemasaran.winnerId))
    .where(and(eq(pemasaran.id, pemasaranId), eq(barang.unitId, unitId)))
    .groupBy(pemasaran.id, barang.id, units.id, users.name)
    .limit(1);

  if (!row) {
    throw new Error("Sesi pemasaran tidak ditemukan.");
  }

  const [mediaByBarangId, transactionByPemasaranId, participantPreviewsByPemasaranId, historyRows] = await Promise.all([
    getMarketingMediaByBarangIds([row.item.id]),
    getLatestTransactionsByPemasaranIds([row.marketing.id]),
    getParticipantPreviewsByPemasaranIds([row.marketing.id]),
    db
      .select({
        marketing: pemasaran,
        bidCount: sql<number>`count(${bids.id})`,
        winnerName: users.name
      })
      .from(pemasaran)
      .leftJoin(bids, eq(bids.pemasaranId, pemasaran.id))
      .leftJoin(users, eq(users.id, pemasaran.winnerId))
      .where(eq(pemasaran.barangId, row.item.id))
      .groupBy(pemasaran.id, users.name)
      .orderBy(
        desc(sql<Date>`greatest(${pemasaran.updatedAt}, ${pemasaran.createdAt})`),
        desc(pemasaran.createdAt),
        desc(pemasaran.iteration)
      )
  ]);

  const marketingInsightRows = [
    row.marketing,
    ...historyRows.map((history) => history.marketing)
  ];
  const uniqueMarketingIds = Array.from(new Set(marketingInsightRows.map((marketing) => marketing.id).filter(Boolean)));
  const vickreyMarketingIds = marketingInsightRows
    .filter((marketing) => marketing.mode === "vickrey")
    .map((marketing) => marketing.id);
  const [historyTransactionByPemasaranId, statsByPemasaranId, bidRowsByPemasaranId] = await Promise.all([
    getLatestTransactionsByPemasaranIds(historyRows.map((history) => history.marketing.id)),
    getLotStatsByIds(uniqueMarketingIds),
    getBidRowsByPemasaranIds(vickreyMarketingIds)
  ]);
  const insightsByPemasaranId = resolveMarketingPerformanceInsights(marketingInsightRows, statsByPemasaranId);

  const baseExtra = {
    lotName: row.item.name,
    lotCode: row.item.code,
    lotCategory: row.item.category,
    lotCondition: row.item.condition,
    lotDescription: row.item.description,
    lotAppraisalValue: row.item.appraisalValue,
    lotSpecifications: row.item.specifications,
    unitName: row.unitName,
    unitAddress: row.unitAddress
  };

  const iterationHistory = historyRows.map((history) =>
    serializeAdminPemasaran(history.marketing, {
      ...baseExtra,
      bidCount: Number(history.bidCount ?? 0),
      insights: insightsByPemasaranId.get(history.marketing.id) ?? null,
      winnerName: history.winnerName ?? null,
      transaction: historyTransactionByPemasaranId.get(history.marketing.id) ?? null,
      bids: bidRowsByPemasaranId.get(history.marketing.id) ?? []
    })
  );

  return {
    ...serializeAdminPemasaran(row.marketing, {
      ...baseExtra,
      media: mediaByBarangId.get(row.item.id) ?? [],
      bidCount: Number(row.bidCount ?? 0),
      insights: insightsByPemasaranId.get(row.marketing.id) ?? null,
      winnerName: row.winnerName ?? null,
      transaction: transactionByPemasaranId.get(row.marketing.id) ?? null,
      participantPreviews: participantPreviewsByPemasaranId.get(row.marketing.id) ?? [],
      bids: bidRowsByPemasaranId.get(row.marketing.id) ?? []
    }),
    iterationHistory
  };
}
