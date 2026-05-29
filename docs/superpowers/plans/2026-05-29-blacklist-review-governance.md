# Blacklist Review Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure blacklist ownership and review handling so blacklist remains a superadmin-governed platform sanction, while buyer and admin-unit flows support assistance, review escalation, and status transparency without duplicating authority.

**Architecture:** Keep blacklist activation automatic and system-driven from overdue winner payments. Move admin-unit behavior to read-and-escalate only, introduce a buyer help case flow with evidence upload and status tracking, and route every final review decision through superadmin with strong audit trails and SLA-aware queueing.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Vitest, Drizzle ORM, PostgreSQL.

---

## Product Decisions Locked In

- Blacklist is a **global sanction**, not an admin-unit-owned feature.
- Blacklist is activated **automatically by the system** when a winner fails to pay within 24 hours.
- This flow currently has **one trigger only**: overdue auction-winner payment.
- Admin unit can **see local cases only** and can never activate, extend, or revoke blacklist directly.
- Admin unit may submit a **review escalation** to superadmin using the buyer help case and an internal recommendation.
- Buyer does **not** submit an official review directly.
- Buyer may open **one active help case per blacklist incident** and upload supporting evidence from the start.
- Review is treated as **one-shot** from the buyer side; the help flow must clearly warn users to prepare complete evidence before submission.
- Every case still ends with a **final superadmin decision**, even if admin unit thinks the case is weak.
- Superadmin may choose `Perlu bukti tambahan`, `Disetujui`, or `Ditolak`.
- If superadmin approves revocation, the system should **immediately restore buyer activity** and deactivate the blacklist.
- Blacklist history and violation history are **never deleted**.
- Buyer should see case status and safe summaries, but never internal admin or superadmin deliberation details.

## Role Matrix

### System

- Activates blacklist automatically after the 24-hour payment window expires.
- Tracks blacklist duration, status, violation count, and audit history.
- Prevents buyer activity based on blacklist restriction rules.
- Creates and updates buyer-facing notifications for blacklist and review state changes.
- Expires blacklist automatically where policy allows.

### Buyer

- Can view blacklist status and any active help case tied to the same blacklist incident.
- Can submit one help case for the incident, with evidence, even from the login page if account access is blocked.
- Can view help case status and safe final outcomes.
- Cannot directly submit official review or resubmit a rejected review for the same incident.

### Admin Unit

- Can view only blacklist incidents tied to the unit's own triggering transaction.
- Can view local operational context and a simple cross-unit signal without details or counts.
- Can review buyer help cases and attach a recommendation note before escalation.
- Cannot activate, extend, revoke, or finally close blacklist as authority.

### Superadmin

- Owns national blacklist oversight and final review authority.
- Can review full cross-unit context, evidence, queue priority, and audit history.
- Can decide `Perlu bukti tambahan`, `Disetujui`, or `Ditolak`.
- Must provide a structured reason code plus optional note for both approval and rejection.

---

### Task 1: Clarify Ownership In Navigation And Page Structure

**Files:**
- Modify: `app/admin/layout.tsx`
- Modify: `app/superadmin/layout.tsx`
- Modify: `components/pages/admin-pages.tsx`
- Modify: `components/pages/superadmin-pages.tsx`
- Test: `tests/admin-blacklist-page.test.tsx`

- [ ] Rename the admin-unit surface away from authoritative `Blacklist` wording and position it as a local case-monitoring workspace.
- [ ] Keep superadmin as the only role with explicit blacklist governance language such as global blacklist and revocation authority.
- [ ] Remove any admin-unit copy that implies direct sanction ownership.

### Task 2: Convert Admin-Unit Blacklist Actions To Read And Escalate

**Files:**
- Modify: `lib/services/admin-blacklist.service.ts`
- Modify: `app/api/admin/blacklist/[userId]/perpanjang/route.ts`
- Modify: `app/admin/blacklist/[userId]/perpanjang/page.tsx`
- Modify: `components/admin/admin-blacklist-detail-workspace.tsx`
- Test: `tests/admin-blacklist-page.test.tsx`
- Test: `tests/admin-unit-validation.test.ts`

- [ ] Remove direct admin-unit blacklist extension behavior from the operational flow.
- [ ] Replace extension-oriented UI and API behavior with escalation/recommendation behavior only.
- [ ] Preserve local blacklist detail visibility, including the triggering transaction and unit-safe timeline.

### Task 3: Add Buyer Help Case Model For Blacklist Incidents

**Files:**
- Create: `lib/db/schema/blacklist-review-cases.ts`
- Modify: `lib/db/schema/index.ts`
- Create: `lib/services/blacklist-review-case.service.ts`
- Test: `tests/blacklist-review-case.service.test.ts`

- [ ] Add a dedicated case model keyed to one blacklist incident, not a user's entire violation history.
- [ ] Enforce one active buyer help case per blacklist incident.
- [ ] Store buyer evidence, buyer notes, admin recommendation, superadmin decision metadata, and visible-safe decision summaries.
- [ ] Preserve strong audit fields for actor, timestamp, and reason code changes.

### Task 4: Add Buyer Help Form And Status Tracking

