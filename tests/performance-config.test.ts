import { describe, expect, it } from "vitest";

// @ts-expect-error Next config is authored as an ESM .mjs file.
import nextConfig from "../next.config.mjs";

describe("production performance configuration", () => {
  it("inlines CSS for every route to avoid render-blocking requests", () => {
    expect(nextConfig.experimental?.inlineCss).toBe(true);
  });
});
