export const HANDOVER_AUTO_COMPLETION_MIGRATION_SQL = `
alter table "transaksi"
  add column if not exists "handover_complaint_at" timestamp with time zone;

alter table "transaksi"
  add column if not exists "handover_complaint_note" text;

alter table "transaksi"
  add column if not exists "completed_at" timestamp with time zone;

alter table "transaksi"
  add column if not exists "completion_source" text;
`;
