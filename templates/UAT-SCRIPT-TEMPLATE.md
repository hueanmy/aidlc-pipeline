# UAT Test Script: [Feature Title]

> **Epic**: [[EPIC-KEY] — Epic Title](../epics/[EPIC-KEY]/[EPIC-KEY].md)
> **Build**: vX.Y.Z (Build XX)
> **Environment**: UAT / staging
> Copy to `docs/sdlc/epics/[EPIC-KEY]/UAT-SCRIPT.md`
>
> This script is for **non-technical testers** (PM, stakeholders). Write steps they can follow in their own environment.

---

## Prerequisites

- [ ] UAT build installed / accessible
- [ ] Build vX.Y.Z (XX) confirmed in use
- [ ] Logged into test account: `_________________`
- [ ] Environment / client: _________ / _________
- [ ] Network: connected

---

## Test Scenarios

### Scenario 1: [Happy Path — Main Flow]

**What we're testing**: _One sentence description_

| Step | Action | Expected Result | Pass? | Notes |
|------|--------|-----------------|-------|-------|
| 1 | Open the application | App loads to starting view | ⬜ | |
| 2 | [Action] | [Expected] | ⬜ | |
| 3 | [Action] | [Expected] | ⬜ | |
| 4 | [Action] | [Expected] | ⬜ | |
| 5 | Verify result | [Expected final state] | ⬜ | |

**Screenshot required**: Step ___

---

### Scenario 2: [Error / Edge Case]

**What we're testing**: _What happens when something goes wrong_

| Step | Action | Expected Result | Pass? | Notes |
|------|--------|-----------------|-------|-------|
| 1 | [Setup condition] | [State ready] | ⬜ | |
| 2 | [Trigger error] | [Error message / graceful handling] | ⬜ | |
| 3 | [Recovery action] | [App recovers] | ⬜ | |

---

### Scenario 3: [Offline / Network Edge Case]

**What we're testing**: _Behavior without network_

| Step | Action | Expected Result | Pass? | Notes |
|------|--------|-----------------|-------|-------|
| 1 | Disable network | No crash | ⬜ | |
| 2 | [Try action that needs network] | [Error message / cached data] | ⬜ | |
| 3 | Re-enable network | [App recovers / syncs] | ⬜ | |

---

## Regression Quick Check

> Verify existing features still work after this change.

| # | Check | Steps | Pass? |
|---|-------|-------|-------|
| 1 | App starts | Open app, reach main view | ⬜ |
| 2 | [Core flow 1] | [Steps] | ⬜ |
| 3 | [Core flow 2] | [Steps] | ⬜ |
| 4 | [Core flow 3] | [Steps] | ⬜ |
| 5 | [Core flow 4] | [Steps] | ⬜ |

---

## Issues Found

| # | Scenario | Step | Description | Severity | Screenshot | Ticket |
|---|----------|------|-------------|----------|------------|--------|
| 1 | | | | P0/P1/P2/P3 | | [OTHER-KEY] |

---

## UAT Verdict

| Criterion | Status |
|-----------|--------|
| All happy path scenarios pass | ⬜ |
| No P0/P1 issues open | ⬜ |
| Regression checks pass | ⬜ |
| Performance acceptable (no visible lag) | ⬜ |

**Verdict**: ⬜ **PASS** — Ready for release / ⬜ **FAIL** — Issues must be fixed first

**Tested by**: _________________ **Date**: _________ **Environment**: _________
