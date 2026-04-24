# Superadmin Backend End-to-End Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghubungkan seluruh area `superadmin` ke backend nyata berbasis Better Auth role guard, Drizzle ORM, PostgreSQL, dan UI `shadcn/ui` agar CRUD unit, rekening unit, admin unit, monitoring, dan blacklist bekerja end-to-end.

**Architecture:** Implementasi dibagi per domain agar route API hanya menangani auth, validasi, dan response shaping, sementara business logic hidup di service layer yang fokus per area (`unit`, `rekening`, `admin`, `monitoring`, `blacklist`). Frontend `superadmin` akan memakai fetch client-side/server-side ke endpoint `api/superadmin/*` dan fallback mock dihapus dari area yang sudah dibackend-kan.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Better Auth native session, Drizzle ORM, PostgreSQL, Vitest, `shadcn/ui`-style components di `components/ui`

---

## File Structure

### Existing files to modify

- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\db\schema\auth.ts`
  Tambah field `unitId` dan `isActive` ke tabel `user`.
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\db\schema\index.ts`
  Export schema domain superadmin baru.
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth\session.ts`
  Tambah helper proteksi API superadmin berbasis session Better Auth.
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\pages\superadmin-pages.tsx`
  Ganti penggunaan mock dengan data API dan form/action nyata.
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\unit\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\unit\[id]\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\unit\[id]\rekening\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\admin\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\monitoring\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\blacklist\page.tsx`
  Ubah page agar menyuplai data nyata dan callback action ke komponen.

### New database/schema files

- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\db\schema\superadmin.ts`
  Tabel `units`, `unitAccounts`, `blacklists`, `blacklistActionLogs`.

### New validation/helper files

- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\superadmin\validation.ts`
  Fungsi validasi payload unit, rekening, admin, cabut blacklist.
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\superadmin\serializers.ts`
  Bentuk response UI-ready untuk frontend.

### New service files

- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\services\unit.service.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\services\rekening-unit.service.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\services\admin-unit.service.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\services\monitoring.service.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\services\blacklist.service.ts`

### New API route files

- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\unit\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\unit\[id]\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\unit\[id]\rekening\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\unit\[id]\rekening\[rid]\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\admin\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\admin\[id]\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\monitoring\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\blacklist\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\blacklist\[userId]\cabut\route.ts`

### New frontend data hooks/helpers

- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\superadmin\client.ts`
  Fetch helpers untuk halaman superadmin.
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\components\superadmin\unit-form.tsx`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\components\superadmin\rekening-form.tsx`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\components\superadmin\admin-form.tsx`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\components\superadmin\cabut-blacklist-form.tsx`
  Form interaktif `shadcn/ui` untuk aksi create/update utama.

### New test files

- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\superadmin-validation.test.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\superadmin-serializers.test.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\superadmin-auth-guards.test.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\superadmin-pages.test.tsx`

---

### Task 1: Tambahkan schema database superadmin

**Files:**
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\db\schema\superadmin.ts`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\db\schema\auth.ts`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\db\schema\index.ts`
- Test: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\superadmin-validation.test.ts`

- [ ] **Step 1: Write the failing validation test**

```ts
import { describe, expect, it } from "vitest";

import {
  normalizeUnitCode,
  validateUnitAccountPayload,
  validateUnitPayload
} from "@/lib/superadmin/validation";

describe("superadmin validation", () => {
  it("normalizes kode unit and trims payload unit", () => {
    expect(
      validateUnitPayload({
        code: " cp-mdn-01 ",
        name: " Pegadaian CP Manado ",
        address: " Jl. Piere Tendean No. 88 "
      })
    ).toEqual({
      code: "CP-MDN-01",
      name: "Pegadaian CP Manado",
      address: "Jl. Piere Tendean No. 88"
    });
  });

  it("requires rekening payload lengkap", () => {
    expect(() =>
      validateUnitAccountPayload({
        bankName: "",
        accountNumber: " 1234567890 ",
        accountHolderName: ""
      })
    ).toThrow("Data rekening unit belum lengkap.");
  });

  it("normalizes kode unit helper", () => {
    expect(normalizeUnitCode(" upc-mks-01 ")).toBe("UPC-MKS-01");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npx vitest run tests/superadmin-validation.test.ts
```

Expected: FAIL karena `@/lib/superadmin/validation` belum ada.

