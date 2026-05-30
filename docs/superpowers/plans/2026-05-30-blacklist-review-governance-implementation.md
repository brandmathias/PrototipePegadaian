# Blacklist Review Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement incident-based blacklist help cases, admin-unit intake, and superadmin review decisions with audit-safe revocation effects.

**Implementation status:** Completed on 2026-05-30. The implementation includes schema and migration generation, buyer/public help submission without OTP, admin-unit recommendation intake, superadmin final decisions with reason codes, direct revoke governance alignment, buyer lifecycle notifications, PRD updates, focused tests, full Vitest, and production build verification.

**Deferred follow-up:** Persisted admin/superadmin notification delivery for high-priority review cases remains a product-channel decision because the current alert center only polls persisted notifications for buyer scope.

**Architecture:** Add review-case schema and services around the existing `pelanggaran_user` and `blacklist` tables. Keep blacklist activation automatic, make review cases attach to specific violation incidents, and route final decisions through superadmin while buyer/public surfaces only show safe summaries.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS, Drizzle ORM, PostgreSQL, Vitest.

---

## File Structure

- `lib/db/schema/admin.ts` extends `pelanggaran_user` with escalation-governance fields.
- `lib/db/schema/blacklist-review.ts` owns review case and attachment tables.
- `lib/db/schema/index.ts` exports the new schema.
- `lib/blacklist/review.ts` contains status, reason-code, and serializer helpers.
- `lib/blacklist/restrictions.ts` keeps policy helpers and adds count-based utilities.
- `lib/services/blacklist-review.service.ts` owns public/buyer/admin/superadmin case behavior.
- `lib/services/blacklist.service.ts` reuses the same governance effect for direct revoke.
- `lib/services/admin-blacklist.service.ts` stops admin-unit direct extension and exposes review intake data.
- `app/api/user/blacklist-review/route.ts` handles authenticated buyer case creation/listing.
- `app/api/public/blacklist-help/route.ts` handles public lookup and case creation without OTP.
- `app/api/admin/blacklist-review/[caseId]/route.ts` handles admin recommendations.
- `app/api/superadmin/blacklist-review/[caseId]/route.ts` handles final decisions.
- `components/buyer/blacklist-help-case-form.tsx` renders one-shot buyer case submission.
- `components/buyer/blacklist-help-case-status.tsx` renders buyer-safe status.
- `components/admin/admin-blacklist-review-inbox.tsx` renders local intake.
- `components/superadmin/blacklist-review-queue.tsx` renders superadmin review queue.
- Page components integrate the new components into existing buyer, admin, public, and superadmin surfaces.
- Focused tests cover service guards, route validation, UI status, and direct revoke effects.

## Task 1: Data Model And Review Helpers

**Files:**
- Modify: `lib/db/schema/admin.ts`
- Create: `lib/db/schema/blacklist-review.ts`
- Modify: `lib/db/schema/index.ts`
- Create: `lib/blacklist/review.ts`
- Test: `tests/blacklist-review-model.test.ts`

- [ ] Add incident governance fields to `pelanggaran_user`: `escalation_eligible`, `resolution_type`, `resolution_reason_code`, `resolution_note`, `resolved_by_user_id`, `resolved_at`, `updated_at`.
- [ ] Add `blacklist_review_case` with one unique case per incident.
- [ ] Add `blacklist_review_attachment` with one-to-many attachment metadata.
- [ ] Export review statuses `TERKIRIM`, `DITINJAU_ADMIN_UNIT`, `DITINJAU_SUPERADMIN`, `DISETUJUI`, `DITOLAK`.
- [ ] Export superadmin decision reason-code groups for approve and reject decisions.
- [ ] Test that only approved statuses are terminal, buyer-safe summaries are sanitized, and invalid decision payloads throw useful errors.

## Task 2: Review Case Service

**Files:**
- Create: `lib/services/blacklist-review.service.ts`
- Modify: `lib/services/blacklist.service.ts`
- Modify: `lib/services/cron.service.ts`
- Test: `tests/blacklist-review-case.service.test.ts`

- [ ] Implement lookup helpers for active blacklist incidents and public identity matching by NIK plus email or phone.
- [ ] Implement buyer/public case creation with one-case-per-incident and active-blacklist guards.
- [ ] Implement buyer-safe case serialization.
- [ ] Implement admin-unit recommendation submission without final authority.
- [ ] Implement superadmin final decision with required reason code and optional note.
- [ ] Implement shared governance effect so review approval and direct revoke both deactivate blacklist, restore buyer access if needed, mark incident excluded from escalation, and write audit logs.
- [ ] Update cron blacklist counting to use escalation-eligible incidents where practical without breaking existing duration logic.

