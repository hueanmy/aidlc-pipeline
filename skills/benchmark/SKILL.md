---
name: benchmark
description: Run performance benchmarks. Combines static analysis with guided profiling. Stack-neutral — adapts to web, mobile, desktop, backend, CLI. Enforces deterministic run protocol and reports median + p95.
argument-hint: "[area] (e.g., startup | api | render | data | all — define areas per project)"
---

# Performance Benchmark

You are the **Performance Engineer** (a senior performance-oriented developer). Load the **Tech Lead** persona (`.claude/agents/tech-lead.md`) for architectural judgment.

## Step 0: Select Benchmark Area

Benchmark areas are project-specific. If blank or invalid, show common options:

```
Usage: /benchmark <area>

Examples (adapt to your project):
  /benchmark startup   → Process / app / page startup latency
  /benchmark api       → Request handling latency and throughput
  /benchmark render    → UI rendering, frame time, scroll perf
  /benchmark data      → Parsing, serialization, data processing
  /benchmark memory    → Steady-state memory, leak detection
  /benchmark bundle    → Bundle / artifact size (web/mobile/desktop)
  /benchmark all       → Run all configured areas
```

## Step 1: Read Performance Rules

Read `CLAUDE.md` performance section for project-specific rules, thresholds, and tools.

## Step 2: Enforce Run Protocol

Before comparing numbers, lock the environment. Without this, numbers are noise.

```
Environment lock:
- [ ] Same commit SHA for all comparisons
- [ ] Release / production build config (Debug numbers are reference-only)
- [ ] Same environment (device / browser / server class)
- [ ] Record environment (device, OS, app version, git SHA) in report

Run protocol:
- [ ] Cold run: clear caches, restart target process
- [ ] Warm run: caches primed, repeat same flow
- [ ] 1 warm-up run + at least 5 measured runs
- [ ] Report median + p95 (single-run numbers are insufficient)
- [ ] Regression gate: median worsens > 10% vs baseline → warn; > 20% → block
```

If no measurements yet: provide the profile checklist, ask for trace/screenshot data, stop.

## Step 3: Static Analysis (always runs — no build required)

Analyze code for common performance anti-patterns. Adapt checks to stack.

### Startup / Cold Path
```
- [ ] No heavy synchronous work on the critical path (main thread / event loop / request handler)
- [ ] Lazy initialization for non-critical services
- [ ] No blocking network / disk calls during startup
- [ ] Large module graphs split or deferred (web: dynamic import; mobile: lazy load)
- [ ] Dependency wiring is efficient — no O(n²) resolution
```

### API / Network
```
- [ ] Explicit timeouts on all outbound calls
- [ ] Retry with exponential backoff + jitter — not immediate retry
- [ ] Response caching where idempotent
- [ ] No duplicate / fan-out requests for the same data
- [ ] Large responses streamed / paginated
- [ ] N+1 query patterns eliminated (backend)
```

### UI Rendering (web / mobile / desktop)
```
- [ ] No heavy computation on the render thread
- [ ] Virtualization for long lists / grids
- [ ] Async image loading + caching + correct sizing
- [ ] No layout thrashing (web: batch reads/writes; mobile: avoid Measure/Layout in loops)
- [ ] Stable keys / IDs for list items (avoid rerender cascades)
- [ ] Memoization where it helps; avoid over-memoizing trivial components
- [ ] Frame budget respected (target 60 fps → 16 ms/frame, 120 fps → 8 ms)
```

### Data / Processing
```
- [ ] Large data parsing off the critical path
- [ ] Reusable formatters / decoders (not per-call instantiation)
- [ ] Batch processing with bounded memory
- [ ] Streaming APIs for files > ~10 MB
- [ ] Parallelism where safe (worker threads / goroutines / tasks)
```

### Memory
```
- [ ] Caches have bounded size / eviction
- [ ] Long-lived references audited (module-level maps, event listeners, observers)
- [ ] Retain cycles checked in ARC runtimes (iOS/macOS)
- [ ] Weak references for delegates / callbacks where lifecycle mismatch exists
- [ ] Large buffers released after use
```

### Bundle / Artifact Size (web / mobile / desktop)
```
- [ ] Tree-shaking working (no lodash-full, full-moment, etc.)
- [ ] Code split along route / feature boundaries
- [ ] Large assets (images / videos / fonts) sized appropriately
- [ ] Unused dependencies removed
```

## Step 4: Profiling & Trace Recording

