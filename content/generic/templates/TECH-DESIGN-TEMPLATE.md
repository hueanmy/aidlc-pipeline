# Tech Design: [Feature Title]

> **Epic**: [[EPIC-KEY] — Epic Title](../epics/[EPIC-KEY]/[EPIC-KEY].md)
> **PRD**: [PRD](../epics/[EPIC-KEY]/PRD.md)
> Copy to `docs/sdlc/epics/[EPIC-KEY]/TECH-DESIGN.md`

---

## Metadata

| Field | Value |
|-------|-------|
| **Epic Key** | [EPIC-KEY] |
| **Author** | |
| **Reviewer** | |
| **Status** | `draft` / `review` / `approved` |
| **Created** | YYYY-MM-DD |
| **Approved** | YYYY-MM-DD |

---

## 1. Summary

_One paragraph: what is being built and the technical approach._

---

## 2. Architecture

### Component Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  [Layer A]   │────►│  [Layer B]   │────►│  [Layer C]   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
                                                ▼
                                          ┌──────────────┐
                                          │  [External]  │
                                          └──────────────┘
```

### Layer / Module Mapping

| Layer / Module | New / Modified | Location |
|----------------|----------------|----------|
| [Presentation / UI] | New / Modified | |
| [Application / Logic] | New / Modified | |
| [Domain / Service] | New / Modified | |
| [Data / Persistence] | New / Modified | |
| [Integration / External] | New / Modified | |
| [Configuration / Wiring] | Modified | |

---

## 3. API / Interface Contract

### New / Modified Endpoints or Interfaces

```
[METHOD/VERB] [path or interface name]
```

**Request / Input**:
```
{
  "field": "value"
}
```

**Response / Output** (success):
```
{
  "data": {}
}
```

**Error Cases**:
| Condition | Response / Behavior | Caller Handling |
|-----------|---------------------|-----------------|
| Auth failure | 401 / equivalent | Re-authenticate |
| Validation error | 4xx / equivalent | Show field error |
| Server / internal error | 5xx / equivalent | Generic error message |

### Data Model

```
[Type / schema definition]
```

---

## 4. State Management

| State | Location | Reason |
|-------|----------|--------|
| [Feature data] | [Local component / view scope] | Scoped to this screen/flow |
| [Shared data] | [Application / session store] | Needed across flows |
| [Persistent] | [Persistent storage] | Survives process restart |

### State Flow

```
User/Trigger → Controller → Service → External/Store
      │              │           │            │
      ▼              ▼           ▼            ▼
   UI state    loading → ok/err  result   updates
```

---

## 5. Sequence Diagram

```
Actor         UI            Controller       Service        External
 │             │                 │              │              │
 │──action───► │                 │              │              │
 │             │──invoke()─────► │              │              │
 │             │                 │──request()──►│              │
 │             │                 │              │──call──────► │
 │             │                 │              │◄──response── │
 │             │                 │◄──result()── │              │
 │             │◄──state update──│              │              │
 │◄──render────│                 │              │              │
```

---

## 6. Dependency Wiring / Registration

```
[Describe how new components are registered / injected / configured.
 Keep language-agnostic: registration mechanism, lifetime, parameters.]
```

---

## 7. Navigation / Control Flow Changes

| Action | From | To | Method |
|--------|------|-----|--------|
| | [Source] | [Destination] | [transition/route/push] |

---

## 8. Non-Functional Design

### Performance Budget

| Metric | Budget | Measurement |
|--------|--------|-------------|
| Response / load time | [target] | [how measured] |
| Memory / resource use | [target] | [how measured] |
| Throughput | [target] | [how measured] |
| Size / footprint impact | [target] | [how measured] |

### Reliability & Failure Modes

- Retry strategy: _________
- Timeout: _________
- Fallback / degraded mode: _________
- Idempotency: _________

### Security & Privacy

- Data classification: _________
- Authn / authz: _________
- Input validation: _________
- Secrets handling: _________

### Observability

- Logs: _________
- Metrics: _________
- Traces / diagnostics: _________

---

## 9. File / Module Impact Summary

### New Files
| File / Module | Purpose |
|---------------|---------|
| | |

### Modified Files
| File / Module | Change |
|---------------|--------|
| | |

### Deleted Files
| File / Module | Reason |
|---------------|--------|
| (none expected) | |

---

## 10. Risks & Technical Debt

| Risk | Impact | Mitigation |
|------|--------|------------|
| | | |

### Known Shortcuts
_Any technical debt being intentionally introduced and why._

---

## 11. Open Questions

| # | Question | Answer | Answered By |
|---|----------|--------|-------------|
| 1 | | | |
