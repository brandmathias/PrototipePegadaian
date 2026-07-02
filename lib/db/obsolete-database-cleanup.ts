export const OBSOLETE_DATABASE_TABLES = [
  "blacklist_review_attachment",
  "blacklist_review_case"
] as const;

type LegacyRealAccountIdRepair = {
  oldUserId: string;
  newUserId: string;
  newAccountRowId: string;
  oldBuyerProfileId?: string;
  newBuyerProfileId?: string;
  oldBlacklistId?: string;
  newBlacklistId?: string;
  oldBlacklistLogId?: string;
  newBlacklistLogId?: string;
};

export const LEGACY_REAL_ACCOUNT_ID_REPAIRS: readonly LegacyRealAccountIdRepair[] = [
  {
    oldUserId: "admin-unit-demo-local",
    newUserId: "3ae5d615-d640-4a8b-8174-3ca28c8b824c",
    newAccountRowId: "08171707-1333-4063-999e-6eb569067351"
  },
  {
    oldUserId: "buyer-admin-unit-demo-local",
    newUserId: "ecdb3b42-99f7-4a5f-8020-3f8070a1b4df",
    newAccountRowId: "2c36894d-45aa-40e4-98d8-276340548aad",
    oldBlacklistId: "blk-admin-unit-demo-local",
    newBlacklistId: "dd6fcddb-fe00-4cc7-b1b5-97a924d302c8",
    oldBlacklistLogId: "blk-log-admin-unit-demo-local",
    newBlacklistLogId: "065a60d1-aa24-48de-a1f4-f3400dfd9564"
  },
  {
    oldUserId: "seed-buyer-simple-1",
    newUserId: "25524a61-604d-4eb7-8c8a-787e45466d63",
    newAccountRowId: "405c5189-d5af-4e32-86ac-3631bffe6d14",
    oldBuyerProfileId: "seed-buyer-simple-1-profile",
    newBuyerProfileId: "6168e2cc-df5e-4e88-9578-b7776780157d"
  },
  {
    oldUserId: "seed-buyer-simple-2",
    newUserId: "e353f820-1060-4a31-86e3-52c0c7b0d98f",
    newAccountRowId: "f62e1c6a-40d9-442b-be3a-af890dfb6edf",
    oldBuyerProfileId: "seed-buyer-simple-2-profile",
    newBuyerProfileId: "08be2eae-8dcc-4021-869f-bc1c88c44328"
  }
] as const;

export const OBSOLETE_DEMO_USER_IDS = [
  "e72cbc9a-4c10-4df5-9f42-0069cb9a7449",
  "f574be26-79b1-4605-b992-f29e8c27b4ec",
  "9fac63bb-092c-4917-a1c5-6ec38ebb139e",
  "THcz3hXzETC2aE7FLoyQNQUqIybyQrqg",
  "ay2OrSTlMDhOq2BRmf6mf6L2k3tgZj0h",
  "BIMKBXimQSMHVl5gJjz9c8OSUppHvajp",
  "x8zkHFb7RHBiecsFPENz2pcoAzBOTKuo",
  "hGCZedleORx2YWzc1WMnx6mnbsVoHbA5",
  "hu2DffTnOpghsE3PNH1EPoQNrBxHYnpU",
  "7oSngAdHUgQs6KUWRifJdg0DXGhr8h8h",
  "9GgghqI1pf47KIXknFnozYXq1sLBMMG4",
  "ojZUiy342QiFZWWSoNjhHjTVoUvlVJ8m",
  "seed-level1-expired-user",
  "seed-level2-active-user",
  "pM2ZN4FVbyCPWirptofxurjVz3VspWSt"
] as const;

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlNullable(value?: string) {
  return value ? sqlLiteral(value) : "null";
}

const legacyRealAccountRepairValues = LEGACY_REAL_ACCOUNT_ID_REPAIRS.map((repair) =>
  [
    repair.oldUserId,
    repair.newUserId,
    repair.newAccountRowId,
    repair.oldBuyerProfileId,
    repair.newBuyerProfileId,
    repair.oldBlacklistId,
    repair.newBlacklistId,
    repair.oldBlacklistLogId,
    repair.newBlacklistLogId
  ]
    .map(sqlNullable)
    .join(", ")
)
  .map((row) => `(${row})`)
  .join(",\n      ");

