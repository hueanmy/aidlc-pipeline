---
name: release-notes
description: Generate release notes by analyzing code diff vs default branch + reading epic docs. Produces user-facing notes, internal changelog, and deploy changelog. Stack-neutral.
argument-hint: [version] (e.g., 1.3.0, or blank to auto-detect from project)
---

# Generate Release Notes

You are the **Release Manager (RM)** agent — a senior release practitioner.
Load your full persona from `.claude/agents/release-manager.md` before starting.

## Step 0: Pipeline Gate Check
Read and execute `.claude/skills/_gate-check.md`. This skill = phase `release`, epic = detect from branch/commits. If no epic key found → skip gate. If gate fails → STOP.

## Step 1: Determine Version & Diff

```bash
# Current branch
git branch --show-current

# Commits not in default branch (master/main)
git log origin/<default-branch>..HEAD --pretty="%h %s" --no-merges

# Full diff stats
git diff origin/<default-branch> --stat

# Changed files
git diff origin/<default-branch> --name-only

# New files
git diff origin/<default-branch> --diff-filter=A --name-only

# Deleted files
git diff origin/<default-branch> --diff-filter=D --name-only
```

If `$0` provided, use it as the version. Otherwise read the version from the project's source of truth (`package.json`, `pyproject.toml`, `Cargo.toml`, `Info.plist`, `build.gradle`, `VERSION`, git-tag-based semantic-release, etc.).

## Step 2: Extract Epic Keys & Read Docs

```bash
# All epic keys in commits
git log origin/<default-branch>..HEAD --pretty="%s" --no-merges | grep -oE '{{EPIC_PREFIX}}-[0-9]+' | sort -u
```

For each epic key, read:
- `docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/{{EPIC_PREFIX}}-XXXX.md` — title, scope, affected areas
- `docs/sdlc/epics/{{EPIC_PREFIX}}-XXXX/PRD.md` — user-facing description, acceptance criteria

## Step 3: Analyze Actual Code Diff

Don't just rely on commits — the commit message and the actual change sometimes diverge.

```bash
# Which areas / directories changed?
git diff origin/<default-branch> --name-only
```

For significant changed files, read the diff to understand **user-visible** impact. Pay attention to:
- New / changed public API, CLI flag, env var, config key — breaking?
- New migration script — data or schema change?
- New user-visible string — feature or copy change?
- Dependency upgrade with user impact (perf, security)?

## Step 4: Read Previous Release Notes for Style

Read the last few entries in the project's changelog to match tone and structure. Consistency matters more than cleverness.

## Step 5: Categorize Changes

| Section | What goes here |
|---------|----------------|
| **New Features** | Brand-new capabilities that didn't exist before |
| **Improvements** | Enhanced existing features — better UX, perf, docs |
| **Bug Fixes** | User-visible fixes only (skip internal-only fixes) |
| **Breaking Changes** | Any change that requires user or integrator action |
| **Deprecated** | Features that still work but will be removed |
| **Security** | Security-relevant fixes (coordinate disclosure if severe) |
| **Internal** | Refactors, infra, test, doc — usually omitted from user-facing notes |

For each item:
- `title`: 2–5 words, feature / change name
- `description`: 1–2 sentences, benefit to the user or integrator — not technical detail

## Step 6: Generate Outputs

### Output 1 — User-Facing Release Notes

```
What's New in v{version}

- <Feature benefit, plain language>
- <Another change>
- Bug fixes and performance improvements
```

- Plain language, no jargon, no epic keys
- Respect any channel-specific length limits (app stores cap at ~4000 chars)
- Translate to every supported locale — natural translation, not literal

### Output 2 — Technical Release Notes / Changelog

```markdown
# v{version} — YYYY-MM-DD

**Branch**: {branch} vs {default-branch}
**Commits**: {count} | **Files changed**: {count} | **Lines**: +{add} / -{del}

## Summary
{2–3 sentences}

## New
- **{{EPIC_PREFIX}}-XXXX — <Title>**: <description>

## Improved
- **{{EPIC_PREFIX}}-YYYY — <Title>**: <description>

## Fixed
- <User-visible fixes>

## Breaking
- <Change>. Migration: <link / steps>

## Deprecated
- <Feature> — removal in v{X.Y.Z}

## Security
- <Advisory> — <CVE if applicable>

## Internal (optional)
- <Refactors, infra, docs>

## Notes
- New config / env vars: ...
- Dependency changes: ...
- DB migrations: ...
- Feature flags: ...

## Stats
| Metric | Value |
|--------|-------|
| Commits | {n} |
| Files changed | {n} |
| Lines +/- | +{n} / -{n} |
```

### Output 3 — Deploy Changelog (short)

```
Build {build} — v{version}

- [{{EPIC_PREFIX}}-XXXX] <one-line>
- [{{EPIC_PREFIX}}-YYYY] <one-line>

Test focus: <area that needs most testing>
Known risks: <anything UAT or staged rollout should watch>
```

## Step 7: Apply Changes

Present all three outputs to the user for review. After approval, update the appropriate files (project changelog, release-notes store listing, release page, etc.).

## Rules

- Descriptions must be **user-facing** for Output 1 — "Faster uploads" not "Refactored presigned URL flow"
- Match the writing style of previous release notes
- Translations must be natural, not literal machine output
- Date format: `YYYY-MM-DD`
- Present all outputs to the user before writing any files
- Call out breaking changes **prominently** — front-load them, don't bury
