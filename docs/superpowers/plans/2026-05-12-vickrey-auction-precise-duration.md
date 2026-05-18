# Vickrey Auction Precise Duration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin unit to configure Vickrey auction duration using days, hours, minutes, and seconds so short-lived auctions can be tested without waiting for day-based deadlines.

**Architecture:** Keep `startsAt` and `endsAt` as the canonical timing fields, then thread structured duration inputs through admin validation, the admin marketing form, and the publish service. Preserve compatibility by continuing to store a derived `durationDays` value while all precision-sensitive flows use `endsAt`.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Drizzle ORM, PostgreSQL.

---

## File Structure

- `components/admin-unit/admin-marketing-form.tsx`
  - Admin UI for choosing marketing mode and duration inputs
- `lib/admin-unit/validation.ts`
  - Canonical server-side payload validation for admin marketing submissions
- `lib/services/admin-pemasaran.service.ts`
  - Computes `startsAt` and `endsAt` during publish
- `tests/admin-unit-validation.test.ts`
  - Validation coverage for structured duration payloads
- `tests/admin-marketing-form.test.tsx`
  - New UI coverage for structured duration fields and submitted payload
- `tests/admin-pemasaran-service.test.ts`
  - New service-level coverage for deadline calculation precision

### Task 1: Add failing validation coverage for structured auction duration

**Files:**
- Modify: `tests/admin-unit-validation.test.ts`
- Test: `tests/admin-unit-validation.test.ts`

- [ ] **Step 1: Write the failing test**

Extend the existing validation suite with structured duration cases.

```ts
it("accepts vickrey durations with hour minute and second precision", () => {
  expect(
    validatePemasaranPayload({
      mode: "vickrey",
      price: "10000000",
      durationDays: "0",
      durationHours: "0",
      durationMinutes: "2",
      durationSeconds: "15"
    })
  ).toMatchObject({
    mode: "vickrey",
    price: "10000000",
    durationDays: 0,
    durationHours: 0,
    durationMinutes: 2,
    durationSeconds: 15,
    totalSeconds: 135
  });
});

it("rejects vickrey duration when all parts are zero", () => {
  expect(() =>
    validatePemasaranPayload({
      mode: "vickrey",
      price: "10000000",
      durationDays: "0",
      durationHours: "0",
      durationMinutes: "0",
      durationSeconds: "0"
    })
  ).toThrow("Durasi lelang harus lebih dari 0 detik.");
});

it("rejects out of range minute and second values", () => {
  expect(() =>
    validatePemasaranPayload({
      mode: "vickrey",
      price: "10000000",
      durationDays: "0",
      durationHours: "0",
      durationMinutes: "60",
      durationSeconds: "0"
    })
  ).toThrow("Menit lelang harus 0 sampai 59.");

  expect(() =>
    validatePemasaranPayload({
      mode: "vickrey",
      price: "10000000",
      durationDays: "0",
      durationHours: "0",
      durationMinutes: "1",
      durationSeconds: "60"
    })
  ).toThrow("Detik lelang harus 0 sampai 59.");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/admin-unit-validation.test.ts`

Expected: FAIL because `validatePemasaranPayload` does not yet accept `durationHours`, `durationMinutes`, `durationSeconds`, or return `totalSeconds`.

- [ ] **Step 3: Write minimal implementation**

Update `lib/admin-unit/validation.ts` so `validatePemasaranPayload` accepts:

```ts
type MarketingDurationInput = {
  durationDays?: unknown;
  durationHours?: unknown;
  durationMinutes?: unknown;
  durationSeconds?: unknown;
};
```

Add a small parser for non-negative integers:

```ts
function normalizeWholeNumber(value: unknown, message: string) {
  const raw = String(value ?? "").trim();
  if (raw === "") {
    return 0;
  }

  if (!/^\d+$/.test(raw)) {
    throw new Error(message);
  }

  return Number(raw);
}
```

Return this shape for `vickrey`:

```ts
return {
  mode,
  price,
  durationDays,
  durationHours,
  durationMinutes,
  durationSeconds,
  totalSeconds
};
```

Enforce:

