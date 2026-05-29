WITH duplicate_pelanggaran AS (
  SELECT id, user_id
  FROM (
    SELECT
      id,
      user_id,
      row_number() OVER (PARTITION BY transaksi_id ORDER BY created_at ASC, id ASC) AS row_number
    FROM pelanggaran_user
  ) ranked_pelanggaran
  WHERE row_number > 1
),
affected_users AS (
  SELECT DISTINCT user_id
  FROM duplicate_pelanggaran
),
deleted_duplicates AS (
DELETE FROM pelanggaran_user
WHERE id IN (SELECT id FROM duplicate_pelanggaran)
RETURNING user_id
),
recalculated_counts AS (
  SELECT
    user_id,
    count(DISTINCT transaksi_id)::integer AS total_violations
  FROM pelanggaran_user
  WHERE user_id IN (
    SELECT user_id FROM affected_users
    UNION
    SELECT user_id FROM deleted_duplicates
  )
  GROUP BY user_id
),
updated_blacklists AS (
  UPDATE blacklist
  SET
    total_violations = recalculated_counts.total_violations,
    blocked_until = CASE
      WHEN blacklist.blocked_until IS NULL THEN NULL
      WHEN recalculated_counts.total_violations = 1 THEN blacklist.blocked_at + interval '7 days'
      WHEN recalculated_counts.total_violations = 2 THEN blacklist.blocked_at + interval '30 days'
      ELSE blacklist.blocked_at + interval '365 days'
    END,
    updated_at = now()
  FROM recalculated_counts
  WHERE blacklist.user_id = recalculated_counts.user_id
    AND blacklist.is_active = true
  RETURNING blacklist.user_id, blacklist.total_violations
)
UPDATE "user"
SET is_active = updated_blacklists.total_violations < 3
FROM updated_blacklists
WHERE "user".id = updated_blacklists.user_id
  AND "user".is_active <> (updated_blacklists.total_violations < 3);

CREATE UNIQUE INDEX "pelanggaran_user_transaksi_unique" ON "pelanggaran_user" USING btree ("transaksi_id");
