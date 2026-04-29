# Notifications

Notifications surface events to users via in-app, email, and (later) push
channels. The module owns subscription preferences, delivery routing, and
read/unread state.

## Notification kinds

| Kind | Triggered by | Default channel |
|---|---|---|
| `card.assigned` | someone assigns you a card | in-app + email |
| `card.mentioned` | a comment mentions you | in-app + email |
| `card.due_soon` | due date within 24h, scheduled | in-app |
| `comment.replied` | a reply on your comment | in-app + email |
| `workspace.invited` | invited to a new workspace | email only |

## Per-user preferences

Each user has a preferences document:

```json
{
  "card.assigned": { "inApp": true, "email": true },
  "card.mentioned": { "inApp": true, "email": false },
  "card.due_soon":  { "inApp": true, "email": false },
  ...
}
```

Defaults applied at signup; users can change them on the Settings page.

## Delivery pipeline

```
event source ── publish ──► notifications topic
                                 │
                                 ▼
                          fan-out worker
                          (enriches, fetches prefs)
                                 │
                ┌────────────────┼────────────────┐
                ▼                ▼                ▼
            in-app store      email queue     push queue (TBD)
```

- Idempotency: each event has a `dedupe_key`. Worker re-uses the key to
  avoid double-sending if the source publishes twice.
- Failures: emails retry up to 5 times with exponential backoff, then drop
  to DLQ.

## Quiet hours

A user may set quiet hours (e.g. 22:00–07:00 in their TZ). During quiet
hours, **email** delivery is paused; in-app notifications still appear.
Messages buffered during quiet hours are coalesced into a single digest
email at the start of the next active window.

## Read/unread

- Notification has `readAt?` and `seenAt?`.
- "Seen" = appeared in the bell dropdown. "Read" = user clicked through.
- Bell badge count = `unread`. There's no "mark all as seen" — only
  "mark all as read."

## Out of scope

- Slack/Teams forwarding (separate integration epic).
- Push notifications — placeholder in pipeline; not user-visible in v1.
- Per-board mute (only per-kind mute exists in v1).

## Constraints

- Notifications older than 90 days are pruned from the in-app store.
- Email send rate per user: max 30 / hour. Excess gets coalesced to a
  digest.