```ts
if (durationHours < 0 || durationHours > 23) throw new Error("Jam lelang harus 0 sampai 23.");
if (durationMinutes < 0 || durationMinutes > 59) throw new Error("Menit lelang harus 0 sampai 59.");
if (durationSeconds < 0 || durationSeconds > 59) throw new Error("Detik lelang harus 0 sampai 59.");
if (totalSeconds <= 0) throw new Error("Durasi lelang harus lebih dari 0 detik.");
if (totalSeconds > 30 * 24 * 60 * 60) throw new Error("Durasi lelang maksimal 30 hari.");
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/admin-unit-validation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/admin-unit-validation.test.ts lib/admin-unit/validation.ts
git commit -m "feat: validate precise vickrey durations"
```

### Task 2: Add failing UI coverage for precise duration inputs

**Files:**
- Create: `tests/admin-marketing-form.test.tsx`
- Test: `tests/admin-marketing-form.test.tsx`

- [ ] **Step 1: Write the failing test**

Create a new component test for `AdminMarketingForm`.

```tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AdminMarketingForm } from "@/components/admin-unit/admin-marketing-form";
import { ToastProvider } from "@/components/ui/toast";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router
}));

function renderWithToast(ui: React.ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("AdminMarketingForm", () => {
  beforeEach(() => {
    router.push.mockClear();
    router.refresh.mockClear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "pm-1" })
    }) as typeof fetch;
  });

  it("submits structured vickrey duration fields", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <AdminMarketingForm
        barangId="barang-1"
        defaultPrice={10000000}
        endpoint="/api/admin/barang/barang-1/publish"
        redirectTo="/admin/pemasaran/vickrey-auction"
        submitLabel="Tayangkan"
        successTitle="Berhasil"
        successDescription="Berhasil"
      />
    );

    await user.click(screen.getByRole("button", { name: /vickrey auction/i }));
    await user.clear(screen.getByLabelText(/hari/i));
    await user.type(screen.getByLabelText(/hari/i), "0");
    await user.clear(screen.getByLabelText(/jam/i));
    await user.type(screen.getByLabelText(/jam/i), "0");
    await user.clear(screen.getByLabelText(/menit/i));
    await user.type(screen.getByLabelText(/menit/i), "2");
    await user.clear(screen.getByLabelText(/detik/i));
    await user.type(screen.getByLabelText(/detik/i), "15");
    await user.click(screen.getByRole("button", { name: /tayangkan/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/barang/barang-1/publish",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            mode: "vickrey",
            price: 10000000,
            durationDays: 0,
            durationHours: 0,
            durationMinutes: 2,
            durationSeconds: 15
          })
        })
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/admin-marketing-form.test.tsx`

Expected: FAIL because the form still renders one `durationDays` field and submits the old payload.

- [ ] **Step 3: Write minimal implementation**

Refactor `components/admin-unit/admin-marketing-form.tsx` to hold structured state:

```ts
const [durationDays, setDurationDays] = useState("0");
const [durationHours, setDurationHours] = useState("0");
const [durationMinutes, setDurationMinutes] = useState("5");
const [durationSeconds, setDurationSeconds] = useState("0");
```

Add a helper:

```ts
function parseDurationPart(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}
```

Submit this JSON for Vickrey:

```ts
body: JSON.stringify({
  mode,
  price: normalizedPrice,
  durationDays: mode === "vickrey" ? parsedDurationDays : undefined,
  durationHours: mode === "vickrey" ? parsedDurationHours : undefined,
  durationMinutes: mode === "vickrey" ? parsedDurationMinutes : undefined,
  durationSeconds: mode === "vickrey" ? parsedDurationSeconds : undefined
})
```

Render four labeled numeric inputs:

```tsx
<FieldLabel>Hari</FieldLabel>
<Input aria-label="Hari" min={0} type="number" value={durationDays} onChange={(event) => setDurationDays(event.target.value)} />
```

Repeat for `Jam`, `Menit`, `Detik`, with `max={23}` for hours and `max={59}` for minutes/seconds.

Add a live summary:

```ts
const durationSummary = `${safeDays} hari ${safeHours} jam ${safeMinutes} menit ${safeSeconds} detik`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/admin-marketing-form.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/admin-marketing-form.test.tsx components/admin-unit/admin-marketing-form.tsx
git commit -m "feat: add precise vickrey duration inputs"
```

