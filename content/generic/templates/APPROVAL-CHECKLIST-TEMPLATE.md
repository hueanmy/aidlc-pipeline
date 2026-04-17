# Approval Checklist: [Feature Title]

> **Epic**: [[EPIC-KEY] — Epic Title](../epics/[EPIC-KEY]/[EPIC-KEY].md)
> Copy to `docs/sdlc/epics/[EPIC-KEY]/APPROVAL.md`

---

## Pre-Implementation Gate

> All items must be checked before implementation begins.

### Product Readiness (PM Sign-off)

- [ ] PRD is complete with all acceptance criteria
- [ ] User flow covers happy path AND error/edge cases
- [ ] Design artifacts approved (or UI spec described in PRD)
- [ ] Analytics / telemetry events defined
- [ ] Dependencies identified and status confirmed
- [ ] Open questions resolved (no blockers)

**PM**: _________________ **Date**: _________ **Verdict**: ⬜ Approved / ⬜ Needs revision

---

### Technical Readiness (Tech Lead Sign-off)

- [ ] Tech design reviewed and approved
- [ ] API / interface contract agreed with integrating teams
- [ ] File / module impact analysis complete
- [ ] Dependency wiring plan clear
- [ ] State management approach decided
- [ ] No architectural concerns or risks unaddressed
- [ ] Performance budget defined

**Non-Functional**:
- [ ] Reliability / failure modes assessed (if applicable)
- [ ] Security & privacy reviewed (if applicable)
- [ ] Observability plan defined (if applicable)
- [ ] Compatibility verified across supported environments

**Tech Lead**: _________________ **Date**: _________ **Verdict**: ⬜ Approved / ⬜ Needs revision

---

### QA Readiness (QA Lead Sign-off)

- [ ] Test plan reviewed and approved
- [ ] Environment / configuration matrix defined
- [ ] Test infrastructure reserved (if needed)
- [ ] Test data / fixtures identified
- [ ] Regression scope defined
- [ ] Performance thresholds set

**QA Lead**: _________________ **Date**: _________ **Verdict**: ⬜ Approved / ⬜ Needs revision

---

## Gate Decision

| Criterion | Status |
|-----------|--------|
| PM Approved | ⬜ |
| Tech Lead Approved | ⬜ |
| QA Lead Approved | ⬜ |
| All dependencies ready | ⬜ |

**Final Decision**: ⬜ **GO** — Proceed to implementation / ⬜ **NO-GO** — Revisions needed

**Reason (if NO-GO)**: _________________________________

---

## Post-Implementation Gate

> Check before merging to release branch.

- [ ] All acceptance criteria met (linked PR)
- [ ] Code review passed (no blockers)
- [ ] Unit tests passing with adequate coverage
- [ ] UI / component tests passing
- [ ] Integration tests passing on target environment
- [ ] No P0/P1 bugs open
- [ ] Performance within budget
- [ ] Analytics / telemetry events verified firing correctly
- [ ] Doc reverse-sync completed

**Decision**: ⬜ **Merge to release** / ⬜ **Hold** — issues to resolve first
