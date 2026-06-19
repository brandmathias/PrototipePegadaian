export const HANDOVER_PROOF_CONSTRAINT_NAME =
  "transaksi_handover_proof_uploaded_by_user_id_user_id_fk";

export const HANDOVER_PROOF_MIGRATION_SQL = `
alter table "transaksi"
  add column if not exists "handover_proof_url" text;

alter table "transaksi"
  add column if not exists "handover_proof_uploaded_at" timestamp with time zone;

alter table "transaksi"
  add column if not exists "handover_proof_uploaded_by_user_id" text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = '${HANDOVER_PROOF_CONSTRAINT_NAME}'
      and conrelid = 'transaksi'::regclass
  ) then
    alter table "transaksi"
      add constraint "${HANDOVER_PROOF_CONSTRAINT_NAME}"
      foreign key ("handover_proof_uploaded_by_user_id")
      references "public"."user"("id")
      on delete set null
      on update no action;
  end if;
end $$;
`;
