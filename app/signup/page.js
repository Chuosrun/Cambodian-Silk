import Link from 'next/link';
import SignupForm from './SignupForm';

export default async function SignupPage() {
  return (
    <main className="page page--auth">
      <div className="auth-card">
        <h1>Create an account</h1>
        <p className="auth-card__lead">
          Join the archive and start your own collection. We email you a confirmation link first.
        </p>

        <SignupForm />

        <p className="auth__alt">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}