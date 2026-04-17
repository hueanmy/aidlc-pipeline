---
name: coverage
description: Run tests with code coverage and generate a report. Stack-neutral — adapt commands to the project's test runner and coverage tooling.
argument-hint: [filter] (e.g., area or layer to focus on — see CLAUDE.md, or "all")
---

# Code Coverage Report

You are the **QA Engineer (QA)** agent — a senior test practitioner.
Load your full persona from `.claude/agents/qa.md` before starting.

## Step 1: Run Tests with Coverage

Use the project's test + coverage command, defined in `CLAUDE.md`:

```bash
{{TEST_COVERAGE_COMMAND}}
```

Common conventions:
- **JS/TS** — `vitest run --coverage`, `jest --coverage`, `c8 node ...`
- **Python** — `pytest --cov`, `coverage run -m pytest && coverage report`
- **Go** — `go test ./... -coverprofile=coverage.out`
- **Rust** — `cargo llvm-cov --html`
- **JVM** — JaCoCo via Gradle/Maven
- **Swift** — `xcodebuild test -enableCodeCoverage YES` + `xccov view`
- **Android** — JaCoCo + Gradle `jacocoTestReport`
- **.NET** — `dotnet test --collect:"XPlat Code Coverage"`

If the test environment isn't available, show what's available:
```bash
{{LIST_TEST_TARGETS_COMMAND}}
```

## Step 2: Extract Coverage Data

### Overall summary
```bash
{{COVERAGE_SUMMARY_COMMAND}}
```

### Per-file / per-module breakdown (filter by `$ARGUMENTS` if provided)
```bash
{{COVERAGE_DETAIL_COMMAND}}
```

### Uncovered files (0% or below threshold)
```bash
{{COVERAGE_UNCOVERED_COMMAND}}
```

## Step 3: Generate Report

```markdown
## Coverage Report — {date}

### Summary
| Target | Coverage | Lines Covered | Total Lines | Branches |
|--------|----------|---------------|-------------|----------|
| {{PROJECT_NAME}} | X.XX% | XXXX | XXXXX | XX.XX% |

### Target
Project target: see `CLAUDE.md` (common floors: 70% for apps, 80–90% for libraries, 95% for safety-critical code)
Progress: ██████░░░░░░░░░░░░░░ X.X% (need +XX.X% to target)

### Coverage by Layer / Module
| Layer / Module | Files covered | Files total | Avg coverage |
|----------------|--------------|-------------|--------------|
| <domain> | X/XX | XX | X.X% |
| <services / business logic> | X/XX | XX | X.X% |
| <adapters / infra> | X/XX | XX | X.X% |
| <UI / presentation> | X/XX | XX | X.X% |
| <utilities> | X/XX | XX | X.X% |

Adapt the layer breakdown to the project's actual structure.

### Top Covered Files
| File | Coverage |
|------|----------|
| ... | XX.X% |

### Biggest Gaps (lowest coverage, highest line count first)
| File | Lines | Coverage | Priority |
|------|-------|----------|----------|
| ... | XXX | X% | HIGH / MED / LOW |

Priority heuristic:
- **HIGH** — low coverage on critical-path code (auth, payments, data mutation, core flows)
- **MED** — low coverage on domain logic
- **LOW** — low coverage on glue / scaffolding / generated code

### Test Counts
| Suite | Tests | Passed | Failed | Skipped |
|-------|-------|--------|--------|---------|
| Total | XX | XX | XX | XX |
```

## Step 4: Save Report

Create the output directory once and write the report:

```bash
mkdir -p {{BUILD_OUTPUT_DIR}}/coverage-reports
```

Write to `{{BUILD_OUTPUT_DIR}}/coverage-reports/coverage_{YYYY-MM-DD}.md`.

## Step 5: Compare with Previous (if a prior report exists)

```markdown
### Delta vs Previous
| Metric | Previous | Current | Delta |
|--------|----------|---------|-------|
| Overall | X.X% | X.X% | +/- X.X% |
| Lines covered | XXXX | XXXX | +/- XXX |
| Branch coverage | X.X% | X.X% | +/- X.X% |
| Test count | XX | XX | +/- XX |
```

## Rules

- Always run in the fastest available test environment
- Report must include per-layer / per-module breakdown
- Flag any regression (coverage dropped) — regressions are blockers in many projects
- Save report to `{{BUILD_OUTPUT_DIR}}/coverage-reports/`
- Prefer **branch coverage** over line coverage where the runner supports it; branch coverage is a stronger signal
- Coverage is a **floor**, not a ceiling — high coverage with weak assertions is worse than moderate coverage with sharp assertions
