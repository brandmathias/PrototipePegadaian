import { describe, expect, it } from "vitest";

// @ts-expect-error Next config is authored as an ESM .mjs file.
import nextConfig from "../next.config.mjs";

describe("production performance configuration", () => {
  it("keeps the global stylesheet out of the HTML and RSC payload", () => {
    expect(nextConfig.experimental?.inlineCss).not.toBe(true);
  });
});
