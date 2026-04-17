---
name: coverage
description: Run unit tests with code coverage and report percentage. Shows per-file breakdown and tracks progress toward 95% target.
argument-hint: [filter] (e.g., Models, Services, Network, ViewModels, all)
---

# Unit Test Coverage Report

You are the **QA Engineer (QA)** agent on the {{PROJECT_NAME}} team.
Load your full persona from `.claude/agents/qa.md` before starting.

## Step 1: Run Tests with Coverage

Run the project's test suite with coverage enabled. Adapt the command to your {{TECH_STACK}}:

```bash
# Example — adapt to your project's build system and test runner
{{TEST_COVERAGE_COMMAND}}
```

If the test environment is not available, check available targets/runners:
```bash
{{LIST_TEST_TARGETS_COMMAND}}
```

## Step 2: Extract Coverage Data

### Overall summary:
```bash
{{COVERAGE_SUMMARY_COMMAND}}
```

### Per-file breakdown (filter by $ARGUMENTS if provided):
```bash
# All files
{{COVERAGE_DETAIL_COMMAND}}

# Filter by layer (if $ARGUMENTS provided)
{{COVERAGE_FILTER_COMMAND}}
```

### Uncovered files (0% coverage):
```bash
{{COVERAGE_UNCOVERED_COMMAND}}
```

## Step 3: Generate Report

```markdown
## Coverage Report — {date}

### Summary
| Target | Coverage | Lines Covered | Total Lines |
|--------|----------|---------------|-------------|
| {{PROJECT_NAME}} | X.XX% | XXXX | XXXXX |

### Target: 95%
Progress: ██████░░░░░░░░░░░░░░ X.X% (need +XX.X%)

### Coverage by Layer
| Layer | Files Covered | Files Total | Avg Coverage |
|-------|--------------|-------------|-------------|
| Core/Models | X/XX | XX | X.X% |
| Core/Services | X/XX | XX | X.X% |
| Core/Network | X/XX | XX | X.X% |
| Core/State | X/XX | XX | X.X% |
| Views/ViewModels | X/XX | XX | X.X% |
| Utilities | X/XX | XX | X.X% |

### Top Covered Files
| File | Coverage |
|------|----------|
| file | XX.X% |
| ... | ... |

### Biggest Gaps (0% coverage, sorted by line count)
| File | Lines | Priority |
|------|-------|----------|
| file | XXX | HIGH |
| ... | ... | ... |

### Test Count
| Suite | Tests | Passed | Failed |
|-------|-------|--------|--------|
| Total | XX | XX | XX |
```

## Step 4: Save Report

```bash
mkdir -p {{BUILD_OUTPUT_DIR}}/coverage-reports
```

Write to: `{{BUILD_OUTPUT_DIR}}/coverage-reports/coverage_{YYYY-MM-DD}.md`

## Step 5: Compare with Previous (if exists)

If a previous report exists, compare:
```markdown
### Delta vs Previous
| Metric | Previous | Current | Delta |
|--------|----------|---------|-------|
| Overall | X.X% | X.X% | +X.X% |
| Lines covered | XXXX | XXXX | +XXX |
| Test count | XX | XX | +XX |
```

## Rules:
- Always run in the fastest available test environment
- Report must include per-layer breakdown
- Flag any regression (coverage dropped)
- Save report to `{{BUILD_OUTPUT_DIR}}/coverage-reports/`
- Reference epic {{EPIC_PREFIX}}-XXXX for target tracking
