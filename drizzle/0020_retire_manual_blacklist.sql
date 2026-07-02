DELETE FROM "blacklist_action_log"
WHERE "action" NOT IN ('blokir_otomatis', 'selesai_otomatis')
   OR lower(trim(coalesce("note", ''))) IN ('test', 'demo', 'mock', 'data uji')
   OR "note" ILIKE '%review%'
   OR "note" ILIKE '%manual%'
   OR "note" ILIKE '%uji%';--> statement-breakpoint
UPDATE "pelanggaran_user"
SET "escalation_eligible" = true,
    "updated_at" = now()
WHERE "resolution_type" IN ('review_disetujui', 'cabut_manual')
   OR lower(trim(coalesce("resolution_note", ''))) IN ('test', 'demo', 'mock', 'data uji')
   OR "resolution_note" ILIKE '%review%'
   OR "resolution_note" ILIKE '%manual%'
   OR "resolution_note" ILIKE '%uji%';--> statement-breakpoint
UPDATE "blacklist"
SET "blocked_until" = "blocked_at" + CASE
      WHEN "total_violations" >= 3 THEN interval '365 days'
      WHEN "total_violations" = 2 THEN interval '30 days'
      ELSE interval '7 days'
    END,
    "updated_at" = now()
WHERE "blocked_until" IS NULL;--> statement-breakpoint
UPDATE "blacklist"
SET "is_active" = "blocked_until" > now(),
    "updated_at" = now()
WHERE "revoked_by_user_id" IS NOT NULL
   OR "revoke_reason" IS NOT NULL;--> statement-breakpoint
UPDATE "user" AS owner
SET "is_active" = true,
    "updated_at" = now()
FROM "blacklist" AS blacklist
WHERE owner."id" = blacklist."user_id"
  AND blacklist."total_violations" >= 3
  AND blacklist."blocked_until" <= now()
  AND owner."role" = 'buyer';--> statement-breakpoint
INSERT INTO "blacklist_action_log" (
  "id",
  "blacklist_id",
  "target_user_id",
  "action",
  "performed_by_type",
  "performed_by_user_id",
  "note",
  "created_at"
)
SELECT
  concat('auto-expiry-', blacklist."id"),
  blacklist."id",
  blacklist."user_id",
  'selesai_otomatis',
  'system',
  null,
  'Masa pembatasan berakhir otomatis. Riwayat blacklist tetap tersimpan.',
  blacklist."blocked_until"
FROM "blacklist" AS blacklist
WHERE blacklist."blocked_until" <= now()
  AND NOT EXISTS (
    SELECT 1
    FROM "blacklist_action_log" AS existing
    WHERE existing."blacklist_id" = blacklist."id"
      AND existing."action" = 'selesai_otomatis'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "blacklist_action_log" AS existing_id
    WHERE existing_id."id" = concat('auto-expiry-', blacklist."id")
  );--> statement-breakpoint
UPDATE "blacklist"
SET "is_active" = false,
    "updated_at" = now()
WHERE "is_active" = true
  AND "blocked_until" <= now();--> statement-breakpoint
ALTER TABLE "pelanggaran_user" DROP CONSTRAINT IF EXISTS "pelanggaran_user_resolved_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "blacklist_action_log" DROP CONSTRAINT IF EXISTS "blacklist_action_log_performed_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "blacklist" DROP CONSTRAINT IF EXISTS "blacklist_revoked_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "pelanggaran_user" DROP COLUMN IF EXISTS "resolution_type";--> statement-breakpoint
ALTER TABLE "pelanggaran_user" DROP COLUMN IF EXISTS "resolution_reason_code";--> statement-breakpoint
ALTER TABLE "pelanggaran_user" DROP COLUMN IF EXISTS "resolution_note";--> statement-breakpoint
ALTER TABLE "pelanggaran_user" DROP COLUMN IF EXISTS "resolved_by_user_id";--> statement-breakpoint
ALTER TABLE "pelanggaran_user" DROP COLUMN IF EXISTS "resolved_at";--> statement-breakpoint
ALTER TABLE "blacklist_action_log" DROP COLUMN IF EXISTS "performed_by_type";--> statement-breakpoint
ALTER TABLE "blacklist_action_log" DROP COLUMN IF EXISTS "performed_by_user_id";--> statement-breakpoint
ALTER TABLE "blacklist" DROP COLUMN IF EXISTS "revoked_by_user_id";--> statement-breakpoint
ALTER TABLE "blacklist" DROP COLUMN IF EXISTS "revoke_reason";
