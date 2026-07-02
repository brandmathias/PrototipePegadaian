# Remove Handover Complaint Design

## Goal

Remove the handover-complaint feature completely from buyer, admin unit, superadmin, services, API contracts, automated finalization, tests, and PostgreSQL.

## Retained workflow

1. Payment is verified.
2. Admin unit uploads physical handover documentation.
3. Buyer presses `Pembelian Selesai`.
4. If the buyer does not respond, the existing grace-period job completes the transaction automatically.
5. The final receipt remains available only after buyer or automatic completion.

## Removed runtime behavior

- Buyer complaint button, dialog, request, status, and explanatory copy.
- Complaint API route and buyer service mutation.
- Complaint fields in buyer, admin-unit, marketing, and superadmin contracts and serializers.
- Complaint-based hold conditions in the handover finalization helper and cron query.

## Database change

An idempotent PostgreSQL migration drops these columns from `transaksi`:

- `handover_complaint_at`
- `handover_complaint_note`

Dropping the columns also permanently removes all historical values stored in them. No handover-complaint table exists.

## Verification

- A regression test proves the retired route, component, schema keys, SQL additions, and runtime terms are absent.
- Finalization and cron tests prove eligible transactions still auto-complete without complaint branching.
- Relevant UI, serializer, migration, and service tests pass.
- TypeScript and the production build pass.
- A repository audit finds no active handover-complaint identifier, endpoint, or user-facing copy.
