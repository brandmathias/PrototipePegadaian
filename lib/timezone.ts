export const APP_TIME_ZONE = "Asia/Jakarta";
export const APP_TIME_ZONE_LABEL = "WIB";

export function formatAppDate(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: APP_TIME_ZONE
  }).format(date);
}

export function formatAppLongDate(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeZone: APP_TIME_ZONE
  }).format(date);
}

export function formatAppDateTime(
  value: Date | string | null | undefined,
  options: { showSeconds?: boolean } = {},
) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const label = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: options.showSeconds ? "medium" : "short",
    timeZone: APP_TIME_ZONE
  }).format(date);

  return `${label} ${APP_TIME_ZONE_LABEL}`;
}
