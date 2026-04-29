import { useState } from 'react';
import { SignIn } from './components/SignIn';
import { TaskList } from './components/TaskList';
import { Toaster } from './components/Toaster';
import { storage } from './storage';
import type { Notification, NotificationKind, Session, User } from './types';

export function App() {
  const [session, setSession] = useState<Session | null>(storage.getSession());
  const [user, setUser] = useState<User | null>(storage.getUser());
  const [notifications, setNotifications] = useState<Notification[]>(storage.getNotifications());

  function notify(kind: NotificationKind, title: string, body: string) {
    const n: Notification = {
      id: 'n-' + Math.random().toString(36).slice(2, 10),
      kind,
      title,
      body,
      createdAt: new Date().toISOString(),
    };
    const next = [...notifications, n];
    setNotifications(next);
    storage.setNotifications(next);
  }

  function dismiss(id: string) {
    const next = notifications.map((n) =>
      n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
    );
    setNotifications(next);
    storage.setNotifications(next);
  }

  function signIn(s: Session, u: User) {
    setSession(s);
    setUser(u);
  }

  function signOut() {
    storage.setSession(null);
    storage.setUser(null);
    setSession(null);
    setUser(null);
  }

  if (!session || !user) {
    return <SignIn onSignIn={signIn} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <strong>TaskFlow</strong>
        <span className="muted">{user.displayName} · {user.email}</span>
        <button onClick={signOut}>Sign out</button>
      </header>
      <main>
        <TaskList onNotify={notify} />
      </main>
      <Toaster notifications={notifications} onDismiss={dismiss} />
    </div>
  );
}
