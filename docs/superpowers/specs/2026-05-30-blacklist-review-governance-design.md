# Blacklist Review Governance Design

Status: proposed for review
Date: 2026-05-30
Scope: incident-based blacklist help and review flow with superadmin final authority

## Context

The current prototype already has automatic blacklist activation, buyer-facing restriction rules, admin-unit blacklist views, and superadmin revocation capability. However, the ownership boundaries are still mixed: admin unit surfaces still imply blacklist control, level 3 already mentions manual review, and the system does not yet have a complete review workflow tied to a specific violation incident.

This design restructures blacklist handling so the sanction remains system-triggered and superadmin-governed, while buyer and admin-unit flows support assistance, escalation, and status visibility without duplicating final authority.

## Goals

- Keep blacklist activation automatic and system-driven.
- Treat each unpaid winning-auction event as one reviewable violation incident.
- Let buyers submit one help case per active blacklist incident.
- Let admin unit and superadmin both see cases from the start.
- Keep final approve or reject authority only at superadmin level.
- Ensure approved review or direct revoke removes the incident from future escalation counts without deleting history.
- Provide a public help entry for locked buyers using identity lookup.
- Preserve strong audit trails for every important action.

## Non-Goals

- No buyer resubmission loop for the same incident after final decision.
- No buyer upload of additional evidence after first submission.
- No OTP gate for the public help page in this phase.
- No admin-unit authority to activate, extend, revoke, or close blacklist as final decision.
- No exposure of internal deliberation details to buyer-facing surfaces.

## Core Business Model

### Violation Incident

One violation incident equals one buyer who wins an auction and does not complete payment before the deadline.

This incident is the reviewable unit. Help cases, audit reasoning, and escalation eligibility attach to the incident, not to the buyer's entire violation history.

### Blacklist

Blacklist remains a system sanction derived from the accumulation of valid incidents. Restriction level is computed from incidents that are still eligible for escalation.

### Help Case

One help case may exist for one violation incident. The case carries buyer-submitted evidence, buyer statement, optional admin-unit recommendation, superadmin decision, and a buyer-safe summary.

## Locked Product Decisions

- Blacklist is a global sanction governed by superadmin, not by admin unit.
- Blacklist activation remains automatic and triggered by overdue winner payment.
- All active blacklist levels may enter the help and review flow.
- Priority remains highest for level 3 and locked-account cases.
- Buyer review is one-shot per incident.
- Buyer must see a strong disclaimer to prepare complete evidence before first submission.
- Buyer cannot upload more evidence after submission.
- Admin unit and superadmin can both see the case from the beginning.
- Admin-unit recommendation is optional and never blocks superadmin decision.
- Superadmin final outcomes are only `DISETUJUI` or `DITOLAK`.
- Superadmin decision always requires a selected reason code and may include an optional note.
- Superadmin may still revoke directly without a help case for operational correction scenarios.
- Review approval and direct revoke have the same governance effect.
- If blacklist expires while case review is still running, review continues until final decision.
- Buyer may create a help case only while the blacklist for that incident is still active.
- Public help lookup uses NIK plus email or phone number, with no OTP in this phase.
- Public and buyer-facing status views show safe summaries only.

## Role Matrix

### System

- Activates blacklist automatically after overdue winner payment.
- Tracks incidents, blacklist restriction level, status, and audit history.
- Computes restriction level from escalation-eligible incidents only.
- Applies buyer restrictions immediately based on current blacklist state.
- Restores buyer access immediately when approval or direct revoke removes the active restriction.

### Buyer

- Can submit one help case per incident while the blacklist is active.
- Can submit from authenticated buyer surfaces or from a public help page if account access is blocked.
- Can view case status, their own submitted evidence, safe summaries, and current blacklist status.
- Cannot resubmit or reopen a final case for the same incident.
- Cannot upload more evidence after first submission.

### Admin Unit

- Can view only incidents and cases tied to its own triggering transaction or unit context.
- Can inspect buyer evidence and local operational context.
- Can submit an optional recommendation.
- Can see only a simple cross-unit signal, with no cross-unit counts or details.
- Cannot activate, extend, revoke, or finally decide blacklist.

### Superadmin

- Can see cases from the start across all units.
- Can inspect full incident context, evidence, queue priority, and audit history.
- Can decide `DISETUJUI` or `DITOLAK`.
- Must select a reason code and may add an optional note.
- May revoke directly without a help case when operationally justified.

## Case Lifecycle

Recommended case statuses:

- `TERKIRIM`
- `DITINJAU_ADMIN_UNIT`
- `DITINJAU_SUPERADMIN`
- `DISETUJUI`
- `DITOLAK`

Notes:

- `DITINJAU_ADMIN_UNIT` means local intake is in progress, not that superadmin must wait.
- `DITINJAU_SUPERADMIN` is the final decision stage.
- `DISETUJUI` and `DITOLAK` are terminal statuses.
- No separate `SELESAI` status is needed.