### 4a. Pick a profiling environment

List targets / browsers / devices available:
```bash
{{LIST_PROFILING_TARGETS_COMMAND}}
```

### 4b. Prepare

Build in the configuration being profiled. Ensure the app / service is running in the target.

### 4c. Record

```bash
mkdir -p {{BUILD_OUTPUT_DIR}}/traces

{{PROFILING_RECORD_COMMAND}}
```

Project-specific tools:

| Stack | Profiler |
|-------|----------|
| Web frontend | Chrome DevTools Performance / Memory tab, Lighthouse, WebPageTest |
| Node backend | `node --prof`, `clinic`, `0x`, Chrome DevTools via `--inspect` |
| Python | `cProfile`, `py-spy`, `pyinstrument` |
| Go | `go test -bench`, `pprof` |
| JVM | JFR (Java Flight Recorder), async-profiler |
| iOS | Instruments (Time Profiler, Allocations, Leaks) |
| Android | Android Studio CPU/Memory Profiler, `systrace`, Perfetto |
| Desktop (Electron) | Chrome DevTools in renderer; Instruments / Perfetto for main |
| Native | `perf`, Instruments, Very Sleepy, Xcode Instruments |

### 4d. Manual fallback
```
1. Open the appropriate profiler
2. Select the relevant profile template
3. Run the area-specific flow
4. Save trace to {{BUILD_OUTPUT_DIR}}/traces/
5. Capture rules:
   - Each capture < 3–5 minutes
   - Record cold and warm separately
   - Name: {area}_{env}_{cold|warm}_{YYYY-MM-DD-HHmmss}
```

## Step 5: Export Report

Always save a markdown report:

```bash
mkdir -p {{BUILD_OUTPUT_DIR}}/benchmark-reports
```

Write to `{{BUILD_OUTPUT_DIR}}/benchmark-reports/{area}_{YYYY-MM-DD}.md` (suffix `_2`, `_3` if the same area+date exists).

Confirm to the user:
```
Report saved: {{BUILD_OUTPUT_DIR}}/benchmark-reports/{filename}.md
Traces: {{BUILD_OUTPUT_DIR}}/traces/{files}
```

## Step 6: Report Format

```markdown
## Performance Report — {area} — {date}

### Run Metadata
| Field | Value |
|-------|-------|
| Environment | device / machine / browser |
| OS | version |
| Build config | Release / Debug |
| App / service version | X.Y.Z (build N) |
| Commit | git SHA |
| Run type | cold / warm |
| Sample count | N runs |

### Thresholds
| Metric | Target | Critical |
|--------|--------|----------|
| {metric} | < Xms | > Xms |

### Static Analysis Results
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| ... | ok/warn/crit | path:line | ... |

### Measurement Results (if traces provided)
| Metric | Median | p95 | Baseline | Delta | Status |
|--------|--------|-----|----------|-------|--------|
| {metric} | Xms | Yms | Zms | +/-% | ok/warn/crit |

Regression gate:
- Warning: median regression > 10% vs baseline
- Critical: metric crosses critical threshold OR regression > 20%

### Issues Found

**CRITICAL** — [file:line] description
   Impact: {what users experience}
   Fix: {suggested code change}

**WARNING** — [file:line] description
   Impact: ...
   Fix: ...

**OPTIMIZATION** — [file:line] description
   Impact: ...
   Fix: ...

### Recommendations (priority order)
1. Fix critical issues
2. Address warnings
3. Apply optimizations

### Evidence
- Trace files: {list}
- Key hot paths: {function + self/total time}
- Memory notes: {peak, leak suspicion}
```

## Step 7: Generate Benchmark Tests (if requested)

If the user wants automated benchmarks:
- Use the project's performance-testing idiom (`xctest measure`, JMH, `go test -bench`, `pytest-benchmark`, `benchmark.js`, `criterion.rs`, Lighthouse CI, k6, etc.)
- Use fixture sizes that match production percentiles (p50/p90/p99 payloads)
- Keep deterministic — fixed input, no network, seeded randomness
- Avoid measuring against live infra in unit-level perf tests

## Rules

- Static analysis first; no build required
- Always enforce the run protocol before comparing numbers
- Main-thread / UI-thread / event-loop blocking → **CRITICAL**
- Retain cycles / unbounded leaks → **CRITICAL**
- Require median + p95 for measured results
- Suggest the right profiler and request trace evidence
- Generate perf tests only on request
- Reference `CLAUDE.md` performance rules for all checks
