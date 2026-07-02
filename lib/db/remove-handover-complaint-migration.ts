export const REMOVE_HANDOVER_COMPLAINT_MIGRATION_SQL = `
alter table "transaksi"
  drop column if exists "handover_complaint_at";

alter table "transaksi"
  drop column if exists "handover_complaint_note";
`;
