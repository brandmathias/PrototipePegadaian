export const OBSOLETE_DATABASE_TABLES = [
  "blacklist_review_attachment",
  "blacklist_review_case"
] as const;

export const OBSOLETE_DATABASE_CLEANUP_SQL = `
delete from "notifications"
where "type" = 'blacklist_review_submitted'
   or "entity_type" = 'blacklist_review'
   or "entity_type" = 'superadmin_audit'
   or "type" in (
     'superadmin_account_created',
     'superadmin_account_updated',
     'superadmin_account_reset',
     'superadmin_account_guardrail'
   )
   or "action_href" ilike '%/blacklist-review%'
   or "action_href" ilike '%/review-pelanggaran%'
   or "action_href" ilike '%/bantuan/blacklist%';

update "blacklist_action_log"
set "action" = 'cabut_manual'
where "action" = 'review_disetujui';

delete from "blacklist_action_log"
where "action" in ('review_diajukan', 'review_ditolak', 'otomatis');

update "blacklist_action_log"
set "note" = replace(
  "note",
  'membutuhkan review manual',
  'membutuhkan evaluasi manual'
)
where "note" like '%membutuhkan review manual%';

update "pelanggaran_user"
set "resolution_type" = 'cabut_manual'
where "resolution_type" = 'review_disetujui';

delete from "barang"
where "id" like 'seed-level3-review-%';

delete from "user"
where "id" = 'seed-level3-review-user';

delete from "user"
where "id" like 'qa-%';

delete from "buyer_profile" as profile
using "user" as owner
where profile."user_id" = owner."id"
  and owner."role" <> 'buyer';

delete from "session"
where "expires_at" <= now();

delete from "verification"
where "expires_at" <= now();

drop table if exists "blacklist_review_attachment";
drop table if exists "blacklist_review_case";
`;
