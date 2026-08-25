import { sql } from "drizzle-orm";

import { barang, mediaBarang } from "@/lib/db/schema";

export function primaryViolationPhotoUrl() {
  return sql<string | null>`(
    select ${mediaBarang.url}
    from ${mediaBarang}
    where ${mediaBarang.barangId} = ${barang.id}
      and ${mediaBarang.type} = 'foto'
    order by ${mediaBarang.sortOrder} asc, ${mediaBarang.createdAt} asc
    limit 1
  )`;
}

export function primaryViolationPhotoFileName() {
  return sql<string | null>`(
    select ${mediaBarang.fileName}
    from ${mediaBarang}
    where ${mediaBarang.barangId} = ${barang.id}
      and ${mediaBarang.type} = 'foto'
    order by ${mediaBarang.sortOrder} asc, ${mediaBarang.createdAt} asc
    limit 1
  )`;
}
