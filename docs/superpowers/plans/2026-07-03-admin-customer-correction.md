# Admin Customer Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin units to correct customer name, phone number, and item appraisal from active or historical items while synchronizing that customer identity across all matching items in the same unit.

**Architecture:** Keep `barang` as the current customer-data source. The existing update endpoint distinguishes full edits from correction-only edits, validates the three correction fields, and performs same-unit customer propagation plus the selected appraisal update in one PostgreSQL transaction. Existing history/detail readers automatically receive the corrected values.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Drizzle ORM, PostgreSQL, Vitest, Testing Library

---

## File Map

- Modify `lib/admin-unit/validation.ts`: normalize and validate customer correction data.
- Modify `lib/services/admin-barang.service.ts`: enforce update modes and execute the atomic same-unit correction.
- Modify `components/admin-unit/admin-barang-edit-form.tsx`: expose editable correction fields and correction-only UI.
- Modify `components/pages/admin-pages.tsx`: allow every item status to reach the edit route and select correction-only presentation.
- Modify `components/admin/admin-inventory-workspace.tsx`: add the history edit action.
- Modify `tests/admin-unit-validation.test.ts`: cover phone and appraisal validation.
- Modify `tests/admin-barang-service.test.ts`: cover propagation, isolation, collision, and locked-field protection.
- Modify `tests/admin-gadai-actions.test.tsx`: cover editable form state and correction-only payload.
- Modify `tests/admin-inventory-detail-page.test.tsx`: cover edit access for terminal states.
- Modify `tests/admin-inventory-workspace.test.tsx`: cover the history edit link.

### Task 1: Customer Correction Validation

**Files:**
- Modify: `lib/admin-unit/validation.ts`
- Test: `tests/admin-unit-validation.test.ts`

- [ ] **Step 1: Write failing correction validation tests**

Add tests that expect:

```ts
expect(
  validateAdminBarangCorrectionPayload(
    {
      ownerName: "  Raras Maheswari ",
      customerNumber: "0812-3456-7890",
      appraisalValue: "8500000",
    },
    "6500000",
  ),
).toEqual({
  ownerName: "Raras Maheswari",
  customerNumber: "081234567890",
  appraisalValue: "8500000",
});

expect(() =>
  validateAdminBarangCorrectionPayload(
    { ownerName: "Raras", customerNumber: "081234567", appraisalValue: "8500000" },
    "6500000",
  ),
).toThrow("Nomor telepon harus terdiri dari 10 sampai 13 digit.");

expect(() =>
  validateAdminBarangCorrectionPayload(
    { ownerName: "Raras", customerNumber: "081234567890", appraisalValue: "6000000" },
    "6500000",
  ),
).toThrow("Nilai taksiran tidak boleh lebih kecil dari nilai gadai.");
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:

```powershell
rtk npm test -- tests/admin-unit-validation.test.ts
```

Expected: FAIL because `validateAdminBarangCorrectionPayload` does not exist.

- [ ] **Step 3: Implement the focused validator**

Add:

```ts
export function validateAdminBarangCorrectionPayload(
  input: {
    ownerName?: unknown;
    customerNumber?: unknown;
    appraisalValue?: unknown;
  },
  currentLoanValue: string | number,
) {
  const ownerName = requiredText(input.ownerName, "Nama penggadai wajib diisi.");
  const customerNumber = String(input.customerNumber ?? "").replace(/\D/g, "");
  const appraisalValue = normalizeMoney(input.appraisalValue, "Nilai taksiran harus lebih dari 0.");

  if (!/^\d{10,13}$/.test(customerNumber)) {
    throw new Error("Nomor telepon harus terdiri dari 10 sampai 13 digit.");
  }

  if (Number(appraisalValue) < Number(currentLoanValue)) {
    throw new Error("Nilai taksiran tidak boleh lebih kecil dari nilai gadai.");
  }

  return { ownerName, customerNumber, appraisalValue };
}
```

- [ ] **Step 4: Run validation tests**

Run:

```powershell
rtk npm test -- tests/admin-unit-validation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit validation**

```powershell
rtk git add lib/admin-unit/validation.ts tests/admin-unit-validation.test.ts
rtk git commit -m "test: define admin customer correction validation"
```

### Task 2: Atomic Same-Unit Correction Service

**Files:**
- Modify: `lib/services/admin-barang.service.ts`
- Test: `tests/admin-barang-service.test.ts`

- [ ] **Step 1: Write failing service tests**

Add test cases that mock `db.transaction` and assert:

