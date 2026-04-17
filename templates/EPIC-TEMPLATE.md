# Epic: [EPIC-KEY] — [Epic Title]

> Copy this template to `docs/sdlc/epics/[EPIC-KEY]/[EPIC-KEY].md`
> Example: `docs/sdlc/epics/PROJ-1234/PROJ-1234.md`
>
> **Epic Key** is the single identifier for all work. All artifacts, PRs, branches, and docs reference this key.

---

## Overview

| Field | Value |
|-------|-------|
| **Epic Key** | [EPIC-KEY] |
| **Title** | |
| **Owner** | |
| **Priority** | P0 / P1 / P2 / P3 |
| **Status** | `backlog` → `planning` → `in-progress` → `review` → `done` → `released` |
| **Estimated Size** | S / M / L / XL |
| **Created** | YYYY-MM-DD |
| **Target Release** | vX.Y.Z |
| **Last Updated** | YYYY-MM-DD |

---

## Problem Statement

_What problem does this epic solve? Why now?_

## Business Value

_Who benefits and how? Include metrics if possible (e.g., "reduce failure rate from X% to <Y%")._

---

## Scope

### In Scope
- [ ] Feature/change 1
- [ ] Feature/change 2

### Out of Scope
- Item explicitly excluded and why

---

## User Stories

| ID | Story | Acceptance Criteria | Priority | Status |
|----|-------|-------------------|----------|--------|
| [EPIC-KEY]-01 | As a [user], I want [action] so that [benefit] | Given/When/Then (detail in PRD) | Must | ⬜ |
| [EPIC-KEY]-02 | | | Should | ⬜ |
| [EPIC-KEY]-03 | | | Could | ⬜ |

---

## Affected Areas

> List the domains/modules this epic touches. This drives the test matrix, review assignments, and doc reverse-sync.

- [ ] [Area 1]
- [ ] [Area 2]
- [ ] [Area 3]

---

## Dependencies

| Dependency | Type | Status | Blocked? | Owner |
|-----------|------|--------|----------|-------|
| [External API / service ready] | External | ⬜ Ready | | |
| [Design artifacts approved] | External | ⬜ Ready | | |
| Other epic: [OTHER-KEY] | Internal | ⬜ Done | | |
| [Third-party dependency] | External | ⬜ Ready | | |

---

## Epic Phases

> Break this epic into ordered phases. Each phase has a clear deliverable.
> Unlike sprints (which are time-boxed), phases are scope-boxed and complete when done.

| Phase | Scope | Deliverable | Status |
|-------|-------|-------------|--------|
| 1. Planning | PRD + Tech Design + Test Plan + Approval | All artifacts approved | ⬜ |
| 2. Core Implementation | [EPIC-KEY]-01, [EPIC-KEY]-02 | Working feature on DEV | ⬜ |
| 3. Testing & Polish | Edge cases, environment testing, bug fixes | All tests passing | ⬜ |
| 4. UAT & Release | UAT sign-off, release build | Included in vX.Y.Z | ⬜ |
| 5. Doc Reverse-Sync | Update docs from what was built | Docs reflect reality | ⬜ |

---

## Pipeline — Artifacts Tracker

> Every artifact is keyed to this epic. Check off as completed.
> Branch naming: `feature/[EPIC-KEY]-short-desc`
> PR title: `[EPIC-KEY] description`
> Commit prefix: `[EPIC-KEY] description`

| Stage | Artifact | Status | Link |
|-------|----------|--------|------|
| **Planning** | | | |
| Requirement | This epic doc | ✅ | (this file) |
| Product/UX | PRD | ⬜ | `epics/[EPIC-KEY]/PRD.md` |
| Product/UX | Design artifacts | ⬜ | (design link) |
| Tech Design | Technical design doc | ⬜ | `epics/[EPIC-KEY]/TECH-DESIGN.md` |
| Test Planning | Test plan | ⬜ | `epics/[EPIC-KEY]/TEST-PLAN.md` |
| Approval | Approval checklist | ⬜ | `epics/[EPIC-KEY]/APPROVAL.md` |
| **Execution** | | | |
| Implementation | PR(s) | ⬜ | (PR links) |
| Code Review | Review passed | ⬜ | (PR review links) |
| Unit Tests | Passing | ⬜ | (CI link) |
| Integration Tests | Passing | ⬜ | (CI link) |
| End-to-End Tests | Passing | ⬜ | (CI link / manual report) |
| **Delivery** | | | |
| CI/CD Build | Release build | ⬜ | (build link) |
| UAT Script | UAT test script | ⬜ | `epics/[EPIC-KEY]/UAT-SCRIPT.md` |
| UAT | UAT sign-off | ⬜ | |
| Release | Included in version | ⬜ | vX.Y.Z |
| **Closure** | | | |
| Doc Reverse-Sync | Docs updated | ⬜ | `epics/[EPIC-KEY]/DOC-REVERSE-SYNC.md` |

---

## Doc Reverse-Sync

> After implementation, which docs need updating to reflect what was ACTUALLY built?
> List only docs for areas marked in "Affected Areas" above.

| Doc File | Affected? | What Changed | PR | Updated? |
|----------|-----------|-------------|-----|----------|
| `[area-1].md` | ⬜ | | | ⬜ |
| `[area-2].md` | ⬜ | | | ⬜ |
| `README.md` (architecture) | ⬜ | | | ⬜ |

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| | High/Med/Low | High/Med/Low | |

---

## Notes / Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| YYYY-MM-DD | | |
