# UPC Wanea Real Buyer Violation Scenario Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an idempotent, production-safe UPC Wanea Vickrey scenario for five specified buyer accounts, with Anindita at Level 1 and Rendra progressing from Level 1 to active Level 2.

**Architecture:** A dedicated scenario module declares immutable buyer identities, real item data, auction chronology, and participant eligibility. A pure seed builder translates that scenario into database rows; an explicit production runner creates missing credential accounts, validates all existing records, dry-runs in a rollback transaction, and only commits after `SCENARIO_TARGET=production --apply`.

**Tech Stack:** TypeScript, Vitest, PostgreSQL (`pg`), Better Auth password hashing, existing Drizzle schema, Pexels-attributed WebP assets.

## Global Constraints

- Do not alter legacy cross-unit scenarios or unrelated production rows.
- Every target buyer is `role='buyer'`, has a credential account with a hashed password, and has one buyer profile.
- Initial passwords are supplied only as a one-off Dokploy environment secret during the production run; they are never committed to source control or logged.
- Each item enters exactly 10 days before its Vickrey marketing starts; each payment deadline is exactly 24 hours after its auction closes.
- Rendra may bid before his Level 2 incident but never after its payment deadline; he is excluded from Anindita's later auction.
- All production writes require both `SCENARIO_TARGET=production` and `--apply`; dry-run must rollback.
- Blacklist durations remain in `days`; no production configuration is changed.

---

### Task 1: Lock the scenario contract with failing tests

**Files:**
- Create: `tests/wanea-real-violation-scenario.test.ts`
- Create: `tests/wanea-real-violation-seed.test.ts`

**Interfaces:**
- Consumes: `WaneaRealViolationScenario`, `WaneaRealBuyerIdentities`, `validateWaneaRealViolationScenario`, and `buildWaneaRealViolationSeedRows`.
- Produces: a regression contract for identities, chronology, participant safety, Level 1/2 final state, item history, and Vickrey ranking.

- [ ] **Step 1: Write the failing scenario tests**

Assert the exact five identities, three incidents (`Rendra L1`, `Rendra L2`, `Anindita L1`), UPC Wanea ownership, H-10 and H+1 timing, `iteration === 1`, and final restrictions:

```ts
expect(getWaneaRealExpectedRestrictions()).toEqual([
  { buyerEmail: "anindita@gmail.com", level: 1, unitName: "UPC Wanea" },
  { buyerEmail: "rendra@gmail.com", level: 2, unitName: "UPC Wanea" }
]);
```

- [ ] **Step 2: Verify the tests fail**

Run: `rtk npm test -- tests/wanea-real-violation-scenario.test.ts tests/wanea-real-violation-seed.test.ts --exclude .worktrees/**`

Expected: module-not-found failure because the production scenario does not exist yet.

- [ ] **Step 3: Write failing seed assertions**

Use a context with five buyer IDs and one Wanea admin. Assert three items, three media rows, three marketing rows, fourteen bids, three failed Vickrey transactions, three violation rows, twelve status-history rows, two blacklist rows, and no suspended users.

- [ ] **Step 4: Verify seed tests fail for the intended missing module**

Run the same targeted command and confirm the failure remains solely the absent implementation.

### Task 2: Implement the pure scenario and row builder

**Files:**
- Create: `lib/blacklist/wanea-real-violation-scenario.ts`
- Create: `lib/blacklist/wanea-real-violation-seed.ts`

**Interfaces:**
- Produces `WaneaRealViolationScenario`, `WaneaRealBuyerIdentities`, `getWaneaRealExpectedRestrictions()`, `validateWaneaRealViolationScenario()`, and `buildWaneaRealViolationSeedRows(context)`.

- [ ] **Step 1: Declare the exact buyer identities and fixed chronology**

Define five buyer identities with the user-provided names, emails, NIKs, normalized Indonesian mobile numbers, and deterministic UUIDs. Use these incidents in chronological order:

```ts
// Rendra L1: entered 2026-04-12 09:00+07, starts 2026-04-22 09:00+07,
// ends 10:00+07, payment deadline / violation 2026-04-23 10:00+07.
// Rendra L2: entered 2026-07-08 10:00+07, starts 2026-07-18 10:00+07,
// ends 11:00+07, payment deadline / violation 2026-07-19 11:00+07.
// Anindita L1: entered 2026-07-10 14:00+07, starts 2026-07-20 14:00+07,
// ends 15:00+07, payment deadline / violation 2026-07-21 15:00+07.
```

All five buyers bid in both Rendra auctions. Anindita, Lazuardi, Savera, and Mahesa bid in Anindita's auction; Rendra is excluded because his Level 2 restriction is already active.

- [ ] **Step 2: Add the validator**

