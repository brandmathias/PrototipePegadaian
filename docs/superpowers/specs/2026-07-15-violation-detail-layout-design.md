# Violation Detail Layout Design

## Goal

Make the shared violation-detail workspace for admin unit and superadmin match the approved compact dossier layout.

## Scope

- Remove the hero right-rail status and case-count badges.
- Rename `Kasus Pemicu Utama` to `Kasus Terakhir`.
- Keep the buyer-level status badge in the buyer identity card.
- Keep the active sentence colors in the existing green/dark palette; do not introduce an all-blue typography treatment.
- Replace the timeline heading's empty right space with three read-only counts: total recorded violations, violations in the current unit, and violations outside the current unit.
- Remove `Log Keputusan Sistem`, `Ketetapan Level`, and the standalone `Konteks Lintas Unit` card.
- Add `Keterangan Level Pelanggaran` directly below the timeline with three compact Level 1-3 explanation cards.
- Use the same component for admin unit and superadmin so layout and count logic cannot drift.

## Data and behavior

- `items.length` is the total recorded violations.
- `crossUnitViolationSummary.currentUnitViolationCount` is used when present; otherwise the total is treated as current-unit count.
- `crossUnitViolationSummary.externalViolationCount` is used when present; otherwise external count is zero.
- The existing image, countdown, timeline expansion, and buyer status behavior remain unchanged.

## Responsive behavior

- At desktop width, the three timeline counts align at the right of the timeline title.
- Below `sm`, the title and count group stack with count cards retaining readable labels and values.
- The level explanations use three columns at `md` and a single-column stack below that breakpoint.

## Validation

- Add a regression test that asserts removed panels and hero badges are absent, revised labels/counts are present, and both scope modes render the new layout.
- Run the targeted blacklist and superadmin page tests, TypeScript, and production build.
