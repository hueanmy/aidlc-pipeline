# PRD: [Feature Title]

> **Epic**: [[EPIC-KEY] — Epic Title](../epics/[EPIC-KEY]/[EPIC-KEY].md)
> Copy to `docs/sdlc/epics/[EPIC-KEY]/PRD.md`

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

_What user problem or business need does this solve?_

## 2. Goal

_What does success look like? Include measurable outcomes._

| Metric | Current | Target |
|--------|---------|--------|
| | | |

---

## 3. User Flow

_Step-by-step flow from user's perspective._

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
| [Authentication/session expired mid-flow] | [Transparent refresh or re-auth prompt] |
| [Interruption or process restart] | [Preserve or safely discard state] |

---

## 4. Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| [EPIC-KEY]-AC01 | **Given** [precondition] **When** [action] **Then** [result] | Must |
| [EPIC-KEY]-AC02 | | Must |
| [EPIC-KEY]-AC03 | | Should |
| [EPIC-KEY]-AC04 | | Could |

---

## 5. UI / Design

| Screen / View | Design Link | Notes |
|---------------|-------------|-------|
| | | |

_If no design yet, describe layout and behavior requirements:_

---

## 6. Non-Functional Considerations

> Check all that apply and fill in details.

- [ ] **Performance**: Latency / throughput budget? Resource usage?
- [ ] **Reliability**: Retry / timeout / fallback behavior?
- [ ] **Security & Privacy**: Data handled, access controls, PII implications?
- [ ] **Compatibility**: Minimum supported environments / versions?
- [ ] **Accessibility**: Required a11y standards?
- [ ] **Internationalization**: Languages / locale support?
- [ ] **Observability**: Logs, metrics, traces needed?

---

## 7. Analytics / Telemetry Events

> Events to track for measuring success.

| Event Name | Trigger | Properties | Maps to Metric |
|-----------|---------|------------|----------------|
| `feature_x_opened` | User opens feature | `source` | Adoption |
| `feature_x_completed` | User completes flow | `duration_ms`, `result` | Completion rate |
| `feature_x_error` | Error occurs | `error_code`, `step` | Error rate |

---

## 8. Dependencies

| Dependency | Status | Notes |
|-----------|--------|-------|
| [External API / endpoint] | ⬜ Ready / ⬜ In progress | |
| [Design artifacts] | ⬜ Ready / ⬜ In progress | |
| Other epic: [OTHER-KEY] | ⬜ Done / ⬜ Blocked | |

---

## 9. Open Questions

| # | Question | Answer | Answered By |
|---|----------|--------|-------------|
| 1 | | | |

---

## 10. Revision History

| Date | Author | Change |
|------|--------|--------|
| YYYY-MM-DD | | Initial draft |
