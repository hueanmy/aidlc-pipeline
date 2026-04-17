---
name: hotfix
description: Diagnose a production issue and guide through the hotfix process. Stack-neutral — works for web, mobile, desktop, backend, CLI. Accepts input from issue trackers, error dashboards, user feedback, or free-form description.
argument-hint: "<{{EPIC_PREFIX}}-XXXX> [issue source]"
---

# Hotfix for $ARGUMENTS

You are the **SRE (Healer)** agent — a senior production engineer.
Load your full persona from `.claude/agents/sre.md` before starting.

## Step 0: Gather Input

The hotfix can be triggered from several sources. Ask the user which they have (wait for input):

```markdown
## Hotfix Input — What do you have?

Provide one or more:

### A. Issue-tracker ticket
   - Ticket key (e.g. {{EPIC_PREFIX}}-2100) — fetchable via Jira / Linear / GitHub Issues
   - Or paste the ticket description + repro steps

### B. Error / crash dashboard
   📍 Sentry / Crashlytics / Bugsnag / Rollbar / Datadog Errors / etc.
   - Error signature / stack trace
   - Affected environments / versions / users
   - Error rate / crash-free rate

### C. Service metrics / SLO breach
   - What SLO burned (latency / error rate / saturation)
   - Dashboard link
   - When it started

### D. User / support report
   📍 Support tool — Zendesk, Intercom, etc.
   - What the user described
   - Environment (device / browser / OS / version)
   - Screenshots or recording

### E. Team / slack report
   - Message or thread
   - Who reported, when

### F. Your own description
   - What's broken, when it started, who's affected
   - Repro steps if known

### Helpful extras
   - App version + build number
   - Environment details (device / browser / OS)
   - Frequency (always / sometimes / rare)
   - Recent deploy timing (correlate to change)
```

## Step 1: Mitigate First (If User Impact is Ongoing)

If users are currently hurting, **mitigation beats diagnosis**. Before writing a fix:
1. Is there a **feature flag** to disable the broken path? → flip it
2. Is there a **rollback path** (previous version still deployable)? → consider it
3. Is there a **config rollback** that un-breaks it? → apply it
4. If none of the above: proceed to fix, but move fast

Capture the timeline for the postmortem from here on.

## Step 2: Fetch Additional Context

- **Ticket provided** → fetch full issue details via the project's issue-tracker integration (summary, description, repro, priority, assignee, affected version)
- **Stack trace provided** → map to source file + line; check git blame for recent changes
- **Description provided** → search codebase for related code via Grep/Glob

## Step 3: Read Reference

1. `docs/sdlc/templates/ROLLBACK-PLAYBOOK.md` — severity matrix and procedure
2. Project runbooks for the affected area, if any

## Step 4: Assess the Issue

- Map to source file(s)
- Determine scope: environment-specific? version-specific? platform-specific? tenant-specific?
- Check git blame for recent changes in the affected area
- Read related domain / reference docs

## Step 5: Classify Severity

| Severity | Trigger | Timeline |
|----------|---------|----------|
| **P0** | Crash > threshold / data loss / auth broken / security / privacy breach | Hotfix NOW (or rollback/flag-off now, fix in parallel) |
| **P1** | Core feature broken / critical flow failing | Hotfix next build, within 24h |
| **P2** | Functional issue, workaround exists | Next epic cycle |
| **P3** | Cosmetic / edge case | Backlog |

## Step 6: For P0 / P1 — Generate the Fix

- **Minimal blast radius** — fix *this* bug; don't refactor around it
- Write the fix
- Write a **regression test** that fails without the fix and passes with it
- Verify nothing else breaks: run full test suite
- Review for security implications (does the fix introduce a new risk?)

## Step 7: Guide Through Deploy

```bash
# Create hotfix branch from the release tag (not default branch)
git checkout -b hotfix/{{EPIC_PREFIX}}-XXXX-desc vX.Y.Z

# Apply fix + test
{{TEST_COMMAND}}

# Push and open a PR marked [HOTFIX]
# Fast-track review — Tech Lead must approve

# Deploy through staging → production
# Even under pressure: UAT on staging before production
# Use `/deploy uat` then `/deploy prod`
```

## Step 8: Update Issue Tracker (if ticket provided)

- Post root cause + fix summary as a comment on the ticket
- Transition to "In Progress" / "Done" as appropriate
- Link the hotfix PR and the epic doc

## Step 9: Create Epic Doc (for tracking & postmortem)

```bash
make epic KEY={{EPIC_PREFIX}}-XXXX
```
- Mark it as a **hotfix** in the epic doc
- Fill the postmortem section once the fix is in prod

## Step 10: Postmortem (after the fire is out)

Within 1 week:
- Timeline (detection → mitigation → resolution)
- Root cause (technical) + contributing factors (process)
- What worked / didn't — blameless
- Action items with owners and dates
- File to `docs/sdlc/incidents/YYYY-MM-DD-title.md`

## Rules

- Minimal change only — fix the bug, nothing else
- Must include a regression test
- Fast-track review, but still a review — no solo-merge
- Always UAT before prod, even for hotfixes — broken hotfixes are worse than the original bug
- Write the postmortem — the next incident depends on it
