# Delivery workflow — TaskFlow

How the team takes an epic from idea to shipped. Read by the `plan`,
`test-plan`, `implement`, and `execute-test` phases as workflow context.

## Phase flow

```
PLAN ─► DESIGN ─► TEST-PLAN ─► IMPLEMENT ─► REVIEW ─► EXECUTE-TEST ─► RELEASE ─► MONITOR ─► DOC-SYNC
```

The orchestrator drives this. Humans approve at four gates — plan, design,
test-plan, implement — before each can advance.

## Roles

- **PO** — owns Plan. Writes the epic doc + PRD with acceptance criteria.
- **Tech Lead** — owns Design + Review. Defines architecture, files
  affected, DI plan; later validates the implementation against design.
- **QA** — owns Test-Plan + Execute-Test. Writes test cases mapped to ACs; later
  writes the test script that human testers run on the UAT environment.
- **Developer** — owns Implement. Writes code on a feature branch named
  `feature/<EPIC_KEY>-<short-desc>`.
- **Release Manager** — owns Release. Tags, deploys, writes release notes.
- **SRE** — owns Monitor. Watches the post-release window for regressions.
- **Archivist** — owns Doc-Sync. Updates `core-business/*.md` to reflect
  what shipped, so the next epic gets accurate context.

## Branching & PR

- Branch off `main`: `feature/EPIC-123-short-desc`.
- Commits reference the epic key in the subject (the `implement`-phase
  auto-reviewer checks this).
- One PR per epic. Squash on merge.
- A PR may not merge with red CI. We do not allow `--no-verify` overrides
  except in declared hotfixes (see hotfix runbook).

## Definition of Done — per phase

| Phase | Done when |
|---|---|
| Plan | PRD + epic doc exist, every user story has ≥ 1 AC, `affected_modules` non-empty. |
| Design | TECH-DESIGN.md has Architecture / Components / Data Flow / Risks. Every story is traced to a component. |
| Test-Plan | TEST-PLAN.md has Scope / Test Cases / Coverage Matrix. Every AC maps to ≥ 1 test case. |
| Implement | Feature branch exists, all tests pass locally, no unlinked TODOs in changed files. |
| Review | APPROVAL.md is `[approved]`. Critical comments resolved. |
| Execute-Test | TEST-SCRIPT.md walks through every user story end-to-end. |
| Release | Git tag exists, release notes written, deployed to prod. |
| Monitor | Health report shows error/latency budgets are within KPIs for ≥ 24h. |
| Doc-Sync | `core-business/*.md` reflects shipped behavior; deviations from design are noted. |

## Hotfix path

Hotfixes skip the normal gates. They use `/advance-epic --skip-gates` and
must include a post-mortem doc-sync within 7 days.
