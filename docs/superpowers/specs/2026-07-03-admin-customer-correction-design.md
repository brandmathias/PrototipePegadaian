# Admin Customer and Appraisal Correction Design

## Goal

Allow an admin unit to temporarily correct the pawner/customer name, phone
number, and appraisal value from both active inventory and item history. A
customer identity correction must remain consistent across every item owned by
the same customer in the same unit, regardless of each item's status.

## Scope

- Make the customer name, phone number, and appraisal value editable.
- Expose the same correction flow from Kelola Barang and Riwayat Barang.
- Permit corrections for every item status, including marketed, failed,
  redeemed, and sold items.
- Synchronize customer name and phone number across related items in the same
  unit.
- Keep appraisal values item-specific.
- Persist all changes in PostgreSQL and make existing cross-role reads reflect
  the corrected values.

This change does not introduce a customer master table, alter transaction
amounts, reopen completed workflows, or grant an admin access to another
unit's records.

## Selected Approach

Use the existing `barang` table as the current source of customer identity.
When correcting an item, the backend uses the selected item's original
`unit_id` and `customer_number` to locate related items. It updates their
`owner_name` and `customer_number` together in one database transaction.

This is preferred over introducing a new customer master table because the
feature is explicitly temporary, the existing application already reads
customer identity from `barang`, and a new entity would require a broad data
migration without adding necessary behavior.

## User Interface

### Edit page

The existing item edit page gains editable controls for:

- Nama nasabah/penggadai
- Nomor telepon
- Nilai taksiran

For item states already eligible for normal editing, the existing editable
product fields remain available. For terminal or otherwise locked states, only
the three correction fields are editable; product, marketing, status, loan,
and transaction data remain read-only.

The phone input accepts digits only, has a maximum input length of 13, and
shows an inline error unless it contains 10 to 13 digits.

### Entry points

- Kelola Barang keeps its existing detail/edit route.
- Each Riwayat Barang row receives an `Edit Data` action that opens the same
  item edit page.
- After a successful save, the page shows a success message and refreshes the
  current route so lists and details use the latest server data.

## Backend Rules

The existing item update endpoint supports two server-enforced update modes:

1. Full editing for item states already allowed by the current marketing edit
   policy.
2. Correction-only editing for all other states.

Correction-only requests may change only:

- `ownerName`
- `customerNumber`
- `appraisalValue`

The backend never trusts disabled frontend controls. Any attempt to change
other fields for a locked item is rejected.

Validation rules:

- Customer name is required after trimming.
- Phone number is normalized to digits and must contain 10 to 13 digits.
- Appraisal value must be greater than zero.
- Appraisal value cannot be lower than the item's existing loan value.
- The selected item must belong to the authenticated admin's unit.
- If the new phone number already belongs to a different customer name within
  the same unit, the update is rejected to avoid merging unrelated customers.

## Database Transaction

One PostgreSQL transaction performs the correction:

1. Load and lock the selected item within the authenticated unit.
2. Capture its original `customer_number`.
3. Validate the requested phone and collision rules.
4. Update `owner_name` and `customer_number` on every `barang` row in the same
   unit whose stored `customer_number` matches the original number.
5. Update `appraisal_value` only on the selected `barang` row.
6. Update timestamps and commit.

If any step fails, all writes roll back. No schema migration or additional
table is required.

## Synchronization Behavior

The history service currently joins history events to the current `barang`
row. Therefore, once all related `barang` rows are corrected:

- Kelola Barang shows the corrected customer data.
- Riwayat Barang shows the corrected customer data for all statuses.
- Item detail and redemption-related admin views show the corrected data.
- Superadmin and other roles that read the same `barang` records receive the
  same values without duplicate synchronization code.

Appraisal changes remain attached only to the selected item because each
pledged item has an independent valuation.

## Error Handling

- Validation failures return a clear Indonesian message and do not modify the
  database.
- A customer collision explains that the phone is already associated with a
  different customer in the same unit.
- Network/server failures keep entered form values and allow the admin to retry.
- A missing or cross-unit item returns the existing not-found/authorization
  behavior.

## Verification

Automated tests will cover:

- Phone normalization and the 10-to-13-digit limits.
- Rejection of appraisal below loan value.
- Correction access for terminal item states.
- Rejection of non-correction field changes on locked items.
- Same-unit propagation of customer name and phone across mixed item statuses.
- No propagation to another unit.
- Appraisal changes only on the selected item.
- Collision rejection for a phone owned by a different customer.
- Riwayat Barang rendering an `Edit Data` action.
- The edit form rendering and submitting the three correction fields.

Final verification consists of targeted tests, TypeScript checking, and a
production build before commit and push of the implementation.
