import {
  deriveEffectiveBlacklistState,
  type EffectiveBlacklistState
} from "@/lib/blacklist/effective-state";
import type { BlacklistViolationTraceLike } from "@/lib/blacklist/escalation";
import { getBlacklistRestrictionPolicy } from "@/lib/blacklist/restrictions";
import { formatAppDateTime } from "@/lib/timezone";

export type LoginSuspensionBlacklist = {
  blockedUntil: Date | null;
  isActive: boolean;
  totalViolations: number | null;
};

type LoginSuspensionState<T extends BlacklistViolationTraceLike> = EffectiveBlacklistState<T> & {
  hasDerivedMilestone: boolean;
};

export const LEVEL_THREE_LOGIN_SUSPENSION_MARKER = "akumulasi 3 pelanggaran";

export function buildLevelThreeLoginSuspensionMessage(blockedUntil: Date | string | null | undefined) {
  const endLabel = formatAppDateTime(blockedUntil);
  const baseMessage =
    "Akun Anda ditangguhkan karena akumulasi 3 pelanggaran tidak membayar lelang yang dimenangkan.";

  if (endLabel !== "-") {
    return `${baseMessage} Akses login dibuka kembali pada ${endLabel}.`;
  }

  return `${baseMessage} Waktu berakhir penangguhan belum tersedia; hubungi admin unit untuk bantuan.`;
}

function deriveLoginSuspensionState<T extends BlacklistViolationTraceLike>({
  blacklist,
  traces
}: {
  blacklist: LoginSuspensionBlacklist;
  traces: T[];
}): LoginSuspensionState<T> {
  const effectiveState = deriveEffectiveBlacklistState({
    storedBlockedUntil: blacklist.blockedUntil,
    storedTotalViolations: blacklist.totalViolations,
    traces
  });
  const hasDerivedMilestone = effectiveState.milestones.length > 0;

  return {
    ...effectiveState,
    blockedUntil: hasDerivedMilestone ? effectiveState.blockedUntil : blacklist.blockedUntil,
    hasDerivedMilestone,
    totalViolations: hasDerivedMilestone
      ? effectiveState.totalViolations
      : Math.max(0, Math.floor(Number(blacklist.totalViolations ?? 0)))
  };
}

export function getLevelThreeLoginSuspensionMessage<T extends BlacklistViolationTraceLike>({
  blacklist,
  now = new Date(),
  traces
}: {
  blacklist: LoginSuspensionBlacklist | null;
  now?: Date;
  traces: T[];
}) {
  if (!blacklist?.isActive) {
    return null;
  }

  const suspensionState = deriveLoginSuspensionState({ blacklist, traces });
  const policy = getBlacklistRestrictionPolicy(suspensionState.totalViolations);
  const activeByDate =
    !suspensionState.blockedUntil || suspensionState.blockedUntil.getTime() > now.getTime();

  if (!policy.suspendsLogin || !activeByDate) {
    return null;
  }

  return buildLevelThreeLoginSuspensionMessage(suspensionState.blockedUntil);
}

export function isLevelThreeLoginSuspensionMessage(message: string) {
  return message.toLowerCase().includes(LEVEL_THREE_LOGIN_SUSPENSION_MARKER);
}
