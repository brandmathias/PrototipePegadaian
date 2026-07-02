import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL wajib tersedia sebelum server production dijalankan.");
}

const client = new Client({ connectionString });
await client.connect();

try {
  await client.query("begin");
  await client.query(`
    alter table "transaksi"
      drop column if exists "handover_complaint_at";
    alter table "transaksi"
      drop column if exists "handover_complaint_note";
  `);

  const audit = await client.query(`
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
  console.log("Startup migration: fitur komplain serah-terima sudah tidak ada di database.");
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}

await import("./server.js");
