---
name: deploy
description: Build and deploy to an environment. Stack-neutral — supports web (CDN / edge), mobile (store tracks / beta), desktop (update channels), backend (service environments), CLI (package registry). Runs pre-flight checks first.
argument-hint: "<environment> (dev | uat | prod)"
---

# Deploy

You are the **Release Manager (RM)** agent — a senior release practitioner.
Load your full persona from `.claude/agents/release-manager.md` before starting.

## Step 0: Pipeline Gate Check
Read and execute `.claude/skills/_gate-check.md`. This skill = phase `release`, epic = detect from branch. If no epic key found → skip gate. If gate fails → STOP.

## Step 1: Validate Environment Argument

Valid values: `dev`, `uat`, `prod`. If blank or invalid, show:
```
Usage: /deploy <environment>

  /deploy dev   → Build + ship to internal / development target
  /deploy uat   → Build + ship to UAT / staging target
  /deploy prod  → Build + ship to production target, tagged
```

Environment targets are project-specific. Typical mappings:

| Surface | dev | uat | prod |
|---------|-----|-----|------|
| Web app | Preview / feature env | Staging | Production (CDN + origin) |
| Mobile iOS | Internal TestFlight | External TestFlight | App Store (phased %) |
| Mobile Android | Internal track | Closed/Open track | Production (phased %) |
| Desktop | Nightly channel | Beta channel | Stable channel |
| Backend service | Dev cluster | Staging cluster | Prod (blue/green or canary) |
| CLI / library | Dev tag | RC / beta tag | Public registry (npm / pypi / crates / brew) |

## Step 2: Pre-Flight Checks

Before deploying, verify everything is ready.

```bash
# 1. Clean git state
git status --short

# 2. Current branch
git branch --show-current

# 3. Current version (read from project's version source — package.json, pyproject.toml, Info.plist, build.gradle, Cargo.toml, etc.)

# 4. Current build number / metadata (if applicable)

# 5. Run tests
{{TEST_COMMAND}}
```

### Pre-flight checklist

| Check | dev | uat | prod |
|-------|:---:|:---:|:---:|
| Git working tree clean | | ✅ | ✅ |
| On correct branch (e.g. `release/*`) | | ✅ | ✅ |
| CI green on this commit | ✅ | ✅ | ✅ |
| Tests passing | | ✅ | ✅ |
| No P0/P1 bugs open | | ✅ | ✅ |
| Integration / E2E suites green | | ✅ | ✅ |
| Release notes written | | | ✅ |
| Release checklist filled | | | ✅ |
| UAT signed off | | | ✅ |
| DB migration plan reviewed (if applicable) | | ✅ | ✅ |
| Feature flags configured for risky changes | | | ✅ |
| Rollback path verified | | | ✅ |

**If any required check fails**: STOP. Show what failed and how to fix. Do NOT proceed.

## Step 3: Deploy

Use the project's deployment command (Make target, CI job trigger, Fastlane lane, CLI script, etc.).

### `/deploy dev`
- Build configuration: Debug / Development
- Target: internal / dev environment
- Usually: no version bump, no tag

### `/deploy uat`
- Build configuration: UAT / Staging / RC
- Target: UAT environment / staging channel / external testers
- Bumps build number (if project uses one)
- Commit the bump: `{{EPIC_PREFIX}}-00000 bump build to N`
- Upload debug symbols / sourcemaps to crash / error tracker

### `/deploy prod`
- Build configuration: Release
- Target: production environment / public channel
- Bumps version per semver decision
- Tag: `vX.Y.Z` and push
- Upload debug symbols / sourcemaps to crash / error tracker
- Commit: `{{EPIC_PREFIX}}-00000 release vX.Y.Z`
- Staged rollout if the platform supports it (1% → 5% → 25% → 50% → 100%)

## Step 4: Post-Deploy Verification

```bash
# Verify build number / version was applied

# Verify tag (prod only)
git tag --sort=-version:refname | head -3

# Verify commit
git log --oneline -3
```

### Runtime verification (pick what applies)
- Synthetic / smoke tests green
- Key SLIs within thresholds (error rate, latency, throughput)
- No new error signatures appearing
- Staged-rollout percentage matches plan
- Feature flags set to expected state

### Output summary

```markdown
## Deploy Complete

| Field | Value |
|-------|-------|
| Environment | dev / uat / prod |
| Version | vX.Y.Z |
| Build / commit | N / <sha> |
| Branch | <branch> |
| Target / channel | <channel or cluster> |
| Tag | vX.Y.Z or "none" |
| Symbols / sourcemaps | uploaded / skipped |
| Rollout % (if staged) | N% |

### Next Steps
- dev: hand off to internal testers
- uat: notify UAT testers, run UAT scripts from epics
- prod: monitor rollout (run `/monitor`), watch error/latency dashboards
```

## Step 5: If Deploy Fails

| Error | Likely cause | Fix |
|-------|--------------|-----|
| Code signing / notarization | Cert or profile mismatch | Refresh signing material |
| Build failed | Compile error | Fix and re-run |
| Upload failed | Registry / store / API credentials | Check env vars / service auth |
| Symbol upload failed | Monitoring tool auth token | Check token env var (non-blocking) |
| Git not clean | Uncommitted changes | Commit or stash first |
| Migration blocked | Pending schema change | Run migration plan first |
| Canary failed health check | Regression | Roll back, open hotfix epic |

Show the error and suggest the fix. Do NOT retry automatically — escalate to a human decision.
