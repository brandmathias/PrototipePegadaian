import { config } from "dotenv";
import { Client } from "pg";

import { HANDOVER_PROOF_MIGRATION_SQL } from "../lib/db/handover-proof-migration";

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
    console.log("Dry-run: SQL yang akan dijalankan:");
    console.log(HANDOVER_PROOF_MIGRATION_SQL.trim());
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("begin");
    await client.query(HANDOVER_PROOF_MIGRATION_SQL);
    await client.query("commit");
    console.log(`Migrasi bukti serah-terima berhasil diterapkan ke ${target}.`);
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
