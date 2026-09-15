'use client';

import { useState } from 'react';
import { signUp } from '../actions/auth';

export default function SignupForm() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await signUp({ email, password, displayName });
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <p className="notice notice--success">
        Almost there — we sent a confirmation link to <strong>{email}</strong>. Click it, then
        log in.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="notice notice--error">{error}</p>}

      <div className="field">
        <label className="field__label" htmlFor="display-name">
          Display name <small>(optional — shown on your entries)</small>
        </label>
        <input
          id="display-name"
          className="field__input"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="e.g. Sovannara"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="field__input"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="field__input"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 6 characters"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="confirm-password">
          Confirm password
        </label>
        <input
          id="confirm-password"
          className="field__input"
          type="password"
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="Repeat your password"
        />
      </div>

      <button type="submit" className="btn btn--primary" disabled={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}