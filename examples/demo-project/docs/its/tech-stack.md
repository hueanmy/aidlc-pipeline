# Tech stack

Snapshot of the systems and constraints the design / review / release / monitor
phases must respect. Update this file whenever an architecture change lands.

## Frontend

- **Web app**: React 18 + TypeScript, Vite build. Hosted on Cloudflare Pages.
- **State**: TanStack Query for server state, Zustand for local UI state.
- **Styling**: Tailwind v3 + shadcn/ui primitives. No CSS-in-JS.
- **Browser support**: latest 2 of Chrome/Edge/Safari/Firefox. No IE.

## Backend

- **API**: Node.js 20 + Fastify, TypeScript end-to-end.
- **Database**: PostgreSQL 16. One primary + one read replica. No NoSQL.
- **Cache**: Redis 7 for sessions, rate-limit counters, ephemeral state.
  Never the primary store.
- **Queue**: Postgres-based job queue (`graphile-worker`) for async work.
  No external broker until volume requires it.
- **Search**: Postgres `tsvector` + GIN index. Migrating to a dedicated
  engine (Meilisearch) is a future epic — design new features so the
  search layer is swappable.

## Auth

- Server-issued opaque session tokens (32-byte random). **Never JWTs** —
  we want O(1) revocation.
- Sessions stored in Postgres `sessions` table; hot lookup cached in Redis
  with a 60s TTL.
- Passwords: bcrypt cost 12.
- MFA: TOTP via `otplib`.

## Infra

- Hosted on Fly.io, two regions (iad, fra). Active-active read; writes go
  to iad primary.
- Logs: structured JSON to stdout, scraped by Vector → Loki.
- Metrics: Prometheus, dashboards in Grafana.
- Errors: Sentry for both web and api. Source maps uploaded on deploy.
- Tracing: OpenTelemetry → Tempo. All service hops carry `traceparent`.

## Constraints (hard rules — design must respect)

1. **All multi-tenant queries MUST filter by `workspace_id`.** Add the
   filter at the repository layer. There is a query linter (`drizzle-lint`)
   in CI that fails the build on unfiltered queries.
2. **Money is stored as bigint cents, never floats.**
3. **Timestamps are stored as `timestamp with time zone`, always UTC.**
   Display TZ is a client concern.
4. **No GraphQL.** REST + JSON only. Resource design follows JSON:API
   loosely — pagination via `?cursor=`, filtering via top-level keys.
5. **Schema migrations are forward-only.** No down migrations in code;
   roll forward instead.
6. **Webhooks must be idempotent on the consumer side.** We deliver
   at-least-once; consumers dedupe by `event.id`.

## Performance budgets

- API p95 latency under load: 250 ms / endpoint, 500 ms for search.
- Web Time-to-Interactive on cold load: < 2.5 s on a 4G network.
- Critical CSS and above-the-fold images must be in the initial HTML payload.

## Observability budget

Every new endpoint must:
- emit a structured log on entry/exit with `route`, `workspace_id`, `latency_ms`
- bump a Prometheus counter
- propagate the OpenTelemetry trace context

Reviewers (Tech Lead at the `review` phase) will block PRs that skip these.
