import { sql } from "drizzle-orm";

const TARGET_ITEM_NAMES = [
  "Kalung Emas Rantai Singapura 22K",
  "Cincin Emas Solitaire 22K",
  "Gelang Emas Bangle Polos 22K"
] as const;

async function main() {
  if (process.env.SYNC_TARGET !== "production") {
    throw new Error(
      "Refusing to update the database. Set SYNC_TARGET=production explicitly."
    );
  }

  const { db, pool } = await import("@/lib/db/client");
  const updatedRows = await db.transaction(async (tx) =>
    tx.execute(sql`
    with first_marketing as (
      select
        p.barang_id,
        min(p.created_at) as first_marketed_at
      from pemasaran p
      group by p.barang_id
    ), stale_input as (
      select
        rs.id,
        fm.first_marketed_at - interval '10 days' as aligned_at
      from riwayat_status_barang rs
      inner join barang b on b.id = rs.barang_id
      inner join first_marketing fm on fm.barang_id = rs.barang_id
      where b.name in (${sql.join(
        TARGET_ITEM_NAMES.map((name) => sql`${name}`),
        sql`, `
      )})
        and rs.old_status is null
        and rs.new_status in ('gadai', 'jaminan')
        and rs.created_at < fm.first_marketed_at - interval '10 days'
    )
    update riwayat_status_barang rs
    set created_at = stale_input.aligned_at
    from stale_input
    where rs.id = stale_input.id
    returning rs.id, rs.barang_id, rs.created_at
    `)
  );

  console.log(
    JSON.stringify(
      {
        updatedCount: updatedRows.rows.length,
        rows: updatedRows.rows
      },
      null,
      2
    )
  );

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