```ts
await updateAdminBarang("unit-1", "barang-sold", {
  correctionOnly: true,
  ownerName: "Raras Maheswari",
  customerNumber: "081234567890",
  appraisalValue: "9000000",
});

expect(customerUpdateWhere).toHaveBeenCalled();
expect(customerUpdateSet).toHaveBeenCalledWith(
  expect.objectContaining({
    ownerName: "Raras Maheswari",
    customerNumber: "081234567890",
  }),
);
expect(appraisalUpdateSet).toHaveBeenCalledWith(
  expect.objectContaining({ appraisalValue: "9000000" }),
);
```

Also cover:

- the customer propagation predicate contains both `unit_id = unit-1` and the original phone;
- appraisal is updated only with `barang.id = barang-sold`;
- a matching target phone owned by a different customer throws
  `Nomor telepon sudah digunakan nasabah lain di unit ini.`;
- a terminal item with `correctionOnly: false` remains blocked;
- a correction request carrying product fields is rejected.

- [ ] **Step 2: Run service tests and confirm failure**

Run:

```powershell
rtk npm test -- tests/admin-barang-service.test.ts
```

Expected: FAIL because terminal correction mode and transactional propagation are absent.

- [ ] **Step 3: Extend the update input contract**

Use:

```ts
type AdminBarangUpdateInput = Parameters<typeof validateAdminBarangPayload>[0] & {
  correctionOnly?: unknown;
  marketingPrice?: unknown;
};
```

Import `validateAdminBarangCorrectionPayload`. Treat
`input.correctionOnly === true` as a correction request. Reject product,
marketing, loan, and date fields when correction-only mode is active.

- [ ] **Step 4: Implement collision detection and transactional writes**

Within `db.transaction`:

```ts
const correction = validateAdminBarangCorrectionPayload(input, current.loanValue);
const oldCustomerNumber = current.customerNumber;

if (correction.customerNumber !== oldCustomerNumber) {
  const [existingCustomer] = await tx
    .select({ ownerName: barang.ownerName })
    .from(barang)
    .where(and(
      eq(barang.unitId, unitId),
      eq(barang.customerNumber, correction.customerNumber),
    ))
    .limit(1);

  if (
    existingCustomer &&
    existingCustomer.ownerName.trim().toLocaleLowerCase("id-ID") !==
      correction.ownerName.toLocaleLowerCase("id-ID")
  ) {
    throw new Error("Nomor telepon sudah digunakan nasabah lain di unit ini.");
  }
}

await tx
  .update(barang)
  .set({
    ownerName: correction.ownerName,
    customerNumber: correction.customerNumber,
    updatedAt: new Date(),
  })
  .where(and(
    eq(barang.unitId, unitId),
    eq(barang.customerNumber, oldCustomerNumber),
  ));

const [updated] = await tx
  .update(barang)
  .set({
    appraisalValue: correction.appraisalValue,
    updatedAt: new Date(),
  })
  .where(and(eq(barang.id, barangId), eq(barang.unitId, unitId)))
  .returning();
```

For full edits, preserve the existing marketing policy and fields, but execute
the full item update, customer propagation, and optional fixed-price update in
the same transaction. Validate the correction fields in both modes.

- [ ] **Step 5: Run service tests**

Run:

```powershell
rtk npm test -- tests/admin-barang-service.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit service behavior**

```powershell
rtk git add lib/services/admin-barang.service.ts tests/admin-barang-service.test.ts
rtk git commit -m "feat: synchronize corrected customer data per unit"
```

### Task 3: Editable Correction Form for Every Status

**Files:**
- Modify: `components/admin-unit/admin-barang-edit-form.tsx`
- Modify: `components/pages/admin-pages.tsx`
- Test: `tests/admin-gadai-actions.test.tsx`
- Test: `tests/admin-inventory-detail-page.test.tsx`

- [ ] **Step 1: Write failing form and terminal-state tests**

Update fixtures to use valid phone numbers and assert:

```ts
fireEvent.change(screen.getByLabelText("Nama penggadai"), {
  target: { value: "Raras Maheswari" },
});
fireEvent.change(screen.getByLabelText("Nomor telepon nasabah"), {
  target: { value: "0812-3456-7890" },
});
fireEvent.change(screen.getByLabelText("Nilai taksiran"), {
  target: { value: "9000000" },
});

