---
name: status.schema
description: Shape of docs/sdlc/epics/<id>/phases/<phase>/status.json — per-phase state the orchestrator and extension both read.
---

# status.json schema

One file per phase, at `docs/sdlc/epics/<EPIC_KEY>/phases/<PHASE>/status.json`.

Written by the orchestrator, read by the orchestrator and by the VS Code extension (`aidlc`) for UI rendering.

## Required fields

| Field | Type | Description |
|---|---|---|
| `phase` | string | Phase id (e.g. `plan`, `design`, `implement`). Matches the folder name. |
| `status` | enum | One of: `pending`, `in_progress`, `in_review`, `awaiting_human_review`, `passed`, `rejected`, `stale`, `failed_needs_human`. |
| `revision` | number | Increments each time the phase is (re-)run. Starts at 1. |

## Optional fields

| Field | Type | Description |
|---|---|---|
| `last_review` | object | Verdict from the most recent review (auto or human). |
| `updated_at` | string | ISO8601 timestamp of last write. |
| `user_feedback` | string | Free-form note from the human user attached to the next worker run. Written by the extension's "Update feedback" UI on a rejected / failed phase. Preserved across `startPhase` revisions, cleared when the phase transitions to `passed`. Worker should treat this as higher priority than the auto-reviewer's reason. |

## last_review shape

| Field | Type | Description |
|---|---|---|
| `decision` | `"pass"` \| `"reject"` | Outcome. |
| `reviewer` | string | `auto-reviewer` or `human:<user>` or `auto-reviewer:escalated`. |
| `at` | string | ISO8601 timestamp. |
| `reject_to` | string? | Only when `decision = reject`. The phase to bounce back to. Must be upstream of this phase and currently `passed` or `stale`. |
| `reason` | string | Human-readable rationale. For auto-reviewer, the failed checklist items. |
| `checklist_results` | object? | Auto-reviewer only: per-item pass/fail map. |

## Status state machine

```
pending ──► in_progress ──► in_review ──► passed
                               │
                               ├──► awaiting_human_review ──► passed
                               │           │
                               │           └──► rejected (cascade)
                               │
                               ├──► rejected (auto-reviewer verdict)
                               │
                               └──► failed_needs_human (max retries exceeded)

passed ──► stale (upstream phase rejected)
stale  ──► in_progress (re-run after upstream re-pass)
```

## Example — passed phase

```json
{
  "phase": "plan",
  "status": "passed",
  "revision": 1,
  "updated_at": "2026-04-21T10:30:00Z",
  "last_review": {
    "decision": "pass",
    "reviewer": "human:user@example.com",
    "at": "2026-04-21T10:29:55Z",
    "reason": "PRD covers all stated user stories."
  }
}
```

## Example — rejected with cascade source

```json
{
  "phase": "design",
  "status": "rejected",
  "revision": 2,
  "updated_at": "2026-04-21T11:00:00Z",
  "last_review": {
    "decision": "reject",
    "reviewer": "auto-reviewer",
    "at": "2026-04-21T10:59:00Z",
    "reject_to": "plan",
    "reason": "TECH-DESIGN references user stories not present in PRD. Suggest returning to Plan.",
    "checklist_results": {
      "structure.tech_design_has_sections": "pass",
      "semantic.stories_traced": "fail"
    }
  }
}
```

## Archive

When a phase is re-run (revision > 1), the previous artifacts are moved to:

```
docs/sdlc/epics/<EPIC_KEY>/phases/<PHASE>/archive/revision-<N>/
```

The previous `status.json` is archived there too. The live `status.json` at the phase root is always the current revision.
