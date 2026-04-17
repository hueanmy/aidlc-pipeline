# Test Plan: [Feature Title]

> **Epic**: [[EPIC-KEY] — Epic Title](../epics/[EPIC-KEY]/[EPIC-KEY].md)
> **PRD**: [PRD](../epics/[EPIC-KEY]/PRD.md)
> **Tech Design**: [Tech Design](../epics/[EPIC-KEY]/TECH-DESIGN.md)
> Copy to `docs/sdlc/epics/[EPIC-KEY]/TEST-PLAN.md`

---

## Metadata

| Field | Value |
|-------|-------|
| **Epic Key** | [EPIC-KEY] |
| **Author** | |
| **QA Reviewer** | |
| **Status** | `draft` / `review` / `approved` |
| **Created** | YYYY-MM-DD |

---

## 1. Test Scope

### In Scope
_What this test plan covers (derived from PRD acceptance criteria)._

| AC ID | Acceptance Criteria | Test Type |
|-------|---------------------|-----------|
| [EPIC-KEY]-AC01 | (from PRD) | Unit / Integration / E2E |
| [EPIC-KEY]-AC02 | | |

### Out of Scope
_What is NOT tested and why._

---

## 2. Environment & Configuration Matrix

> List environments / configurations that must be covered. Mark which require real infrastructure vs. simulated.

| Environment / Config | Version / Profile | Real | Simulated | Priority |
|----------------------|-------------------|------|-----------|----------|
| [Minimum supported] | | ⬜ | ⬜ | Must |
| [Current stable] | | ⬜ | ⬜ | Must |
| [Latest] | | ⬜ | ⬜ | Should |

### Simulation Limitations (must test on real environment)
- [List items that simulators / mocks cannot cover]

---

## 3. Unit Tests

| ID | Component | Test Description | Location | Status |
|----|-----------|------------------|----------|--------|
| [EPIC-KEY]-UT01 | [Component] | State transitions: idle → loading → success/error | | ⬜ |
| [EPIC-KEY]-UT02 | [Component] | Data transformation / mapping | | ⬜ |
| [EPIC-KEY]-UT03 | [Service] | Call with mocked dependencies | | ⬜ |
| [EPIC-KEY]-UT04 | [Model] | Serialization with full payload | | ⬜ |
| [EPIC-KEY]-UT05 | [Model] | Serialization with missing optional fields | | ⬜ |
| [EPIC-KEY]-UT06 | [Model] | Serialization with unknown extra fields | | ⬜ |

---

## 4. UI / Component Tests

| ID | Flow | Steps | Expected | Environment | Status |
|----|------|-------|----------|-------------|--------|
| [EPIC-KEY]-UI01 | Happy path | 1. Open feature 2. Do action 3. See result | Result displayed | | ⬜ |
| [EPIC-KEY]-UI02 | Error state | 1. Trigger error condition | Error UI shown | | ⬜ |
| [EPIC-KEY]-UI03 | Empty state | 1. Open with no data | Empty state shown | | ⬜ |

---

## 5. Integration Tests

| ID | Flow | Components | Precondition | Expected | Status |
|----|------|-----------|--------------|----------|--------|
| [EPIC-KEY]-IT01 | End-to-end | [Component chain] | [State] | [Outcome] | ⬜ |
| [EPIC-KEY]-IT02 | Auth refresh | [Components] | [Expired credential] | Transparent refresh | ⬜ |

---

## 6. Environment-Specific Tests

### Network / Connectivity

| ID | Scenario | How to Test | Expected | Status |
|----|----------|-------------|----------|--------|
| [EPIC-KEY]-NET01 | Offline: no network | Disable network | Graceful error / cached data | ⬜ |
| [EPIC-KEY]-NET02 | Network loss mid-operation | Toggle network mid-flow | Retry / resume | ⬜ |
| [EPIC-KEY]-NET03 | Connectivity transition | Switch network | Reconnect correctly | ⬜ |
| [EPIC-KEY]-NET04 | Slow / lossy network | Throttle bandwidth | Timeout handling | ⬜ |

### Lifecycle / Process Tests

| ID | Scenario | Steps | Expected | Status |
|----|----------|-------|----------|--------|
| [EPIC-KEY]-LC01 | Pause / suspend mid-flow | Suspend process | State preserved | ⬜ |
| [EPIC-KEY]-LC02 | Resume from suspend | Bring back | Resume correctly | ⬜ |
| [EPIC-KEY]-LC03 | Low-resource conditions | Simulate pressure | No crash, graceful degrade | ⬜ |
| [EPIC-KEY]-LC04 | External interruption | [Describe] | Handled gracefully | ⬜ |
| [EPIC-KEY]-LC05 | Force termination / restart | Kill and restart | Clean restart, no stale state | ⬜ |

### Access / Permission Tests

| ID | Permission / Access | Scenario | Expected | Status |
|----|---------------------|----------|----------|--------|
| [EPIC-KEY]-PM01 | [Permission A] | First time: grant | Flow works | ⬜ |
| [EPIC-KEY]-PM02 | [Permission A] | First time: deny | Clear recovery path | ⬜ |
| [EPIC-KEY]-PM03 | [Permission B] | Partial access | Handled correctly | ⬜ |

---

## 7. Performance Tests

| ID | Metric | Threshold | How to Measure | Status |
|----|--------|-----------|----------------|--------|
| [EPIC-KEY]-PF01 | Response / load time | [target] | [tool / method] | ⬜ |
| [EPIC-KEY]-PF02 | Memory / resource footprint | [target] | [tool / method] | ⬜ |
| [EPIC-KEY]-PF03 | No resource leaks | 0 leaks after [N] cycles | [tool / method] | ⬜ |

---

## 8. Accessibility Tests

| ID | Check | Expected | Status |
|----|-------|----------|--------|
| [EPIC-KEY]-A11Y01 | Screen reader navigation | All elements announced | ⬜ |
| [EPIC-KEY]-A11Y02 | Scalable text / zoom | Layout adapts, no truncation | ⬜ |
| [EPIC-KEY]-A11Y03 | Color contrast | Meets WCAG AA (4.5:1) | ⬜ |

---

## 9. Regression Checklist

> Existing features that MUST still work after this change.

| Area | Quick Smoke Test | Status |
|------|------------------|--------|
| [Core area 1] | [Smoke test description] | ⬜ |
| [Core area 2] | [Smoke test description] | ⬜ |
| [Core area 3] | [Smoke test description] | ⬜ |

---

## 10. Test Results Summary

> Fill after test execution.

| Category | Total | Pass | Fail | Blocked | Skip |
|----------|-------|------|------|---------|------|
| Unit | | | | | |
| UI | | | | | |
| Integration | | | | | |
| Environment-specific | | | | | |
| Performance | | | | | |
| Accessibility | | | | | |
| Regression | | | | | |
| **Total** | | | | | |

**Overall Verdict**: ⬜ Pass / ⬜ Fail / ⬜ Pass with known issues

**Known Issues**:
| ID | Description | Severity | Ticket |
|----|-------------|----------|--------|
| | | | [OTHER-KEY] |

---

## 11. Sign-off

| Role | Name | Date | Approved |
|------|------|------|----------|
| QA Lead | | | ⬜ |
| Tech Lead | | | ⬜ |
| PM | | | ⬜ |
