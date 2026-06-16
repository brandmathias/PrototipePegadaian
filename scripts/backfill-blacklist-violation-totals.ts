import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
const applyChanges = process.argv.includes("--apply");

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur. Jalankan dari environment aplikasi atau isi .env.local.");
}

type BackfillRow = {
  current_blocked_until: Date | null;
  current_total: number;
  eligible_violations: number;
  id: string;
  is_active: boolean;
  latest_violation_at: Date | null;
  next_blocked_until: Date | null;
  next_total: number;
  user_id: string;
};

const BACKFILL_CTE = `
with blacklist_scope as (
  select
    b.id,
    b.user_id,
    b.is_active,
    b.total_violations,
    b.blocked_until,
    coalesce(nullif(b.national_id, ''), nullif(owner.national_id, '')) as national_id
  from blacklist b
  left join "user" owner on owner.id = b.user_id
),
violation_rollup as (
  select
    scope.id,
    count(distinct violation.id)::int as eligible_violations,
    max(violation.created_at) as latest_violation_at
  from blacklist_scope scope
  left join pelanggaran_user violation
    on violation.escalation_eligible = true
   and (
      violation.user_id = scope.user_id
      or (
        scope.national_id is not null
        and exists (
          select 1
          from "user" violation_owner
          where violation_owner.id = violation.user_id
            and violation_owner.national_id = scope.national_id
        )
      )
    )
  group by scope.id
),
candidate_base as (
  select
    scope.id,
    scope.user_id,
    scope.is_active,
    scope.total_violations as current_total,
    scope.blocked_until as current_blocked_until,
    violation_rollup.eligible_violations,
    violation_rollup.latest_violation_at,
    greatest(scope.total_violations, violation_rollup.eligible_violations) as next_total
  from blacklist_scope scope
  inner join violation_rollup on violation_rollup.id = scope.id
),
candidate_deadlines as (
  select
    candidate_base.*,
    case
      when candidate_base.latest_violation_at is null then candidate_base.current_blocked_until
      when candidate_base.next_total >= 3 then candidate_base.latest_violation_at + interval '365 days'
      when candidate_base.next_total = 2 then candidate_base.latest_violation_at + interval '30 days'
      when candidate_base.next_total = 1 then candidate_base.latest_violation_at + interval '7 days'
      else candidate_base.current_blocked_until
    end as policy_blocked_until
  from candidate_base
),
candidates as (
  select
    candidate_deadlines.id,
    candidate_deadlines.user_id,
    candidate_deadlines.is_active,
    candidate_deadlines.current_total,
    candidate_deadlines.current_blocked_until,
    candidate_deadlines.eligible_violations,
    candidate_deadlines.latest_violation_at,
    candidate_deadlines.next_total,
    case
      when not candidate_deadlines.is_active then candidate_deadlines.current_blocked_until
      when candidate_deadlines.policy_blocked_until is null then candidate_deadlines.current_blocked_until
      when candidate_deadlines.current_blocked_until is null then candidate_deadlines.policy_blocked_until
      when candidate_deadlines.policy_blocked_until > candidate_deadlines.current_blocked_until then candidate_deadlines.policy_blocked_until
      else candidate_deadlines.current_blocked_until
    end as next_blocked_until
  from candidate_deadlines
  where
    candidate_deadlines.next_total > candidate_deadlines.current_total
    or (
      candidate_deadlines.is_active
      and candidate_deadlines.policy_blocked_until is not null
      and (
        candidate_deadlines.current_blocked_until is null
        or candidate_deadlines.policy_blocked_until > candidate_deadlines.current_blocked_until + interval '1 minute'
      )
    )
)
`;

const PREVIEW_SQL = `${BACKFILL_CTE}
select *
from candidates
order by next_total desc, eligible_violations desc, latest_violation_at desc nulls last;
`;

const APPLY_SQL = `${BACKFILL_CTE}
update blacklist target
set
  total_violations = candidates.next_total,
  blocked_until = candidates.next_blocked_until,
  updated_at = now()
from candidates
where target.id = candidates.id
returning
  target.id,
  target.user_id,
  candidates.is_active,
  candidates.current_total,
  candidates.eligible_violations,
  candidates.latest_violation_at,
  candidates.current_blocked_until,
  target.total_violations as next_total,
  target.blocked_until as next_blocked_until;
`;

function formatRow(row: BackfillRow) {
  return {
    id: row.id,
    userId: row.user_id,
    active: row.is_active,
    total: `${row.current_total} -> ${row.next_total}`,
    eligibleViolations: row.eligible_violations,
    blockedUntil: `${row.current_blocked_until?.toISOString() ?? "-"} -> ${row.next_blocked_until?.toISOString() ?? "-"}`
  };
}

async function main() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query("begin");

    if (applyChanges) {
      const result = await client.query<BackfillRow>(APPLY_SQL);
      await client.query("commit");

      console.log(`[blacklist-backfill] applied ${result.rowCount ?? 0} blacklist row(s).`);
      console.table(result.rows.slice(0, 20).map(formatRow));
      return;
    }

    const result = await client.query<BackfillRow>(PREVIEW_SQL);
    await client.query("rollback");

    console.log(`[blacklist-backfill] dry-run found ${result.rowCount ?? 0} blacklist row(s) to update.`);
    console.table(result.rows.slice(0, 20).map(formatRow));
    console.log("[blacklist-backfill] no changes written. Re-run with --apply to update the database.");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
