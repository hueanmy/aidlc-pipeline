# aidlc-pipeline

Public, project-agnostic MCP server that runs the full SDLC pipeline for an epic — Plan → Design → Test-Plan → Implement → Review → Execute-Test → Release → Monitor → Doc-Sync — with an auto-reviewer at every step and 4 human gates (plan, design, test-plan, implement).

Designed to be consumed by the `aidlc` VS Code extension, or directly by any Claude Code session whose `.claude/settings.json` has this package wired as an MCP server.

## What's included

- `server/` — MCP runtime: registry, content merger, orchestrator state machine, MCP tools.
- `agents/`, `skills/`, `templates/` — generic SDLC content. No project-specific knowledge baked in.
- `config/review-matrix.json` — phase order, human gates, per-phase checklists.
- `schemas/` — JSON shapes for `epic.json` and per-phase `status.json`.
- `scripts/publish.sh` — auto-bump + build + publish to npmjs.

Project-specific knowledge (business modules, tech-stack notes) is **not** stored in this package. The orchestrator reads it from the consuming workspace under `docs/core-business/`, `docs/its/`, and `docs/sdlc/workflow/`. Missing folders are handled gracefully — the worker just sees fewer context files.

## How the orchestrator works

```
/advance-epic EPIC-123
        │
        ▼
   ┌──────────────────────────────────────────────────┐
   │ Orchestrator agent (.claude/agents/orchestrator) │
   │  ─ epic_status → next phase                      │
   │  ─ phase_context → pack files + checklist        │
   │  ─ start_phase → archive + revision++            │
   │  ─ dispatch worker (po, tech-lead, qa, …)        │
   │  ─ dispatch auto-reviewer                        │
   │      ├─ pass + human-gate → STOP (await UI)      │
   │      ├─ pass otherwise → next phase              │
   │      ├─ reject in-phase → retry (≤2)             │
   │      └─ reject upstream → reject_gate cascade    │
   └──────────────────────────────────────────────────┘
```

Per-epic state lives entirely on disk under `docs/sdlc/epics/<KEY>/`:

```
EPIC-123/
  epic.json                       # metadata + affected_modules
  PRD.md  TECH-DESIGN.md  …       # phase artifacts
  phases/<phase>/
    status.json                   # current revision + last_review
    archive/revision-N/…          # prior revisions, rotated on retry
```

## MCP tools

Content access:
- `list_agents`, `get_agent`, `list_skills`, `get_skill`, `list_templates`, `get_template`
- `setup` — install skills, agents, schemas, and the docs scaffold into a workspace

Orchestrator (drive `/advance-epic`):
- `epic_status` — full status report + next-step decision
- `phase_context` — pack domain files + upstream artifacts + checklist for a worker
- `start_phase` — archive prior run, bump revision, mark in_progress
- `set_phase_status` — transition a phase (in_review, passed, awaiting_human_review, failed_needs_human)
- `reject_gate` — cascade reject to an upstream phase, mark intermediates stale
- `amend_affected_modules` — append-only module amendments (Tech Lead at Design)
- `list_project_modules` — list `docs/core-business/*.md` in the workspace
- `init_epic` — write `epic.json` for a new epic

## Quick start (Claude Code)

`.claude/settings.json` in your project:

```json
{
  "mcpServers": {
    "sdlc": {
      "command": "npx",
      "args": ["-y", "github:hueanmy/aidlc-pipeline"]
    }
  }
}
```

The MCP server auto-installs skills, agents, and schemas into `.claude/` on boot, plus a `docs/sdlc/workflow/README.md` and an example epic.

Then in a Claude Code session:

```
/epic EPIC-123 "My new feature"
# fill in docs/core-business/<module>.md if you want richer context
/advance-epic EPIC-123
```

## Publish

```
npm login
./scripts/publish.sh
```

## License

MIT.
