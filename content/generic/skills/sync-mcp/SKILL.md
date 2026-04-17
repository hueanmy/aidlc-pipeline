---
name: sync-mcp
description: Sync cf-sdlc-pipeline content into the current project via symlinks — docs (core-business, its, workflow), generic skills, and project-specific agents. Also clears stale npx caches so the MCP boots against the latest version. Use when MCP tools/docs seem outdated or after a known upstream release.
---

# Sync cf-sdlc-pipeline

Refresh the `cf-sdlc-pipeline` npm cache and re-link project content (docs, skills, agents) from the cached package into the current project.

## Run

```bash
echo "{\"cwd\":\"$PWD\"}" | bash ~/.claude/hooks/sync-sdlc-mcp.sh
```

## What the script does

1. Exits silently unless the current project's `.claude/settings.json` references `cf-sdlc-pipeline`.
2. Queries `npm view cf-sdlc-pipeline version`; clears any stale `~/.npm/_npx` caches at older versions and warms with `npx -y cf-sdlc-pipeline@latest`.
3. Updates the stable user-level symlink `~/.cache/cf-sdlc-pipeline/current` → current npx cache dir.
4. Creates symlinks under the current project (uses `SDLC_PROJECT` from settings):
   - `docs/core-business`, `docs/its`, `docs/workflow` → `content/projects/<SDLC_PROJECT>/<folder>`
   - `.claude/skills/<name>` → `content/generic/skills/<name>` (every generic skill dir)
   - `.claude/agents/<name>.md` → project-specific agent if exists, else generic fallback
5. Existing real files/dirs at those paths are left untouched; only symlinks (or missing paths) are refreshed.

## Why symlinks and not wait for the MCP

The `cf-sdlc-pipeline` MCP server has its own `syncWorkspace()` that writes merged real files on startup — but Claude Code boots MCPs lazily (only when a tool is invoked), so a fresh session starts with an empty `.claude/`. Symlinks give the project its skills/agents/docs immediately. If the MCP later boots and overwrites with merged content, the skill/agent/doc still works.

## Report to the user

Read the `systemMessage` JSON the script prints. It shows:
- Latest version now warmed.
- How many stale caches were cleared.
- How many docs/skills/agents symlinks were refreshed.

Tell the user whether a **Claude Code restart** is needed — only if `cache cleared > 0`, since the running MCP holds old content in memory. Symlinks take effect immediately; newly-linked skills appear in `/` slash-command discovery next session.

## Notes

- Runs automatically on every SessionStart via `~/.claude/settings.json` hooks.
- Idempotent; safe to run repeatedly.
- To force real-file install (MCP's merged content), invoke the MCP's `setup` tool.
