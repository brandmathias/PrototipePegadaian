# Canonical Unit and SBG Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate canonical five-digit unit codes and unique 16-digit SBG item codes while preserving unit names and all existing relations.

**Architecture:** A shared pure helper owns province-to-region mapping and unit-code parsing/formatting. Superadmin forms submit only `unitNumber`; backend validation reconstructs the trusted full code. PostgreSQL owns a sequence for concurrent SBG allocation, while an idempotent migration normalizes current units and rewrites legacy item codes.

**Tech Stack:** Next.js 15, React 19, TypeScript, Drizzle ORM, PostgreSQL, Vitest.

---

### Task 1: Shared canonical unit-code contract

**Files:**
- Modify: `lib/locations/indonesia-provinces.ts`
- Modify: `lib/superadmin/validation.ts`
- Test: `tests/superadmin-validation.test.ts`

- [ ] **Step 1: Write failing helper and validation tests**

```ts
expect(getProvinceRegionCode("Sulawesi Utara")).toBe("MND");
expect(formatUnitCode("Sulawesi Utara", "11793")).toBe("CP-MND-11793");
expect(extractUnitNumber("CP-MND-11793")).toBe("11793");
expect(validateUnitPayload({
  unitNumber: "11793",
  name: "UPC Ranotana",
  address: "Manado",
  domicile: "Sulawesi Utara"
})).toMatchObject({ code: "CP-MND-11793", unitNumber: "11793", name: "UPC Ranotana" });
expect(() => validateUnitPayload({
  unitNumber: "13",
  name: "UPC Ranotana",
  address: "Manado",
  domicile: "Sulawesi Utara"
})).toThrow("Kode unit harus terdiri dari tepat 5 angka.");
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npx vitest run tests/superadmin-validation.test.ts`

Expected: FAIL because the canonical helpers and `unitNumber` contract do not exist.

- [ ] **Step 3: Implement the shared mapping and validation**

```ts
export const PROVINCE_REGION_CODES: Record<IndonesiaProvince, string> = {
  Aceh: "BNA",
  Bali: "DPS",
  Banten: "SER",
  Bengkulu: "BKL",
  "DI Yogyakarta": "YGY",
  "DKI Jakarta": "JKT",
  Gorontalo: "GTO",
  Jambi: "JBI",
  "Jawa Barat": "BDG",
  "Jawa Tengah": "SMG",
  "Jawa Timur": "SBY",
  "Kalimantan Barat": "PTK",
  "Kalimantan Selatan": "BJB",
  "Kalimantan Tengah": "PLK",
  "Kalimantan Timur": "SMD",
  "Kalimantan Utara": "TJS",
  "Kepulauan Bangka Belitung": "PKP",
  "Kepulauan Riau": "TPI",
  Lampung: "BDL",
  Maluku: "AMQ",
  "Maluku Utara": "TTE",
  "Nusa Tenggara Barat": "MTR",
  "Nusa Tenggara Timur": "KPG",
  Papua: "JYP",
  "Papua Barat": "MNN",
  "Papua Barat Daya": "SOQ",
  "Papua Pegunungan": "WMN",
  "Papua Selatan": "MKQ",
  "Papua Tengah": "NBX",
  Riau: "PKU",
  "Sulawesi Barat": "MJU",
  "Sulawesi Selatan": "MKS",
  "Sulawesi Tengah": "PLU",
  "Sulawesi Tenggara": "KDI",
  "Sulawesi Utara": "MND",
  "Sumatera Barat": "PDG",
  "Sumatera Selatan": "PLB",
  "Sumatera Utara": "MDN"
};

export function formatUnitCode(province: unknown, unitNumber: unknown) {
  const domicile = normalizeIndonesiaProvince(province);
  const number = String(unitNumber ?? "").trim();
  if (!domicile || !/^\d{5}$/.test(number)) return null;
  return `CP-${PROVINCE_REGION_CODES[domicile]}-${number}`;
}

export function extractUnitNumber(code: unknown) {
  return String(code ?? "").trim().toUpperCase().match(/^CP-[A-Z]{3}-(\d{5})$/)?.[1] ?? null;
}
```

Update `validateUnitPayload` and `validateManagedUnitCreatePayload` to accept `unitNumber`, preserve `name`, normalize domicile, and derive `code` server-side.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `npx vitest run tests/superadmin-validation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/locations/indonesia-provinces.ts lib/superadmin/validation.ts tests/superadmin-validation.test.ts
git commit -m "feat: canonicalize operational unit codes"
```

