# Buyer Session Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melindungi seluruh route akun buyer dengan session Better Auth dan mengembalikan user ke halaman tujuan setelah login.

**Architecture:** `app/(user)/layout.tsx` menjadi gate server-side utama yang membaca session Better Auth dan me-redirect guest ke `/login?next=...`. Session yang valid diteruskan ke `BuyerShell` dan halaman akun untuk mengganti identitas mock dengan data user nyata.

**Tech Stack:** Next.js App Router, Better Auth, PostgreSQL, Drizzle ORM, TypeScript, Vitest

---

### Task 1: Tambahkan util guard buyer dan server session context

**Files:**
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth\guards.ts`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth\session.ts`
- Test: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\buyer-auth-guards.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { getSafeBuyerNextPath } from "@/lib/auth/guards";

describe("buyer auth guards", () => {
  it("allows only internal buyer-safe paths", () => {
    expect(getSafeBuyerNextPath("/dashboard")).toBe("/dashboard");
    expect(getSafeBuyerNextPath("http://evil.com")).toBe("/dashboard");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/buyer-auth-guards.test.ts`
Expected: FAIL because `getSafeBuyerNextPath` does not exist yet

- [ ] **Step 3: Write minimal implementation**

```ts
const FALLBACK_BUYER_PATH = "/dashboard";

export function getSafeBuyerNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return FALLBACK_BUYER_PATH;
  }

  if (!["/dashboard", "/transaksi", "/profil", "/riwayat-bid"].some((path) => next.startsWith(path))) {
    return FALLBACK_BUYER_PATH;
  }

  return next;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/buyer-auth-guards.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/buyer-auth-guards.test.ts lib/auth/guards.ts lib/auth/session.ts
git commit -m "feat: add buyer auth guard utilities"
```

### Task 2: Pasang guard di route buyer dan teruskan session ke shell

**Files:**
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\(user)\layout.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\layout\buyer-shell.tsx`

- [ ] **Step 1: Write the failing test**

Gunakan verifikasi HTTP manual karena layout App Router private redirect lebih tepat diuji lewat request nyata.

- [ ] **Step 2: Run verification to capture current broken behavior**

Run: `Invoke-WebRequest http://localhost:3000/dashboard -MaximumRedirection 0`
Expected: route masih bisa dibuka tanpa redirect ke login

- [ ] **Step 3: Write minimal implementation**

```tsx
const session = await requireBuyerSession("/dashboard");

return (
  <BuyerShell buyer={session.user} ...>
    {children}
  </BuyerShell>
);
```

`BuyerShell` membaca `buyer.name` dan `buyer.email` dari session, bukan dari `userSummary`.

- [ ] **Step 4: Run verification to verify redirect works**

Run: `Invoke-WebRequest http://localhost:3000/dashboard -MaximumRedirection 0`
Expected: redirect location menuju `/login?next=%2Fdashboard`

- [ ] **Step 5: Commit**

```bash
git add app/(user)/layout.tsx components/layout/buyer-shell.tsx
git commit -m "feat: protect buyer account routes"
```

### Task 3: Hormati query `next` pada login/register dan verifikasi end-to-end

**Files:**
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\auth\login-form.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\auth\register-form.tsx`

- [ ] **Step 1: Write the failing test**

Gunakan verifikasi HTTP manual + browser flow karena redirect pasca login bergantung pada URL query dan cookie session.

- [ ] **Step 2: Run verification to capture current behavior**

Run alur login dari `/login?next=/transaksi`
Expected: setelah sukses masih selalu ke `/dashboard`

- [ ] **Step 3: Write minimal implementation**

```tsx
const searchParams = useSearchParams();
const next = getSafeBuyerNextPath(searchParams.get("next"));
router.push(next);
```

Terapkan logika yang sama untuk register.

- [ ] **Step 4: Run verification to verify it passes**

Run:
- `GET /dashboard` sebagai guest -> redirect ke `/login?next=%2Fdashboard`
- login sukses -> redirect ke `/dashboard`
- `GET /transaksi` sebagai guest -> redirect ke `/login?next=%2Ftransaksi`
- login sukses -> redirect ke `/transaksi`

Expected: semua redirect sesuai target dan cookie session tetap terbentuk

- [ ] **Step 5: Commit**

```bash
git add components/auth/login-form.tsx components/auth/register-form.tsx
git commit -m "feat: preserve buyer next redirect after auth"
```