- [ ] **Step 3: Write minimal validation helper and schema**

```ts
// lib/superadmin/validation.ts
export function normalizeUnitCode(value: string) {
  return value.trim().toUpperCase();
}

export function validateUnitPayload(input: {
  code?: string;
  name?: string;
  address?: string;
}) {
  const code = normalizeUnitCode(String(input.code ?? ""));
  const name = String(input.name ?? "").trim();
  const address = String(input.address ?? "").trim();

  if (!code || !name || !address) {
    throw new Error("Data unit belum lengkap.");
  }

  return { code, name, address };
}

export function validateUnitAccountPayload(input: {
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  branchName?: string;
  isActive?: boolean;
}) {
  const bankName = String(input.bankName ?? "").trim();
  const accountNumber = String(input.accountNumber ?? "").trim();
  const accountHolderName = String(input.accountHolderName ?? "").trim();
  const branchName = String(input.branchName ?? "").trim();

  if (!bankName || !accountNumber || !accountHolderName) {
    throw new Error("Data rekening unit belum lengkap.");
  }

  return {
    bankName,
    accountNumber,
    accountHolderName,
    branchName,
    isActive: Boolean(input.isActive)
  };
}
```

```ts
// lib/db/schema/superadmin.ts
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core";

import { users } from "@/lib/db/schema/auth";

export const units = pgTable("units", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  codeIdx: uniqueIndex("units_code_unique").on(table.code)
}));

export const unitAccounts = pgTable("rekening_unit", {
  id: text("id").primaryKey(),
  unitId: text("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  branchName: text("branch_name").notNull().default(""),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  unitIdx: index("rekening_unit_unit_id_idx").on(table.unitId),
  activePerUnitIdx: uniqueIndex("rekening_unit_active_per_unit_unique")
    .on(table.unitId)
    .where(table.isActive)
}));

export const blacklists = pgTable("blacklist", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalViolations: integer("total_violations").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  blockedAt: timestamp("blocked_at", { withTimezone: true }).notNull().defaultNow(),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }),
  revokedByUserId: text("revoked_by_user_id"),
  revokeReason: text("revoke_reason"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const blacklistActionLogs = pgTable("blacklist_action_log", {
  id: text("id").primaryKey(),
  blacklistId: text("blacklist_id").notNull().references(() => blacklists.id, { onDelete: "cascade" }),
  targetUserId: text("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  performedByUserId: text("performed_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
```

```ts
// auth.ts table change snippet
unitId: text("unit_id"),
isActive: boolean("is_active").notNull().default(true),
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npx vitest run tests/superadmin-validation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Generate migration**

Run:

```powershell
npm run db:generate
```

Expected: migration file baru muncul di `drizzle/`.

- [ ] **Step 6: Commit**

```powershell
git add lib/db/schema/auth.ts lib/db/schema/index.ts lib/db/schema/superadmin.ts lib/superadmin/validation.ts tests/superadmin-validation.test.ts drizzle
git commit -m "feat: add superadmin domain schema"
```

### Task 2: Tambahkan serializer dan guard helper untuk API superadmin

**Files:**
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\superadmin\serializers.ts`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth\session.ts`
- Test: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\superadmin-auth-guards.test.ts`
- Test: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\superadmin-serializers.test.ts`

- [ ] **Step 1: Write the failing serializer and guard tests**

```ts
import { describe, expect, it } from "vitest";

import { getSafeSuperAdminNextPath } from "@/lib/auth/guards";
import {
  serializeUnitListItem,
  serializeUnitAccount
} from "@/lib/superadmin/serializers";

describe("superadmin auth guard", () => {
  it("keeps superadmin next path inside /superadmin", () => {
    expect(getSafeSuperAdminNextPath("/superadmin/unit/unit-alpha-central")).toBe(
      "/superadmin/unit/unit-alpha-central"
    );
    expect(getSafeSuperAdminNextPath("/admin")).toBe("/superadmin");
  });
});

