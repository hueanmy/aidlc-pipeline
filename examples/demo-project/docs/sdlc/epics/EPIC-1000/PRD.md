# PRD — EPIC-1000 — Bulk-assign cards from board view

## Problem Statement

Power users (sprint leads, team admins) currently assign cards one-by-one
during triage, opening every card to set an assignee. For a 20-card sprint
that's ~20 modal-open / save / close cycles per triage. Users have asked
for a multi-select assignment shortcut twice in the last quarter
(support tickets TF-2421, TF-2509). The friction is well-defined and the
solution does not require new permissions or data shapes — it's a UX +
endpoint shape change.

## Scope

### In scope
- Multi-select cards on the board view via shift-click and cmd/ctrl-click.
- A floating action bar (visible only when ≥ 1 card is selected) with an
  "Assign to…" action.
- Server: a bulk endpoint or client fan-out that updates `assigneeIds` on
  each selected card; per-card audit log entry; existing
  `card.assigned` notifications fan out as today.
- Per-card failure handling: if any card cannot be updated (e.g. archived,
  guest assignee, permission), the bar shows a partial-success summary
  with the failed card titles.

### Out of scope
- Bulk *unassign* (separate epic).
- Bulk move across columns / boards.
- Bulk label or due-date edit.
- Mobile/touch multi-select gestures.

## User Stories

### US-01 — Select multiple cards
As a workspace member, I want to select multiple cards on a board, so that
I can act on them together.

### US-02 — Assign one teammate to all selected
As a workspace member, after selecting cards I want to assign one teammate
to all of them in a single action, so that I save the open-card-close-card
cycle.

### US-03 — See partial failures clearly
As a workspace member, when some cards in my selection cannot be assigned,
I want to know exactly which ones failed and why, so that I can fix them
manually.

### US-04 — Keep guest restrictions intact
As an admin, I want guests to remain non-assignable, so that bulk-assign
doesn't create a new way to grant work to guests.

## Acceptance Criteria

```
EPIC-1000-AC01: Shift-click extends selection to a contiguous range
  Given a board with cards in a column
  When  the user clicks the first card and shift-clicks a later card
  Then  every card between (inclusive) is selected
  And   the floating action bar shows "<N> cards selected"

EPIC-1000-AC02: Cmd/ctrl-click toggles a single card in the selection
  Given the user has any selection (even 0)
  When  the user cmd-clicks (mac) or ctrl-clicks (win) a card
  Then  that card's selection state toggles
  And   the action bar updates the count

EPIC-1000-AC03: "Assign to…" applied to all selected cards
  Given the user has selected ≥ 1 card
  When  the user opens the action bar's "Assign to…" picker and picks a
        workspace member
  Then  every selected card has that member added to its assigneeIds
  And   each card emits a card.assigned notification (per existing rules)
  And   the action bar shows "<N> cards assigned" toast for ≥ 2 s

EPIC-1000-AC04: Partial failure surfaces per-card reason
  Given the user has selected 5 cards and 1 is archived
  When  the user applies "Assign to…"
  Then  4 cards are updated and the toast says "4 of 5 assigned, 1 failed"
  And   clicking the toast opens a panel listing the failed card title
        and reason ("This card is archived.")

EPIC-1000-AC05: Guest assignee is rejected for the whole batch
  Given the user picks a guest (not a workspace member) in "Assign to…"
  When  the user submits
  Then  no card is updated
  And   the toast says "Guests can't be assigned to cards."

EPIC-1000-AC06: Performance — 50-card bulk assign completes within budget
  Given the user has 50 cards selected
  When  the user applies "Assign to…"
  Then  all assignments complete within 2 s p95 from the user's click
  And   API p95 latency for the bulk operation is under 500 ms

EPIC-1000-AC07: Audit log entries are per card, not per batch
  Given a bulk assignment of N cards
  When  the operation completes
  Then  N audit-log entries exist, each with the same correlation id
  And   each entry references the actor and the assigned member
```

## Non-functional requirements

- Performance: see AC06.
- Accessibility: the action bar must be reachable via keyboard
  (focus-trapped while open, Escape closes). Assistive tech should
  announce "X cards selected" on selection change.
- Observability: bulk endpoint emits a single trace with one span per
  card; per-card duration recorded.

## Rollout

- Behind a flag (`bulk_assign_enabled`), default off.
- 10 % rollout for 48 h → 50 % for 24 h → 100 %.
- Kill switch: flag-flip rollback. UI gracefully degrades to per-card.

## Success metrics

- Adoption: ≥ 30 % of triage sessions (defined as sessions with ≥ 5 card
  modifications in 10 min) use bulk-assign within 2 weeks of GA.
- Performance: assignment p95 latency unchanged (Δ < 5 %) compared with
  the week before launch.
- Quality: zero permission incidents (guest assigned, cross-workspace
  assignment) attributable to this epic in the first month.
