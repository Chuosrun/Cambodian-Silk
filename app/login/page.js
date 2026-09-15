import Link from 'next/link';
import LoginForm from './LoginForm';

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;

  return (
    <main className="page page--auth">
      <div className="auth-card">
        <h1>Log in</h1>
        <p className="auth-card__lead">
          Sign in to add, keep, and remove your own entries in the archive.
        </p>

        {params.confirmed === '1' && (
          <p className="notice notice--success">Your email is confirmed — log in below.</p>
        )}
        {params.error === 'could_not_verify' && (
          <p className="notice notice--error">
            That link could not be verified. Please try signing up again.
          </p>
        )}

        <LoginForm />

        <p className="auth__alt">
          New to the archive? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </main>
  );
}