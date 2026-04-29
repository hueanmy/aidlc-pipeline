# Auth & Sessions

The Auth module owns identity, login flow, sessions, and password recovery for
all TaskFlow users (workspace members and admins).

## Entities

- **User** — `id`, `email` (unique), `displayName`, `passwordHash`, `mfaSecret?`, `createdAt`, `lastSeenAt`.
- **Session** — `id`, `userId`, `userAgent`, `ip`, `issuedAt`, `expiresAt`, `revokedAt?`. Sessions are server-side records; the client receives an opaque token.
- **PasswordResetTicket** — single-use, 30-minute TTL, bound to `userId` + `requestIp`.

## Login flow

1. Client `POST /auth/login` with email + password.
2. Server validates, optionally challenges MFA (`/auth/mfa/verify`).
3. On success → server creates Session, returns opaque session token + CSRF cookie.
4. Subsequent requests carry the session cookie + CSRF header.

Failed-login attempts are rate-limited per email and per IP independently.
After 10 consecutive failures within 15 minutes, the account enters a
soft-lock for 30 minutes — login still possible after a verified password
reset.

## Session lifecycle

- Default TTL: 7 days from issuance, renewed on use up to a hard cap of 30
  days, after which re-auth is required.
- Server-side revocation supported (`/auth/sessions/{id}` DELETE).
- "Sign out everywhere" iterates all non-revoked sessions for the user.

## Password reset

- User requests reset → server creates `PasswordResetTicket`, sends email
  with single-use link.
- Click → user lands on reset form, server validates ticket + binds session
  to a new password.
- A successful reset invalidates **all** existing sessions for that user
  (forces re-login on every device).

## MFA

- Optional, opt-in per user.
- TOTP only (no SMS) for v1.
- Backup codes: 10 single-use codes, regenerated on demand.

## Out of scope

- SSO / SAML — tracked in a separate epic.
- Magic-link login — under consideration but not in this module.
- Social login — explicitly not supported in v1.

## Constraints

- Email is the only login identifier. No usernames.
- Passwords: bcrypt cost 12, min length 12 chars, server enforces a denylist
  of the 1k most-common passwords.
- Token format: opaque random 32-byte URL-safe string. Never JWTs (we want
  server-side revocation to be O(1)).
