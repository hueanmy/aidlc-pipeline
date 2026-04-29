# Demo project — TaskFlow

Fictional team-task-management SaaS. Use this folder as a starter to see how
`aidlc-pipeline` reads domain knowledge from a workspace.

## What's here

```
docs/
  core-business/        # one .md per business module
    01-auth.md
    02-tasks.md
    03-notifications.md
    11-acceptance.md    # acceptance-criteria conventions (test-plan reads this)
  its/
    tech-stack.md       # tech-stack constraints (design/review/release read this)
  sdlc/
    workflow/README.md  # delivery operating model (plan/test-plan/execute-test read this)
    epics/EPIC-1000/    # an example epic, plan-phase complete
      epic.json
      EPIC-1000.md
      PRD.md
```

## Try it

Copy the folder into a fresh directory, point Claude Code at it, and run:

```bash
cp -R examples/demo-project ~/taskflow-demo
cd ~/taskflow-demo
# .claude/settings.json should bind the aidlc-pipeline MCP server (see top-level README)
```

Then in a Claude Code session:

```
/advance-epic EPIC-1000
```

The orchestrator will:

1. Read `epic.json`, see `affected_modules: ["auth", "tasks"]`.
2. Resolve those slugs to `01-auth.md` and `02-tasks.md` (substring match on filename).
3. Pack them as domain context for each phase's worker.
4. Pause at the design gate for human approval.

## Removing the demo from your real project

If you copied this folder and want to wipe it before adding your own modules:

```bash
rm -rf docs/core-business/* docs/its/* docs/sdlc/epics/EPIC-1000
```

Keep `docs/sdlc/workflow/` — that's the operating model, edit it instead of deleting.
