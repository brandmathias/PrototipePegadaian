type CountdownOptions = {
  now?: number;
  expiredLabel?: string;
};

export type CountdownState = {
  label: string;
  isExpired: boolean;
};

function padUnit(value: number) {
  return String(value);
}

export function getCountdownState(
  targetAt: string | Date | null | undefined,
  options: CountdownOptions = {}
): CountdownState {
  const expiredLabel = options.expiredLabel ?? "Selesai";
  if (!targetAt) {
    return {
      isExpired: true,
      label: expiredLabel
    };
  }

  const targetMs = new Date(targetAt).getTime();
  const now = options.now ?? Date.now();
  const diffMs = targetMs - now;

  if (Number.isNaN(targetMs) || diffMs <= 0) {
    return {
      isExpired: true,
      label: expiredLabel
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return {
      isExpired: false,
      label: `${days} hari ${padUnit(hours)} jam ${padUnit(minutes)} menit ${padUnit(seconds)} detik`
    };
  }

  if (hours > 0) {
    return {
      isExpired: false,
      label: `${hours} jam ${padUnit(minutes)} menit ${padUnit(seconds)} detik`
    };
  }

  if (minutes > 0) {
    return {
      isExpired: false,
      label: `${minutes} menit ${padUnit(seconds)} detik`
    };
  }

  return {
    isExpired: false,
    label: `${Math.max(1, seconds)} detik`
  };
}
