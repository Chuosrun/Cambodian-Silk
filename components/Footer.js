import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Footer() {
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
    user = null;
  }

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__info">
          <Link href="/" className="site-footer__brand">
            Cambodian Silk Archives
          </Link>
          <p className="site-footer__desc">
            A living archive of Tromol Meas — Cambodia&apos;s naturally golden raw silk.
            Credits and sources accompany every entry.
          </p>
        </div>

        <nav className="site-footer__nav">
          <Link href="/" className="site-footer__link">
            Archive
          </Link>
          {user ? (
            <Link href="/my-collection" className="site-footer__link">
              My collection
            </Link>
          ) : (
            <Link href="/login" className="site-footer__link">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </footer>
  );
}