expect(JSON.parse(String((request as RequestInit).body))).toMatchObject({
  ownerName: "Raras Maheswari",
  customerNumber: "081234567890",
  appraisalValue: "9000000",
});
```

Render a terminal item and assert its detail page contains the `Edit Data
Barang` link. Render the form with `correctionOnly` and assert product fields
are absent while the three correction fields remain enabled.

- [ ] **Step 2: Run UI tests and confirm failure**

Run:

```powershell
rtk npm test -- tests/admin-gadai-actions.test.tsx tests/admin-inventory-detail-page.test.tsx
```

Expected: FAIL because the correction controls and terminal edit access are absent.

- [ ] **Step 3: Add controlled correction fields**

In `AdminBarangEditForm`, add state for `ownerName`, `customerNumber`, and
`appraisalValue`. Normalize phone input on change:

```tsx
<Input
  id="admin-barang-customer-number"
  inputMode="numeric"
  maxLength={13}
  minLength={10}
  onChange={(event) => setCustomerNumber(event.target.value.replace(/\D/g, "").slice(0, 13))}
  pattern="[0-9]{10,13}"
  required
  value={customerNumber}
/>
```

Submit the controlled values. When `correctionOnly` is true, submit only:

```ts
{
  correctionOnly: true,
  ownerName,
  customerNumber,
  appraisalValue,
}
```

Otherwise preserve the full existing payload with the controlled correction
values included.

- [ ] **Step 4: Select correction-only presentation by status**

In `AdminInventoryEditPage`, derive:

```ts
const normalizedStatus = String(item.status ?? "").toUpperCase();
const correctionOnly =
  !["GADAI", "JAMINAN", "GAGAL"].includes(normalizedStatus) &&
  !(normalizedStatus === "DIPASARKAN" && String(item.marketingMode ?? "").toLowerCase() === "fixed_price");
```

Pass `correctionOnly` and `status` to the form. Hide the editable media manager
in correction-only mode. Change the audit copy so appraisal is no longer
described as locked.

Always render the detail-page `Edit Data Barang` link for an authenticated
admin unit, including terminal statuses.

- [ ] **Step 5: Run UI tests**

Run:

```powershell
rtk npm test -- tests/admin-gadai-actions.test.tsx tests/admin-inventory-detail-page.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit form and detail access**

```powershell
rtk git add components/admin-unit/admin-barang-edit-form.tsx components/pages/admin-pages.tsx tests/admin-gadai-actions.test.tsx tests/admin-inventory-detail-page.test.tsx
rtk git commit -m "feat: allow customer corrections for every item status"
```

### Task 4: History Edit Action

**Files:**
- Modify: `components/admin/admin-inventory-workspace.tsx`
- Test: `tests/admin-inventory-workspace.test.tsx`

- [ ] **Step 1: Write the failing history-link test**

Add:

```ts
expect(screen.getByRole("link", { name: "Edit Data" })).toHaveAttribute(
  "href",
  "/admin/barang/barang-1/edit",
);
```

- [ ] **Step 2: Run the history test and confirm failure**

Run:

```powershell
rtk npm test -- tests/admin-inventory-workspace.test.tsx
```

Expected: FAIL because only `Lihat detail` exists.

- [ ] **Step 3: Add the compact edit action**

Keep the action column compact by stacking the existing detail link and:

```tsx
<DetailActionLink
  href={`/admin/barang/${entry.barangId}/edit`}
  label="Edit Data"
/>
```

Do not add the action to the printable audit document.

- [ ] **Step 4: Run the history test**

Run:

```powershell
rtk npm test -- tests/admin-inventory-workspace.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit history access**

```powershell
rtk git add components/admin/admin-inventory-workspace.tsx tests/admin-inventory-workspace.test.tsx
rtk git commit -m "feat: expose item correction from history"
```

### Task 5: Regression and Production-Safe Verification

**Files:**
- Verify all modified files

- [ ] **Step 1: Run the targeted regression suite**

```powershell
rtk npm test -- tests/admin-unit-validation.test.ts tests/admin-barang-service.test.ts tests/admin-gadai-actions.test.tsx tests/admin-inventory-detail-page.test.tsx tests/admin-inventory-workspace.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 2: Run the full test suite**

```powershell
rtk npm test
```

Expected: all tests PASS.

- [ ] **Step 3: Run TypeScript validation**

```powershell
rtk npx tsc --noEmit --pretty false
```

Expected: exit code 0.

- [ ] **Step 4: Run the production build**

```powershell
rtk npm run build
```

Expected: Next.js production build succeeds.

- [ ] **Step 5: Inspect the final diff**

```powershell
rtk git diff --check
rtk git status --short
rtk git log -6 --oneline
```

Expected: no whitespace errors; only intended commits/files are present.

- [ ] **Step 6: Push the completed implementation**

```powershell
rtk git push origin master
```

Expected: the current implementation commits are pushed successfully.