describe("superadmin serializers", () => {
  it("serializes unit summary for ui", () => {
    expect(
      serializeUnitListItem({
        id: "unit-1",
        code: "CP-MND-01",
        name: "Pegadaian CP Manado",
        address: "Jl. Piere Tendean No. 88",
        isActive: true,
        adminCount: 2,
        accountCount: 1,
        activeAccount: null
      })
    ).toMatchObject({
      id: "unit-1",
      code: "CP-MND-01",
      name: "Pegadaian CP Manado",
      status: "Aktif"
    });
  });

  it("serializes active account ui shape", () => {
    expect(
      serializeUnitAccount({
        id: "acc-1",
        bankName: "BRI",
        accountNumber: "0123",
        accountHolderName: "PT Pegadaian",
        branchName: "Manado",
        isActive: true
      })
    ).toEqual({
      id: "acc-1",
      bankName: "BRI",
      accountNumber: "0123",
      accountHolder: "PT Pegadaian",
      branch: "Manado",
      status: "AKTIF"
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
npx vitest run tests/superadmin-auth-guards.test.ts tests/superadmin-serializers.test.ts
```

Expected: FAIL karena serializer belum ada.

- [ ] **Step 3: Implement serializer and API role helper**

```ts
// lib/superadmin/serializers.ts
export function serializeUnitAccount(account: {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branchName: string;
  isActive: boolean;
}) {
  return {
    id: account.id,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    accountHolder: account.accountHolderName,
    branch: account.branchName,
    status: account.isActive ? "AKTIF" : "CADANGAN"
  };
}

export function serializeUnitListItem(input: {
  id: string;
  code: string;
  name: string;
  address: string;
  isActive: boolean;
  adminCount: number;
  accountCount: number;
  activeAccount: ReturnType<typeof serializeUnitAccount> | null;
}) {
  return {
    id: input.id,
    code: input.code,
    name: input.name,
    address: input.address,
    status: input.isActive ? "Aktif" : "Nonaktif",
    adminCount: input.adminCount,
    accountCount: input.accountCount,
    activeAccount: input.activeAccount
  };
}
```

```ts
// lib/auth/session.ts addition
export async function requireSuperAdminApiSession() {
  const session = await getServerSession();

  if (!session?.user) {
    return { ok: false as const, status: 401, message: "Silakan masuk terlebih dahulu." };
  }

  if (!isAuthRole(session.user.role) || session.user.role !== "super_admin") {
    return { ok: false as const, status: 403, message: "Akses superadmin ditolak." };
  }

  return { ok: true as const, session };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```powershell
npx vitest run tests/superadmin-auth-guards.test.ts tests/superadmin-serializers.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/auth/session.ts lib/superadmin/serializers.ts tests/superadmin-auth-guards.test.ts tests/superadmin-serializers.test.ts
git commit -m "feat: add superadmin serializer and api guard helpers"
```

### Task 3: Implement service dan API untuk unit serta rekening unit

**Files:**
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\services\unit.service.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\services\rekening-unit.service.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\unit\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\unit\[id]\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\unit\[id]\rekening\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\unit\[id]\rekening\[rid]\route.ts`
- Test: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\superadmin-validation.test.ts`

- [ ] **Step 1: Write the failing service-level behavior test**

```ts
import { describe, expect, it } from "vitest";

import { activateAccountSelection } from "@/lib/services/rekening-unit.service";

describe("rekening unit service", () => {
  it("marks selected account active and others inactive", () => {
    expect(
      activateAccountSelection([
        { id: "a", isActive: true },
        { id: "b", isActive: false }
      ], "b")
    ).toEqual([
      { id: "a", isActive: false },
      { id: "b", isActive: true }
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npx vitest run tests/superadmin-validation.test.ts
```

Expected: FAIL karena helper service belum ada.

- [ ] **Step 3: Implement unit and rekening services**

```ts
// lib/services/rekening-unit.service.ts
export function activateAccountSelection<T extends { id: string; isActive: boolean }>(
  accounts: T[],
  targetId: string
) {
  return accounts.map((account) => ({
    ...account,
    isActive: account.id === targetId
  }));
}
```

```ts
// lib/services/unit.service.ts skeleton
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { unitAccounts, units, users } from "@/lib/db/schema";
import { serializeUnitAccount, serializeUnitListItem } from "@/lib/superadmin/serializers";
import { validateUnitPayload } from "@/lib/superadmin/validation";

export async function listUnits() {
  const rows = await db.select({
    id: units.id,
    code: units.code,
    name: units.name,
    address: units.address,
    isActive: units.isActive,
    adminCount: sql<number>`count(distinct ${users.id})`,
    accountCount: sql<number>`count(distinct ${unitAccounts.id})`
  })
  .from(units)
  .leftJoin(users, and(eq(users.unitId, units.id), eq(users.role, "admin_unit")))
  .leftJoin(unitAccounts, eq(unitAccounts.unitId, units.id))
  .groupBy(units.id);

  return rows.map((row) => serializeUnitListItem({ ...row, activeAccount: null }));
}

export async function createUnit(input: { code?: string; name?: string; address?: string }) {
  const payload = validateUnitPayload(input);
  const [created] = await db.insert(units).values({
    id: crypto.randomUUID(),
    code: payload.code,
    name: payload.name,
    address: payload.address
  }).returning();

  return created;
}
```

```ts
// app/api/superadmin/unit/route.ts skeleton
import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import { createUnit, listUnits } from "@/lib/services/unit.service";

export async function GET() {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) return NextResponse.json({ message: access.message }, { status: access.status });

  return NextResponse.json({ data: await listUnits() });
}

export async function POST(request: Request) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) return NextResponse.json({ message: access.message }, { status: access.status });

  const body = await request.json();
  const created = await createUnit(body);

  return NextResponse.json({ data: created }, { status: 201 });
}
```

- [ ] **Step 4: Push schema to local database**

Run:

```powershell
npm run db:push
```

Expected: schema `units` dan `rekening_unit` terbentuk di PostgreSQL.

- [ ] **Step 5: Run service tests and smoke check API**

Run:

```powershell
npx vitest run tests/superadmin-validation.test.ts
Invoke-WebRequest -Uri http://localhost:3000/api/superadmin/unit -UseBasicParsing
```

Expected: test PASS; API guest returns `401`/`403` sesuai guard.

- [ ] **Step 6: Commit**

```powershell
git add lib/services/unit.service.ts lib/services/rekening-unit.service.ts app/api/superadmin/unit app/api/superadmin/unit/[id] app/api/superadmin/unit/[id]/rekening
git commit -m "feat: add superadmin unit and rekening api"
```

### Task 4: Implement service dan API untuk admin unit

**Files:**
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\services\admin-unit.service.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\admin\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\admin\[id]\route.ts`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth.ts`
- Test: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\superadmin-validation.test.ts`

- [ ] **Step 1: Write the failing admin validation test**

```ts
import { describe, expect, it } from "vitest";

import { validateAdminUnitPayload } from "@/lib/superadmin/validation";

describe("admin unit payload", () => {
  it("requires email, unitId, and temporary password", () => {
    expect(() =>
      validateAdminUnitPayload({
        name: "Admin Manado",
        email: "admin@pegadaian.test",
        unitId: "",
        temporaryPassword: ""
      })
    ).toThrow("Data admin unit belum lengkap.");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npx vitest run tests/superadmin-validation.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement admin service with Better Auth-compatible account creation**

```ts
// lib/services/admin-unit.service.ts
import { eq, and } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { accounts, users, units } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { validateAdminUnitPayload } from "@/lib/superadmin/validation";

export async function createAdminUnit(input: {
  name?: string;
  email?: string;
  unitId?: string;
  temporaryPassword?: string;
  phoneNumber?: string;
}) {
  const payload = validateAdminUnitPayload(input);

  const unit = await db.query.units.findFirst({
    where: eq(units.id, payload.unitId)
  });

  if (!unit) {
    throw new Error("Unit belum ditemukan.");
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, payload.email)
  });

  if (existing) {
    throw new Error("Email admin sudah dipakai.");
  }

  const created = await auth.api.signUpEmail({
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.temporaryPassword
    }
  });

  await db.update(users)
    .set({
      role: "admin_unit",
      unitId: payload.unitId,
      isActive: true,
      phoneNumber: payload.phoneNumber ?? null
    })
    .where(eq(users.id, created.user.id));

  return created.user;
}
```

```ts
// app/api/superadmin/admin/route.ts skeleton
export async function POST(request: Request) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) return NextResponse.json({ message: access.message }, { status: access.status });

  const body = await request.json();
  const created = await createAdminUnit(body);
  return NextResponse.json({ data: created }, { status: 201 });
}
```

- [ ] **Step 4: Run test and manual API login verification**

Run:

```powershell
npx vitest run tests/superadmin-validation.test.ts
```

Then verify:

```powershell
$admin = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/superadmin/admin -ContentType 'application/json' -Body '{"name":"Admin Unit Uji","email":"admin.unit.uji@example.com","unitId":"<unit-id>","temporaryPassword":"AdminUnit123!","phoneNumber":"6281234567801"}'
```

Expected: admin row created, `role = admin_unit`, `unit_id` terisi.

- [ ] **Step 5: Commit**

```powershell
git add lib/services/admin-unit.service.ts app/api/superadmin/admin app/api/superadmin/admin/[id] lib/auth.ts lib/superadmin/validation.ts tests/superadmin-validation.test.ts
git commit -m "feat: add superadmin admin unit management"
```

### Task 5: Implement monitoring dan blacklist API

**Files:**
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\services\monitoring.service.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\services\blacklist.service.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\monitoring\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\blacklist\route.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\superadmin\blacklist\[userId]\cabut\route.ts`
- Test: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\superadmin-validation.test.ts`

- [ ] **Step 1: Write the failing blacklist validation test**

```ts
import { describe, expect, it } from "vitest";

import { validateBlacklistRevokePayload } from "@/lib/superadmin/validation";

describe("blacklist revoke payload", () => {
  it("requires revoke reason", () => {
    expect(() => validateBlacklistRevokePayload({ reason: "   " })).toThrow(
      "Alasan pencabutan blacklist wajib diisi."
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npx vitest run tests/superadmin-validation.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement monitoring and blacklist services**

```ts
// lib/services/monitoring.service.ts
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { blacklists, unitAccounts, units, users } from "@/lib/db/schema";

export async function getSuperAdminMonitoringSummary() {
  const [unitStats] = await db.select({
    totalUnits: sql<number>`count(*)`,
    activeUnits: sql<number>`count(*) filter (where ${units.isActive} = true)`
  }).from(units);

  const [adminStats] = await db.select({
    totalAdmins: sql<number>`count(*)`
  }).from(users);

  const [accountStats] = await db.select({
    activeAccounts: sql<number>`count(*) filter (where ${unitAccounts.isActive} = true)`
  }).from(unitAccounts);

  const [blacklistStats] = await db.select({
    activeBlacklists: sql<number>`count(*) filter (where ${blacklists.isActive} = true)`
  }).from(blacklists);

  return {
    metrics: {
      totalUnits: unitStats.totalUnits,
      activeUnits: unitStats.activeUnits,
      totalAdmins: adminStats.totalAdmins,
      activeAccounts: accountStats.activeAccounts,
      activeBlacklists: blacklistStats.activeBlacklists
    }
  };
}
```

```ts
// lib/services/blacklist.service.ts
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { blacklistActionLogs, blacklists } from "@/lib/db/schema";
import { validateBlacklistRevokePayload } from "@/lib/superadmin/validation";

export async function revokeBlacklist(userId: string, actorUserId: string, input: { reason?: string }) {
  const payload = validateBlacklistRevokePayload(input);

  const active = await db.query.blacklists.findFirst({
    where: and(eq(blacklists.userId, userId), eq(blacklists.isActive, true))
  });

  if (!active) {
    throw new Error("Blacklist aktif untuk user ini tidak ditemukan.");
  }

  await db.transaction(async (tx) => {
    await tx.update(blacklists)
      .set({
        isActive: false,
        revokeReason: payload.reason,
        revokedByUserId: actorUserId,
        updatedAt: new Date()
      })
      .where(eq(blacklists.id, active.id));

    await tx.insert(blacklistActionLogs).values({
      id: crypto.randomUUID(),
      blacklistId: active.id,
      targetUserId: userId,
      action: "cabut_manual",
      performedByUserId: actorUserId,
      note: payload.reason
    });
  });
}
```

- [ ] **Step 4: Run test and smoke check blacklist revoke**

Run:

```powershell
npx vitest run tests/superadmin-validation.test.ts
```

Then verify API route:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/superadmin/monitoring
```

Expected: authenticated superadmin gets `200`, guest gets `401/403`.

- [ ] **Step 5: Commit**

```powershell
git add lib/services/monitoring.service.ts lib/services/blacklist.service.ts app/api/superadmin/monitoring app/api/superadmin/blacklist
git commit -m "feat: add superadmin monitoring and blacklist api"
```

### Task 6: Integrasikan frontend superadmin dengan API nyata dan komponen shadcn/ui

**Files:**
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\superadmin\client.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\components\superadmin\unit-form.tsx`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\components\superadmin\rekening-form.tsx`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\components\superadmin\admin-form.tsx`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\components\superadmin\cabut-blacklist-form.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\pages\superadmin-pages.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\unit\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\unit\[id]\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\unit\[id]\rekening\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\admin\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\monitoring\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\superadmin\blacklist\page.tsx`
- Test: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\superadmin-pages.test.tsx`

- [ ] **Step 1: Write the failing UI wiring test**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { SuperAdminDashboardPage } from "@/components/pages/superadmin-pages";

describe("superadmin pages", () => {
  it("renders monitoring metrics from backend payload", () => {
    render(
      <SuperAdminDashboardPage
        summary={{
          headline: "Pantau seluruh unit dari satu control center.",
          metrics: [
            { label: "Total Unit", value: "2", detail: "2 aktif" }
          ],
          spotlight: [],
          priorities: []
        }}
        unitsNeedAttention={[]}
        pendingMonitoring={[]}
      />
    );

    expect(screen.getByText("Pantau seluruh unit dari satu control center.")).toBeInTheDocument();
    expect(screen.getByText("Total Unit")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npx vitest run tests/superadmin-pages.test.tsx
```

Expected: FAIL karena komponen masih bergantung pada mock internal.

- [ ] **Step 3: Implement backend client helpers and page props**

```ts
// lib/superadmin/client.ts
export async function fetchSuperAdminJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "include"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Permintaan gagal." }));
    throw new Error(payload.message ?? "Permintaan superadmin gagal.");
  }

  const payload = await response.json();
  return payload.data as T;
}
```

```tsx
// component prop pattern
export function SuperAdminDashboardPage({
  summary,
  unitsNeedAttention,
  pendingMonitoring
}: {
  summary: SuperAdminDashboardData;
  unitsNeedAttention: SuperAdminUnitListItem[];
  pendingMonitoring: SuperAdminMonitoringItem[];
}) {
  // render from props, no direct mock imports
}
```

```tsx
// app/superadmin/page.tsx
import { fetchSuperAdminDashboardData } from "@/lib/superadmin/client";
import { SuperAdminDashboardPage } from "@/components/pages/superadmin-pages";

export default async function SuperAdminPage() {
  const data = await fetchSuperAdminDashboardData();
  return (
    <SuperAdminDashboardPage
      summary={data.summary}
      unitsNeedAttention={data.unitsNeedAttention}
      pendingMonitoring={data.pendingMonitoring}
    />
  );
}
```

- [ ] **Step 4: Wire forms with shadcn/ui primitives**

```tsx
// components/superadmin/unit-form.tsx
"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UnitForm() {
  const [loading, setLoading] = useState(false);

  return (
    <form className="space-y-4">
      <Input name="code" placeholder="Contoh: CP-MND-01" />
      <Input name="name" placeholder="Nama unit" />
      <Input name="address" placeholder="Alamat lengkap unit" />
      <Button disabled={loading} type="submit">
        Simpan Unit
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Run UI test to verify it passes**

Run:

```powershell
npx vitest run tests/superadmin-pages.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add components/pages/superadmin-pages.tsx app/superadmin lib/superadmin/client.ts components/superadmin tests/superadmin-pages.test.tsx
git commit -m "feat: connect superadmin frontend to real api"
```

### Task 7: Verifikasi end-to-end dengan PostgreSQL, auth role, dan HTTP checks

**Files:**
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\docs\superpowers\plans\2026-04-23-superadmin-backend-implementation.md`
  Tandai langkah yang sudah tervalidasi saat eksekusi.
- Test: HTTP route nyata, login role nyata, query PostgreSQL nyata.

- [ ] **Step 1: Seed minimal data superadmin jika belum ada**

Run:

```powershell
@'
import { db } from "./lib/db/client";
import { users } from "./lib/db/schema";
import { eq } from "drizzle-orm";

const email = "superadmin.demo@example.com";
const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
if (!existing) {
  console.log("Seed user handled elsewhere through Better Auth sign-up.");
}
'@ | npx tsx -
```

Expected: environment bisa membaca database tanpa error.

- [ ] **Step 2: Verify guest access is blocked**

Run:

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/superadmin/unit -MaximumRedirection 0
Invoke-WebRequest -Uri http://localhost:3000/superadmin -MaximumRedirection 0
```

Expected: API `401/403`, page redirect ke `/login`.

- [ ] **Step 3: Verify superadmin can create unit and rekening**

Run with authenticated cookie jar:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/superadmin/unit -ContentType 'application/json' -Body '{"code":"CP-MKS-09","name":"Pegadaian CP Aroepala","address":"Jl. Aroepala No. 19, Makassar"}'
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/superadmin/unit/<unit-id>/rekening -ContentType 'application/json' -Body '{"bankName":"BRI","accountNumber":"0099887766","accountHolderName":"PT Pegadaian (Persero) CP Aroepala","branchName":"Makassar Aroepala","isActive":true}'
```

Expected: row masuk ke `units` dan `rekening_unit`.

- [ ] **Step 4: Verify only one active account per unit**

Run:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/superadmin/unit/<unit-id>/rekening -ContentType 'application/json' -Body '{"bankName":"Mandiri","accountNumber":"7788990011","accountHolderName":"PT Pegadaian (Persero) CP Aroepala","branchName":"Makassar Pettarani","isActive":true}'
```

Expected: rekening pertama otomatis nonaktif, rekening kedua aktif.

- [ ] **Step 5: Verify created admin unit can login**

Run:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/superadmin/admin -ContentType 'application/json' -Body '{"name":"Admin Aroepala","email":"admin.aroepala@example.com","unitId":"<unit-id>","temporaryPassword":"AdminAroepala123!","phoneNumber":"6281234500099"}'
```

Then sign in:

```powershell
Invoke-WebRequest -Method Post -Uri http://localhost:3000/api/auth/sign-in/email -ContentType 'application/json' -Body '{"email":"admin.aroepala@example.com","password":"AdminAroepala123!"}' -SessionVariable adminSession
Invoke-WebRequest -Uri http://localhost:3000/admin -WebSession $adminSession
```

Expected: login succeeds, `/admin` returns `200`.

- [ ] **Step 6: Verify blacklist revoke writes audit log**

Run:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/superadmin/blacklist/<user-id>/cabut -ContentType 'application/json' -Body '{"reason":"Masa evaluasi selesai dan user dinyatakan layak aktif kembali."}'
```

Expected: `blacklist.is_active = false` dan row baru muncul di `blacklist_action_log`.

- [ ] **Step 7: Run regression tests**

Run:

```powershell
npx vitest run tests/superadmin-validation.test.ts tests/superadmin-serializers.test.ts tests/superadmin-auth-guards.test.ts tests/superadmin-pages.test.tsx tests/buyer-auth-validation.test.ts tests/buyer-auth-guards.test.ts
```

Expected: PASS untuk suite auth dan superadmin baru.

- [ ] **Step 8: Run targeted type-check and build sanity**

Run:

```powershell
npx tsc --noEmit
npm run build
```

Expected: type-check clean; build succeeds ketika dev server tidak mengunci `.next\trace`.

- [ ] **Step 9: Commit**

```powershell
git add .
git commit -m "feat: implement superadmin backend end-to-end"
```

---

## Self-Review

### 1. Spec coverage

- CRUD unit tercakup di Task 3 dan Task 6.
- Kelola rekening unit tercakup di Task 3 dan Task 6.
- CRUD admin unit tercakup di Task 4 dan Task 7.
- Monitoring global tercakup di Task 5 dan Task 6.
- Blacklist global dan cabut manual tercakup di Task 5 dan Task 7.
- Proteksi role `super_admin` tercakup di Task 2 dan diverifikasi di Task 7.
- Integrasi frontend nyata tercakup di Task 6.

### 2. Placeholder scan

- Tidak ada `TODO` / `TBD`.
- Setiap task memiliki file target, command, dan contoh kode.
- Langkah verifikasi menjelaskan command dan expected result.

### 3. Type consistency

- Tabel memakai nama `units`, `unitAccounts`, `blacklists`, `blacklistActionLogs`.
- Serializer memakai `accountHolder` untuk UI dan `accountHolderName` untuk DB.
- API guard memakai `requireSuperAdminApiSession`.
- Admin unit selalu memakai `temporaryPassword` pada payload create.

---

Plan complete and saved to `docs/superpowers/plans/2026-04-23-superadmin-backend-implementation.md`. Karena Anda sudah meminta lanjut langsung, eksekusi berikutnya memakai pendekatan **Inline Execution** di sesi ini dengan checkpoint verifikasi per domain.