## User Flows

### Authenticated Buyer Flow

- Buyer sees active blacklist status and a clear help CTA.
- Buyer sees a strong disclaimer that all evidence must be prepared before submission.
- If no case exists for the incident, buyer can submit one case.
- If a case already exists, buyer is routed to the existing case status view.
- After submission, buyer can only monitor status and safe outcome summaries.

### Public Help Flow

- Used when buyer is locked out or cannot access the account.
- Buyer identifies using NIK plus email or phone number.
- No OTP is required in this phase.
- If the incident has no case, buyer may create one.
- If the incident already has a case, buyer is routed to the existing status view.
- Public view shows only safe information:
  - case status
  - submission time
  - blacklist status
  - concise safe result summary

### Admin Unit Flow

- Admin unit sees local case list and incident detail for its own unit.
- Admin unit can inspect buyer evidence and local auction or transaction context.
- Admin unit may attach an optional recommendation and note.
- Admin unit never sees cross-unit counts, other units, or internal superadmin deliberation.

### Superadmin Flow

- Superadmin has a national review queue separate from general blacklist listing.
- Queue prioritization order:
  1. level 3 or locked-account cases
  2. near-SLA or overdue cases
  3. older cases
  4. remaining cases by submission age
- Superadmin opens the case, reviews evidence and context, then decides `DISETUJUI` or `DITOLAK`.
- Direct revoke remains available for operational correction cases.

## Decision Effects

### If Superadmin Approves

- Active blacklist is immediately deactivated.
- Locked buyer account is immediately restored if the blacklist caused login suspension.
- Case moves to `DISETUJUI`.
- Incident remains stored for audit.
- Incident is marked as excluded from future escalation.

### If Superadmin Rejects

- Blacklist remains active under existing duration rules.
- Case moves to `DITOLAK`.
- Buyer cannot create a new case for the same incident.
- Incident remains escalation-eligible.

### If Superadmin Directly Revokes

- Same effect as approved review:
  - blacklist deactivated
  - buyer access restored if needed
  - incident preserved in history
  - incident excluded from future escalation

## Recommended Data Model

### Violation Incident

Add or formalize an incident-level record with fields equivalent to:

```text
id
user_id
unit_id
transaction_id
auction_id
item_id
occurred_at
violation_type
escalation_eligible
resolved_by_superadmin_decision
resolution_type
resolution_reason_code
resolution_note
created_at
updated_at
```

The key governance field is `escalation_eligible`. Restriction level must be derived from incidents where this value remains true.

### Review Case

Recommended fields:

```text
id
incident_id
buyer_user_id
submission_channel
status
buyer_statement
safe_summary_for_buyer
submitted_at
last_status_changed_at
admin_recommendation
admin_recommendation_note
admin_recommendation_at
superadmin_decision
superadmin_reason_code
superadmin_note
decided_at
created_at
updated_at
```

### Review Case Attachments

Use a separate attachment model rather than a single JSON array on the case:

```text
id
case_id
uploaded_by_role
file_url
file_name
mime_type
uploaded_at
```

This keeps the case model focused and preserves clean attachment audit history.

## Audit Trail

Important events must be recorded explicitly, not inferred only from timestamps:

- system activates blacklist automatically
- buyer submits help case
- admin unit submits recommendation
- superadmin approves revocation
- superadmin rejects revocation
- superadmin directly revokes blacklist
- system deactivates blacklist from decision effect
- system restores buyer access
- incident marked excluded from escalation

Audit records should capture actor role, actor id when relevant, action type, reason code if relevant, optional note, target entity, and timestamp.

## Backend Rules

- Buyer may create a case only while blacklist for the incident is active.
- Only one case is allowed per incident.
- Final cases cannot be reopened.
- Buyer cannot add evidence after first submission.
- Admin unit can only access cases tied to its own unit-triggering incident.
- Superadmin can access all cases.
- Approval review and direct revoke must share the same governance effect.
- Restriction level computation must read escalation-eligible incidents, not only a raw counter.

## UI and Copy Rules

- Admin-unit navigation and copy must avoid language that implies blacklist ownership.
- Superadmin surfaces may use explicit blacklist governance language.
- Buyer and public pages must use strong one-shot submission disclaimer copy.
- Buyer-safe summaries must never expose internal recommendations or superadmin deliberation notes.

## Recommended Implementation Order

1. Build incident and review-case data foundations.
2. Add buyer and public help entry plus safe status view.
3. Add admin-unit local intake workspace.
4. Add superadmin queue and final decision center.
5. Synchronize blacklist restriction logic with escalation-eligible incidents.
6. Add notifications, PRD updates, and rollout notes.

## Open Outcome

This design is ready for implementation planning once the written spec is reviewed and approved.