**Files:**
- Create: `app/(user)/bantuan/blacklist/[blacklistId]/page.tsx`
- Modify: `components/pages/user-pages.tsx`
- Modify: `app/(user)/layout.tsx`
- Create: `components/buyer/blacklist-help-case-form.tsx`
- Create: `components/buyer/blacklist-help-case-status.tsx`
- Test: `tests/buyer-blacklist-help-page.test.tsx`

- [ ] Add a buyer help page for blacklist incidents with strong disclaimer copy that evidence must be complete from the start.
- [ ] Allow buyer evidence upload on first submission and further uploads only while the case is not in a final state.
- [ ] Show buyer-safe case statuses such as `Terkirim`, `Sedang ditinjau admin unit`, `Diajukan ke superadmin`, `Sedang direview oleh superadmin`, `Review disetujui`, `Review ditolak`, and `Selesai`.
- [ ] Show safe rejection summaries without exposing internal notes.
- [ ] Prevent duplicate active submissions for the same blacklist incident and route the buyer back to the existing case view.

### Task 5: Add Login-Safe Help Entry For Locked Accounts

**Files:**
- Modify: `components/pages/public-pages.tsx`
- Create: `app/bantuan/blacklist/page.tsx`
- Create: `app/api/public/blacklist-help/route.ts`
- Test: `tests/public-blacklist-help.test.tsx`

- [ ] Add a no-login blacklist-help entry point for locked buyers, with minimum identity verification fields tied to an existing account and incident.
- [ ] Reuse the same one-case-per-incident rule for login-page submissions.
- [ ] Surface CTA entry points from both the login page and buyer blacklist status page.

### Task 6: Add Admin-Unit Review Intake Workspace

**Files:**
- Create: `components/admin/admin-blacklist-review-inbox.tsx`
- Modify: `components/admin/admin-blacklist-detail-workspace.tsx`
- Create: `app/api/admin/blacklist-review/[caseId]/route.ts`
- Test: `tests/admin-blacklist-review-inbox.test.tsx`

- [ ] Let admin unit inspect the buyer help case, evidence, and incident context for its own unit only.
- [ ] Let admin unit submit a structured recommendation without closing the case as final authority.
- [ ] Remove any buyer evidence back-and-forth loop; the buyer must submit complete evidence from the start.
- [ ] Allow admin unit to forward the case automatically to superadmin using the existing buyer-submitted payload plus an internal note.

### Task 7: Build Superadmin Review Queue And Decision Workflow

**Files:**
- Modify: `app/superadmin/blacklist/page.tsx`
- Modify: `components/pages/superadmin-pages.tsx`
- Create: `components/superadmin/blacklist-review-queue.tsx`
- Create: `app/api/superadmin/blacklist-review/[caseId]/route.ts`
- Test: `tests/superadmin-blacklist-review-page.test.tsx`

- [ ] Add a queue that prioritizes level 3 and login-locked cases first, then older cases, then other cases.
- [ ] Show overdue badges when the review SLA has been exceeded.
- [ ] Require structured decision reasons for both approval and rejection, with optional short notes.
- [ ] Encourage evidence review before decision and make evidence visibility prominent in the layout.
- [ ] Keep `Perlu bukti tambahan` available as a superadmin-only state, without reopening buyer-side duplicate case creation.

### Task 8: Execute Immediate Revocation Effects On Approval

**Files:**
- Modify: `lib/services/blacklist.service.ts`
- Modify: `lib/services/cron.service.ts`
- Modify: `lib/auth.ts`
- Test: `tests/blacklist-restrictions.test.ts`
- Test: `tests/buyer-registration-guard.test.ts`

- [ ] When a review is approved, immediately deactivate the blacklist and restore buyer access where needed.
- [ ] Preserve violation history and revocation audit data after access is restored.
- [ ] Ensure restriction checks respect revoked status immediately across buyer-facing flows.

### Task 9: Add Notifications And Status Messaging

**Files:**
- Modify: `lib/services/notification-events.ts`
- Modify: `lib/services/notification.service.ts`
- Modify: `components/ui/alert-center.tsx`
- Test: `tests/notification-events.test.ts`
- Test: `tests/buyer-alert-center.test.tsx`

- [ ] Notify buyers when a help case is submitted, forwarded to superadmin, approved, rejected, or marked complete.
- [ ] Notify admin unit when new blacklist help cases arrive for its unit.
- [ ] Notify superadmin when a case becomes overdue or reaches high-priority status.
- [ ] Keep buyer-facing copy safe and concise, without exposing internal recommendations or audit reasoning.

### Task 10: Verification, PRD Alignment, And Rollout Notes

**Files:**
- Modify: `PRD.md`
- Modify: `docs/prd-traceability-checklist.md`
- Generate: relevant Drizzle migration files

- [ ] Update PRD language so blacklist is clearly system-triggered and superadmin-governed.
- [ ] Document the role matrix, buyer help-case flow, one-shot review rule, and cross-unit visibility limits.
- [ ] Run focused tests for admin blacklist pages, superadmin blacklist pages, public help entry, buyer help case flow, notifications, and TypeScript.
