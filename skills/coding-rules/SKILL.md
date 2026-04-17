---
name: coding-rules
description: Stack-neutral senior coding rules. Reference for all agents and skills when writing or reviewing code. Adapt specifics in CLAUDE.md for the project's chosen stack.
argument-hint: "[area] (e.g., architecture, concurrency, security, testing, all)"
---

# Coding Rules

Show coding rules for area: `$ARGUMENTS` (or all if blank).

These rules are **stack-neutral and senior-level**. They hold across web, mobile, desktop, backend, and CLI. Translate each rule to the idioms of the runtime in play; project-specific overrides belong in `CLAUDE.md`.

All other skills (`/prd`, `/tech-design`, `/test-plan`, `/review`, `/hotfix`, etc.) must respect these rules.

---

## 1. Architecture

- Define the project's layering in `CLAUDE.md` (MVC, MVVM, Clean, hexagonal, layered, onion, etc.) and follow it consistently
- **Layer dependencies are one-way** — a layer can depend on the layer below it, never above
- **External dependencies sit behind interfaces** — DB, HTTP client, file system, clock, random, OS service, third-party SDK. Every one is mockable.
- **No hidden global state** — wire explicitly through the project's composition mechanism (DI container, module graph, factory functions, plugin system). Singletons only when the runtime imposes them.
- **Single responsibility per module** — file/module names describe one responsibility; if the name needs "and," split it
- **Composition over inheritance** — prefer small, focused types that compose, not deep hierarchies

---

## 2. Types & Correctness

- Use the strongest types the language allows (TypeScript `strict`, Kotlin null-safety, Rust ownership, Python type hints with mypy/pyright, Go with explicit types, etc.)
- **Parse, don't validate** — turn untrusted input into a known-good domain type at the boundary; the rest of the code never re-checks
- **Exhaustive handling** for enums / sum types / variants — compiler-enforced where possible
- No `any` / `Object` / `interface{}` / unchecked casts except at true unknowns (plugin boundaries, serialized data being parsed)
- Value types / immutable models preferred for data containers

---

## 3. Concurrency

- Know your runtime's concurrency model (event loop, coroutines, goroutines, actors, threads + locks) and stay consistent with it
- **Never block the critical path** — UI thread, main thread, event loop, request handler, hot render path. Heavy work (I/O, parsing, crypto, compression, large loops) moves off it.
- **Structured concurrency** — child tasks cancel when the parent cancels; no detached fire-and-forget
- **Protect shared mutable state** — prefer immutability or message passing; when using locks, keep critical sections short and avoid nested locks
- **No data races** — prove absence via types (Rust), actors (Swift/Dart/Erlang), single-writer invariants (JS event loop), or explicit synchronization (JVM/native)
- Cancel in-flight work when the owning scope is destroyed (view unmounted, request aborted, job stopped)

---

## 4. Resource & Memory Safety

- **Close what you open** — files, sockets, timers, subscriptions, cursors, DB connections. On all paths, including error paths.
- **Bounded caches** — any in-memory cache has an explicit eviction policy (size, time, or both)
- **GC'd languages** — watch for retained references in listeners, closures-over-context, long-lived maps keyed by request, and module-level caches
- **ARC / ref-counted languages** (Swift, ObjC, some C++) — prevent retain cycles in every escaping closure (including nested); weak delegates; `[weak self]` / `[unowned self]` chosen deliberately
- **Ownership languages** (Rust) — respect lifetimes; avoid reaching for `Arc<Mutex<_>>` as a default
- **Manual memory** — pair every allocation with a free; prefer RAII / defer / `try-with-resources`

---

## 5. API & Interface Design

- **Stable contracts at external boundaries** — public HTTP/RPC APIs, SDK surfaces, IPC messages, CLI flags, library exports
- **Version breaking changes explicitly** — semver for libraries; URL/header versioning for HTTP APIs; message versioning for IPC
- **Idempotency** for non-read operations where retries are expected — idempotency keys, `PUT` over `POST` where natural
- **Predictable errors** — typed error envelope with code, message, and (where safe) details; never leak internal details or stack traces across a trust boundary
- **Pagination, not unbounded lists** — every "list all" endpoint is a DoS waiting to happen
- **Deprecation policy** — warn before removal; document migration

### Data Integrity across Layers

- Do not pass transport/DTO models directly to UI or domain layers
- Map DTO → Domain Model in the service/mapper layer
- UI bindings and business logic use domain models, not transport types
- Version serialized schemas; handle forward- and backward-compat as the product ages

---

## 6. Error Handling

