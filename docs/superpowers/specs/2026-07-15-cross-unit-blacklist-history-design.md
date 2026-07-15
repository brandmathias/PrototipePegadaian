# Cross-Unit Blacklist History Design

## Goal

Make every admin unit able to see the buyer violations that occurred in its own auctions while keeping superadmin as the authoritative view of the buyer's global accumulated restriction.

The fix must make the production scenario unambiguous:

- UPC Sarinah shows Safira Melani's Level 1 violation as ended.
- UPC Ranotana shows Safira Melani's Level 2 violation as ended.
- UPC Wanea shows Safira Melani's Level 3 violation as active.
- Superadmin shows one global Safira Melani restriction at Level 3 with three counted cross-unit violations.

## Confirmed root cause

The admin-unit list currently starts from the single global `blacklist` row and filters that row by `blacklist.unit_id`. Every escalation moves the global row's unit reference to the unit of the latest violation. After Level 3 occurs in UPC Wanea, UPC Sarinah and UPC Ranotana no longer receive a row even though their local violations remain stored in `pelanggaran_user`.

The `Berakhir` tab only filters the rows already returned by the service. It cannot show ended local violations when the service returns no row. The admin detail service has the same ownership filter, so an older unit can also lose access to its legitimate local history.

## Domain contract

The two screens intentionally answer different questions:

- Admin unit: "What violation occurred through this unit, and has that local restriction window ended?"
- Superadmin: "What is this buyer's current accumulated restriction across all units?"

An admin-unit row therefore uses the latest counted violation milestone belonging to that unit. A superadmin row continues to use the latest global milestone across all units.

## Data model

No schema change and no duplicate blacklist rows are required.

- `pelanggaran_user` remains the source of individual payment violations and their unit ownership.
- `blacklist` remains one global accumulated restriction row per buyer.
- Existing escalation rules remain the source of counted milestone levels and restriction deadlines.
- `blacklist_action_log` remains the global automatic audit ledger.

The implementation must derive display state from existing records rather than inserting one blacklist row per unit.

## Admin-unit list behavior

`listAdminBlacklist(unitId)` will start from eligible local violation traces for the requested unit, not from `blacklist.unit_id`.

For buyers found in those traces, the service will:

1. Load their single global blacklist record by buyer ID.
2. Load all eligible cross-unit escalation facts needed to assign sequential milestone levels.
3. Annotate the local traces with their globally determined Level 1, Level 2, or Level 3 milestone.
4. Use the latest counted local milestone to derive the unit row's displayed level, start time, end time, and active/ended state.
5. Keep aggregate counts available for context without changing the local row's status.

The client tabs continue to filter returned rows:

- `Level 1`, `Level 2`, and `Level 3` use the displayed local milestone.
- `Aktif` contains local milestones whose restriction end is still in the future.
- `Berakhir` contains local milestones whose restriction end has passed.

A local violation that was not eligible for escalation must not create a unit blacklist row.

## Admin-unit detail and authorization

The detail service will authorize access using counted local violation ownership, not the current unit reference on the global blacklist row.

- The requested buyer must have at least one counted violation trace in the signed-in admin's unit.
- Item, auction, transaction, payment-deadline, and bid details shown to an admin remain limited to that unit.
- The page may show a compact global accumulation summary, such as total counted violations and current global level.
- It must not reveal item or transaction details belonging to another unit.
- A buyer with no counted violation in the admin's unit remains inaccessible to that admin.

## Superadmin synchronization

The superadmin contract remains global and authoritative:

- One buyer appears once, even when violations span multiple units.
- Effective level and active status come from the latest sequential global milestone.
- The global detail may show all counted traces across units because superadmin has cross-unit authority.
- Admin-unit local status must not overwrite or downgrade the stored global blacklist state.

The existing superadmin service should remain unchanged unless a regression test proves a shared helper must be adjusted. A regression test will explicitly protect the one-row, Level 3 global result while the admin-unit tests protect the three local views.

## Time semantics

Restriction time is derived from the payment deadline that caused each counted violation and the policy duration for its assigned level:

- Level 1: 7 days.
- Level 2: 30 days.
- Level 3: 365 days.

All comparisons use absolute timestamps. Formatting must use the application's established timezone helper so the displayed start, end, countdown, and active/ended status agree with one another.

## Error handling

- Missing global blacklist data for a locally eligible trace is treated as inconsistent data and must be surfaced deliberately rather than silently fabricating state.
- A local trace without a valid counted milestone is excluded from the blacklist ledger.
- Detail access without a counted local trace returns the existing not-found/forbidden behavior.
- No production mutation or automatic repair is performed by read services.

## Test strategy

Regression tests will be written before implementation and must initially fail for the current behavior.

Required cases:

1. A global blacklist row currently owned by UPC Wanea does not prevent UPC Sarinah from listing its ended Level 1 incident.
2. The same buyer is listed by UPC Ranotana as ended Level 2.
3. UPC Wanea lists the buyer as active Level 3.
4. The `Berakhir` classification receives the Sarinah and Ranotana rows; `Aktif` receives the Wanea row.
5. Sarinah and Ranotana can open their local details even though `blacklist.unit_id` points to Wanea.
6. An unrelated unit cannot open the buyer's detail.
7. Local details contain no other-unit item or transaction data.
8. Superadmin still receives one buyer row at active Level 3 with three counted cross-unit violations.
9. Existing sequential-escalation, type-check, and production-build checks remain green.

## Production verification

After deployment, verification is read-only:

- Open each unit's violation page and verify the expected local row and tab.
- Open the same buyer in superadmin and verify one global Level 3 record with three milestones.
- Compare displayed deadlines against the stored payment deadlines and policy durations.
- Confirm no duplicate `blacklist` row was created and no production history was rewritten.

