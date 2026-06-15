const FALLBACK_SITE_URL = "https://app.tugasprototype.cloud";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

export function resolvePublicSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.BETTER_AUTH_URL,
    FALLBACK_SITE_URL
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      const parsedUrl = new URL(candidate);

      if (LOCAL_HOSTNAMES.has(parsedUrl.hostname)) {
        continue;
      }

      return parsedUrl.origin;
    } catch {
      continue;
    }
  }

  return FALLBACK_SITE_URL;
}
