---
name: dashboard
description: Show SDLC pipeline dashboard for all epics. Displays pipeline status, current phase, responsible agent, and next action for each epic.
argument-hint: [{{EPIC_PREFIX}}-XXXX] (optional — show specific epic, or blank for all)
---

# Pipeline Dashboard

You are the **Pipeline Orchestrator** showing the SDLC dashboard.

## Step 1: Scan All Epics

```bash
ls -d docs/sdlc/epics/{{EPIC_PREFIX}}-*/ 2>/dev/null
```

## Step 1.5: Load Per-Epic Pipeline Config

For each epic, read its `pipeline.json`:

```bash
cat docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/pipeline.json 2>/dev/null
```

- If `pipeline.json` exists with `enabledPhases` array → only check those phases
- If `pipeline.json` does not exist → all 9 phases are enabled (default)

## Step 2: For Each Epic, Detect Phase Status (Enabled Phases Only)

For each epic folder, check which artifacts exist and have real content (not just templates).
**Only check phases that are in the epic's `enabledPhases` list.**

| Phase ID | Check | File |
|----------|-------|------|
| `plan` | Epic doc + PRD have content | `{{EPIC_PREFIX}}-XXXX.md` + `PRD.md` |
| `design` | Tech design has content | `TECH-DESIGN.md` |
| `test-plan` | Test plan has content | `TEST-PLAN.md` |
| `implement` | Feature branch exists | `git branch --all --list "*{{EPIC_PREFIX}}-XXXX*"` |
| `review` | Approval doc marked approved | `APPROVAL.md` contains `[x]` |
| `uat` | UAT script has content | `UAT-SCRIPT.md` |
| `release` | Git tag exists for commits | `git log --grep="{{EPIC_PREFIX}}-XXXX" --format="%D"` |
| `monitor` | Doc sync done (implies monitor passed) | `DOC-REVERSE-SYNC.md` |
| `doc-sync` | Reverse sync completed | `DOC-REVERSE-SYNC.md` has content |

"Has content" means: file exists, >200 chars after frontmatter, no `{{` or `[TODO]` placeholders.

**Progress calculation**: `completed enabled phases / total enabled phases` (not out of 9).

## Step 3: Display Dashboard

If a specific epic key is provided ($ARGUMENTS), show detailed view for that epic.
If blank, show summary for all epics.

### Summary View (all epics):

```markdown
## {{PROJECT_NAME}} Pipeline Dashboard

| Epic | Phases | Progress | Current Phase | Agent | Next Action |
|------|--------|----------|--------------|-------|-------------|
| {{EPIC_PREFIX}}-2100 | 7/9 | ████████░░ 86% | 6. Release | RM | /release 1.3.0 |
| {{EPIC_PREFIX}}-2090 | 9/9 | ██████░░░░ 56% | 5. Review | TL | /review |
| {{EPIC_PREFIX}}-2086 | 5/9 | ██░░░░░░░░ 20% | 1. Plan | PO | /prd {{EPIC_PREFIX}}-2086 |

**Active**: X epics | **Complete**: Y epics | **Pending**: Z epics
```

The "Phases" column shows how many phases are enabled out of 9. Progress is calculated against enabled phases only.

### Detailed View (single epic):

Show **only enabled phases**, numbered sequentially:

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

**Skipped**: Design, Test Plan, UAT, Monitor
**Current phase**: 3. Review — Tech Lead
**Next action**: Run `/review` to validate PR against epic docs
```

If all 9 phases are enabled (or no `pipeline.json`), show the full 9-phase table without "Skipped" line.

## Rules:
- Always read `pipeline.json` per epic before displaying status
- Progress = completed enabled phases / total enabled phases (not always out of 9)
- Always show progress as a visual bar (unicode blocks) + percentage
- Mark the current phase with Current
- Show the specific next command the user should run — must be the next **enabled** phase
- Show "Skipped" line listing disabled phases (only in detailed view, only if any are disabled)
- If epic folder is empty (just templates), show as 0% — "Run `/epic {{EPIC_PREFIX}}-XXXX` to start"
- If no `pipeline.json` exists, treat all 9 phases as enabled (backward compatible)
