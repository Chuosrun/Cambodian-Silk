import { createBrowserClient } from '@supabase/ssr';
import { getConfig } from './env';

export function createClient() {
  const { url, publishableKey, ready } = getConfig();

  if (!ready) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local (see .env.local.example).',
    );
  }

  return createBrowserClient(url, publishableKey);
}