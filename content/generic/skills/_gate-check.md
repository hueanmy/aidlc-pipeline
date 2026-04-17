# Pipeline Gate Check (Shared Reference)

This file is referenced by all pipeline-phase skills. When a skill says
"Run the Pipeline Gate Check", execute the steps below **before** doing any work.

## When Gate Check Applies

**Gate check ONLY applies when a skill is run for a specific epic** (e.g., `/tech-design {{EPIC_PREFIX}}-2100`, `/uat {{EPIC_PREFIX}}-2100`).

If the skill is run **without an epic context** — no epic key in arguments, no epic-related branch — **skip the gate check entirely** and proceed normally. The gate is about enforcing epic pipeline order, not about blocking standalone tool usage.

## How to Run

### 1. Identify the Epic Key

Extract the epic key (`{{EPIC_PREFIX}}-XXXX`) from the skill's arguments.
If the skill does not have an epic key argument (e.g., `/deploy`, `/release-notes`), try to detect it from the current git branch name (`feature/{{EPIC_PREFIX}}-XXXX-*`).
If no epic key can be determined, **skip the gate check** and proceed normally — no epic = no pipeline to enforce.

### 2. Read pipeline.json

```bash
cat docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/pipeline.json 2>/dev/null
```

- If `pipeline.json` does not exist → **skip the gate check** (no config = no enforcement)
- If `pipeline.json` exists → read `enabledPhases` array

### 3. Determine This Skill's Phase

Each skill maps to a pipeline phase:

| Skill | Phase ID | Phase Order |
|-------|----------|-------------|
| `/epic` | `plan` | 1 |
| `/prd` | `plan` | 1 |
| `/tech-design` | `design` | 2 |
| `/test-plan` | `test-plan` | 3 |
| `/review` | `review` | 5 |
| `/uat` | `uat` | 6 |
| `/release` | `release` | 7 |
| `/release-notes` | `release` | 7 |
| `/deploy` | `release` | 7 |
| `/monitor` | `monitor` | 8 |
| `/doc-sync` | `doc-sync` | 9 |

Phase order: `plan`(1) → `design`(2) → `test-plan`(3) → `implement`(4) → `review`(5) → `uat`(6) → `release`(7) → `monitor`(8) → `doc-sync`(9)

### 4. Check if This Phase is Enabled

If this skill's phase is **not** in `enabledPhases`:
```
⛔ Phase "[phase]" is disabled for epic {{EPIC_PREFIX}}-XXXX.

This phase is not in the epic's pipeline config (pipeline.json).
To enable it, use the Pipeline Settings panel or edit:
  docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/pipeline.json
```
**STOP. Do not proceed.**

### 5. Check All Preceding Enabled Phases Are Complete

Walk through the phase order. For each phase **before** this skill's phase that is in `enabledPhases`, check if it's complete:

| Phase ID | Complete when |
|----------|--------------|
| `plan` | `docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/{{EPIC_PREFIX}}-XXXX.md` AND `docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/PRD.md` exist with real content (>200 chars, no `{{` or `[TODO]` placeholders) |
| `design` | `docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/TECH-DESIGN.md` exists with real content |
| `test-plan` | `docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/TEST-PLAN.md` exists with real content |
| `implement` | Feature branch `*{{EPIC_PREFIX}}-XXXX*` exists (`git branch --all --list "*{{EPIC_PREFIX}}-XXXX*"`) |
| `review` | `docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/APPROVAL.md` contains `[x]` (approved) |
| `uat` | `docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/UAT-SCRIPT.md` exists with real content |
| `release` | Git tag exists for this epic's commits |
| `monitor` | Health report generated |
| `doc-sync` | `docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/DOC-REVERSE-SYNC.md` exists with real content |

"Real content" = file exists, >200 chars after frontmatter, no `{{` template placeholders, no `[TODO]` markers.

**Only check phases that are both (a) before this phase AND (b) in `enabledPhases`.** Skip disabled phases.

### 6. If Any Preceding Phase is Incomplete → BLOCK

If one or more preceding enabled phases are not complete, output this and **STOP**:

```
⛔ Cannot run [this skill] — prerequisite phases are incomplete.

Pipeline config for {{EPIC_PREFIX}}-XXXX: [N] phases enabled
Current skill: [skill name] (phase: [phase id])

Incomplete prerequisites:
  ❌ [phase name] — [what's missing]
  ❌ [phase name] — [what's missing]

✅ Already complete:
  ✅ [phase name]

👉 Next step: Complete "[first incomplete phase]" first.
   Run: /pipeline {{EPIC_PREFIX}}-XXXX [first-incomplete-phase-id]
```

**STOP. Do not proceed with the skill.**

### 7. If All Preceding Phases Are Complete → PROCEED

Output a brief confirmation and continue with the skill:
```
✅ Gate check passed — all [N] prerequisite phases complete for {{EPIC_PREFIX}}-XXXX.
```
Then proceed with the skill's normal steps.

## Special Cases

- **`/epic` skill**: This is the first phase (`plan`). It has no prerequisites. Skip the gate check entirely.
- **`/prd` skill**: Also phase `plan`. Only prerequisite: the epic doc (`{{EPIC_PREFIX}}-XXXX.md`) must exist (scaffolded by `/epic`). If not, tell user to run `/epic` first.
- **`/review` without epic key**: `/review` can be run on any PR or file. If no epic key is detectable, skip the gate check.
- **`/deploy` and `/release-notes`**: These are part of the `release` phase. They share the same prerequisites as `/release`.
- **`/hotfix`**: Emergency path. **Never gate-check.** Skip entirely.
- **`/benchmark`**: Performance tooling, not a pipeline phase. **Never gate-check.** Skip entirely.
- **`/monitor`**: Can be run independently for any version. **Never gate-check.** Skip entirely.
- **`/coverage`**: Test tooling, not a pipeline phase. **Never gate-check.** Skip entirely.
