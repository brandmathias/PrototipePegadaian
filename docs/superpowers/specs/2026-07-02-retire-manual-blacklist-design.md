# Retire Manual Blacklist Design

## Goal

Remove the retired blacklist review, manual revoke, and manual extension feature end to end while preserving the automatic sequential blacklist system.

## Confirmed root cause

The previous cleanup removed legacy rows and review tables, but the application schema still declared manual-feature columns and the application still exposed manual routes and services. The production deployment runs the application build/start flow and does not automatically apply a general Drizzle migration, so a Git push alone cannot drop PostgreSQL columns.

## Retained behavior

- Payment-deadline violations remain the only source of blacklist escalation.
- `pelanggaran_user.escalation_eligible` remains because sequential escalation uses it.
- Blacklist levels remain 7, 30, and 365 days.
- Level 3 may suspend login automatically for its 365-day window.
- The expiry job ends every expired level automatically and reactivates an account suspended by level 3.
- `blacklist_action_log` remains as an automatic audit ledger with `action`, `note`, and timestamps.

## Removed behavior

- Superadmin manual blacklist revoke API, service, validation, reason options, and form.
- Admin-unit manual blacklist extension page, API, service, validation, and form.
- Manual-review wording and perpetual level-3 behavior.
- Manual actor joins and labels in blacklist history.
- Demo/mock/seed content for manual blacklist actions.

## Database change

The migration first removes any remaining non-automatic blacklist action rows, normalizes retained blacklist state, and then drops:

- `blacklist.revoked_by_user_id`
- `blacklist.revoke_reason`
- `blacklist_action_log.performed_by_type`
- `blacklist_action_log.performed_by_user_id`
- `pelanggaran_user.resolution_type`
- `pelanggaran_user.resolution_reason_code`
- `pelanggaran_user.resolution_note`
- `pelanggaran_user.resolved_by_user_id`
- `pelanggaran_user.resolved_at`

The migration is applied transactionally and audited against `information_schema` plus live action/state data.

## Verification

- A regression test proves retired routes/files and schema keys are absent.
- Policy tests prove level 3 expires by date rather than waiting for manual review.
- Cron tests prove expired level 3 is closed and its suspended buyer is reactivated.
- Existing targeted tests, TypeScript, and production build must pass.
- Production audit must show no retired columns, no retired review tables, and only supported automatic action values.
