type MarketingEditContext = {
  activeMarketingMode?: string | null;
  hasFailedWinnerPayment?: boolean;
  hasWinner?: boolean;
  latestMarketingMode?: string | null;
  latestMarketingStatus?: string | null;
  participantCount?: number | null;
  status?: string | null;
};

function normalize(value?: string | null) {
  return String(value ?? "").toLowerCase();
}

export function canEditMarketedBarang(context: MarketingEditContext) {
  const status = normalize(context.status);
  const activeMode = normalize(context.activeMarketingMode);
  const latestMode = normalize(context.latestMarketingMode);
  const latestStatus = normalize(context.latestMarketingStatus);

  if (status === "gadai" || status === "jaminan") {
    return true;
  }

  if (status === "dipasarkan") {
    return activeMode === "fixed_price";
  }

  if (status !== "gagal" || latestMode !== "vickrey" || latestStatus !== "gagal") {
    return false;
  }

  const noParticipants = Number(context.participantCount ?? 0) === 0 && !context.hasWinner;
  const failedWinnerPayment = Boolean(context.hasWinner && context.hasFailedWinnerPayment);

  return noParticipants || failedWinnerPayment;
}
