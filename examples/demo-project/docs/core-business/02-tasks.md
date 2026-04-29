# Tasks & Boards

The Tasks module is the heart of TaskFlow — boards, columns, cards, and the
operations users perform on them.

## Entities

- **Workspace** — top-level tenant boundary. A user belongs to one or more
  workspaces with a `WorkspaceRole` (admin, member, guest).
- **Board** — `id`, `workspaceId`, `name`, `archivedAt?`. Each board has an
  ordered list of Columns.
- **Column** — `id`, `boardId`, `name`, `position`. Position is a fractional
  index (e.g. 1.0, 1.5, 2.0) so reordering is a single-row update.
- **Card** — `id`, `columnId`, `position`, `title`, `description?`,
  `assigneeIds[]`, `dueAt?`, `labels[]`, `archivedAt?`.
- **Comment** — `id`, `cardId`, `authorId`, `body`, `createdAt`,
  `editedAt?`.

## Operations

### Create
- `POST /boards` — admin/member only.
- `POST /boards/{id}/columns` — admin/member.
- `POST /columns/{id}/cards` — admin/member; guests can comment but not create.

### Reorder
- Drag-and-drop reorder of cards within a column or across columns: client
  computes a new fractional position halfway between neighbours and `PATCH`es
  it to the server.
- If two clients reorder simultaneously, they may collide on the same
  position — server tolerates this; positions are eventually rebalanced by a
  background job when float precision degrades.

### Assign
- A card may have 0..N assignees, each a workspace member.
- Assigning a guest is rejected (HTTP 403).

### Archive vs delete
- "Archive" sets `archivedAt`. The card is hidden from the default board
  view but still searchable. Reversible.
- "Delete" is admin-only and is a hard delete. Triggers cascade: comments
  and attachments removed.

## Search

- Server-side full-text on title + description + comment body.
- Filters: by assignee, by label, by due date range, by board.
- Indexed via Postgres `tsvector` on each entity, refreshed on write.

## Webhooks

When a card changes (create / move / archive / delete), the workspace's
configured webhooks fire. Webhook delivery is at-least-once, with
exponential backoff up to 24h. Consumers must dedupe by event id.

## Out of scope

- Subtasks (tracked in a separate epic).
- Recurring cards.
- Time tracking.

## Constraints

- A board may have at most 50 columns.
- A column may have at most 1,000 cards before `archive` is required.
- Card title: 1..200 chars. Description: up to 16 KB markdown.
- All timestamps are UTC; clients render in local TZ.