const obsoleteDemoUserValues = OBSOLETE_DEMO_USER_IDS.map((id) => `(${sqlLiteral(id)})`).join(",\n  ");

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

delete from "blacklist_action_log"
where "action" in ('review_diajukan', 'review_ditolak', 'review_disetujui', 'otomatis');

do $cleanup$
declare
  repair record;
  fk record;
  legacy_user record;
  legacy_blacklist record;
begin
  for repair in
    select *
    from (values
      ${legacyRealAccountRepairValues}
    ) as legacy_real_account_id_repairs(
      old_user_id,
      new_user_id,
      new_account_row_id,
      old_buyer_profile_id,
      new_buyer_profile_id,
      old_blacklist_id,
      new_blacklist_id,
      old_blacklist_log_id,
      new_blacklist_log_id
    )
  loop
    if exists (select 1 from "user" where "id" = repair.old_user_id)
       and not exists (select 1 from "user" where "id" = repair.new_user_id) then
      select * into legacy_user
      from "user"
      where "id" = repair.old_user_id;

      update "user"
      set "email" = concat('legacy+', repair.old_user_id, '@cleanup.local'),
          "national_id" = null,
          "phone_number" = null,
          "updated_at" = now()
      where "id" = repair.old_user_id;

      insert into "user" (
        "id",
        "name",
        "email",
        "email_verified",
        "image",
        "role",
        "phone_number",
        "national_id",
        "created_at",
        "updated_at",
        "unit_id",
        "is_active",
        "super_admin_level"
      )
      values (
        repair.new_user_id,
        legacy_user.name,
        legacy_user.email,
        legacy_user.email_verified,
        legacy_user.image,
        legacy_user.role,
        legacy_user.phone_number,
        legacy_user.national_id,
        legacy_user.created_at,
        now(),
        legacy_user.unit_id,
        legacy_user.is_active,
        legacy_user.super_admin_level
      );
    end if;

    if exists (select 1 from "user" where "id" = repair.new_user_id) then
      for fk in
        select tc.table_schema, tc.table_name, kcu.column_name
        from information_schema.table_constraints tc
        join information_schema.key_column_usage kcu
          on tc.constraint_name = kcu.constraint_name
         and tc.table_schema = kcu.table_schema
        join information_schema.constraint_column_usage ccu
          on ccu.constraint_name = tc.constraint_name
         and ccu.table_schema = tc.table_schema
        join information_schema.referential_constraints rc
          on rc.constraint_name = tc.constraint_name
         and rc.constraint_schema = tc.table_schema
        where tc.constraint_type = 'FOREIGN KEY'
          and tc.table_schema = 'public'
          and ccu.table_name = 'user'
          and ccu.column_name = 'id'
      loop
        execute format(
          'update %I.%I set %I = $1 where %I = $2',
          fk.table_schema,
          fk.table_name,
          fk.column_name,
          fk.column_name
        )
        using repair.new_user_id, repair.old_user_id;
      end loop;

      update "account"
      set "account_id" = repair.new_user_id,
          "updated_at" = now()
      where "user_id" = repair.new_user_id
        and "account_id" = repair.old_user_id;

      update "account"
      set "id" = repair.new_account_row_id,
          "updated_at" = now()
      where "user_id" = repair.new_user_id
        and "provider_id" = 'credential'
        and "id" <> repair.new_account_row_id
        and not exists (
          select 1 from "account" existing
          where existing."id" = repair.new_account_row_id
        );

      if repair.new_buyer_profile_id is not null then
        update "buyer_profile"
        set "id" = repair.new_buyer_profile_id,
            "updated_at" = now()
        where "user_id" = repair.new_user_id
          and "id" = repair.old_buyer_profile_id
          and not exists (
            select 1 from "buyer_profile" existing
            where existing."id" = repair.new_buyer_profile_id
          );
      end if;

      delete from "pemasaran_views" old_view
      using "pemasaran_views" new_view
      where old_view."viewer_key" = concat('user:', repair.old_user_id)
        and new_view."pemasaran_id" = old_view."pemasaran_id"
        and new_view."viewer_key" = concat('user:', repair.new_user_id);

      update "pemasaran_views"
      set "viewer_key" = concat('user:', repair.new_user_id),
          "updated_at" = now()
      where "viewer_key" = concat('user:', repair.old_user_id);

      update "notifications"
      set "entity_id" = concat('blacklist-', repair.new_user_id)
      where "entity_type" = 'blacklist'
        and "entity_id" = concat('blacklist-', repair.old_user_id);

      if repair.new_blacklist_id is not null then
        if exists (select 1 from "blacklist" where "id" = repair.old_blacklist_id)
           and not exists (select 1 from "blacklist" where "id" = repair.new_blacklist_id) then
          select * into legacy_blacklist
          from "blacklist"
          where "id" = repair.old_blacklist_id;

          update "blacklist"
          set "is_active" = false,
              "updated_at" = now()
          where "id" = repair.old_blacklist_id;

          insert into "blacklist" (
            "id",
            "unit_id",
            "user_id",
            "total_violations",
            "is_active",
            "blocked_at",
            "blocked_until",
            "updated_at",
            "national_id"
          )
          values (
            repair.new_blacklist_id,
            legacy_blacklist.unit_id,
            legacy_blacklist.user_id,
            legacy_blacklist.total_violations,
            legacy_blacklist.is_active,
            legacy_blacklist.blocked_at,
            legacy_blacklist.blocked_until,
            now(),
            legacy_blacklist.national_id
          );

          update "blacklist_action_log"
          set "blacklist_id" = repair.new_blacklist_id
          where "blacklist_id" = repair.old_blacklist_id;

          delete from "blacklist"
          where "id" = repair.old_blacklist_id;
        end if;

        if repair.new_blacklist_log_id is not null then
          update "blacklist_action_log"
          set "id" = repair.new_blacklist_log_id
          where "id" = repair.old_blacklist_log_id
            and not exists (
              select 1 from "blacklist_action_log" existing
              where existing."id" = repair.new_blacklist_log_id
            );
        end if;
      end if;

      delete from "user"
      where "id" = repair.old_user_id;
    end if;
  end loop;
