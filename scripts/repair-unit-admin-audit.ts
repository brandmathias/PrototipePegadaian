import { config } from "dotenv";
import { Client } from "pg";

import { repairUnitAdminAuditTrail } from "../lib/db/unit-admin-audit-repair";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
const applyChanges = process.argv.includes("--apply");

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur. Jalankan dari environment aplikasi atau isi .env.local.");
}

const databaseUrl = connectionString;

function describeTarget(urlValue: string) {
  try {
    const url = new URL(urlValue);
    return `${url.protocol.replace(":", "")}://${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
  } catch {
    return "(DATABASE_URL tidak bisa diparse, nilai tidak ditampilkan)";
  }
}

function readSingleArg(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1]?.trim() ?? "" : "";
}

function readMultiArg(flag: string) {
  const values: string[] = [];

  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === flag) {
      const value = process.argv[index + 1]?.trim();

      if (value) {
        values.push(value);
      }
    }
  }

  return values;
}

async function main() {
  const unitName = readSingleArg("--unit");
  const replacementAdminName = readSingleArg("--admin");
  const staleAdminNames = readMultiArg("--replace");

  if (!unitName) {
    throw new Error("Isi --unit dengan nama unit target, misalnya --unit \"UPC Wanea\".");
  }

  if (!replacementAdminName) {
    throw new Error("Isi --admin dengan nama admin aktif pengganti, misalnya --admin \"Hendra Wijaya\".");
  }

  if (staleAdminNames.length === 0) {
    throw new Error("Tambahkan minimal satu --replace untuk nama admin lama yang ingin diganti.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    console.log(`Target database: ${describeTarget(databaseUrl)}`);
    console.log(`Requested unit: ${unitName} | Replacement admin: ${replacementAdminName}`);

    const result = await repairUnitAdminAuditTrail(client, {
      apply: applyChanges,
      replacementAdminName,
      staleAdminNames,
      unitName,
    });

    console.log(
      `Target unit: ${result.context.unit_name} | Admin pengganti: ${result.context.replacement_user_name}`,
    );
    console.table(
      result.candidates.map((candidate) => ({
        userIdLama: candidate.stale_user_id,
        namaLama: candidate.stale_user_name,
        verifikasi: candidate.verified_transaction_count,
        serahTerima: candidate.handover_transaction_count,
        riwayat: candidate.history_actor_count,
        perpanjangan: candidate.extension_history_count,
        pemasaran: candidate.marketing_created_count,
        barang: candidate.barang_created_count,
      })),
    );

    if (applyChanges) {
      console.log(`[unit-admin-audit-repair] applied ${result.applied} perubahan referensi, skipped ${result.skipped}.`);
      return;
    }

    console.log(`[unit-admin-audit-repair] dry-run found ${result.candidates.length} kandidat akun lama.`);
    console.log("[unit-admin-audit-repair] no changes written. Re-run with --apply to repair the database.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