Validate unique IDs/codes/bidders, the H-10/H+1 gaps, correct second-price settlement, no later bid during an unresolved payment or restriction, and no user suspension because no target reaches Level 3.

- [ ] **Step 3: Build rows following the existing scenario pattern**

Create `barang`, `media_barang`, `pemasaran` (`mode='vickrey'`, `iteration=1`, `status='gagal'`), hashed bid integrity data, failed transactions, eligible violations, four status transitions per item (`gadai → tersedia → dipasarkan → menunggu_pembayaran → gagal`), two global blacklist rows, and action logs. Use only locally stored WebP paths and keep source attribution in the scenario.

- [ ] **Step 4: Verify tests pass**

Run: `rtk npm test -- tests/wanea-real-violation-scenario.test.ts tests/wanea-real-violation-seed.test.ts --exclude .worktrees/**`

Expected: all assertions pass.

### Task 3: Add the idempotent runner, assets, and audit

**Files:**
- Create: `scripts/apply-wanea-real-violation-scenario.ts`
- Create: `scripts/audit-wanea-real-violation-scenario.sql`
- Modify: `package.json`
- Reuse: three existing, locally verified Pexels WebP files listed in `docs/cross-unit-violation-media-attribution.md`

**Interfaces:**
- Consumes the scenario and seed builder.
- Produces `npm run db:scenario:wanea-real-violations`, with rollback by default and a committed, post-write audit only on the explicit production command.

- [ ] **Step 1: Create the runner with account creation and strict preflight**

For each target email, query existing user, credential account, and buyer profile. Insert only a completely missing identity, hash the supplied password from a required one-off `WANEA_SCENARIO_PASSWORDS_JSON` environment secret with `hashPassword`, and abort if any existing name, NIK, phone, role, account, or profile differs. Reject existing non-scenario violations, blacklists, open transactions, active bids, duplicate scenario IDs/codes, an inactive Wanea unit, or an unavailable Wanea admin.

- [ ] **Step 2: Make reruns safe**

Use one database transaction, `pg_advisory_xact_lock(hashtext('wanea-real-violation-scenario-2026-07-27'))`, 5-second lock timeout, and 60-second statement timeout. Re-run only replaces rows whose deterministic IDs belong to this scenario; it never deletes a target account, credential, buyer profile, or foreign row.

- [ ] **Step 3: Add production audit SQL**

Audit the five accounts, account/profile completeness, three item/marketing records and their iteration, fourteen bids, three violations, two active restrictions, the twelve item-status transitions, all media URLs, and the exclusion of Rendra from the final auction.

- [ ] **Step 4: Add the package command and media attribution**

Add `db:scenario:wanea-real-violations`. Reuse the existing documented Pexels assets and verify each local file remains valid WebP with the expected byte size before it is referenced.

- [ ] **Step 5: Run the runner locally as rollback-only preflight**

Run: `rtk npm run db:scenario:wanea-real-violations`

Expected: either an audited rollback succeeds against a matching local fixture or it stops before writes because the local database has no UPC Wanea; neither outcome changes local data.

### Task 4: Verify, publish, and synchronize production

**Files:**
- Modify only files from Tasks 1–3.

- [ ] **Step 1: Run targeted and project checks**

Run:

```powershell
rtk npm test -- tests/wanea-real-violation-scenario.test.ts tests/wanea-real-violation-seed.test.ts tests/blacklist-escalation.test.ts tests/cron-overdue-idempotency.test.ts --exclude .worktrees/**
rtk npx tsc --noEmit --pretty false
rtk npm run build
rtk git diff --check
```

- [ ] **Step 2: Commit and push the approved branch**

Commit the scenario and tests with `feat(blacklist): add real wanea violation scenario`, then push `codex/wanea-real-violations`.

- [ ] **Step 3: Merge the verified commit to master and push**

Fast-forward `master` only after verification, then push it so the existing Dokploy webhook deploys the exact verified code.

- [ ] **Step 4: Execute production dry-run and apply from Dokploy**

Inside the deployed application container, run:

```sh
SCENARIO_TARGET=production npm run db:scenario:wanea-real-violations
SCENARIO_TARGET=production npm run db:scenario:wanea-real-violations -- --apply
```

The first command must report rollback-only success. The second must report its committed audit; then execute `scripts/audit-wanea-real-violation-scenario.sql` read-only in Dokploy PostgreSQL.

## Plan self-review

- Coverage: accounts, real media, all specified buyer participation, Wanea Level 1/2 outcomes, item and iteration history, production safety, and publish/deploy are each assigned to a task.
- No placeholders: all required timelines, commands, constraints, and output contracts are explicit.
- Scope: this is one isolated scenario; no shared blacklist behavior or legacy seed is changed.
