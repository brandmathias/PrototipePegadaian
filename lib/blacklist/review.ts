export const BLACKLIST_REVIEW_STATUSES = [
  "TERKIRIM",
  "DITINJAU_ADMIN_UNIT",
  "DITINJAU_SUPERADMIN",
  "DISETUJUI",
  "DITOLAK"
] as const;

export type BlacklistReviewStatus = (typeof BLACKLIST_REVIEW_STATUSES)[number];
export type BlacklistReviewDecision = Extract<BlacklistReviewStatus, "DISETUJUI" | "DITOLAK">;

export type BlacklistReviewReason = {
  code: string;
  label: string;
};

export type BlacklistReviewAttachmentInput = {
  fileUrl: string;
  fileName: string;
  mimeType: string;
};

export const BLACKLIST_REVIEW_APPROVAL_REASONS = [
  {
    code: "PAYMENT_PROOF_VALID",
    label: "Bukti pembayaran valid"
  },
  {
    code: "SYSTEM_OR_DATA_ERROR",
    label: "Kesalahan sistem atau data"
  },
  {
    code: "ADMINISTRATIVE_CORRECTION",
    label: "Koreksi administratif"
  }
] as const satisfies ReadonlyArray<BlacklistReviewReason>;

export const BLACKLIST_REVIEW_REJECTION_REASONS = [
  {
    code: "INSUFFICIENT_EVIDENCE",
    label: "Bukti belum mendukung pencabutan"
  },
  {
    code: "PAYMENT_DEADLINE_MISSED",
    label: "Pembayaran tetap melewati batas waktu"
  },
  {
    code: "POLICY_RESTRICTION_REMAINS",
    label: "Pembatasan tetap berlaku sesuai kebijakan"
  }
] as const satisfies ReadonlyArray<BlacklistReviewReason>;

const TERMINAL_STATUSES = new Set<BlacklistReviewStatus>(["DISETUJUI", "DITOLAK"]);

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function isReviewDecision(value: unknown): value is BlacklistReviewDecision {
  return value === "DISETUJUI" || value === "DITOLAK";
}

function getAllowedReasonCodes(decision: BlacklistReviewDecision) {
  return new Set<string>(
    (decision === "DISETUJUI" ? BLACKLIST_REVIEW_APPROVAL_REASONS : BLACKLIST_REVIEW_REJECTION_REASONS).map(
      (item) => item.code
    )
  );
}

export function isBlacklistReviewTerminalStatus(status: unknown) {
  return TERMINAL_STATUSES.has(status as BlacklistReviewStatus);
}

export function validateBlacklistReviewDecisionPayload(input: {
  decision?: unknown;
  reasonCode?: unknown;
  note?: unknown;
}) {
  const decision = normalizeText(input.decision);
  const reasonCode = normalizeText(input.reasonCode);
  const note = normalizeText(input.note);

  if (!isReviewDecision(decision)) {
    throw new Error("Hasil keputusan review belum valid.");
  }

  if (!reasonCode) {
    throw new Error("Alasan keputusan superadmin wajib dipilih.");
  }

  if (!getAllowedReasonCodes(decision).has(reasonCode)) {
    throw new Error("Alasan keputusan tidak sesuai dengan hasil review.");
  }

  return {
    decision,
    reasonCode,
    note
  };
}

export function validateBlacklistReviewCasePayload(input: {
  incidentId?: unknown;
  buyerStatement?: unknown;
  evidence?: unknown;
}) {
  const incidentId = normalizeText(input.incidentId);
  const buyerStatement = normalizeText(input.buyerStatement);
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const normalizedEvidence = evidence
    .map((item) => {
      const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        fileUrl: normalizeText(record.fileUrl),
        fileName: normalizeText(record.fileName),
        mimeType: normalizeText(record.mimeType) || "application/octet-stream"
      };
    })
    .filter((item) => item.fileUrl);

  if (!incidentId) {
    throw new Error("Insiden blacklist wajib dipilih.");
  }

  if (!buyerStatement) {
    throw new Error("Keterangan buyer wajib diisi.");
  }

  if (normalizedEvidence.length === 0) {
    throw new Error("Minimal satu bukti wajib disiapkan sebelum mengirim bantuan.");
  }

  return {
    incidentId,
    buyerStatement,
    evidence: normalizedEvidence satisfies BlacklistReviewAttachmentInput[]
  };
}

export function validatePublicBlacklistHelpLookupPayload(input: {
  nationalId?: unknown;
  contact?: unknown;
}) {
  const nationalId = normalizeText(input.nationalId);
  const contact = normalizeText(input.contact).toLowerCase();

  if (!nationalId || !contact) {
    throw new Error("NIK dan email atau nomor HP wajib diisi.");
  }

  return {
    nationalId,
    contact
  };
}

export function validateAdminBlacklistRecommendationPayload(input: {
  recommendation?: unknown;
  note?: unknown;
}) {
  const recommendation = normalizeText(input.recommendation);
  const note = normalizeText(input.note);

  if (!recommendation) {
    throw new Error("Rekomendasi admin unit wajib dipilih.");
  }

  return {
    recommendation,
    note
  };
}

export function serializeBuyerSafeReviewCase(input: {
  id: string;
  incidentId: string;
  status: BlacklistReviewStatus;
  submittedAt: Date;
  safeSummaryForBuyer?: string | null;
  [key: string]: unknown;
}) {
  return {
    id: input.id,
    incidentId: input.incidentId,
    status: input.status,
    submittedAt: input.submittedAt.toISOString(),
    summary: input.safeSummaryForBuyer ?? "Status review insiden sedang diproses."
  };
}
