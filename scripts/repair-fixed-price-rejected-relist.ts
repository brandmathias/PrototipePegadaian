import { config } from "dotenv";
import { Client } from "pg";

import { repairFixedPriceRejectedRelists } from "../lib/db/fixed-price-rejected-relist-repair";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
const applyChanges = process.argv.includes("--apply");

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur. Jalankan dari environment aplikasi atau isi .env.local.");
}

function describeTarget(urlValue: string) {
  try {
    const url = new URL(urlValue);
    return `${url.protocol.replace(":", "")}://${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
  } catch {
    return "(DATABASE_URL tidak bisa diparse, nilai tidak ditampilkan)";
  }
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await repairFixedPriceRejectedRelists(client, { apply: applyChanges });

    console.log(`Target database: ${describeTarget(connectionString!)}`);
    console.table(
      result.candidates.slice(0, 20).map((candidate) => ({
        pemasaranId: candidate.marketing_id,
        barangId: candidate.barang_id,
        transaksiId: candidate.transaction_id,
        iterasi: `${candidate.iteration} -> ${Number(candidate.max_iteration ?? candidate.iteration) + 1}`,
        harga: candidate.price ?? candidate.amount ?? "-",
        actor: candidate.verified_by_user_id ?? candidate.created_by_user_id
      }))
    );

    if (applyChanges) {
      console.log(`[fixed-price-relist-repair] applied ${result.applied} row(s), skipped ${result.skipped}.`);
      return;
    }

    console.log(`[fixed-price-relist-repair] dry-run found ${result.candidates.length} row(s).`);
    console.log("[fixed-price-relist-repair] no changes written. Re-run with --apply to repair the database.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
