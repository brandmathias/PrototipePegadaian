# Admin Unit Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Admin Unit workflows to PostgreSQL with Drizzle, Better Auth role guards, API routes, and database-backed frontend pages.

**Architecture:** Add admin domain schema, validation, serializers, service layer, API routes, and form components. Keep the existing Admin Unit visual layout but feed it with server data instead of `mock-data`.

**Tech Stack:** Next.js App Router, Drizzle ORM, PostgreSQL, Better Auth, Tailwind CSS, shadcn-style local UI primitives, Vitest, Playwright.

---

### Task 1: Schema and Domain Utilities

**Files:**
- Create: `lib/db/schema/admin.ts`
- Modify: `lib/db/schema/index.ts`
- Create: `lib/admin-unit/validation.ts`
- Create: `lib/admin-unit/serializers.ts`
- Test: `tests/admin-unit-validation.test.ts`
- Test: `tests/admin-unit-serializers.test.ts`

- [ ] Add Drizzle tables matching PRD admin workflows.
- [ ] Add validation functions for barang, transitions, pemasaran, transaksi, and blacklist extension.
- [ ] Add serializers that shape DB rows for current admin UI.
- [ ] Run validation and serializer tests.

### Task 2: Service Layer and API Routes

**Files:**
- Create: `lib/services/admin-barang.service.ts`
- Create: `lib/services/admin-pemasaran.service.ts`
- Create: `lib/services/admin-transaction.service.ts`
- Create: `lib/services/admin-blacklist.service.ts`
- Create: `lib/services/admin-dashboard.service.ts`
- Create: `app/api/admin/**/route.ts`
- Test: `tests/admin-unit-services.test.ts`

- [ ] Implement unit-scoped service methods.
- [ ] Implement route handlers with `requireAdminApiSession`.
- [ ] Ensure invalid unit access returns `403` or not found.
- [ ] Run service tests and HTTP smoke checks.

### Task 3: Frontend Integration

**Files:**
- Modify: `app/admin/**/page.tsx`
- Modify: `components/pages/admin-dashboard-page.tsx`
- Modify: `components/pages/admin-pages.tsx`
- Create: `components/admin-unit/*.tsx`
- Create: `lib/admin-unit/client.ts`

- [ ] Pass server data into admin pages.
- [ ] Replace static forms with client forms that call API routes.
- [ ] Preserve existing layout and copy.
- [ ] Add loading, toast, and inline feedback where actions mutate data.

### Task 4: Database Migration and Verification

**Files:**
- Create: `drizzle/*.sql`
- Create: `tests/admin-unit-pages.test.tsx`

- [ ] Generate/push migration.
- [ ] Seed local demo admin unit data for testing.
- [ ] Run Vitest suites.
- [ ] Verify browser routes and database state.