### Task 2: Superadmin create/edit unit forms

**Files:**
- Modify: `components/superadmin/unit-form.tsx`
- Modify: `lib/services/unit.service.ts`
- Modify: `app/api/superadmin/unit/route.ts`
- Modify: `app/api/superadmin/unit/[id]/route.ts`
- Test: `tests/superadmin-unit-form.test.tsx`

- [ ] **Step 1: Write failing form tests**

```tsx
expect(screen.getByLabelText("Nomor Unit")).toHaveAttribute("maxLength", "5");
await user.type(screen.getByLabelText("Nomor Unit"), "11793");
await user.click(screen.getByRole("button", { name: /Sulawesi Utara/i }));
expect(screen.getByText("CP-MND-11793")).toBeInTheDocument();
expect(screen.queryByDisplayValue("CP-MND-11793")).not.toBeInTheDocument();
```

Assert create/update requests send `unitNumber: "11793"` and never use the read-only preview as an editable field.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npx vitest run tests/superadmin-unit-form.test.tsx`

Expected: FAIL because the forms still edit and submit the full code.

- [ ] **Step 3: Implement minimal form and service changes**

```ts
const [unitNumber, setUnitNumber] = useState(extractUnitNumber(initialValue.code) ?? "");
const codePreview = formatUnitCode(domicile, unitNumber) ?? "CP-XXX-00000";

const body = {
  unitNumber,
  name,
  address,
  domicile,
  isActive
};
```

Render a five-digit numeric input and a non-editable `codePreview`. Update create/update service input types so validation derives `payload.code`; keep writing `units.name = payload.name`.

- [ ] **Step 4: Run form and validation tests**

Run: `npx vitest run tests/superadmin-unit-form.test.tsx tests/superadmin-validation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/superadmin/unit-form.tsx lib/services/unit.service.ts app/api/superadmin/unit tests/superadmin-unit-form.test.tsx
git commit -m "feat: generate unit codes from domicile"
```

### Task 3: Transaction-safe SBG generation

**Files:**
- Create: `lib/barang/sbg-code.ts`
- Modify: `lib/services/admin-barang.service.ts`
- Test: `tests/sbg-code.test.ts`
- Test: `tests/admin-barang-service.test.ts`

- [ ] **Step 1: Write failing SBG tests**

```ts
expect(formatSbgCode("CP-MND-11787", 25010004741n)).toBe("SBG-1178725010004741");
expect(isCanonicalSbgCode("SBG-1178725010004741")).toBe(true);
expect(() => formatSbgCode("CP-MND-11787", 100000000000n)).toThrow(
  "Nomor urut SBG telah melampaui kapasitas 11 digit."
);
```

Mock the item transaction and assert it selects `nextval('barang_sbg_number_seq')`, reads the owning unit, and inserts the formatted code.

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `npx vitest run tests/sbg-code.test.ts tests/admin-barang-service.test.ts`

Expected: FAIL because SBG helpers and sequence allocation are absent.

- [ ] **Step 3: Implement SBG helper and service allocation**

```ts
export function formatSbgCode(unitCode: unknown, sequence: bigint) {
  const unitNumber = extractUnitNumber(unitCode);
  if (!unitNumber) throw new Error("Kode unit belum menggunakan format resmi.");
  const suffix = sequence.toString();
  if (suffix.length > 11) throw new Error("Nomor urut SBG telah melampaui kapasitas 11 digit.");
  return `SBG-${unitNumber}${suffix.padStart(11, "0")}`;
}
```

Inside the existing item transaction, read `units.code`, allocate `nextval`, format the SBG, and insert it. Remove the timestamp-based `makeBarangCode`.

- [ ] **Step 4: Run SBG and item-service tests**

Run: `npx vitest run tests/sbg-code.test.ts tests/admin-barang-service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/barang/sbg-code.ts lib/services/admin-barang.service.ts tests/sbg-code.test.ts tests/admin-barang-service.test.ts
git commit -m "feat: generate transaction-safe SBG codes"
```

### Task 4: Idempotent database migration and production startup

**Files:**
- Create: `drizzle/0023_canonical_unit_sbg_codes.sql`
- Modify: `drizzle/meta/_journal.json`
- Create: `scripts/apply-canonical-codes-migration.ts`
- Modify: `scripts/start-production.mjs`
- Modify: `package.json`
- Test: `tests/canonical-code-migration.test.ts`

- [ ] **Step 1: Write failing migration contract tests**

```ts
expect(sql).toContain(`lower(trim("name")) = 'upc ranotana'`);
expect(sql).toContain(`'CP-MND-11793'`);
expect(sql).toContain(`lower(trim("name")) = 'upc wanea'`);
expect(sql).toContain(`'CP-MND-11787'`);
expect(sql).not.toMatch(/update\s+"units"\s+set\s+"name"/i);
expect(sql).toContain(`create sequence if not exists "barang_sbg_number_seq"`);
expect(sql).toContain(`'SBG-'`);
```

- [ ] **Step 2: Run the focused migration test and confirm RED**

Run: `npx vitest run tests/canonical-code-migration.test.ts`

Expected: FAIL because migration `0023` does not exist.

- [ ] **Step 3: Implement a transactional, idempotent migration**

```sql
create sequence if not exists "barang_sbg_number_seq" minvalue 1;

