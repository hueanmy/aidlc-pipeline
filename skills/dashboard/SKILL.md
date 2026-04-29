---
name: dashboard
description: Show SDLC pipeline dashboard for all epics. Displays pipeline status, current phase, responsible agent, and next action. Stack-neutral.
argument-hint: "[{{EPIC_PREFIX}}-XXXX] (optional — show specific epic, or blank for all)"
---

# Pipeline Dashboard

You are the **Pipeline Orchestrator** showing the SDLC dashboard.

## Step 1: Scan All Epics

```bash
ls -d docs/sdlc/epics/{{EPIC_PREFIX}}-*/ 2>/dev/null
```

## Step 2: Load Per-Epic Pipeline Config

For each epic, read its `pipeline.json`:

```bash
cat docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/pipeline.json 2>/dev/null
```

- If `pipeline.json` exists with `enabledPhases` → only check those phases
- If `pipeline.json` does not exist → all 9 phases are enabled (default, backward compatible)

## Step 3: Detect Phase Status (Enabled Phases Only)

For each epic folder, check which artifacts exist and have **real content** (not just template scaffolding). Only check phases that are in the epic's `enabledPhases` list.

| Phase ID | Complete when | File |
|----------|---------------|------|
| `plan` | Epic doc + PRD have real content | `{{EPIC_PREFIX}}-XXXX.md` + `PRD.md` |
| `design` | Tech design has real content | `TECH-DESIGN.md` |
| `test-plan` | Test plan has real content | `TEST-PLAN.md` |
| `implement` | Feature branch exists | `git branch --all --list "*{{EPIC_PREFIX}}-XXXX*"` |
| `review` | Approval doc marked approved | `APPROVAL.md` contains `[x]` |
| `execute-test` | Test script has real content | `TEST-SCRIPT.md` |
| `release` | Git tag exists for commits | `git log --grep="{{EPIC_PREFIX}}-XXXX" --format="%D"` |
| `monitor` | Health report generated / postmortem filed | `HEALTH.md` or `docs/sdlc/incidents/` |
| `doc-sync` | Reverse sync completed | `DOC-REVERSE-SYNC.md` has real content |

"Real content" = file exists, > 200 chars after frontmatter, no `{{` template placeholders, no `[TODO]` markers.

**Progress calculation**: `completed enabled phases / total enabled phases` (not always out of 9).

## Step 4: Display Dashboard

If a specific epic key is provided (`$ARGUMENTS`), show a detailed view. Otherwise, show a summary of all epics.

### Summary view (all epics)

```markdown
## {{PROJECT_NAME}} Pipeline Dashboard

| Epic | Phases | Progress | Current Phase | Agent | Next Action |
|------|--------|----------|---------------|-------|-------------|
| {{EPIC_PREFIX}}-2100 | 7/9 | ████████░░ 86% | 6. Release | RM | /release 1.3.0 |
| {{EPIC_PREFIX}}-2090 | 9/9 | █████░░░░░ 56% | 5. Review | TL | /review |
| {{EPIC_PREFIX}}-2086 | 5/9 | ██░░░░░░░░ 20% | 1. Plan | PO | /prd {{EPIC_PREFIX}}-2086 |

**Active**: X epics | **Complete**: Y | **Pending**: Z
```

The "Phases" column shows enabled / total (9). Progress is calculated against enabled phases only.

### Detailed view (single epic)

Show only enabled phases, numbered sequentially:

```markdown
## Pipeline: {{EPIC_PREFIX}}-XXXX — [Epic Title]
**Config**: 5/9 phases enabled

| # | Phase | Agent | Status | Command | Artifact |
|---|-------|-------|--------|---------|----------|
| 1 | Plan | PO | Done | /epic + /prd | PRD.md |
| 2 | Implement | Dev | Done | code + tests | feature/{{EPIC_PREFIX}}-XXXX |
| 3 | Review | TL | Current | /review | — |
| 4 | Release | RM | Pending | /release + /deploy prod | — |
| 5 | Doc Sync | Archivist | Pending | /doc-sync | — |

**Skipped**: Design, Test Plan, Execute-Test, Monitor
**Current phase**: 3. Review — Tech Lead
**Next action**: `/review`
```

If all 9 phases are enabled (or no `pipeline.json`), show the full table without a "Skipped" line.

## Rules

- Always read `pipeline.json` per epic before displaying status
- Progress = completed enabled phases / total enabled phases (not always out of 9)
- Visual progress bar (unicode blocks) + percentage
- Mark the current phase explicitly
- Next-action command must point to the next **enabled** phase
- Show "Skipped" line (detailed view only) if any phases are disabled
- Empty epic folder (just templates) → 0% → "Run `/epic {{EPIC_PREFIX}}-XXXX` to start"
- No `pipeline.json` → treat all 9 phases as enabled (backward compatible)
