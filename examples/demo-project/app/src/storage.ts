import type { Card, Column, Notification, Session, User } from './types';

const KEY_SESSION = 'taskflow:session';
const KEY_USER = 'taskflow:user';
const KEY_COLUMNS = 'taskflow:columns';
const KEY_CARDS = 'taskflow:cards';
const KEY_NOTIFICATIONS = 'taskflow:notifications';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function defaultColumns(): Column[] {
  return [
    { id: 'todo', name: 'To Do', position: 1 },
    { id: 'doing', name: 'Doing', position: 2 },
    { id: 'done', name: 'Done', position: 3 },
  ];
}

export const storage = {
  getSession: (): Session | null => read<Session | null>(KEY_SESSION, null),
  setSession: (s: Session | null): void => {
    if (s === null) localStorage.removeItem(KEY_SESSION);
    else write(KEY_SESSION, s);
  },
  getUser: (): User | null => read<User | null>(KEY_USER, null),
  setUser: (u: User | null): void => {
    if (u === null) localStorage.removeItem(KEY_USER);
    else write(KEY_USER, u);
  },
  getColumns: (): Column[] => read<Column[]>(KEY_COLUMNS, defaultColumns()),
  setColumns: (c: Column[]): void => write(KEY_COLUMNS, c),
  getCards: (): Card[] => read<Card[]>(KEY_CARDS, []),
  setCards: (c: Card[]): void => write(KEY_CARDS, c),
  getNotifications: (): Notification[] => read<Notification[]>(KEY_NOTIFICATIONS, []),
  setNotifications: (n: Notification[]): void => write(KEY_NOTIFICATIONS, n),
};
