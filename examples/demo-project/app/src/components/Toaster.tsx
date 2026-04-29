import { useEffect } from 'react';
import type { Notification } from '../types';

interface Props {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 4000;

export function Toaster({ notifications, onDismiss }: Props) {
  const visible = notifications.filter((n) => !n.readAt);

  useEffect(() => {
    const timers = visible.map((n) => window.setTimeout(() => onDismiss(n.id), AUTO_DISMISS_MS));
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [visible, onDismiss]);

  if (visible.length === 0) return null;

  return (
    <div className="toaster" role="region" aria-live="polite">
      {visible.map((n) => (
        <div key={n.id} className={`toast toast-${n.kind.replace('.', '-')}`}>
          <div className="toast-body">
            <strong>{n.title}</strong>
            <div className="muted small">{n.body}</div>
          </div>
          <button aria-label="Dismiss" onClick={() => onDismiss(n.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
