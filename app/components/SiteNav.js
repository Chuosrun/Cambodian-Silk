import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../actions/auth';

export default async function SiteNav() {
  let user = null;

  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
  } catch {
    user = null; // Supabase not configured yet — show logged-out nav.
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          Cambodian Silk Archives
        </Link>

        <nav className="nav">
          <Link href="/" className="nav__link">
            Archive
          </Link>

          {user ? (
            <>
              <span className="nav__email" title="Signed in as">
                {user.email}
              </span>
              <Link href="/my-collection" className="nav__link">
                My collection
              </Link>
              <form action={signOut}>
                <button type="submit" className="nav__link">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="nav__link">
                Log in
              </Link>
              <Link href="/signup" className="btn btn--primary btn--small">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}