update "units"
set "code" = case
  when lower(trim("name")) = 'upc ranotana' then 'CP-MND-11793'
  when lower(trim("name")) = 'upc wanea' then 'CP-MND-11787'
  else "code"
end;

with allocated as (
  select b.id,
         'SBG-' || substring(u.code from '([0-9]{5})$')
           || lpad(nextval('barang_sbg_number_seq')::text, 11, '0') as new_code
  from barang b
  join units u on u.id = b.unit_id
  where b.code !~ '^SBG-[0-9]{16}$'
     or left(substring(b.code from 5), 5) <> substring(u.code from '([0-9]{5})$')
  order by b.created_at, b.id
)
update barang b set code = allocated.new_code
from allocated where allocated.id = b.id;
```

Include collision-safe temporary values before final assignment, normalize other parsable unit suffixes, validate zero invalid rows, and leave `units.name` untouched. Add a script command and execute the same migration automatically before the production server starts.

- [ ] **Step 4: Run migration contract tests**

Run: `npx vitest run tests/canonical-code-migration.test.ts`

Expected: PASS.

- [ ] **Step 5: Apply and audit the configured local database**

Run: `npm run db:migrate:canonical-codes`

Expected: transaction commits; Ranotana/Wanea names remain unchanged; all unit codes match `^CP-[A-Z]{3}-[0-9]{5}$`; all item codes match `^SBG-[0-9]{16}$`; item codes remain unique.

- [ ] **Step 6: Commit**

```bash
git add drizzle/0023_canonical_unit_sbg_codes.sql drizzle/meta/_journal.json scripts/apply-canonical-codes-migration.ts scripts/start-production.mjs package.json tests/canonical-code-migration.test.ts
git commit -m "feat: migrate unit and SBG identifiers"
```

### Task 5: Remove remaining runtime legacy-code fallbacks

**Files:**
- Modify: `components/pages/admin-pages.tsx`
- Modify: `lib/mock-data.ts`
- Modify: relevant seed/setup scripts found by `rg "BRG-|CP-MND-13|ADM-MND"`
- Test: relevant fixture/serializer tests

- [ ] **Step 1: Add or update assertions for canonical displayed values**

```ts
expect(rendered).toContain("SBG-11793");
expect(runtimeSource).not.toMatch(/BRG-\$\{|CP-MND-13|ADM-MND/);
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npx vitest run tests/admin-pages.test.tsx`

Expected: FAIL on any active legacy fallback.

- [ ] **Step 3: Replace only active runtime fallbacks and seed generators**

Use the shared SBG/unit helpers or canonical fixed seed identifiers. Do not bulk-edit historical test labels that do not create production data.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run: `npx vitest run tests/admin-pages.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/pages/admin-pages.tsx lib/mock-data.ts scripts tests
git commit -m "chore: retire legacy runtime item codes"
```

### Task 6: Full verification and publication

**Files:**
- Modify: only files required by verification findings

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run TypeScript**

Run: `npx tsc --noEmit --pretty false`

Expected: exit code 0.

- [ ] **Step 3: Build production bundle**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 4: Audit git diff and database invariants**

Run: `git diff --check` and SQL audits for unit name/code separation, canonical SBG format, uniqueness, and orphan counts.

Expected: no whitespace errors, no invalid codes, no duplicate codes, no changed unit names.

- [ ] **Step 5: Commit any verification-only fixes and push**

```bash
git push origin master
```

Expected: push succeeds and `master` is synchronized with `origin/master`.
