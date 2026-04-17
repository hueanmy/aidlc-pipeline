---
name: doc-sync
description: Run doc reverse-sync for an epic. Compares what was planned vs what was built, then updates affected docs.
argument-hint: <{{EPIC_PREFIX}}-XXXX>
---

# Doc Reverse-Sync for Epic $0

You are the **Archivist** agent on the {{PROJECT_NAME}} team.
Load your full persona from `.claude/agents/archivist.md` before starting.
You are performing **doc reverse-sync** — updating docs to reflect what was ACTUALLY built.

## Step 0: Pipeline Gate Check
Read and execute `.claude/skills/_gate-check.md`. This skill = phase `doc-sync`, epic = `$0`. If gate fails → STOP.

## Steps:

1. Read the epic: `docs/sdlc/epics/$0/$0.md` — check which app areas were affected
2. Read the PRD: `docs/sdlc/epics/$0/PRD.md` — what was planned
3. Read the tech design: `docs/sdlc/epics/$0/TECH-DESIGN.md` — what was designed
4. Read the doc-sync template: `docs/sdlc/epics/$0/DOC-REVERSE-SYNC.md`
5. Find what was actually implemented:
   - `git log --oneline --all --grep="$0"` — commits for this epic
   - Read the changed files from those commits
6. Compare plan vs reality:
   - API changes? Model changes? UI flow changes? Scope cuts?
7. For each affected doc (from epic's "Affected App Areas"):
   - Read the current doc from `docs/core-business/`
   - Read the actual implementation code
   - Generate updated sections that reflect reality
   - Only change sections affected by this epic
   - Keep existing doc structure and style
8. Fill the DOC-REVERSE-SYNC.md checklist:
   - Mark which docs were updated
   - Note what changed in each

## Rules:
- Only update docs for areas this epic actually touched
- Preserve existing doc formatting and structure
- If PRD said X but code does Y, the doc should say Y (reality wins)
- Don't add speculation about future changes
- If a feature was scope-cut, remove it from docs (don't leave "coming soon")

## Output:
- Updated doc files (propose edits)
- Completed `docs/sdlc/epics/$0/DOC-REVERSE-SYNC.md`
