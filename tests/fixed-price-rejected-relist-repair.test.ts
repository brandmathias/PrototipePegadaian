import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  FIXED_PRICE_REJECTED_RELIST_CANDIDATES_SQL,
  repairFixedPriceRejectedRelists,
  type FixedPriceRejectedRelistCandidate
} from "@/lib/db/fixed-price-rejected-relist-repair";

function makeClient(candidates: FixedPriceRejectedRelistCandidate[]) {
  const client = {
    query: vi.fn(async (text: string, values?: unknown[]) => {
      if (text === FIXED_PRICE_REJECTED_RELIST_CANDIDATES_SQL) {
        return { rows: candidates, rowCount: candidates.length };
      }

      if (text === "begin" || text === "commit" || text === "rollback") {
        return { rows: [], rowCount: null };
      }

      if (text.includes(`update "pemasaran"`) && text.includes(`status = 'gagal'`)) {
        return { rows: [{ id: values?.[0] }], rowCount: 1 };
      }

      return { rows: [], rowCount: 1 };
    })
  };

  return client;
}

describe("fixed-price rejected relist repair", () => {
  const rejectedAt = new Date("2026-07-06T07:36:00.000Z");
  const candidate: FixedPriceRejectedRelistCandidate = {
    marketing_id: "pm-fixed-iterasi-5",
    barang_id: "barang-emas-1",
    price: "12500000",
    amount: "12500000",
    iteration: 5,
    max_iteration: 5,
    created_by_user_id: "admin-pembuat",
    item_status: "dipasarkan",
    transaction_id: "trx-ditolak-1",
    rejection_reason: "Uang dikirim bukan ke rekening tujuan",
    verified_by_user_id: "admin-verifikator",
    rejected_at: rejectedAt
  } as FixedPriceRejectedRelistCandidate;

  it("only reports stuck sessions during dry-run", async () => {
    const client = makeClient([candidate]);

    const result = await repairFixedPriceRejectedRelists(client, { apply: false });

    expect(result).toEqual({
      applied: 0,
      candidates: [candidate],
      skipped: 0
    });
    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.query).toHaveBeenCalledWith(FIXED_PRICE_REJECTED_RELIST_CANDIDATES_SQL);
  });

  it("selects rejected proofs by their verification update instead of the newest purchase attempt", () => {
    expect(FIXED_PRICE_REJECTED_RELIST_CANDIDATES_SQL).toContain(`where t."type" = 'fixed_price'`);
    expect(FIXED_PRICE_REJECTED_RELIST_CANDIDATES_SQL).toContain(`and t."status" = 'ditolak_bukti'`);
    expect(FIXED_PRICE_REJECTED_RELIST_CANDIDATES_SQL).toContain(
      `order by t."pemasaran_id", t."updated_at" desc, t."created_at" desc, t."id" desc`
    );
  });

  it("archives the rejected active session and creates the next fixed-price iteration", async () => {
    const client = makeClient([candidate]);

    const result = await repairFixedPriceRejectedRelists(client, {
      apply: true,
      idFactory: vi
        .fn()
        .mockReturnValueOnce("pm-fixed-iterasi-6")
        .mockReturnValueOnce("history-fixed-reject"),
      nowFactory: () => new Date("2026-07-06T08:00:00.000Z")
    });

    expect(result).toEqual({
      applied: 1,
      candidates: [candidate],
      skipped: 0
    });
    expect(client.query).toHaveBeenCalledWith("begin");
    expect(client.query).toHaveBeenCalledWith("commit");
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining(`update "pemasaran"`),
      ["pm-fixed-iterasi-5", rejectedAt]
    );
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining(`insert into "pemasaran"`),
      expect.arrayContaining([
        "pm-fixed-iterasi-6",
        "barang-emas-1",
        "12500000",
        6,
        "admin-verifikator",
        rejectedAt
      ])
    );
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining(`insert into "riwayat_status_barang"`),
      expect.arrayContaining([
        "history-fixed-reject",
        "barang-emas-1",
        "dipasarkan",
        "admin-verifikator",
        "Bukti pembayaran harga tetap ditolak admin unit. Alasan: Uang dikirim bukan ke rekening tujuan. Barang dipasarkan ulang otomatis ke iterasi 6.",
        rejectedAt
      ])
    );
  });

  it("exposes a production repair script", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

    expect(packageJson.scripts["db:repair:fixed-price-relist"]).toBe(
      "tsx scripts/repair-fixed-price-rejected-relist.ts"
    );
  });
});