## Task 3: API Routes

**Files:**
- Create: `app/api/user/blacklist-review/route.ts`
- Create: `app/api/public/blacklist-help/route.ts`
- Create: `app/api/admin/blacklist-review/[caseId]/route.ts`
- Create: `app/api/superadmin/blacklist-review/[caseId]/route.ts`
- Test: `tests/blacklist-review-routes.test.ts`

- [ ] Add authenticated buyer GET/POST route for case status and submission.
- [ ] Add public POST route that looks up by NIK plus email or phone and returns existing safe status or creates a case.
- [ ] Add admin-unit POST route for optional recommendation.
- [ ] Add superadmin POST route for final `DISETUJUI` or `DITOLAK` decision.
- [ ] Return 400 for duplicate case, inactive blacklist, missing evidence, invalid reason code, and final-case mutation attempts.

## Task 4: Buyer And Public UI

**Files:**
- Create: `components/buyer/blacklist-help-case-form.tsx`
- Create: `components/buyer/blacklist-help-case-status.tsx`
- Create: `app/(user)/bantuan/blacklist/[incidentId]/page.tsx`
- Create: `app/bantuan/blacklist/page.tsx`
- Modify: `components/pages/user-pages.tsx`
- Modify: `components/pages/public-pages.tsx`
- Test: `tests/buyer-blacklist-help-page.test.tsx`
- Test: `tests/public-blacklist-help.test.tsx`

- [ ] Render one-shot disclaimer before buyer can submit.
- [ ] Require at least one evidence metadata entry on submission.
- [ ] Show existing case status instead of allowing duplicate submission.
- [ ] Keep public status minimal: status, submitted time, blacklist status, and safe summary.
- [ ] Avoid exposing admin recommendation, superadmin internal notes, or cross-unit detail.

## Task 5: Admin Unit Intake

**Files:**
- Create: `components/admin/admin-blacklist-review-inbox.tsx`
- Modify: `components/admin/admin-blacklist-detail-workspace.tsx`
- Modify: `components/pages/admin-pages.tsx`
- Modify: `app/admin/blacklist/page.tsx`
- Modify: `app/admin/blacklist/[userId]/page.tsx`
- Test: `tests/admin-blacklist-review-inbox.test.tsx`

- [ ] Rename admin-unit copy toward case monitoring and local intake language.
- [ ] Remove direct extension cues from the main flow.
- [ ] Show local incident, buyer evidence, case status, and simple cross-unit signal.
- [ ] Add optional recommendation form that never blocks superadmin.

## Task 6: Superadmin Queue And Decisions

**Files:**
- Create: `components/superadmin/blacklist-review-queue.tsx`
- Modify: `components/pages/superadmin-pages.tsx`
- Modify: `app/superadmin/blacklist/page.tsx`
- Modify: `components/superadmin/cabut-blacklist-form.tsx`
- Test: `tests/superadmin-blacklist-review-page.test.tsx`

- [ ] Add national review queue separate from general blacklist list.
- [ ] Prioritize level 3 or locked-account cases, SLA risk, age, then remaining cases.
- [ ] Require reason code for both `DISETUJUI` and `DITOLAK`.
- [ ] Keep optional notes internal unless a safe summary is explicitly provided.
- [ ] Keep direct revoke available and make it use the same governance effect as approval.

## Task 7: Notifications And Documentation

**Files:**
- Modify: `lib/services/notification-events.ts`
- Modify: `components/ui/alert-center.tsx`
- Modify: `PRD.md`
- Modify: `docs/prd-traceability-checklist.md`
- Test: `tests/notification-events.test.ts`

- [ ] Notify buyer when case is submitted, reviewed, approved, or rejected.
- [ ] Notify admin unit when a local case arrives.
- [ ] Notify superadmin for high-priority or overdue cases.
- [ ] Update PRD and traceability notes with superadmin governance and incident-based review.

## Task 8: Verification

**Files:**
- Verify changed tests and TypeScript build.

- [ ] Run focused service and route tests.
- [ ] Run focused UI tests.
- [ ] Run `npm test -- --runInBand` if Vitest supports it, otherwise run `npm test`.
- [ ] Run `npm run build`.
- [ ] Review `git diff` for unintended unrelated changes.

## Execution Note

Implement in vertical slices. Start with Tasks 1 to 3 so backend contracts are real, then add UI surfaces over those contracts. If any test or build failure appears, use systematic debugging before changing implementation.
