import { config } from "dotenv";
import { Client } from "pg";

import { REMOVE_HANDOVER_COMPLAINT_MIGRATION_SQL } from "../lib/db/remove-handover-complaint-migration";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
const dryRun = process.argv.includes("--dry-run");

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur. Isi environment production atau .env.local sebelum menjalankan migrasi.");
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
  const target = describeTarget(connectionString!);

  if (dryRun) {
    console.log(`Target database: ${target}`);
    console.log(REMOVE_HANDOVER_COMPLAINT_MIGRATION_SQL.trim());
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("begin");
    await client.query(REMOVE_HANDOVER_COMPLAINT_MIGRATION_SQL);
    const audit = await client.query<{ column_name: string }>(`
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'transaksi'
        and column_name in ('handover_complaint_at', 'handover_complaint_note')
    `);

    if (audit.rowCount) {
      throw new Error(`Kolom komplain masih tersisa: ${audit.rows.map((row) => row.column_name).join(", ")}`);
    }

    await client.query("commit");
    console.log(`Fitur komplain serah-terima berhasil dihapus dari ${target}.`);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
