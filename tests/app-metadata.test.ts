import { describe, expect, it } from "vitest";

import { metadata } from "@/app/layout";
import { BRAND_ICON_SRC, BRAND_SHARE_IMAGE_SRC } from "@/lib/brand";
import { resolvePublicSiteUrl } from "@/lib/site-url";

describe("app metadata", () => {
  it("uses non-technical share copy and includes share images", () => {
    const description = String(metadata.description ?? "");
    const icons = metadata.icons as { icon?: Array<{ url?: string }> } | undefined;

    expect(description.toLowerCase()).toContain("prototipe");
    expect(description).not.toContain("Next.js");
    expect(description).not.toContain("shadcn");
    expect(metadata.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          alt: expect.stringContaining("Ruang Agunan"),
          url: BRAND_SHARE_IMAGE_SRC
        })
      ])
    );
    expect(metadata.openGraph?.siteName).toBe("Ruang Agunan");
    expect(icons?.icon).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: BRAND_ICON_SRC
        })
      ])
    );
  });

  it("falls back to the public domain when environment urls point to localhost", () => {
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

    try {
      process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SITE_URL = "http://127.0.0.1:3000";
      process.env.BETTER_AUTH_URL = "http://0.0.0.0:3000";

      expect(resolvePublicSiteUrl()).toBe("https://app.tugasprototype.cloud");
    } finally {
      if (originalAppUrl === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
      }

      if (originalSiteUrl === undefined) {
        delete process.env.NEXT_PUBLIC_SITE_URL;
      } else {
        process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
      }

      if (originalBetterAuthUrl === undefined) {
        delete process.env.BETTER_AUTH_URL;
      } else {
        process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
      }
    }
  });
});
