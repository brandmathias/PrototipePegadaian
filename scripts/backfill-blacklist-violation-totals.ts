import { config } from "dotenv";
import { Pool } from "pg";

import { deriveBlacklistEscalationMilestones } from "../lib/blacklist/escalation";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
const applyChanges = process.argv.includes("--apply");

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur. Jalankan dari environment aplikasi atau isi .env.local.");
}

type BlacklistRow = {
  blocked_until: Date | null;
  id: string;
  is_active: boolean;
  national_id: string | null;
  total_violations: number;
  user_id: string;
};

type ViolationRow = {
  created_at: Date;
  escalation_eligible: boolean | null;
  id: string;
  user_id: string;
};

type BackfillRow = {
  currentBlockedUntil: Date | null;
  currentTotal: number;
  eligibleViolations: number;
  id: string;
  isActive: boolean;
  latestViolationAt: Date | null;
  nextBlockedUntil: Date | null;
  nextTotal: number;
  userId: string;
};

const BLACKLIST_SQL = `
select
  b.id,
  b.user_id,
  b.is_active,
  b.total_violations,
  b.blocked_until,
  coalesce(nullif(b.national_id, ''), nullif(owner.national_id, '')) as national_id
from blacklist b
left join "user" owner on owner.id = b.user_id
order by b.updated_at desc nulls last, b.id asc;
`;

const VIOLATION_SQL = `
select
  violation.id,
  violation.user_id,
  violation.created_at,
  violation.escalation_eligible
from pelanggaran_user violation
left join "user" violation_owner on violation_owner.id = violation.user_id
where violation.escalation_eligible = true
  and (
    violation.user_id = $1
    or (
      $2::text is not null
      and violation_owner.national_id = $2
    )
  )
order by violation.created_at asc, violation.id asc;
`;

function sameInstant(left: Date | null, right: Date | null) {
  if (!left && !right) return true;
  if (!left || !right) return false;

  return Math.abs(left.getTime() - right.getTime()) < 1000;
}

function formatRow(row: BackfillRow) {
  return {
    id: row.id,
    userId: row.userId,
    active: row.isActive,
    total: `${row.currentTotal} -> ${row.nextTotal}`,
    eligibleViolations: row.eligibleViolations,
    latestViolationAt: row.latestViolationAt?.toISOString() ?? "-",
    blockedUntil: `${row.currentBlockedUntil?.toISOString() ?? "-"} -> ${
      row.nextBlockedUntil?.toISOString() ?? "-"
    }`
  };
}

async function main() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query("begin");

    const blacklistResult = await client.query<BlacklistRow>(BLACKLIST_SQL);
    const candidates: BackfillRow[] = [];

    for (const blacklist of blacklistResult.rows) {
      const violationsResult = await client.query<ViolationRow>(VIOLATION_SQL, [
        blacklist.user_id,
        blacklist.national_id
      ]);
      const milestones = deriveBlacklistEscalationMilestones(
        violationsResult.rows.map((violation) => ({
          createdAt: violation.created_at,
          escalationEligible: violation.escalation_eligible,
          id: violation.id
        }))
      );

      if (milestones.length === 0) {
        continue;
      }

      const latestMilestone = milestones[milestones.length - 1];
      const nextTotal = latestMilestone.level;
      const nextBlockedUntil = blacklist.is_active ? latestMilestone.blockedUntil : blacklist.blocked_until;

      if (nextTotal === blacklist.total_violations && sameInstant(nextBlockedUntil, blacklist.blocked_until)) {
        continue;
      }

      candidates.push({
        currentBlockedUntil: blacklist.blocked_until,
        currentTotal: blacklist.total_violations,
        eligibleViolations: violationsResult.rows.length,
        id: blacklist.id,
        isActive: blacklist.is_active,
        latestViolationAt: latestMilestone.occurredAt,
        nextBlockedUntil,
        nextTotal,
        userId: blacklist.user_id
      });
    }

    if (applyChanges) {
      for (const candidate of candidates) {
        await client.query(
          `
          update blacklist
          set total_violations = $1,
              blocked_until = $2,
              updated_at = now()
          where id = $3;
          `,
          [candidate.nextTotal, candidate.nextBlockedUntil, candidate.id]
        );
      }

      await client.query("commit");
      console.log(`[blacklist-backfill] applied ${candidates.length} blacklist row(s).`);
      console.table(candidates.slice(0, 20).map(formatRow));
      return;
    }

    await client.query("rollback");
    console.log(`[blacklist-backfill] dry-run found ${candidates.length} blacklist row(s) to update.`);
    console.table(candidates.slice(0, 20).map(formatRow));
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