end
$cleanup$;

update "blacklist" as blacklist
set "national_id" = owner."national_id",
    "updated_at" = now()
from "user" as owner
where blacklist."user_id" = owner."id"
  and owner."national_id" is not null
  and blacklist."national_id" is distinct from owner."national_id";

delete from "blacklist_action_log"
where "action" in ('cabut_manual', 'perpanjang_manual')
   or lower(trim(coalesce("note", ''))) in ('test', 'demo', 'mock', 'data uji')
   or "note" ilike '%review%'
   or "note" ilike '%manual%'
   or "note" ilike '%uji%';

insert into "blacklist_action_log" (
  "id",
  "blacklist_id",
  "target_user_id",
  "action",
  "note",
  "created_at"
)
select
  concat('auto-log-', blacklist."id"),
  blacklist."id",
  blacklist."user_id",
  'blokir_otomatis',
  'Sistem otomatis memblokir buyer karena pelanggaran pembayaran.',
  blacklist."blocked_at"
from "blacklist" as blacklist
where not exists (
    select 1
    from "blacklist_action_log" as existing_for_blacklist
    where existing_for_blacklist."blacklist_id" = blacklist."id"
  )
  and not exists (
    select 1
    from "blacklist_action_log" as existing_by_id
    where existing_by_id."id" = concat('auto-log-', blacklist."id")
  );

update "barang"
set "description" = '',
    "updated_at" = now()
where lower(trim("description")) in ('test', 'test 2', 'test 3', 'test 4', 'demo', 'mock', 'sample', 'contoh', 'data uji');

update "user"
set "email" = 'superadmin1@pegadaian.co.id',
    "updated_at" = now()
where "id" = '097bb17e-56a4-45b0-b971-2c868dd4f3eb'
  and "email" = 'superadmin.demo@example.com'
  and not exists (
    select 1 from "user" existing
    where existing."email" = 'superadmin1@pegadaian.co.id'
      and existing."id" <> '097bb17e-56a4-45b0-b971-2c868dd4f3eb'
  );

update "superadmin_account_audit_log"
set "note" = replace("note", 'Superadmin Demo', 'Superadmin 1')
where "note" like '%Superadmin Demo%';

with obsolete_demo_user_ids("id") as (
  values
  ${obsoleteDemoUserValues}
)
delete from "pemasaran_views"
where "viewer_key" in (
  select concat('user:', obsolete_demo_user_ids."id")
  from obsolete_demo_user_ids
);

with obsolete_demo_user_ids("id") as (
  values
  ${obsoleteDemoUserValues}
)
delete from "user"
where "id" in (select "id" from obsolete_demo_user_ids);

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
