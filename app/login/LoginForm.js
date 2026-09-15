'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    let signInError = null;
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      signInError = error;
    } catch (err) {
      signInError = err;
    }

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="notice notice--error">{error}</p>}

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
          placeholder="Your password"
        />
      </div>

      <button type="submit" className="btn btn--primary" disabled={loading}>
        {loading ? 'Signing in…' : 'Log in'}
      </button>
    </form>
  );
}