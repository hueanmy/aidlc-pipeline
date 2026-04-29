export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface Column {
  id: string;
  name: string;
  position: number;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  position: number;
  assigneeIds: string[];
  archivedAt?: string;
  createdAt: string;
}

export type NotificationKind =
  | 'card.assigned'
  | 'card.mentioned'
  | 'card.due_soon'
  | 'comment.replied';

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
}
