import { describe, expect, it } from "vitest";

// @ts-expect-error Next config is authored as an ESM .mjs file.
import nextConfig from "../next.config.mjs";

describe("production performance configuration", () => {
  it("keeps the global stylesheet out of the HTML and RSC payload", () => {
    expect(nextConfig.experimental?.inlineCss).not.toBe(true);
  });

  it("prevents browsers and proxies from pinning an outdated push worker", async () => {
    const rules = await nextConfig.headers();

    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/push-service-worker.js",
          headers: expect.arrayContaining([
            { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
            { key: "Service-Worker-Allowed", value: "/" }
          ])
        })
      ])
    );
  });
});
