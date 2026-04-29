# aidlc-pipeline

Public, project-agnostic MCP server that drives the full SDLC pipeline for an epic — auto-reviewer at every step, 4 human gates, on-disk state per phase, deterministic cascade-reject when upstream context is wrong.

Designed to be consumed by the `aidlc` VS Code extension, or directly by any Claude Code session whose `.claude/settings.json` has this package wired as an MCP server.

---

## How the pipeline runs

### The 9 phases

| # | Phase | Worker agent | Output artifact | Human gate? |
|---|---|---|---|---|
| 1 | **plan** | PO | `PRD.md` + `<EPIC>.md` | ✅ |
| 2 | **design** | Tech Lead | `TECH-DESIGN.md` | ✅ |
| 3 | **test-plan** | QA | `TEST-PLAN.md` | ✅ |
| 4 | **implement** | Developer | feature branch + commits | ✅ |
| 5 | **review** | Tech Lead | `APPROVAL.md` | — |
| 6 | **execute-test** | QA | `TEST-SCRIPT.md` | — |
| 7 | **release** | Release Manager | git tag + release notes | — |
| 8 | **monitor** | SRE | health report | — |
| 9 | **doc-sync** | Archivist | `DOC-REVERSE-SYNC.md` + `core-business/*.md` patches | — |

Phases run strictly in this order. The Orchestrator never starts phase N+1 until phase N is `passed`.

### One iteration of the orchestrator loop

`/advance-epic EPIC-123` invokes the **Orchestrator agent** (Sonnet — pure dispatcher), which runs this cycle:

```
┌─ 1. epic_status(workspace, epic_id)
│      └─► returns {epic, phases[], next}
│
├─ 2. inspect next.kind:
│      • "completed"        → ✅ STOP
│      • "halted"           → ⛔ STOP (human must intervene)
│      • "paused_at_gate"   → 🔔 STOP (await extension approve/reject)
│      • "run"              → continue
│
├─ 3. phase_context(workspace, epic_id, next.phase)
│      └─► returns worker + checklist + domain files +
│          upstream artifacts + last reviewer feedback
│
├─ 4. start_phase(workspace, epic_id, next.phase)
│      └─► archives prior revision (if stale/rejected),
│          revision++, status = in_progress
│
├─ 5. dispatch the WORKER agent via Task tool
│      (po | tech-lead | developer | qa | release-manager | sre | archivist)
│      worker reads the brief, writes its artifact, returns a short summary
│
├─ 6. set_phase_status → in_review (UI hint)
│
├─ 7. dispatch the AUTO-REVIEWER agent (Sonnet)
│      ├─ Phase 1 — STRUCTURE checks (deterministic):
│      │    file exists? sections present? no {{ placeholders?
│      │    branch matches *EPIC*? AC count > 0?
│      └─ Phase 2 — SEMANTIC checks (LLM):
│           every story has ≥1 AC? risks have mitigations?
│           changed files inside affected_modules?
│
└─ 8. interpret the verdict:
       • PASS + this is a human-gate phase  → set_phase_status(awaiting_human_review)
                                              STOP. Reviewer opens the
                                              extension sidebar and clicks
                                              ✅ approve or ❌ reject.
       • PASS otherwise                     → set_phase_status(passed) → loop
       • REJECT (in-phase)                  → re-dispatch worker (≤2 retries),
                                              then set failed_needs_human if
                                              still failing
       • REJECT (upstream cascade)          → reject_gate(from, to, reason)
                                              archives `to` phase, marks all
                                              intermediates `stale`, → loop
                                              picks `to` as next.phase
```

### Where the cascade-reject saves you

If at the **review** phase the auto-reviewer notices a deviation that traces back to a missing user story, it doesn't ask the developer to fix code that the PRD never specified. It calls `reject_gate(from=review, to=plan, reason=…)` — the orchestrator archives every passed phase from `plan` onward, the PO re-runs Plan, and downstream phases re-flow. Every revision is preserved under `phases/<phase>/archive/revision-N/`.

### What's deterministic vs LLM

| Concern | Where it lives | Why |
|---|---|---|
| Phase order, gates, retry budget | `config/review-matrix.json` + `server/src/orchestrator.ts` | Deterministic state machine. No LLM gets to decide "let's skip review." |
| Structure checks | Auto-Reviewer phase 1 (file I/O + regex) | Cheap, repeatable, no false negatives. |
| Semantic checks | Auto-Reviewer phase 2 (LLM, Sonnet) | "Every user story is traced to a component" needs reading comprehension. |
| Phase artifact authorship | Worker agents (Opus for po / tech-lead / developer; Sonnet for the rest) | Heavy reasoning kept on Opus where it pays off. |

### State persistence — everything is on disk

```
docs/sdlc/epics/EPIC-123/
  epic.json                    metadata + affected_modules
  PRD.md  TECH-DESIGN.md …     phase artifacts at the epic root
  phases/<phase>/
    status.json                phase / status / revision / last_review / user_feedback
    archive/revision-N/        prior runs, frozen
```

The Orchestrator never holds state in memory between iterations. Crash mid-loop, run `/advance-epic` again, it picks up exactly where it stopped.

---

## What's included

- `server/` — MCP runtime: registry, content merger, orchestrator state machine, MCP tools.
- `agents/`, `skills/`, `templates/` — generic SDLC content. No project-specific knowledge baked in.
- `config/review-matrix.json` — phase order, human gates, per-phase checklists.
- `schemas/` — JSON shapes for `epic.json` and per-phase `status.json`.
- `examples/demo-project/` — a fictional TaskFlow SaaS workspace with realistic core-business / its / workflow docs and a sample epic, ready to drive `/advance-epic`.
- `scripts/publish.sh` — auto-bump + build + publish to npmjs.

Project-specific knowledge (business modules, tech-stack notes) is **not** stored in this package. The orchestrator reads it from the consuming workspace under `docs/core-business/`, `docs/its/`, and `docs/sdlc/workflow/`. Missing folders are handled gracefully — the worker just sees fewer context files.

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
