---
name: benchmark
description: Run performance benchmarks and profiling for critical features. Identifies bottlenecks via static analysis and guided trace recording.
argument-hint: [area] (e.g., startup | api | render | data | all — define areas per project)
---

# Performance Benchmark

You are the **Performance Agent** for {{PROJECT_NAME}}.

## Step 0: Select Benchmark Area

Define benchmark areas relevant to your project. If blank or invalid, show the available areas:

```
Usage: /benchmark <area>

Areas are project-specific. Common examples:
  /benchmark startup   → Application startup latency
  /benchmark api       → API call and network latency
  /benchmark render    → UI rendering and scroll performance
  /benchmark data      → Data processing, parsing, serialization
  /benchmark all       → Run all benchmarks
```

## Step 1: Read Coding Rules

Read `CLAUDE.md` performance section for rules and thresholds.

## Step 2: Benchmark Protocol

Before discussing metrics, enforce a deterministic run protocol:

```
Environment lock:
- [ ] Use same commit hash for all comparisons
- [ ] Use Release/production config for profiling (Debug numbers are reference only)
- [ ] Use appropriate test environment (real device, staging server, etc.)
- [ ] Record environment details (device/machine, OS, app version, git SHA) in report

Run protocol:
- [ ] Cold run: clear caches, restart app/service
- [ ] Warm run: keep caches primed, repeat same flow
- [ ] 1 warm-up run + at least 5 measured runs
- [ ] Report median + p95 (not only a single best run)
- [ ] Mark regression if median worsens >10% vs baseline
```

If the user has no measurements yet, provide the profile checklist and ask for trace/screenshot data.

## Step 3: Static Analysis (always runs)

For the selected area, analyze code for performance issues **without building**.

Define checks relevant to your {{TECH_STACK}}. Common patterns to look for:

### Startup
```
Check:
- [ ] No heavy synchronous work on the main/UI thread during launch
- [ ] Lazy initialization for non-critical services
- [ ] No blocking network calls during startup
- [ ] Dependency injection resolved efficiently
```

### API / Network
```
Check:
- [ ] Appropriate timeouts configured
- [ ] Retry with exponential backoff (not immediate)
- [ ] Response caching where appropriate
- [ ] No redundant or duplicate requests
- [ ] Large responses processed on background thread
```

### UI Rendering
```
Check:
- [ ] No heavy computation on main/UI thread
- [ ] Lazy loading for lists and grids
- [ ] Image loading is asynchronous with caching
- [ ] No layout thrashing or excessive re-renders
- [ ] Scroll performance maintains target frame rate
```

### Data Processing
```
Check:
- [ ] Large data parsing on background thread
- [ ] Reusable formatters/decoders (not created per call)
- [ ] No force-unwrap in parsing code
- [ ] Batch processing uses bounded memory
- [ ] File I/O on background thread
```

## Step 4: Profiling and Trace Recording

If a profiling environment is available, guide the user through recording traces.

### 4a. Select environment

List available test environments:
```bash
# Project-specific commands to list available devices/environments
{{LIST_PROFILING_TARGETS_COMMAND}}
```

**Ask the user which environment to use.**

### 4b. Prepare application

Ensure the application is built and running in the target environment.

### 4c. Record traces

Create output directory:
```bash
mkdir -p {{BUILD_OUTPUT_DIR}}/traces
```

Use the appropriate profiling tool for your {{TECH_STACK}}:
```bash
# Project-specific profiling commands
{{PROFILING_RECORD_COMMAND}}
```

### 4d. Extract trace metadata

After recording, export and analyze:
```bash
{{PROFILING_EXPORT_COMMAND}}
```

### 4e. Manual fallback

If automated profiling is not available, provide manual instructions:

```
1. Open the project profiling tool ({{IDE}} profiler, browser DevTools, etc.)
2. Select the appropriate profiling template for the area
3. Run the area-specific flow
4. Save trace to: {{BUILD_OUTPUT_DIR}}/traces/
5. Capture rules:
   - Keep each capture < 3-5 minutes
   - Record cold and warm runs separately
   - Name: {area}_{environment}_{cold|warm}_{timestamp}
```

## Step 5: Export Report to File

After completing static analysis and trace recording, **always** save a markdown report:

```bash
mkdir -p {{BUILD_OUTPUT_DIR}}/benchmark-reports
```

Write the full report to:
```
{{BUILD_OUTPUT_DIR}}/benchmark-reports/{area}_{YYYY-MM-DD}.md
```

If the same area+date already exists, append a counter: `{area}_{YYYY-MM-DD}_2.md`

The report file must contain ALL sections from the output format below.
After writing, confirm to user:
```
Report saved: {{BUILD_OUTPUT_DIR}}/benchmark-reports/{filename}.md
Traces: {{BUILD_OUTPUT_DIR}}/traces/{trace files}
```

## Step 6: Report Format

### Output format:

```markdown
## Performance Report — {area} — {date}

### Run Metadata
| Field | Value |
|------|-------|
| Environment | device/machine/browser |
| OS | version |
| Build config | Release/Debug |
| App version | X.Y.Z (build N) |
| Commit | git SHA |
| Run type | cold / warm |
| Sample count | N runs |

### Thresholds
| Metric | Target | Critical |
|--------|--------|----------|
| {metric} | < Xms | > Xms |
| ... | ... | ... |

Define thresholds relevant to your project and area.

### Static Analysis Results
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| ... | ok/warn/crit | path:line | ... |

### Measurement Results (if traces provided)
| Metric | Median | p95 | Baseline | Delta | Status |
|-------|--------|-----|----------|-------|--------|
| {metric} | X ms | Y ms | Z ms | +/-% | ok/warn/crit |
| ... | ... | ... | ... | ... | ... |

Regression gate:
- Warning if median regression > 10% vs baseline
- Critical if metric crosses Critical threshold

### Issues Found

**CRITICAL** — [file:line] description
   Impact: {what users experience}
   Fix: {suggested code change}

**WARNING** — [file:line] description
   Impact: {what users experience}
   Fix: {suggested code change}

**OPTIMIZATION** — [file:line] description
   Impact: {potential improvement}
   Fix: {suggested code change}

### Recommendations
Priority order:
1. {Fix critical issues first}
2. {Then warnings}
3. {Then optimizations}

### Evidence
- Trace files: {list of trace names or screenshots}
- Key stacks/hot paths: {function names + self/total time}
- Memory notes: {peak MB, leak suspicion yes/no}
```

## Step 7: Generate Benchmark Tests (if requested)

If user wants automated benchmarks, generate performance tests appropriate to {{TECH_STACK}}:

```
# Project-specific performance test structure
# Adapt to your test framework (XCTest, JUnit, pytest-benchmark, etc.)

- Use the project's test framework with performance measurement APIs
- Use fixture sizes matching production percentiles (p50/p90/p99 payloads)
- Avoid network dependency in unit performance tests; use local fixtures/mocks
- Keep tests deterministic (fixed input, no random data unless seeded)
```

## Rules:
- Static analysis first — no build required
- Always enforce environment/run protocol before comparing numbers
- Flag main-thread/UI-thread violations as CRITICAL
- Flag memory leaks / retain cycles as CRITICAL
- Require median + p95 for measured results (single-run numbers are insufficient)
- Suggest appropriate profiling tool and request trace evidence for manual verification
- Generate performance tests only if user requests
- Reference CLAUDE.md performance rules for all checks
