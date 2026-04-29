---
name: epic.schema
description: Shape of docs/sdlc/epics/<id>/epic.json — the metadata file that drives the orchestrator.
---

# epic.json schema

Stored at `docs/sdlc/epics/<EPIC_KEY>/epic.json`. Created by `/epic` skill (or by `init_epic` MCP tool), amended by later phases.

## Required fields

| Field | Type | Written by | Description |
|---|---|---|---|
| `epic_id` | string | `/epic` | Epic key, e.g. `EPIC-123`. Must match the folder name. |
| `project` | string | `/epic` | Project slug. Used as a label only — domain knowledge is read from `<workspace>/docs/` (see below). |
| `brief` | string | user / `/epic` | Original epic brief text. May contain Figma URLs, links, etc. Workers parse this for optional Figma references. |
| `affected_modules` | string[] | `/epic` (PO) | List of module slugs that map to `<workspace>/docs/core-business/*.md`. Example: `["auth", "billing"]` matches files whose name contains those slugs (case-insensitive). |

## Optional fields

| Field | Type | Written by | Description |
|---|---|---|---|
| `module_amend_log` | object[] | `/tech-design` (Tech Lead) | **Append-only** log of amendments to `affected_modules`. Each entry: `{ at: ISO8601, by: agent-name, added: string[], reason: string }`. Modules can only be added, never removed — if a declared module turns out to be wrong, reject to Plan so the PO re-scopes. |
| `title` | string | `/epic` | Human-readable title. |
| `owner` | string | `/epic` | Epic owner identifier. |

## Domain-knowledge layout (workspace-side)

The orchestrator reads project knowledge from the **user's workspace**, not from the MCP server package:

```
<workspace>/
  docs/
    core-business/        # one .md per business module (e.g. 01-auth.md, 02-billing.md)
    its/                  # tech-stack notes (optional, single .md file)
    sdlc/
      workflow/           # delivery operating model (scaffolded by setup)
      epics/
        <EPIC_KEY>/
          epic.json
          PRD.md
          TECH-DESIGN.md
          ...
          phases/
            <phase>/
              status.json
              archive/revision-N/...
```

Domain folders are optional. If `docs/core-business/` doesn't exist, the orchestrator passes an empty list — the worker proceeds without it. No project knowledge is baked into this package.

## Example

```json
{
  "epic_id": "EPIC-123",
  "project": "my-app",
  "title": "Capture flow v2",
  "brief": "Redesign the camera capture flow. Figma: https://figma.com/design/abc/...",
  "affected_modules": ["camera", "session"],
  "module_amend_log": [
    {
      "at": "2026-04-21T10:30:00Z",
      "by": "tech-lead",
      "added": ["asset-pipeline"],
      "reason": "Capture output feeds into asset-pipeline — must touch that module."
    }
  ]
}
```

## Notes

- Figma URLs go in `brief`, not in a separate field. Workers that need Figma (PO at Plan, Tech Lead at Design, QA at Execute-Test) detect the URL and fetch via the Figma MCP.
- `affected_modules` is the *input* to context packaging — the orchestrator uses it to select which `core-business/*.md` files to pass to each worker.
- Resolution rule: module slug → first `core-business/*.md` whose filename contains the slug (case-insensitive). If none match, the orchestrator skips silently (does not fail).
