# Acceptance Criteria — Conventions

This file is the team's convention sheet for writing acceptance criteria
(ACs) on PRDs and test plans. The orchestrator's `test-plan` phase always
includes this file in the QA worker's context, even if the epic doesn't
list it as an affected module.

## Format

Every AC follows **Given / When / Then**:

```
AC{NN}: <one-line summary>
  Given <starting state>
  When  <user action or system event>
  Then  <observable outcome>
  And   <secondary outcome, if any>
```

## ID rule

ACs are scoped to the epic. ID format:

```
{EPIC_KEY}-AC{NN}      e.g. EPIC-1000-AC03
```

IDs are stable — never renumber when adding a new AC. Append at the end.
Removed ACs become tombstones (`-- removed: superseded by AC07 --`) so
test traces don't break.

## Coverage rule

Every user story in the PRD must have at least one AC. Every AC must map
to at least one test case in the test plan. The QA worker enforces both
sides at the test-plan auto-review checkpoint.

## What makes a good AC

- **Observable.** "Then the user sees a confirmation toast" is good.
  "Then the system feels responsive" is not.
- **Bounded.** "Then within 200 ms" is good. "Then quickly" is not.
- **Pre-conditioned.** Always state the starting state. "Given the user
  is logged in" beats an implicit assumption.
- **Single outcome.** One AC = one outcome. If you find yourself writing
  "Then X *and* Y *and* Z" for unrelated things, split into multiple ACs.

## Negative paths are mandatory

For every happy-path AC, write at least one matching error / boundary AC.
Examples:

- AC: card assignment succeeds → AC: card assignment fails when assignee
  is a guest (HTTP 403, toast says "Guests can't be assigned").
- AC: login succeeds with correct password → AC: login is soft-locked
  after 10 consecutive failures within 15 min.

## Cross-references

- Test plan: each test case must reference the AC IDs it covers.
- Tech design: each component should reference the user stories (and
  thus ACs) it implements.
- Review phase: a reviewer's APPROVAL.md should call out any AC that has
  drifted from the implementation.