- **Typed errors at domain boundaries** — `Result` / `Either` / discriminated union / enum — exceptions only where the runtime expects them
- **No silent swallow on critical paths** — log with context, propagate, or crash loud; silent `catch` only for truly optional operations (analytics, logging)
- **Don't force-crash on user input** — no force-unwrap / `!!` / `panic` driven by untrusted data
- **Map technical errors to user-facing messages at the presentation layer** — never show stack traces or internal codes to users
- Distinguish **expected failures** (retry, fallback) from **bugs** (alert, fix) — treat them differently in telemetry

---

## 7. State Management

- **Client state**: scoped to the view/component unless genuinely shared
- **Shared application state**: one source of truth; clear invalidation; no ambient mutation
- **Server-owned state**: the server is the source; client caches have explicit invalidation
- **Persistent state**: versioned, migratable, never relied on for correctness without validation on read
- **Secrets and tokens**: secure / encrypted storage only — never in unprotected preferences, local storage on untrusted clients, or logs

---

## 8. Security

- **Input validation at trust boundaries** — HTTP handler, IPC receiver, deserializer, file reader
- **Parameterized queries** — never string-concat SQL; escape shell args; validate redirects
- **Output encoding** — HTML-escape, URL-encode, JSON-encode at the right place; content-security-policy for web
- **Secrets** — never in source, logs, client bundles, or error messages; use the project's secret store
- **Least privilege** — tokens, scopes, OS permissions scoped to what's needed
- **Auth** — use battle-tested flows (OAuth2, OIDC, PKCE, session cookies with proper flags); don't roll your own
- **PII** — classify; minimize; retention policy; no PII in logs or analytics without consent
- **Dependency hygiene** — pin versions, audit for CVEs, keep up with security patches

---

## 9. Performance

- **Measure, don't guess** — profile before optimizing
- **Cache with explicit invalidation** — never silent TTLs on correctness-critical data
- **Batch I/O** — avoid N+1; stream large payloads
- **Paginate unbounded lists** — every collection has a limit
- **Lazy-load non-critical work** — warm the critical path, defer the rest
- **Track long-running memory** — services, tabs, desktop apps leak slowly; verify steady-state

---

## 10. Observability

- **Structured logs** with correlation / request IDs; no PII or secrets
- **Metrics** for externally-visible operations: latency, error rate, throughput (RED) or utilization, saturation, errors (USE)
- **Traces** across service and process boundaries (OpenTelemetry is the safe default)
- **Alerts** on user-impact signals (SLO burn), not every error
- **Health checks** that actually check health, not just "the process is up"

---

## 11. Testing

- Tests follow the project's framework and conventions (see `CLAUDE.md`)
- **Deterministic** — inject clock, seed randomness, stub network, isolate data
- **Isolated** — no cross-test state; each test sets up and tears down its own world
- **Idempotent** — order-independent
- **Public-API tests first** — test behavior, not implementation internals; private methods are tested through their callers
- **Boundary tests for parsers / mappers** — full payload, missing optionals, unknown extra fields
- **Test IDs** for traceability: `{{EPIC_PREFIX}}-XXXX-UT01` etc. (see `/test-plan`)
- Mark tests that require real hardware / live services / specific environments

---

## 12. UI & Design System (if applicable)

- **Design tokens** for colors, typography, spacing — never hardcode values
- **Components over one-offs** — extend the design system rather than forking
- **Localized strings** — no hardcoded user-facing text; every string goes through the i18n system
- **Accessibility non-negotiable** — labels, keyboard reach, contrast, motion respect, screen-reader announcements
- **Test identifiers** on interactive elements for automation

---

## 13. Clean Code

- Prefer **early return / guard clauses** over deep nesting
- **Small functions** with clear names — the name is the contract
- **Default to no comments** — names explain *what*, commits explain *why*; comments only for non-obvious constraints or workarounds
- **Delete dead code** — don't leave commented-out blocks or unreferenced symbols
- **No speculative abstraction** — duplicate 2–3 times before extracting; the wrong abstraction costs more than duplication
- Follow language-idiomatic naming (`camelCase` / `snake_case` / `PascalCase` per language convention)

---

## 14. Commits, Branches, PRs

- **Branch naming**: `feature/{{EPIC_PREFIX}}-XXXX-short-desc`, `fix/...`, `hotfix/...`, `chore/...`
- **Commit messages**: imperative mood, ≤72-char subject, epic key prefix; body explains *why*, not *what*
- **Small PRs** — one logical change; easier to review, easier to revert
- **No force-push to shared branches** — rebase locally, push to your branch
- **PR description** — links the epic, summarizes the change, calls out risks and test evidence
