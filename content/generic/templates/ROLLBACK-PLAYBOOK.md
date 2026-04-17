# Rollback Playbook

> This is a reference doc, not a per-release template. Keep it in `docs/sdlc/templates/`.
> Last updated: YYYY-MM-DD

---

## Severity → Action Matrix

| Severity | Trigger | Timeline | Action |
|----------|---------|----------|--------|
| **P0 Critical** | Error/crash rate above threshold, data loss, auth broken | < 1 hour | Halt rollout + emergency hotfix |
| **P1 Major** | Core feature broken, widespread functional failure | < 4 hours | Halt rollout + hotfix next build |
| **P2 Moderate** | Functional issue, workaround exists | Next cycle | Continue rollout + fix in next epic |
| **P3 Minor** | Cosmetic, edge case | Backlog | Continue rollout + log for later |

---

## Step 1: Halt Rollout

**Who**: Release Manager or Tech Lead
**Where**: [Distribution channel / deployment dashboard]

1. Open the distribution / deployment dashboard
2. Locate the current version (vX.Y.Z)
3. Pause the rollout (or disable the release behind a feature flag)
4. Users already on the new version keep it; new receivers get the previous version

> Pausing does NOT remove the release from users who already received it.

---

## Step 2: Assess Impact

```
Questions to answer within 30 minutes:
1. What % of users/traffic are affected? (monitoring dashboard)
2. Is it environment/config specific?
3. Is it reproducible?
4. Can users work around it?
5. Is data at risk?
```

| Signal | Source | How to Check |
|--------|--------|--------------|
| Error / crash rate | [Monitoring tool] | Filter by release version |
| Core flow failures | [Analytics / telemetry] | Event counts by version |
| Key feature failures | [Analytics / telemetry] | Event counts by version |
| User reports | [Support / feedback channel] | Filter by app version |
| Public feedback | [Review / feedback channel] | Recent ratings & comments |

---

## Step 3: Decide — Hotfix or Full Rollback

### Option A: Hotfix (preferred)

**When**: Root cause identified, fix is small and safe.

```bash
# 1. Create hotfix branch from release tag
git checkout -b hotfix/[EPIC-KEY]-description v{X.Y.Z}

# 2. Fix the issue
# ... make changes ...

# 3. Fast-track review (tech lead must approve)
# PR title: [HOTFIX][EPIC-KEY] description

# 4. Test on the environment/config that reproduces the issue

# 5. Build and deploy through the standard pipeline
#    - UAT/staging first — verify fix
#    - Production — request expedited review if applicable
```

**Timeline**: Fix → Review → Deploy = typically 24–48 hours (depends on release channel SLA).

### Option B: Full Rollback

**When**: Root cause unknown OR fix is risky OR data loss occurring.

1. If the channel supports rollback natively (feature flag, server-side toggle, deployment revert): revert now.
2. Otherwise: re-submit the previous release (or its artifacts) as a new build.
   ```bash
   # Check out the previous release tag
   git checkout v{PREVIOUS_VERSION}

   # Increment build metadata (keep same version string if channel requires)
   # Build and submit through the standard pipeline
   ```
3. Keep previous internal / staging builds available for affected users.

> **Note**: Some distribution channels do not allow un-publishing a release — you can only publish a newer one.

---

## Step 4: Communicate

| Audience | Channel | Message Template |
|----------|---------|------------------|
| Team | [Chat channel] | `🚨 [vX.Y.Z] Rollout paused. Issue: [description]. Investigating. ETA: [time]` |
| Stakeholders | [Stakeholder channel] | `⚠️ Release vX.Y.Z paused due to [issue]. Hotfix in progress. No user action needed.` |
| Users (if widespread) | [User comm channel / in-product] | `We're aware of [issue] and working on a fix. Update coming shortly.` |
| Public reviews / feedback | [Review channel] | Reply to affected reports: `Thanks for reporting. A fix is on the way.` |

---

## Step 5: Post-Incident

After the issue is resolved:

1. **Resume rollout** (if paused).
2. **Create incident report epic**: `[EPIC-KEY] [INCIDENT] vX.Y.Z [description]`.
3. **Post-mortem content** (add to epic doc):
   - What happened (timeline)
   - Root cause
   - How it was detected
   - Impact (users / traffic affected, duration)
   - What prevented earlier detection
   - Action items to prevent recurrence
4. **Update monitoring**: add alert for the specific failure pattern.

---

## Emergency Contacts

| Role | Who | Reach via |
|------|-----|-----------|
| Release Manager | | |
| Tech Lead | | |
| Distribution channel support | | |
| Monitoring / observability owner | | |

---

## Prevention Checklist (for future releases)

- [ ] Error / crash-free threshold met on staging before production submission
- [ ] Minimum soak time on staging with representative testers
- [ ] Testing on minimum supported environment
- [ ] Phased rollout enabled (never full rollout for feature releases)
- [ ] Alerts configured for new error signatures
- [ ] Monitoring dashboard for core flow success rates
