import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("barang history database integrity", () => {
  it("backfills and audits missing initial history before production starts", () => {
    const startup = readFileSync(resolve(process.cwd(), "scripts/start-production.mjs"), "utf8");

    expect(startup).toMatch(/insert into "riwayat_status_barang"/i);
    expect(startup).toMatch(/history\."old_status" is null/i);
    expect(startup).toMatch(/barang_tanpa_catatan_awal/i);
  });

  it("synchronizes stale cross-unit test history ten days before first marketing", () => {
    const startup = readFileSync(resolve(process.cwd(), "scripts/start-production.mjs"), "utf8");

    expect(startup).toContain("Kalung Emas Rantai Singapura 22K");
    expect(startup).toContain("Cincin Emas Solitaire 22K");
    expect(startup).toContain("Gelang Emas Bangle Polos 22K");
    expect(startup).toMatch(/first_marketing\.first_marketed_at - interval '10 days'/i);
    expect(startup).toMatch(/update "riwayat_status_barang"/i);
  });
});
