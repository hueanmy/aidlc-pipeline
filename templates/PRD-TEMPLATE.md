# PRD: [Feature Title]

> **Epic**: [[EPIC-KEY] — Epic Title](../epics/[EPIC-KEY]/[EPIC-KEY].md)
> Copy to `docs/sdlc/epics/[EPIC-KEY]/PRD.md`
>
> A senior PRD is **testable, measurable, and honest about trade-offs**. Every AC maps to a test. Every success metric has a guardrail. Every error state has an expected behavior.

---

## Metadata

| Field | Value |
|-------|-------|
| **Epic Key** | [EPIC-KEY] |
| **Author** | |
| **Reviewer** | |
| **Status** | `draft` / `review` / `approved` / `superseded` |
| **Created** | YYYY-MM-DD |
| **Approved** | YYYY-MM-DD |

---

## 1. Problem

_What user problem or business need does this solve? Who is hurting, when, and why? Keep it user-focused, not solution-focused._

## 2. Target User / Cohort

_Which segment, persona, or user type? Be specific — "all users" usually means "no one in particular."_

## 3. Goal

_What does success look like? Include leading and lagging indicators._

### Success Metrics

| Metric | Current | Target | Timeframe |
|--------|---------|--------|-----------|
| | | | |

### Guardrail Metrics

_Metrics that must NOT regress. Examples: error rate, latency, retention of other flows, support-ticket volume._

| Metric | Current | Cannot regress below |
|--------|---------|----------------------|
| | | |

---

## 4. User Flow

```
Step A → [Action] → Step B → [Action] → Step C
```

### Happy Path
1. User does X
2. System shows Y
3. User confirms Z

### Error / Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| [External dependency unavailable] | [Retry / fallback / user-visible message] |
| [Permission / access denied] | [Clear message and recovery path] |
| [Authentication / session expired mid-flow] | [Transparent refresh or re-auth prompt] |
| [Interruption or process restart] | [Preserve or safely discard state] |
| [Invalid / malformed input] | [Validation error with clear correction path] |
| [Empty state / first-run] | [Appropriate prompt or onboarding] |
| [Large data / long text / unicode / RTL] | [Renders correctly, no truncation] |

---

## 5. Acceptance Criteria

> One AC per testable behavior. Don't AND-chain. Every error state has an AC, not just happy path.

| ID | Criteria | Priority |
|----|----------|----------|
| [EPIC-KEY]-AC01 | **Given** [precondition] **When** [action] **Then** [result] | Must |
| [EPIC-KEY]-AC02 | | Must |
| [EPIC-KEY]-AC03 | | Should |
| [EPIC-KEY]-AC04 | | Could |

Priority = MoSCoW (**Must** have to ship, **Should** have ideally, **Could** have if time, **Won't** this cycle).

---

## 6. UI / Design

| Screen / View | Design Link | Notes |
|---------------|-------------|-------|
| | | |

_If no design yet, describe layout and behavior requirements concretely enough for implementation._

**Platform conventions**: _call out where this should follow native / platform patterns (iOS HIG, Material, web a11y, desktop menu/keyboard conventions, etc.)._

---

## 7. Non-Functional Requirements

> Check what applies. Fill in targets and measurement approach. "N/A" is a valid answer if genuinely not applicable — but justify it.

- [ ] **Performance**: user-visible latency budget (p50 / p95), throughput, resource footprint
- [ ] **Reliability**: retry / timeout / fallback behavior; idempotency; degradation mode
- [ ] **Security & privacy**: data classification, authn/authz, input validation, PII handling, consent
- [ ] **Compatibility**: minimum supported platforms / browsers / OS / runtime versions
- [ ] **Accessibility**: WCAG level, keyboard, screen reader, contrast, motion
- [ ] **Internationalization**: supported locales, RTL, currency / date / number formats
- [ ] **Observability**: logs, metrics, traces this feature emits
- [ ] **Offline / resilience**: behavior without network / with intermittent connectivity
- [ ] **Scalability**: expected load (QPS / concurrent users / data volume); headroom

---

## 8. Analytics / Telemetry

> Events you need to measure success and detect problems.

| Event | Trigger | Properties | Maps to Metric |
|-------|---------|------------|----------------|
| `feature_x_opened` | User opens feature | `source` | Adoption |
| `feature_x_completed` | User completes flow | `duration_ms`, `result` | Completion rate |
| `feature_x_error` | Error occurs | `error_code`, `step` | Error rate (guardrail) |

**Privacy notes**: _PII in properties? consent required? retention?_

---

## 9. Rollout Strategy

- **Flag**: `[flag-name]` — `default off`
- **Strategy**: _flagged / phased / canary / direct_
- **Target cohorts / percentages**: _e.g. 1% → 5% → 25% → 50% → 100%_
- **Guardrail watch**: _which metrics halt rollout if they regress_
- **Kill-switch / rollback path**: _how to turn it off fast without a redeploy_

---

## 10. Dependencies

| Dependency | Type | Status | Owner | Blocked? |
|------------|------|--------|-------|----------|
| [External API / endpoint] | External | ⬜ Ready / ⬜ In progress | | |
| [Design artifacts] | Design | ⬜ Ready / ⬜ In progress | | |
| Other epic: [OTHER-KEY] | Internal | ⬜ Done / ⬜ Blocked | | |
| [Legal / compliance review] | Compliance | ⬜ | | |

---

## 11. Risks & Assumptions

| Risk / Assumption | Impact | Likelihood | Mitigation |
|-------------------|--------|-----------|------------|
| | High / Med / Low | High / Med / Low | |

---

## 12. Open Questions

| # | Question | Answer | Answered By | Blocking? |
|---|----------|--------|-------------|-----------|
| 1 | | | | ⬜ |

---

## 13. Revision History

| Date | Author | Change |
|------|--------|--------|
| YYYY-MM-DD | | Initial draft |
