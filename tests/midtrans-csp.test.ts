import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const configPath = resolve(process.cwd(), "next.config.mjs");

describe("Midtrans CSP integration", () => {
  it("allows Snap JS and its embedded payment frame to load", async () => {
    const config = await readFile(configPath, "utf8");

    expect(config).toMatch(/script-src 'self' 'unsafe-inline'[^\"]*https:\/\/\*\.midtrans\.com/);
    expect(config).toMatch(/connect-src 'self'[^\"]*https:\/\/\*\.midtrans\.com/);
    expect(config).toMatch(/frame-src 'self'[^\"]*https:\/\/\*\.midtrans\.com/);
  });
});