### Task 3: Add failing service coverage for second-precision `endsAt`

**Files:**
- Create: `tests/admin-pemasaran-service.test.ts`
- Test: `tests/admin-pemasaran-service.test.ts`

- [ ] **Step 1: Write the failing test**

Create a focused service test that freezes time and proves `publishAdminBarang` computes `endsAt` with second precision.

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const getBarangForUnitMock = vi.fn();
const insertReturningMock = vi.fn();
const selectMock = vi.fn();
const updateSetMock = vi.fn();
const historyInsertMock = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    select: selectMock,
    insert: vi.fn(),
    update: vi.fn()
  }
}));

describe("publishAdminBarang", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-12T10:00:00.000Z"));
  });

  it("computes endsAt using day hour minute and second inputs", async () => {
    const { publishAdminBarang } = await import("@/lib/services/admin-pemasaran.service");

    await publishAdminBarang("unit-1", "admin-1", "barang-1", {
      mode: "vickrey",
      price: "10000000",
      durationDays: "0",
      durationHours: "0",
      durationMinutes: "2",
      durationSeconds: "15"
    });

    expect(insertReturningMock).toHaveBeenCalledWith(
      expect.objectContaining({
        startsAt: new Date("2026-05-12T10:00:00.000Z"),
        endsAt: new Date("2026-05-12T10:02:15.000Z")
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/admin-pemasaran-service.test.ts`

Expected: FAIL because the service still derives `endsAt` from whole days only and the test scaffolding does not yet match the current query chain.

- [ ] **Step 3: Write minimal implementation**

Keep the test simple by mocking the Drizzle method chain just enough to reach the inserted values. In `lib/services/admin-pemasaran.service.ts`, replace the current `endsAt` calculation:

```ts
const endsAt =
  payload.mode === "vickrey" && payload.totalSeconds
    ? new Date(now.getTime() + payload.totalSeconds * 1000)
    : null;
```

Keep compatibility for the insert:

```ts
durationDays:
  payload.mode === "vickrey"
    ? payload.durationDays + Math.floor(payload.durationHours / 24)
    : null,
```

If cleaner, compute a dedicated value first:

```ts
const derivedDurationDays =
  payload.mode === "vickrey"
    ? Math.floor(payload.totalSeconds / 86_400)
    : null;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/admin-pemasaran-service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/admin-pemasaran-service.test.ts lib/services/admin-pemasaran.service.ts
git commit -m "feat: compute precise vickrey deadlines"
```

### Task 4: Run regression checks for marketing and Vickrey timing

**Files:**
- Verify: `components/admin-unit/admin-marketing-form.tsx`
- Verify: `lib/admin-unit/validation.ts`
- Verify: `lib/services/admin-pemasaran.service.ts`
- Verify: `tests/admin-unit-validation.test.ts`
- Verify: `tests/admin-marketing-form.test.tsx`
- Verify: `tests/admin-pemasaran-service.test.ts`
- Verify: `tests/cron-service.test.ts`

- [ ] **Step 1: Run focused test suite**

Run:

```bash
npm test -- tests/admin-unit-validation.test.ts tests/admin-marketing-form.test.tsx tests/admin-pemasaran-service.test.ts tests/cron-service.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS with no regressions in unrelated pages or Vickrey flows.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: exit code `0`.

- [ ] **Step 4: Browser verification**

Open the admin publish flow and verify:

- `Fixed Price` does not require duration fields.
- `Vickrey Auction` shows `Hari`, `Jam`, `Menit`, `Detik`.
- A short configuration like `0 hari 0 jam 0 menit 30 detik` is accepted.
- The resulting session countdown reflects the short duration.

- [ ] **Step 5: Commit verification-only fixes**

```bash
git add components/admin-unit/admin-marketing-form.tsx lib/admin-unit/validation.ts lib/services/admin-pemasaran.service.ts tests/admin-unit-validation.test.ts tests/admin-marketing-form.test.tsx tests/admin-pemasaran-service.test.ts
git commit -m "test: verify precise vickrey duration flow"
```
