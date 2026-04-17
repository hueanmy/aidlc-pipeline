# Doc Reverse-Sync: [EPIC-KEY]

> **Epic**: [[EPIC-KEY] — Epic Title](../epics/[EPIC-KEY]/[EPIC-KEY].md)
> **Purpose**: Update existing docs to reflect what was ACTUALLY built, not what was planned.
> Copy to `docs/sdlc/epics/[EPIC-KEY]/DOC-REVERSE-SYNC.md`

---

## Why Reverse-Sync?

PRD and Tech Design describe what we PLANNED. Implementation often deviates:
- API / interface shape changed during integration
- User flow simplified after testing
- Edge case handling added that wasn't in the original spec
- Scope cut due to time or complexity

Docs must reflect reality, not the plan.

---

## Step 1: Compare Plan vs Reality

| Aspect | Planned (PRD/Tech Design) | Actually Built | Delta |
|--------|--------------------------|---------------|-------|
| User flow | | | Same / Changed |
| API / interface | | | Same / Changed |
| Data models | | | Same / Changed |
| Error handling | | | Same / Changed |
| UI / screens | | | Same / Changed |
| Scope delivered | | | Full / Partial |

---

## Step 2: Update Domain / Architecture Docs

> Only update docs for areas marked in the epic's "Affected Areas". List the docs that actually exist in your project.

| Doc | Needs Update? | What Changed | PR | Done |
|-----|---------------|--------------|-----|------|
| `[area-1].md` | ⬜ Yes / ⬜ No | | | ⬜ |
| `[area-2].md` | ⬜ Yes / ⬜ No | | | ⬜ |
| `[area-3].md` | ⬜ Yes / ⬜ No | | | ⬜ |
| `README.md` (architecture) | ⬜ Yes / ⬜ No | | | ⬜ |

---

## Step 3: Update Epic Artifacts

| Artifact | Needs Update? | What Diverged | Done |
|----------|---------------|---------------|------|
| PRD (acceptance criteria) | ⬜ Yes / ⬜ No | | ⬜ |
| Tech Design (file list, interfaces) | ⬜ Yes / ⬜ No | | ⬜ |
| Test Plan (new cases added) | ⬜ Yes / ⬜ No | | ⬜ |

---

## Step 4: Assisted Doc Update

> For each doc that needs updating, use a prompt like:

```
Read the current doc at [path/to/doc].md and the implementation
in [list of changed files from PR]. Generate updated sections that
reflect what was actually built for epic [EPIC-KEY]. Only change
sections affected by this epic. Keep existing doc structure and style.
```

---

## Sign-off

| Check | Status |
|-------|--------|
| All affected docs identified | ⬜ |
| All doc updates committed | ⬜ |
| Doc updates reviewed | ⬜ |
| Epic artifacts reflect final state | ⬜ |

**Completed by**: _________________ **Date**: _________
