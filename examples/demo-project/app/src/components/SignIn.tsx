import { useState, type FormEvent } from 'react';
import { storage } from '../storage';
import type { Session, User } from '../types';

interface Props {
  onSignIn: (session: Session, user: User) => void;
}

const PASSWORD_MIN = 12;

export function SignIn({ onSignIn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes('@')) {
      setError('Email must contain @ — TaskFlow uses email as the only login identifier.');
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters (matches the bcrypt-cost-12 spec in core-business/01-auth.md).`);
      return;
    }
    const user: User = {
      id: 'u-' + Math.random().toString(36).slice(2, 10),
      email,
      displayName: email.split('@')[0],
    };
    const session: Session = {
      token: 'tok-' + Math.random().toString(36).slice(2, 22),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    storage.setUser(user);
    storage.setSession(session);
    onSignIn(session, user);
  }

  return (
    <div className="signin">
      <h1>TaskFlow</h1>
      <p className="muted">Sign in to your workspace</p>
      <form onSubmit={submit}>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={PASSWORD_MIN}
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit">Sign in</button>
      </form>
      <p className="muted small">
        Demo only. Session is stored in localStorage; this client does not call any real auth API.
      </p>
    </div>
  );
}
