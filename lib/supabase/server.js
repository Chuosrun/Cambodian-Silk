import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getConfig } from './env';

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey, ready } = getConfig();

  if (!ready) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see .env.local.example).',
    );
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot write cookies directly.
            // The middleware refreshes the session, so this is safe.
          }
        },
      },
    },
  );
}