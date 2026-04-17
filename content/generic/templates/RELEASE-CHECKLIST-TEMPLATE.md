# Release Checklist: vX.Y.Z

> Copy to `docs/sdlc/releases/vX.Y.Z-release-checklist.md`

---

## Release Info

| Field | Value |
|-------|-------|
| **Version** | vX.Y.Z |
| **Build** | XX |
| **Branch** | `release/X.Y.Z` |
| **Release Manager** | |
| **Target Date** | YYYY-MM-DD |
| **Rollout Strategy** | Phased (1% → 5% → 20% → 50% → 100%) / Full |

## Epics in This Release

| Epic | Title | UAT Status | Doc Sync |
|------|-------|-----------|----------|
| [EPIC-KEY-A] | | ⬜ Passed | ⬜ Done |
| [EPIC-KEY-B] | | ⬜ Passed | ⬜ Done |

---

## Pre-Release (3 days before)

### Code Freeze
- [ ] Release branch `release/X.Y.Z` created from default / main branch
- [ ] No new features merged after this point (bug fixes only)
- [ ] All epic PRs merged and reviewed
- [ ] Version string bumped: `X.Y.Z`
- [ ] Build number incremented (if applicable)

### Quality Gate
- [ ] All unit tests passing (CI green)
- [ ] No P0/P1 bugs open for epics in this release
- [ ] Linters / static analysis: no new errors introduced
- [ ] Performance: no regressions from baseline

### UAT Sign-off
- [ ] UAT build distributed to testers
- [ ] All epic UAT scripts executed and passed
- [ ] PM sign-off received: _________ (date: _____)
- [ ] QA sign-off received: _________ (date: _____)

### Environment & Compatibility Checks
- [ ] Tested on minimum supported environment
- [ ] Tested on latest supported environment
- [ ] Critical flows verified end-to-end
- [ ] External integrations verified
- [ ] Lifecycle / restart behavior verified
- [ ] Access / permission flows unaffected

---

## Release Day

### Distribution / Submission
- [ ] Release artifact built by CI/CD
- [ ] Artifact uploaded to distribution channel
- [ ] Debug symbols / sourcemaps uploaded to monitoring tool
- [ ] Release metadata reviewed:
  - [ ] Marketing / store assets current (if UI changed)
  - [ ] Description current
  - [ ] Release notes updated (see below)
- [ ] Privacy / compliance declarations reviewed and still accurate
- [ ] Submitted to distribution channel / reviewer

### Release Notes

```
[User-facing release notes — concise, value-focused]
Example:
- [Feature 1 summary]
- [Feature 2 summary]
- Bug fixes and performance improvements
```

### Git
- [ ] Release tagged: `git tag v{X.Y.Z}`
- [ ] Tag pushed: `git push origin v{X.Y.Z}`
- [ ] Release notes published (GitHub Release / equivalent)
- [ ] Release branch merged back to default / main branch

---

## Post-Submission

### External Review / Approval (if applicable)
- [ ] Review status: ⬜ In Review / ⬜ Approved / ⬜ Rejected
- [ ] If rejected: reason noted, fix planned
- [ ] If approved: rollout started

### Rollout Monitoring (first 48 hours)

| Check | 1 hour | 4 hours | 24 hours | 48 hours |
|-------|--------|---------|----------|----------|
| Error / crash rate within threshold | ⬜ | ⬜ | ⬜ | ⬜ |
| No P0 alerts from monitoring | ⬜ | ⬜ | ⬜ | ⬜ |
| Core flow success rate stable | ⬜ | ⬜ | ⬜ | ⬜ |
| Key feature success rate stable | ⬜ | ⬜ | ⬜ | ⬜ |
| User-reported issues stable | | | ⬜ | ⬜ |

### Rollout Progression

| Phase | % Users | Date Started | Status | Notes |
|-------|---------|-------------|--------|-------|
| 1 | 1% | | ⬜ | |
| 2 | 5% | | ⬜ | |
| 3 | 20% | | ⬜ | |
| 4 | 50% | | ⬜ | |
| 5 | 100% | | ⬜ | |

### Decision Points
- **Pause rollout if**: error/crash rate breaches threshold OR P0 alert fires OR critical flow failure rate exceeds [N]%
- **Resume rollout after**: root cause identified + hotfix shipped OR issue is edge-case only
- **Full rollback if**: data loss confirmed OR severe degradation after [N] hours

---

## Post-Release Closure

- [ ] All epics marked as `released` in their epic docs
- [ ] Doc reverse-sync completed for all epics
- [ ] Monitoring dashboards bookmarked for this version
- [ ] Retro notes captured (what went well / what to improve)

---

## Sign-off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Release Manager | | | ⬜ |
| PM | | | ⬜ |
| QA Lead | | | ⬜ |
| Tech Lead | | | ⬜ |
