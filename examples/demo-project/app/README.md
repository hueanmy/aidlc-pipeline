# TaskFlow demo app

Sample React + Vite + TypeScript client that implements the auth, tasks, and
notifications behaviour described in [`../docs/core-business`](../docs/core-business)
under the architecture in [`../docs/its/tech-stack.md`](../docs/its/tech-stack.md).

This is intentionally a **front-end only** sample — `localStorage` stands in
for the Postgres + Fastify backend so the AIDLC example workspace boots without
any infrastructure setup. A real implementation would replace `src/storage.ts`
with an HTTP client against the real API.

## Running locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production bundle
```

## What's implemented

| File | Maps to |
|---|---|
| `src/components/SignIn.tsx` | `core-business/01-auth.md` (email-only login, ≥12-char password rule) |
| `src/components/TaskList.tsx` | `core-business/02-tasks.md` (columns, cards, fractional positions, archive vs delete) |
| `src/components/Toaster.tsx` | `core-business/03-notifications.md` (in-app channel, auto-dismiss, dismiss = "read") |
| `src/storage.ts` | localStorage shim for the sessions / boards / cards / notifications tables |

## What's intentionally omitted

The `## Out of scope` and `## Constraints` sections in each spec point at the
real production rules (MFA, webhooks, quiet hours, idempotent delivery, etc.).
None of those are implemented here — this is a **smoke-test sample**, not a
reference implementation.
