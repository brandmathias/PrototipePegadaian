import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("security response headers", () => {
  it("configures browser protections for every route", async () => {
    const config = await readFile(resolve(process.cwd(), "next.config.mjs"), "utf8");

    expect(config).toContain('key: "Content-Security-Policy"');
    expect(config).toContain('key: "Strict-Transport-Security"');
    expect(config).toContain('key: "X-Frame-Options"');
    expect(config).toContain('key: "X-Content-Type-Options"');
    expect(config).toContain('key: "Referrer-Policy"');
    expect(config).toContain('key: "Permissions-Policy"');
  });
});
